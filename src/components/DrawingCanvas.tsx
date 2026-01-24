import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Trash2, Eraser, Pen, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
}

interface DrawingCanvasProps {
  onSave?: (blob: Blob) => void;
  onDrawingChange?: (hasContent: boolean) => void;
  className?: string;
  initialDrawing?: Blob | null;
}

const COLORS = [
  '#000000', // Black
  '#4A5568', // Gray
  '#2B6CB0', // Blue
  '#2F855A', // Green
  '#C53030', // Red
  '#D69E2E', // Gold
  '#805AD5', // Purple
];

const PEN_SIZES = [2, 4, 8, 12];

export default function DrawingCanvas({ 
  onSave, 
  onDrawingChange, 
  className,
  initialDrawing 
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<Stroke[]>([]);
  
  const [color, setColor] = useState('#000000');
  const [penSize, setPenSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [scale, setScale] = useState(1);
  
  // Touch/stylus state
  const lastPointRef = useRef<Point | null>(null);
  const isApplePencilRef = useRef(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Load initial drawing
  useEffect(() => {
    if (initialDrawing && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = URL.createObjectURL(initialDrawing);
    }
  }, [initialDrawing]);

  // Redraw all strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    // Draw paper lines for guidance
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    const lineSpacing = 32;
    for (let y = lineSpacing; y < canvas.height / dpr; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width / dpr, y);
      ctx.stroke();
    }
    
    // Draw all strokes
    strokes.forEach(stroke => {
      drawStroke(ctx, stroke);
    });
  }, [strokes]);

  useEffect(() => {
    redrawCanvas();
    onDrawingChange?.(strokes.length > 0);
  }, [strokes, redrawCanvas, onDrawingChange]);

  // Draw a single stroke with pressure sensitivity
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1];
      const p1 = stroke.points[i];
      
      // Apply pressure sensitivity
      const pressure = (p0.pressure + p1.pressure) / 2;
      const dynamicWidth = stroke.size * (0.5 + pressure * 0.5);
      
      ctx.beginPath();
      ctx.lineWidth = dynamicWidth;
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
  };

  // Draw current stroke in real-time
  const drawCurrentPoint = (point: Point) => {
    const canvas = canvasRef.current;
    if (!canvas || !lastPointRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pressure = (lastPointRef.current.pressure + point.pressure) / 2;
    const dynamicWidth = penSize * (0.5 + pressure * 0.5);

    ctx.beginPath();
    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = isEraser ? penSize * 3 : dynamicWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  // Get point from event with pressure support
  const getPoint = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5, timestamp: Date.now() };

    const rect = canvas.getBoundingClientRect();
    
    // Detect Apple Pencil
    if (e.pointerType === 'pen') {
      isApplePencilRef.current = true;
    }

    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
      pressure: e.pressure || 0.5, // Default pressure for non-pressure devices
      timestamp: Date.now(),
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only respond to pen or touch for drawing
    if (e.pointerType === 'mouse' && !e.ctrlKey) {
      // Allow mouse drawing too
    }

    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setPointerCapture(e.pointerId);
    }

    const point = getPoint(e);
    setIsDrawing(true);
    setCurrentStroke([point]);
    lastPointRef.current = point;
    setUndoneStrokes([]); // Clear redo stack on new stroke
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;

    e.preventDefault();
    const point = getPoint(e);
    
    // Draw the segment immediately for smooth feedback
    drawCurrentPoint(point);
    
    setCurrentStroke(prev => [...prev, point]);
    lastPointRef.current = point;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing) return;

    e.preventDefault();
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (currentStroke.length > 1) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: isEraser ? '#FFFFFF' : color,
        size: isEraser ? penSize * 3 : penSize,
      };
      setStrokes(prev => [...prev, newStroke]);
    }
    
    setCurrentStroke([]);
    lastPointRef.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    setIsDrawing(false);
    setCurrentStroke([]);
    lastPointRef.current = null;
  };

  // Undo/Redo
  const undo = () => {
    if (strokes.length === 0) return;
    const lastStroke = strokes[strokes.length - 1];
    setStrokes(prev => prev.slice(0, -1));
    setUndoneStrokes(prev => [...prev, lastStroke]);
  };

  const redo = () => {
    if (undoneStrokes.length === 0) return;
    const strokeToRedo = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes(prev => prev.slice(0, -1));
    setStrokes(prev => [...prev, strokeToRedo]);
  };

  const clear = () => {
    setStrokes([]);
    setUndoneStrokes([]);
    redrawCanvas();
  };

  // Export drawing
  const exportDrawing = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }, []);

  const handleSave = async () => {
    const blob = await exportDrawing();
    if (blob && onSave) {
      onSave(blob);
    }
  };

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-lg border overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b bg-muted/30">
        {/* Tool selection */}
        <div className="flex items-center gap-1 p-1 bg-background rounded-lg">
          <Button
            variant={!isEraser ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsEraser(false)}
            className="h-8 w-8 p-0"
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            variant={isEraser ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsEraser(true)}
            className="h-8 w-8 p-0"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        {/* Color palette */}
        <div className="flex items-center gap-1 p-1 bg-background rounded-lg">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              className={cn(
                "w-6 h-6 rounded-full transition-transform hover:scale-110",
                color === c && !isEraser && "ring-2 ring-offset-2 ring-primary"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Pen sizes */}
        <div className="flex items-center gap-1 p-1 bg-background rounded-lg">
          {PEN_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setPenSize(size)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                penSize === size ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <div 
                className="rounded-full bg-current" 
                style={{ width: size + 4, height: size + 4 }}
              />
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            className="h-8 w-8 p-0"
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            className="h-8 w-8 p-0"
            disabled={scale >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={strokes.length === 0}
          className="h-8 w-8 p-0"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={undoneStrokes.length === 0}
          className="h-8 w-8 p-0"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={strokes.length === 0}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {onSave && (
          <>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={strokes.length === 0}
              className="h-8 gap-1"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </>
        )}
      </div>

      {/* Canvas area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-white relative touch-none"
        style={{ 
          backgroundImage: 'linear-gradient(#E2E8F0 1px, transparent 1px)',
          backgroundSize: '100% 32px',
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerUp}
        />
        
        {/* Apple Pencil indicator */}
        {isApplePencilRef.current && isDrawing && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
            ✏️ Apple Pencil detected
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
        <span>{strokes.length} strokes</span>
        <span>
          {isApplePencilRef.current ? '✏️ Stylus mode' : '👆 Touch/Mouse mode'}
        </span>
      </div>
    </div>
  );
}
