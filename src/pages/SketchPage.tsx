import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSameDay } from 'date-fns';
import { Eraser, Undo2, Trash2, Check, Palette, Pencil, Tablet, ArrowLeft, PaintBucket, ImagePlus, ZoomIn, ZoomOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntries } from '@/store/useEntries';
import { saveJournalEntry } from '@/lib/idb';
import { useToast } from '@/hooks/use-toast';
import { isPhone } from '@/lib/deviceDetection';

const COLORS = [
  '#1f2937', // near-black
  '#16A085', // brand teal
  '#F1C40F', // brand gold
  '#E74C3C', // red
  '#3498DB', // blue
  '#9B59B6', // purple
];

const STROKE_SIZES = [2, 4, 8, 14];

type Stroke = {
  color: string;
  size: number;
  isEraser: boolean;
  points: { x: number; y: number }[];
};

export default function SketchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createEntry, entries, loadEntries } = useEntries();
  const [phoneNoticeAck, setPhoneNoticeAck] = useState(false);
  const [phone] = useState(() => isPhone());

  // Load entries on mount so we can detect today's sketch
  useEffect(() => {
    if (entries.length === 0) loadEntries();
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  // Pre-existing sketch image (today's saved drawing) painted as the base layer.
  // Kept as an HTMLImageElement only for the very first preload paint; once any
  // edit happens, baseSnapshotRef becomes the source of truth.
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  // Synchronous baked snapshot of the canvas (used as base layer after fills/undo).
  // Storing ImageData (not an async Image) eliminates race conditions where an
  // async snapshot.onload overwrites state set by a later undo.
  const baseSnapshotRef = useRef<ImageData | null>(null);
  // Undo history: ImageData snapshots taken BEFORE each action
  const undoStackRef = useRef<ImageData[]>([]);
  const MAX_UNDO = 20;

  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(STROKE_SIZES[1]);
  const [tool, setTool] = useState<'draw' | 'eraser' | 'fill'>('draw');
  const isEraser = tool === 'eraser';
  const isFill = tool === 'fill';
  const [showPalette, setShowPalette] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedExisting, setLoadedExisting] = useState(false);

  // Floating picture being placed (drag/zoom before commit). When non-null,
  // the canvas ignores pointer events and an overlay <img> is shown.
  type Placement = {
    src: string;          // object URL (revoked on commit/cancel)
    img: HTMLImageElement; // already-decoded image, used at commit time
    x: number;            // CSS px, top-left within the canvas wrapper
    y: number;
    scale: number;        // multiplier on naturalWidth/Height
  };
  const [placement, setPlacement] = useState<Placement | null>(null);
  // Refs used while dragging/pinching the overlay
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const pinchRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    startDist: number;
    startScale: number;
  } | null>(null);

  // Resize canvas to fit container, redraw on resize
  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Prefer the synchronous baked snapshot (post-fill / post-undo state).
    // Fallback to the preloaded HTMLImageElement only on the very first paint
    // before any edit has happened.
    if (baseSnapshotRef.current) {
      ctx.putImageData(baseSnapshotRef.current, 0, 0);
      ctx.restore();
    } else if (baseImageRef.current) {
      ctx.restore();
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      ctx.drawImage(baseImageRef.current, 0, 0, cssW, cssH);
    } else {
      ctx.restore();
    }

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }
  }, []);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.size;
    ctx.globalCompositeOperation = stroke.isEraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.beginPath();
    const [first, ...rest] = stroke.points;
    ctx.moveTo(first.x, first.y);
    for (const p of rest) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  useEffect(() => {
    fitCanvas();
    const onResize = () => fitCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fitCanvas]);

  // Preload today's existing sketch (if any) into the canvas as a base layer
  useEffect(() => {
    if (loadedExisting) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      const today = new Date();
      const existing = entries.find(e =>
        e.templateId === 'sketch' && isSameDay(new Date(e.createdAt), today)
      );
      if (!existing) return;
      try {
        const { getJournalEntry } = await import('@/lib/idb');
        const raw = await getJournalEntry(existing.id) as any;
        const blob: Blob | undefined = raw?.drawingBlob;
        if (!blob || !(blob instanceof Blob)) return;
        objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          baseImageRef.current = img;
          setHasContent(true);
          setLoadedExisting(true);
          redraw();
          toast({
            title: "Today's sketch loaded",
            description: 'Continue editing — saving will replace it.',
          });
        };
        img.src = objectUrl;
      } catch (err) {
        console.warn('[Sketch] failed to preload existing sketch', err);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entries, loadedExisting, redraw, toast]);

  const getPos = (e: PointerEvent | React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Snapshot the current canvas pixels before each destructive action so undo can restore.
  const pushUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoStackRef.current.push(snap);
      if (undoStackRef.current.length > MAX_UNDO) undoStackRef.current.shift();
    } catch (e) {
      console.warn('[Sketch] failed to snapshot for undo', e);
    }
  };

  // Flood-fill at canvas position using current color, with anti-alias tolerance.
  const floodFill = (cssX: number, cssY: number, hexColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const startX = Math.floor(cssX * dpr);
    const startY = Math.floor(cssY * dpr);
    const w = canvas.width;
    const h = canvas.height;
    if (startX < 0 || startY < 0 || startX >= w || startY >= h) return;

    let imageData: ImageData;
    try {
      imageData = ctx.getImageData(0, 0, w, h);
    } catch {
      return; // tainted canvas (shouldn't happen — same-origin only)
    }
    const data = imageData.data;

    const idx = (x: number, y: number) => (y * w + x) * 4;
    const startIdx = idx(startX, startY);
    const sr = data[startIdx];
    const sg = data[startIdx + 1];
    const sb = data[startIdx + 2];
    const sa = data[startIdx + 3];

    // Parse hex → rgb
    const hex = hexColor.replace('#', '');
    const fr = parseInt(hex.substring(0, 2), 16);
    const fg = parseInt(hex.substring(2, 4), 16);
    const fb = parseInt(hex.substring(4, 6), 16);
    const fa = 255;

    // Skip if already same color
    if (sr === fr && sg === fg && sb === fb && sa === fa) return;

    const tolerance = 32; // anti-alias tolerance
    const matches = (i: number) =>
      Math.abs(data[i] - sr) <= tolerance &&
      Math.abs(data[i + 1] - sg) <= tolerance &&
      Math.abs(data[i + 2] - sb) <= tolerance &&
      Math.abs(data[i + 3] - sa) <= tolerance;

    // Iterative scanline flood fill
    const stack: Array<[number, number]> = [[startX, startY]];
    while (stack.length) {
      const [x, y] = stack.pop()!;
      let nx = x;
      while (nx >= 0 && matches(idx(nx, y))) nx--;
      nx++;
      let spanUp = false;
      let spanDown = false;
      while (nx < w && matches(idx(nx, y))) {
        const i = idx(nx, y);
        data[i] = fr;
        data[i + 1] = fg;
        data[i + 2] = fb;
        data[i + 3] = fa;
        if (!spanUp && y > 0 && matches(idx(nx, y - 1))) {
          stack.push([nx, y - 1]);
          spanUp = true;
        } else if (spanUp && y > 0 && !matches(idx(nx, y - 1))) {
          spanUp = false;
        }
        if (!spanDown && y < h - 1 && matches(idx(nx, y + 1))) {
          stack.push([nx, y + 1]);
          spanDown = true;
        } else if (spanDown && y < h - 1 && !matches(idx(nx, y + 1))) {
          spanDown = false;
        }
        nx++;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Bake the filled result synchronously so undo races can't overwrite it.
    // The fill (and any prior strokes painted onto the canvas) is now part of
    // the base layer; clear the per-stroke list since they're already baked.
    try {
      baseSnapshotRef.current = ctx.getImageData(0, 0, w, h);
      strokesRef.current = [];
      setHasContent(true);
    } catch (e) {
      console.warn('[Sketch] failed to bake fill snapshot', e);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const pos = getPos(e);

    if (isFill) {
      pushUndo();
      floodFill(pos.x, pos.y, color);
      return;
    }

    // Snapshot before each stroke so undo restores the prior state
    pushUndo();
    drawingRef.current = true;
    currentRef.current = {
      color,
      size,
      isEraser,
      points: [pos],
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || !currentRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    currentRef.current.points.push(pos);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    // Draw incrementally for performance
    const pts = currentRef.current.points;
    if (pts.length >= 2) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = currentRef.current.size;
      ctx.globalCompositeOperation = currentRef.current.isEraser ? 'destination-out' : 'source-over';
      ctx.strokeStyle = currentRef.current.color;
      ctx.beginPath();
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentRef.current && currentRef.current.points.length > 0) {
      strokesRef.current.push(currentRef.current);
      setHasContent(true);
    }
    currentRef.current = null;
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = undoStackRef.current.pop();
    if (!snap) return;

    // Restore the snapshot directly to canvas pixels, AND make it the new base
    // synchronously. This eliminates the race where an in-flight async snapshot
    // (from a prior fill) could overwrite the restored state on the next redraw.
    ctx.putImageData(snap, 0, 0);
    baseSnapshotRef.current = snap;
    // Any pending preloaded image is now superseded by the snapshot.
    baseImageRef.current = null;
    strokesRef.current = [];
    setHasContent(true);
  };

  const handleClear = () => {
    if (strokesRef.current.length === 0 && !baseImageRef.current && !baseSnapshotRef.current) return;
    if (!confirm('Clear the whole sketch?')) return;
    pushUndo();
    strokesRef.current = [];
    baseImageRef.current = null;
    baseSnapshotRef.current = null;
    setHasContent(false);
    redraw();
  };

  // Hidden file input — triggered by the "Add Picture" toolbar button.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPicture = () => {
    fileInputRef.current?.click();
  };

  const handlePictureSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file twice still fires onChange
    if (e.target) e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Unsupported file', description: 'Please pick an image file.', variant: 'destructive' });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // If a placement is already in progress, cancel it first (revoke URL).
    if (placement) {
      URL.revokeObjectURL(placement.src);
      setPlacement(null);
    }

    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('image load failed'));
        i.src = url;
      });

      // Initial scale: fit ~60% of the smaller axis so there's room to drag/zoom.
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      const fit = Math.min((cssW * 0.6) / img.width, (cssH * 0.6) / img.height, 1);
      const drawW = img.width * fit;
      const drawH = img.height * fit;
      const x = (cssW - drawW) / 2;
      const y = (cssH - drawH) / 2;

      setPlacement({ src: url, img, x, y, scale: fit });
      toast({
        title: 'Position your picture',
        description: 'Drag to move, pinch or use +/− to resize, then tap ✓ to place.',
      });
    } catch (err) {
      console.error('[Sketch] failed to load picture', err);
      URL.revokeObjectURL(url);
      toast({ title: "Couldn't add picture", description: 'Please try a different image.', variant: 'destructive' });
    }
  };

  // Commit the floating picture onto the canvas at its current position/scale.
  const commitPlacement = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !placement) return;

    pushUndo();
    const { img, x, y, scale } = placement;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    // Bake into synchronous base snapshot so future redraws / undo work.
    try {
      baseSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokesRef.current = [];
      setHasContent(true);
    } catch (err) {
      console.warn('[Sketch] failed to bake picture snapshot', err);
    }

    URL.revokeObjectURL(placement.src);
    setPlacement(null);
  };

  const cancelPlacement = () => {
    if (!placement) return;
    URL.revokeObjectURL(placement.src);
    setPlacement(null);
  };

  // Min/max scale guards for zoom buttons + pinch.
  const SCALE_MIN = 0.05;
  const SCALE_MAX = 8;
  const clampScale = (s: number) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, s));

  // Zoom around the center of the placed image (keeps it visually anchored).
  const zoomPlacement = (factor: number) => {
    setPlacement((p) => {
      if (!p) return p;
      const newScale = clampScale(p.scale * factor);
      const oldW = p.img.width * p.scale;
      const oldH = p.img.height * p.scale;
      const newW = p.img.width * newScale;
      const newH = p.img.height * newScale;
      return {
        ...p,
        scale: newScale,
        x: p.x + (oldW - newW) / 2,
        y: p.y + (oldH - newH) / 2,
      };
    });
  };

  // Drag / pinch handlers for the floating picture overlay.
  const onPlacementPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (!placement) return;

    // If a second pointer arrives, switch into pinch-zoom mode.
    if (dragRef.current && !pinchRef.current) {
      const pointers = new Map<number, { x: number; y: number }>();
      pointers.set(dragRef.current.pointerId, { x: dragRef.current.startX, y: dragRef.current.startY });
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = Array.from(pointers.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      pinchRef.current = { pointers, startDist: dist, startScale: placement.scale };
      dragRef.current = null;
      return;
    }

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: placement.x,
      origY: placement.y,
    };
  };

  const onPlacementPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!placement) return;

    if (pinchRef.current) {
      e.preventDefault();
      const p = pinchRef.current;
      if (!p.pointers.has(e.pointerId)) return;
      p.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = Array.from(p.pointers.values());
      if (pts.length < 2) return;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const factor = dist / p.startDist;
      const newScale = clampScale(p.startScale * factor);
      setPlacement((cur) => {
        if (!cur) return cur;
        const oldW = cur.img.width * cur.scale;
        const oldH = cur.img.height * cur.scale;
        const newW = cur.img.width * newScale;
        const newH = cur.img.height * newScale;
        return {
          ...cur,
          scale: newScale,
          x: cur.x + (oldW - newW) / 2,
          y: cur.y + (oldH - newH) / 2,
        };
      });
      return;
    }

    if (dragRef.current && dragRef.current.pointerId === e.pointerId) {
      e.preventDefault();
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPlacement((cur) => (cur ? { ...cur, x: dragRef.current!.origX + dx, y: dragRef.current!.origY + dy } : cur));
    }
  };

  const onPlacementPointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    if (pinchRef.current) {
      pinchRef.current.pointers.delete(e.pointerId);
      if (pinchRef.current.pointers.size < 2) pinchRef.current = null;
      return;
    }
    if (dragRef.current && dragRef.current.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  };

  // Mouse-wheel zoom while placing (desktop).
  const onPlacementWheel = (e: React.WheelEvent<HTMLImageElement>) => {
    if (!placement) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    zoomPlacement(factor);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;

    // Find an existing sketch for today (we'll overwrite it silently — user
    // is already editing it, no need to re-confirm).
    const today = new Date();
    const existingTodaySketch = entries.find(e =>
      e.templateId === 'sketch' && isSameDay(new Date(e.createdAt), today)
    );

    setSaving(true);
    try {
      // Composite onto a white background so the saved image isn't transparent
      const out = document.createElement('canvas');
      out.width = canvas.width;
      out.height = canvas.height;
      const ctx = out.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(canvas, 0, 0);

      const blob: Blob = await new Promise((resolve, reject) =>
        out.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png', 0.92)
      );

      if (existingTodaySketch) {
        // Overwrite the blob on the existing entry (updateEntry doesn't carry blobs)
        await saveJournalEntry({
          ...(existingTodaySketch as any),
          drawingBlob: blob,
          hasDrawing: true,
          updatedAt: new Date().toISOString(),
        });
        await loadEntries();
        toast({ title: 'Sketch replaced', description: "Today's sketch was updated." });
      } else {
        await createEntry({
          text: '',
          hasDrawing: true,
          drawingBlob: blob,
          templateId: 'sketch',
          tags: ['sketch'],
        } as any);
        toast({ title: 'Sketch saved', description: 'Your drawing was added to your journal.' });
      }

      navigate('/calendar');
    } catch (err) {
      console.error('[Sketch] save failed', err);
      toast({ title: 'Save failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Phone-only intercept: this feature shines on iPad/tablet, but allow opt-in.
  if (phone && !phoneNoticeAck) {
    return (
      <div
        className="min-h-screen bg-white dark:bg-background px-5 flex flex-col"
        style={{
          paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
          paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
        }}
      >
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Tablet className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Best on iPad</h1>
            <p className="text-base text-muted-foreground">
              Write &amp; Sketch is designed for tablets and stylus input. On a phone the canvas is small
              and harder to draw on.
            </p>
            <p className="text-sm text-muted-foreground">
              For the best handwriting and doodling experience, open Journal Inc on your iPad or
              Android tablet.
            </p>
          </div>

          <div className="w-full space-y-2 pt-2">
            <Button
              onClick={() => navigate('/journal')}
              className="w-full h-12 rounded-full gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Journal
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPhoneNoticeAck(true)}
              className="w-full h-11 rounded-full text-muted-foreground hover:text-foreground"
            >
              Continue on phone anyway
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-background flex flex-col overflow-hidden"
      style={{
        height: '100dvh',
        paddingTop: 'max(3rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
        paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
      }}
    >
      {/* Header */}
      <header className="px-5 pb-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Write & Sketch</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Draw, doodle, or handwrite</p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasContent || saving}
          className="rounded-full gap-1.5"
        >
          <Check className="w-4 h-4" />
          {saving ? 'Saving…' : 'Done'}
        </Button>
      </header>

      {/* Canvas area — must have a real height for the canvas to receive input */}
      <div className="flex-1 min-h-0 px-3">
        <div
          ref={wrapRef}
          className="relative w-full h-full rounded-2xl border border-border/60 bg-[hsl(174_55%_98%)] shadow-soft overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`absolute inset-0 w-full h-full touch-none select-none ${isFill ? 'cursor-cell' : 'cursor-crosshair'}`}
            style={{ touchAction: 'none' }}
          />
          {!hasContent && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground/70">
                <Pencil className="w-10 h-10 mx-auto mb-2 opacity-60" />
                <p className="text-sm">Tap and drag to draw</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-3 pt-3 shrink-0">

        <div className="rounded-2xl border border-border/60 bg-white shadow-soft p-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setTool('draw'); setShowPalette((s) => !s); }}
              className="w-10 h-10 rounded-full border border-border/60 flex items-center justify-center"
              aria-label="Pick color"
              style={{ background: tool === 'draw' || tool === 'fill' ? color : 'transparent' }}
            >
              {tool === 'eraser' ? <Palette className="w-4 h-4 text-foreground" /> : null}
            </button>
            <button
              type="button"
              onClick={() => setTool(tool === 'fill' ? 'draw' : 'fill')}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                isFill ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-foreground'
              }`}
              aria-label="Fill area with color"
              title="Fill"
            >
              <PaintBucket className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool(tool === 'eraser' ? 'draw' : 'eraser')}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                isEraser ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-foreground'
              }`}
              aria-label="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleAddPicture}
              className="w-10 h-10 rounded-full border border-border/60 text-foreground flex items-center justify-center"
              aria-label="Add picture"
              title="Add picture"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePictureSelected}
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-1">
            {STROKE_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  size === s ? 'bg-muted' : ''
                }`}
                aria-label={`Stroke size ${s}`}
              >
                <span
                  className="rounded-full bg-foreground"
                  style={{ width: s + 2, height: s + 2 }}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStackRef.current.length === 0}
              className="w-10 h-10 rounded-full border border-border/60 flex items-center justify-center disabled:opacity-40"
              aria-label="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasContent}
              className="w-10 h-10 rounded-full border border-border/60 flex items-center justify-center disabled:opacity-40"
              aria-label="Clear"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showPalette && tool !== 'eraser' && (
          <div className="mt-2 rounded-2xl border border-border/60 bg-white shadow-soft p-3 flex items-center justify-around">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(c); setShowPalette(false); }}
                className={`w-9 h-9 rounded-full border-2 transition-transform ${
                  color === c ? 'border-foreground scale-110' : 'border-border/40'
                }`}
                style={{ background: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
