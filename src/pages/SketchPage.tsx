import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSameDay } from 'date-fns';
import { Eraser, Undo2, Trash2, Check, Palette, Pencil, Tablet, ArrowLeft, PaintBucket, ImagePlus, ZoomIn, ZoomOut, X, Pipette, Sparkles, Heart, Star, ArrowUpRight, MessageCircle, Brush, SprayCan, Droplet, Shapes, Grid3x3, FlipHorizontal2 } from 'lucide-react';
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

type BrushType = 'pen' | 'pencil' | 'marker' | 'watercolor' | 'spray';
type StampType = 'heart' | 'star' | 'arrow' | 'bubble';

type Stroke = {
  color: string;
  size: number;
  isEraser: boolean;
  brush: BrushType;
  opacity: number;
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
  const [tool, setTool] = useState<'draw' | 'eraser' | 'fill' | 'eyedropper' | 'stamp'>('draw');
  const [brush, setBrush] = useState<BrushType>('pen');
  const [opacity, setOpacity] = useState(1);
  const [stabilize, setStabilize] = useState(false);
  const [smartShape, setSmartShape] = useState(false);
  const [perspective, setPerspective] = useState<'off' | '1pt' | '2pt'>('off');
  const [symmetry, setSymmetry] = useState<'off' | 'vertical' | 'horizontal' | 'mandala'>('off');
  const [mandalaSlices, setMandalaSlices] = useState(8);
  const [stamp, setStamp] = useState<StampType>('heart');
  const [showBrushes, setShowBrushes] = useState(false);
  const [showStamps, setShowStamps] = useState(false);
  const [showHelpers, setShowHelpers] = useState(false);
  const isEraser = tool === 'eraser';
  const isFill = tool === 'fill';
  const isEyedropper = tool === 'eyedropper';
  const isStamp = tool === 'stamp';
  const [showPalette, setShowPalette] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedExisting, setLoadedExisting] = useState(false);
  // Paper style: 'plain' shows a solid soft-tint background; 'lined' overlays
  // ruled horizontal lines (rendered via CSS on the wrapper, AND baked under
  // the sketch when saving so the saved PNG matches what the user saw).
  const [paper, setPaper] = useState<'plain' | 'lined'>('plain');
  const LINE_SPACING = 32; // CSS px between ruled lines
  const LINE_COLOR = 'hsl(210 40% 65%)'; // notebook-ruled blue, clearly visible

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
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.size;
    ctx.globalCompositeOperation = stroke.isEraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.globalAlpha = stroke.isEraser ? 1 : stroke.opacity;

    if (stroke.isEraser || stroke.brush === 'pen') {
      ctx.beginPath();
      const [first, ...rest] = stroke.points;
      ctx.moveTo(first.x, first.y);
      for (const p of rest) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else if (stroke.brush === 'marker') {
      // Marker: thicker, square cap, slightly translucent
      ctx.lineCap = 'square';
      ctx.globalAlpha = stroke.opacity * 0.7;
      ctx.lineWidth = stroke.size * 1.6;
      ctx.beginPath();
      const [first, ...rest] = stroke.points;
      ctx.moveTo(first.x, first.y);
      for (const p of rest) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else if (stroke.brush === 'pencil') {
      // Pencil: thin grainy strokes via small dots offset
      ctx.globalAlpha = stroke.opacity * 0.55;
      ctx.lineWidth = Math.max(1, stroke.size * 0.6);
      ctx.beginPath();
      const [first, ...rest] = stroke.points;
      ctx.moveTo(first.x, first.y);
      for (const p of rest) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      // Grain dots
      for (const p of stroke.points) {
        if (Math.random() < 0.35) {
          ctx.globalAlpha = stroke.opacity * 0.25;
          ctx.beginPath();
          ctx.arc(p.x + (Math.random() - 0.5) * stroke.size, p.y + (Math.random() - 0.5) * stroke.size, 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (stroke.brush === 'watercolor') {
      // Watercolor: layered translucent strokes
      for (let layer = 0; layer < 3; layer++) {
        ctx.globalAlpha = stroke.opacity * 0.18;
        ctx.lineWidth = stroke.size * (1 + layer * 0.5);
        ctx.beginPath();
        const [first, ...rest] = stroke.points;
        ctx.moveTo(first.x, first.y);
        for (const p of rest) ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    } else if (stroke.brush === 'spray') {
      // Spray: random dots around each point
      ctx.globalAlpha = stroke.opacity;
      const radius = stroke.size * 1.5;
      for (const p of stroke.points) {
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * radius;
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
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

  // Pick color at canvas pixel position (eyedropper)
  const pickColorAt = (cssX: number, cssY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const dpr = window.devicePixelRatio || 1;
    const x = Math.floor(cssX * dpr);
    const y = Math.floor(cssY * dpr);
    try {
      const px = ctx.getImageData(x, y, 1, 1).data;
      // If transparent, treat as white
      if (px[3] === 0) return '#ffffff';
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(px[0])}${toHex(px[1])}${toHex(px[2])}`;
    } catch {
      return null;
    }
  };

  // Draw a vector stamp shape at given position
  const drawStamp = (ctx: CanvasRenderingContext2D, kind: StampType, cx: number, cy: number, s: number, hex: string) => {
    ctx.save();
    ctx.fillStyle = hex;
    ctx.strokeStyle = hex;
    ctx.lineWidth = Math.max(2, s / 8);
    ctx.lineJoin = 'round';
    const r = s;
    ctx.beginPath();
    if (kind === 'heart') {
      const top = cy - r * 0.3;
      ctx.moveTo(cx, cy + r * 0.7);
      ctx.bezierCurveTo(cx + r, cy + r * 0.2, cx + r, top - r * 0.4, cx, top);
      ctx.bezierCurveTo(cx - r, top - r * 0.4, cx - r, cy + r * 0.2, cx, cy + r * 0.7);
      ctx.fill();
    } else if (kind === 'star') {
      const spikes = 5;
      const outer = r;
      const inner = r * 0.45;
      let rot = -Math.PI / 2;
      const step = Math.PI / spikes;
      ctx.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
      for (let i = 0; i < spikes; i++) {
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
      }
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'arrow') {
      // Arrow pointing up-right
      const len = r * 1.4;
      ctx.lineWidth = Math.max(3, s / 4);
      ctx.lineCap = 'round';
      ctx.moveTo(cx - len / 2, cy + len / 2);
      ctx.lineTo(cx + len / 2, cy - len / 2);
      ctx.stroke();
      // Head
      ctx.beginPath();
      ctx.moveTo(cx + len / 2, cy - len / 2);
      ctx.lineTo(cx + len / 2 - r * 0.5, cy - len / 2 + r * 0.1);
      ctx.moveTo(cx + len / 2, cy - len / 2);
      ctx.lineTo(cx + len / 2 - r * 0.1, cy - len / 2 + r * 0.5);
      ctx.stroke();
    } else if (kind === 'bubble') {
      // Speech bubble
      const w = r * 1.8;
      const h = r * 1.3;
      const rad = r * 0.4;
      ctx.moveTo(cx - w / 2 + rad, cy - h / 2);
      ctx.lineTo(cx + w / 2 - rad, cy - h / 2);
      ctx.quadraticCurveTo(cx + w / 2, cy - h / 2, cx + w / 2, cy - h / 2 + rad);
      ctx.lineTo(cx + w / 2, cy + h / 2 - rad);
      ctx.quadraticCurveTo(cx + w / 2, cy + h / 2, cx + w / 2 - rad, cy + h / 2);
      ctx.lineTo(cx - w / 4, cy + h / 2);
      ctx.lineTo(cx - w / 3, cy + h / 2 + r * 0.4);
      ctx.lineTo(cx - w / 6, cy + h / 2);
      ctx.lineTo(cx - w / 2 + rad, cy + h / 2);
      ctx.quadraticCurveTo(cx - w / 2, cy + h / 2, cx - w / 2, cy + h / 2 - rad);
      ctx.lineTo(cx - w / 2, cy - h / 2 + rad);
      ctx.quadraticCurveTo(cx - w / 2, cy - h / 2, cx - w / 2 + rad, cy - h / 2);
      ctx.closePath();
      ctx.lineWidth = Math.max(2, s / 6);
      ctx.stroke();
    }
    ctx.restore();
  };

  const bakeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      baseSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokesRef.current = [];
      setHasContent(true);
    } catch (e) {
      console.warn('[Sketch] failed to bake', e);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const pos = getPos(e);

    if (isEyedropper) {
      const hex = pickColorAt(pos.x, pos.y);
      if (hex) {
        setColor(hex);
        toast({ title: 'Color picked', description: hex.toUpperCase() });
      }
      setTool('draw');
      return;
    }

    if (isStamp) {
      pushUndo();
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = opacity;
        drawStamp(ctx, stamp, pos.x, pos.y, Math.max(20, size * 6), color);
        ctx.globalAlpha = 1;
        bakeCanvas();
      }
      return;
    }

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
      brush,
      opacity,
      points: [pos],
    };
  };

  // Exponential smoothing for stabilization (pulls cursor toward previous point)
  const smoothPoint = (prev: { x: number; y: number }, next: { x: number; y: number }, factor: number) => ({
    x: prev.x + (next.x - prev.x) * factor,
    y: prev.y + (next.y - prev.y) * factor,
  });

  // Mirror a point across the canvas based on the active symmetry mode.
  // Returns ALL mirrored copies (not including the original).
  const mirrorPoint = (p: { x: number; y: number }): { x: number; y: number }[] => {
    const canvas = canvasRef.current;
    if (!canvas || symmetry === 'off') return [];
    const dpr = window.devicePixelRatio || 1;
    const cx = canvas.width / dpr / 2;
    const cy = canvas.height / dpr / 2;
    if (symmetry === 'vertical') {
      return [{ x: 2 * cx - p.x, y: p.y }];
    }
    if (symmetry === 'horizontal') {
      return [{ x: p.x, y: 2 * cy - p.y }];
    }
    // Mandala: rotate around center for N slices
    const out: { x: number; y: number }[] = [];
    const dx = p.x - cx;
    const dy = p.y - cy;
    for (let i = 1; i < mandalaSlices; i++) {
      const a = (i * Math.PI * 2) / mandalaSlices;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      out.push({ x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos });
    }
    return out;
  };

  // Detect whether a freehand stroke looks like a circle, line, or rectangle.
  // Returns a polished replacement point list, or null to keep the freehand stroke.
  const detectShape = (pts: { x: number; y: number }[]): { x: number; y: number }[] | null => {
    if (pts.length < 8) return null;

    // Bounding box
    let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const w = maxX - minX;
    const h = maxY - minY;
    if (w < 20 && h < 20) return null;

    const start = pts[0];
    const end = pts[pts.length - 1];
    const closed = Math.hypot(start.x - end.x, start.y - end.y) < Math.max(w, h) * 0.25;

    // 1) Straight line: small box on one axis
    if (!closed && (w < 16 || h < 16)) {
      return [start, end];
    }

    if (closed) {
      // Test for circle: average distance from centroid is roughly constant
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const dists = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
      const meanR = dists.reduce((a, b) => a + b, 0) / dists.length;
      const variance = dists.reduce((a, b) => a + (b - meanR) ** 2, 0) / dists.length;
      const stdev = Math.sqrt(variance);
      const aspect = Math.min(w, h) / Math.max(w, h);

      // Circle: low variance AND nearly square bounding box
      if (stdev / meanR < 0.22 && aspect > 0.75) {
        const out: { x: number; y: number }[] = [];
        const r = (w + h) / 4;
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
        return out;
      }

      // Rectangle: closed loop that isn't circular → snap to bounding rectangle
      return [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
        { x: minX, y: minY },
      ];
    }

    return null;
  };

  // Render a single segment of the in-progress stroke from point a → b at given coords
  const renderLiveSegment = (
    ctx: CanvasRenderingContext2D,
    cur: Stroke,
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => {
    ctx.save();
    ctx.lineCap = cur.brush === 'marker' ? 'square' : 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = cur.brush === 'marker' ? cur.size * 1.6 : cur.size;
    ctx.globalCompositeOperation = cur.isEraser ? 'destination-out' : 'source-over';
    ctx.strokeStyle = cur.color;
    ctx.globalAlpha = cur.isEraser ? 1 : (cur.brush === 'marker' ? cur.opacity * 0.7 : cur.opacity);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || !currentRef.current) return;
    e.preventDefault();
    let pos = getPos(e);
    const pts = currentRef.current.points;

    // Stabilization: blend new point toward last
    if (stabilize && pts.length > 0) {
      pos = smoothPoint(pts[pts.length - 1], pos, 0.35);
    }
    pts.push(pos);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const cur = currentRef.current;
    const isSimpleBrush = cur.isEraser || cur.brush === 'pen' || cur.brush === 'marker';

    if (isSimpleBrush && pts.length >= 2) {
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      renderLiveSegment(ctx, cur, a, b);
      // Symmetry: also draw mirrored segment(s) live
      if (symmetry !== 'off') {
        const ma = mirrorPoint(a);
        const mb = mirrorPoint(b);
        for (let i = 0; i < ma.length; i++) {
          renderLiveSegment(ctx, cur, ma[i], mb[i]);
        }
      }
    } else {
      // Repaint the entire base + strokes to render textured brushes correctly
      redraw();
      drawStroke(ctx, cur);
      if (symmetry !== 'off') {
        const mirrored = pts.map((p) => mirrorPoint(p));
        const copies = mirrored[0]?.length ?? 0;
        for (let c = 0; c < copies; c++) {
          drawStroke(ctx, { ...cur, points: mirrored.map((arr) => arr[c]) });
        }
      }
    }
  };

  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const cur = currentRef.current;
    if (cur && cur.points.length > 0) {
      // Smart Shape: try to recognize circle / line / rect and replace points
      if (smartShape && !cur.isEraser) {
        const snapped = detectShape(cur.points);
        if (snapped) {
          cur.points = snapped;
          // Repaint base + redraw the snapped stroke cleanly
          redraw();
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) drawStroke(ctx, cur);
        }
      }
      // Push the primary stroke
      strokesRef.current.push(cur);
      // Symmetry: persist mirrored copies as additional strokes so they survive redraws
      if (symmetry !== 'off') {
        const mirrored = cur.points.map((p) => mirrorPoint(p));
        const copies = mirrored[0]?.length ?? 0;
        for (let c = 0; c < copies; c++) {
          strokesRef.current.push({ ...cur, points: mirrored.map((arr) => arr[c]) });
        }
        // Re-render so mirrored strokes from textured brushes appear baked-in
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          redraw();
        }
      }
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

      // If the user picked lined paper, bake the ruled lines under the sketch
      // so the saved PNG matches what they saw while drawing.
      if (paper === 'lined') {
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = 1;
        for (let y = LINE_SPACING * dpr; y < out.height; y += LINE_SPACING * dpr) {
          ctx.beginPath();
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(out.width, y + 0.5);
          ctx.stroke();
        }
        ctx.restore();
      }

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
          disabled={!hasContent || saving || !!placement}
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
          className="relative w-full h-full rounded-2xl border border-border/60 bg-white shadow-soft overflow-hidden"
          style={{
            touchAction: 'none',
            backgroundImage:
              paper === 'lined'
                ? `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE_SPACING - 1}px, ${LINE_COLOR} ${LINE_SPACING - 1}px, ${LINE_COLOR} ${LINE_SPACING}px)`
                : undefined,
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`absolute inset-0 w-full h-full touch-none select-none ${isFill || isStamp ? 'cursor-cell' : isEyedropper ? 'cursor-copy' : 'cursor-crosshair'}`}
            style={{ touchAction: 'none', pointerEvents: placement ? 'none' : 'auto' }}
          />
          {/* Lined-paper overlay rendered ABOVE the canvas so it's visible
              even when an opaque preloaded sketch covers the wrapper bg. */}
          {paper === 'lined' && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE_SPACING - 1}px, ${LINE_COLOR} ${LINE_SPACING - 1}px, ${LINE_COLOR} ${LINE_SPACING}px)`,
                opacity: 0.45,
                mixBlendMode: 'multiply',
              }}
              aria-hidden
            />
          )}
          {/* Perspective grid overlay (1-point or 2-point) — pure SVG guides */}
          {perspective !== 'off' && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              {/* Horizon line */}
              <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--primary))" strokeWidth="0.15" strokeDasharray="1 1" opacity="0.5" />
              {perspective === '1pt' && Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * Math.PI * 2;
                const x2 = 50 + Math.cos(angle) * 200;
                const y2 = 50 + Math.sin(angle) * 200;
                return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="hsl(var(--primary))" strokeWidth="0.1" opacity="0.35" />;
              })}
              {perspective === '2pt' && (
                <>
                  {Array.from({ length: 16 }).map((_, i) => {
                    const t = i / 15;
                    const y = t * 100;
                    return <line key={`l${i}`} x1="-20" y1="50" x2="100" y2={y} stroke="hsl(var(--primary))" strokeWidth="0.1" opacity="0.3" />;
                  })}
                  {Array.from({ length: 16 }).map((_, i) => {
                    const t = i / 15;
                    const y = t * 100;
                    return <line key={`r${i}`} x1="120" y1="50" x2="0" y2={y} stroke="hsl(var(--primary))" strokeWidth="0.1" opacity="0.3" />;
                  })}
                  {/* Vanishing-point markers */}
                  <circle cx="-20" cy="50" r="0.6" fill="hsl(var(--primary))" />
                  <circle cx="120" cy="50" r="0.6" fill="hsl(var(--primary))" />
                </>
              )}
            </svg>
          )}
          {/* Symmetry guide lines */}
          {symmetry !== 'off' && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              {(symmetry === 'vertical' || symmetry === 'mandala') && (
                <line x1="50" y1="0" x2="50" y2="100" stroke="hsl(var(--primary))" strokeWidth="0.15" strokeDasharray="1 1" opacity="0.55" />
              )}
              {(symmetry === 'horizontal' || symmetry === 'mandala') && (
                <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--primary))" strokeWidth="0.15" strokeDasharray="1 1" opacity="0.55" />
              )}
              {symmetry === 'mandala' && Array.from({ length: mandalaSlices }).map((_, i) => {
                const a = (i / mandalaSlices) * Math.PI * 2;
                const x2 = 50 + Math.cos(a) * 80;
                const y2 = 50 + Math.sin(a) * 80;
                return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="hsl(var(--primary))" strokeWidth="0.08" opacity="0.35" />;
              })}
            </svg>
          )}
          {!hasContent && !placement && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground/70">
                <Pencil className="w-10 h-10 mx-auto mb-2 opacity-60" />
                <p className="text-sm">Tap and drag to draw</p>
              </div>
            </div>
          )}

          {/* Floating placement overlay: drag to move, pinch / wheel / +- to zoom */}
          {placement && (
            <>
              <img
                src={placement.src}
                alt="Placing"
                draggable={false}
                onPointerDown={onPlacementPointerDown}
                onPointerMove={onPlacementPointerMove}
                onPointerUp={onPlacementPointerUp}
                onPointerCancel={onPlacementPointerUp}
                onWheel={onPlacementWheel}
                style={{
                  position: 'absolute',
                  left: placement.x,
                  top: placement.y,
                  width: placement.img.width * placement.scale,
                  height: placement.img.height * placement.scale,
                  touchAction: 'none',
                  cursor: 'move',
                  userSelect: 'none',
                  // Soft outline so the user can see the bounds while placing.
                  outline: '2px dashed hsl(var(--primary))',
                  outlineOffset: '2px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.0)',
                }}
              />
              {/* Floating action bar */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur shadow-soft border border-border/60 px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => zoomPlacement(1 / 1.15)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => zoomPlacement(1.15)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="w-px h-6 bg-border mx-1" aria-hidden />
                <button
                  type="button"
                  onClick={cancelPlacement}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted"
                  aria-label="Cancel picture"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={commitPlacement}
                  className="h-9 px-3 rounded-full bg-primary text-primary-foreground flex items-center gap-1 text-sm font-medium"
                  aria-label="Place picture"
                >
                  <Check className="w-4 h-4" />
                  Place
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-3 pt-3 shrink-0">

        <div className="rounded-2xl border border-border/60 bg-white shadow-soft p-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
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
              onClick={() => { setTool(tool === 'eraser' ? 'draw' : 'eraser'); setShowBrushes(false); setShowStamps(false); }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                isEraser ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-foreground'
              }`}
              aria-label="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setTool('draw'); setShowBrushes((s) => !s); setShowStamps(false); setShowPalette(false); }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                showBrushes ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-foreground'
              }`}
              aria-label="Brush type"
              title="Brush type"
            >
              {brush === 'marker' ? <Brush className="w-4 h-4" /> :
               brush === 'spray' ? <SprayCan className="w-4 h-4" /> :
               brush === 'watercolor' ? <Droplet className="w-4 h-4" /> :
               <Pencil className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => { setTool(isEyedropper ? 'draw' : 'eyedropper'); setShowBrushes(false); setShowStamps(false); }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                isEyedropper ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-foreground'
              }`}
              aria-label="Eyedropper - pick color from canvas"
              title="Eyedropper"
            >
              <Pipette className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setTool(isStamp ? 'draw' : 'stamp'); setShowStamps((s) => !s); setShowBrushes(false); setShowPalette(false); }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                isStamp ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-foreground'
              }`}
              aria-label="Shape stamps"
              title="Shape stamps"
            >
              {stamp === 'star' ? <Star className="w-4 h-4" /> :
               stamp === 'arrow' ? <ArrowUpRight className="w-4 h-4" /> :
               stamp === 'bubble' ? <MessageCircle className="w-4 h-4" /> :
               <Heart className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setStabilize((s) => !s)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                stabilize ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-foreground'
              }`}
              aria-label="Stabilize strokes"
              title={stabilize ? 'Stabilization on' : 'Stabilization off'}
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setShowHelpers((s) => !s); setShowBrushes(false); setShowStamps(false); setShowPalette(false); }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                showHelpers || smartShape || perspective !== 'off' || symmetry !== 'off'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/60 text-foreground'
              }`}
              aria-label="Smart helpers"
              title="Smart helpers"
            >
              <Shapes className="w-4 h-4" />
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
            {/* Paper style toggle: Plain / Lined */}
            <div
              className="ml-1 inline-flex rounded-full border border-border/60 p-0.5 bg-white"
              role="group"
              aria-label="Paper style"
            >
              <button
                type="button"
                onClick={() => setPaper('plain')}
                className={`h-9 px-3 rounded-full text-xs font-medium transition-colors ${
                  paper === 'plain' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                }`}
                aria-pressed={paper === 'plain'}
              >
                Plain
              </button>
              <button
                type="button"
                onClick={() => setPaper('lined')}
                className={`h-9 px-3 rounded-full text-xs font-medium transition-colors ${
                  paper === 'lined' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                }`}
                aria-pressed={paper === 'lined'}
              >
                Lined
              </button>
            </div>
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

        {showBrushes && (
          <div className="mt-2 rounded-2xl border border-border/60 bg-white shadow-soft p-3 space-y-3">
            <div className="flex items-center justify-around">
              {([
                { id: 'pen', label: 'Pen', icon: <Pencil className="w-4 h-4" /> },
                { id: 'pencil', label: 'Pencil', icon: <Pencil className="w-4 h-4" /> },
                { id: 'marker', label: 'Marker', icon: <Brush className="w-4 h-4" /> },
                { id: 'watercolor', label: 'Water', icon: <Droplet className="w-4 h-4" /> },
                { id: 'spray', label: 'Spray', icon: <SprayCan className="w-4 h-4" /> },
              ] as { id: BrushType; label: string; icon: JSX.Element }[]).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { setBrush(b.id); setShowBrushes(false); }}
                  className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors ${
                    brush === b.id ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                  }`}
                  aria-label={`${b.label} brush`}
                  aria-pressed={brush === b.id}
                >
                  {b.icon}
                  <span className="text-[10px] font-medium">{b.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 px-1">
              <span className="text-xs text-muted-foreground w-14 shrink-0">Opacity</span>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(opacity * 100)}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                className="flex-1 accent-primary"
                aria-label="Brush opacity"
              />
              <span className="text-xs tabular-nums text-foreground w-9 text-right">{Math.round(opacity * 100)}%</span>
            </div>
          </div>
        )}

        {showStamps && (
          <div className="mt-2 rounded-2xl border border-border/60 bg-white shadow-soft p-3 flex items-center justify-around">
            {([
              { id: 'heart', label: 'Heart', icon: <Heart className="w-5 h-5" /> },
              { id: 'star', label: 'Star', icon: <Star className="w-5 h-5" /> },
              { id: 'arrow', label: 'Arrow', icon: <ArrowUpRight className="w-5 h-5" /> },
              { id: 'bubble', label: 'Bubble', icon: <MessageCircle className="w-5 h-5" /> },
            ] as { id: StampType; label: string; icon: JSX.Element }[]).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setStamp(s.id); setShowStamps(false); setTool('stamp'); }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                  stamp === s.id ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
                aria-label={`${s.label} stamp`}
                aria-pressed={stamp === s.id}
              >
                {s.icon}
                <span className="text-[10px] font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {showHelpers && (
          <div className="mt-2 rounded-2xl border border-border/60 bg-white shadow-soft p-3 space-y-3">
            {/* Smart Shape toggle */}
            <button
              type="button"
              onClick={() => setSmartShape((s) => !s)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
                smartShape ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border/60 text-foreground hover:bg-muted'
              }`}
              aria-pressed={smartShape}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Shapes className="w-4 h-4" />
                Smart Shape
              </span>
              <span className="text-[10px] text-muted-foreground">
                {smartShape ? 'On — auto-snap circles, lines, rects' : 'Off'}
              </span>
            </button>

            {/* Perspective grid selector */}
            <div>
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Grid3x3 className="w-4 h-4" />
                  Perspective Grid
                </span>
              </div>
              <div className="inline-flex w-full rounded-full border border-border/60 p-0.5 bg-white">
                {([
                  { id: 'off', label: 'Off' },
                  { id: '1pt', label: '1-Point' },
                  { id: '2pt', label: '2-Point' },
                ] as { id: typeof perspective; label: string }[]).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPerspective(p.id)}
                    className={`flex-1 h-9 px-3 rounded-full text-xs font-medium transition-colors ${
                      perspective === p.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                    }`}
                    aria-pressed={perspective === p.id}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Symmetry mode selector */}
            <div>
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FlipHorizontal2 className="w-4 h-4" />
                  Symmetry
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {([
                  { id: 'off', label: 'Off' },
                  { id: 'vertical', label: 'Vert' },
                  { id: 'horizontal', label: 'Horiz' },
                  { id: 'mandala', label: 'Mandala' },
                ] as { id: typeof symmetry; label: string }[]).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSymmetry(s.id)}
                    className={`h-9 px-2 rounded-full text-xs font-medium border transition-colors ${
                      symmetry === s.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border/60 text-foreground hover:bg-muted'
                    }`}
                    aria-pressed={symmetry === s.id}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {symmetry === 'mandala' && (
                <div className="flex items-center gap-3 px-1 mt-2">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">Slices</span>
                  <input
                    type="range"
                    min={3}
                    max={16}
                    value={mandalaSlices}
                    onChange={(e) => setMandalaSlices(Number(e.target.value))}
                    className="flex-1 accent-primary"
                    aria-label="Mandala slices"
                  />
                  <span className="text-xs tabular-nums text-foreground w-9 text-right">{mandalaSlices}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
