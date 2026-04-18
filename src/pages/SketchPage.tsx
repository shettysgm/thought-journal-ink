import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSameDay } from 'date-fns';
import { Eraser, Undo2, Trash2, Check, Palette, Pencil, Tablet, ArrowLeft, PaintBucket } from 'lucide-react';
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
  // Pre-existing sketch image (today's saved drawing) painted as the base layer
  const baseImageRef = useRef<HTMLImageElement | null>(null);

  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(STROKE_SIZES[1]);
  const [tool, setTool] = useState<'draw' | 'eraser' | 'fill'>('draw');
  const isEraser = tool === 'eraser';
  const isFill = tool === 'fill';
  const [showPalette, setShowPalette] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedExisting, setLoadedExisting] = useState(false);

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
    ctx.restore();

    // Paint preloaded sketch (today's saved drawing) as the base layer
    if (baseImageRef.current) {
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      ctx.drawImage(baseImageRef.current, 0, 0, cssW, cssH);
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

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    const pos = getPos(e);
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
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    setHasContent(strokesRef.current.length > 0 || !!baseImageRef.current);
    redraw();
  };

  const handleClear = () => {
    if (strokesRef.current.length === 0 && !baseImageRef.current) return;
    if (!confirm('Clear the whole sketch?')) return;
    strokesRef.current = [];
    baseImageRef.current = null;
    setHasContent(false);
    redraw();
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
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none"
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
              onClick={() => { setIsEraser(false); setShowPalette((s) => !s); }}
              className="w-10 h-10 rounded-full border border-border/60 flex items-center justify-center"
              aria-label="Pick color"
              style={{ background: isEraser ? 'transparent' : color }}
            >
              {isEraser ? <Palette className="w-4 h-4 text-foreground" /> : null}
            </button>
            <button
              type="button"
              onClick={() => setIsEraser((v) => !v)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                isEraser ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-foreground'
              }`}
              aria-label="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
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
              disabled={!hasContent}
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

        {showPalette && !isEraser && (
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
