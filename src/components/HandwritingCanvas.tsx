import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Pen, Eraser, RotateCcw, Trash2, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HandwritingCanvasProps {
  onSave: (imageBlob: Blob, text?: string) => Promise<void>;
  onOCR: (imageBlob: Blob) => Promise<string>;
}

type Tool = 'pen' | 'eraser';

export function HandwritingCanvas({ onSave, onOCR }: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [hasContent, setHasContent] = useState(false);
  const [ocrText, setOcrText] = useState<string>('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = Math.min(container.clientHeight, 500);
        
        // Set white background
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          saveToHistory();
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => [...prev.slice(-9), imageData]); // Keep last 10 states
    }
  };

  const undo = () => {
    if (history.length > 1) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        const previousState = history[history.length - 2];
        ctx.putImageData(previousState, 0, 0);
        setHistory(prev => prev.slice(0, -1));
        setHasContent(true);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasContent(false);
      setOcrText('');
      saveToHistory();
    }
  };

  const getEventPos = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getEventPos(event);

    ctx.beginPath();
    ctx.moveTo(x, y);
    
    if (tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = strokeWidth;
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 2;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getEventPos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const getCanvasBlob = (): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(new Blob());
        return;
      }
      canvas.toBlob((blob) => {
        resolve(blob || new Blob());
      }, 'image/png');
    });
  };

  const handleOCR = async () => {
    if (!hasContent) return;
    
    setIsProcessingOCR(true);
    try {
      const blob = await getCanvasBlob();
      const text = await onOCR(blob);
      setOcrText(text);
    } catch (error) {
      console.error('OCR failed:', error);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleSave = async () => {
    if (!hasContent && !ocrText) return;
    
    setIsSaving(true);
    try {
      const blob = await getCanvasBlob();
      await onSave(blob, ocrText);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Canvas */}
      <Card className="overflow-hidden shadow-medium">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Draw or write your thoughts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative bg-white border-t">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ height: '400px' }}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            
            {/* Drawing tools */}
            <div className="flex gap-2">
              <Button
                variant={tool === 'pen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('pen')}
                className="gap-2"
              >
                <Pen className="w-4 h-4" />
                Pen
              </Button>
              <Button
                variant={tool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('eraser')}
                className="gap-2"
              >
                <Eraser className="w-4 h-4" />
                Eraser
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Stroke width */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Size:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20"
              />
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={history.length <= 1}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                disabled={!hasContent}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OCR and Save */}
      <div className="flex gap-4 flex-wrap">
        <Button
          onClick={handleOCR}
          disabled={!hasContent || isProcessingOCR}
          className="gap-2 flex-1"
          variant="secondary"
        >
          {isProcessingOCR ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {isProcessingOCR ? 'Processing...' : 'Run OCR'}
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={(!hasContent && !ocrText) || isSaving}
          className="gap-2 flex-1"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Save & Analyze'
          )}
        </Button>
      </div>

      {/* OCR Result */}
      {ocrText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">OCR Result</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full h-32 p-3 border rounded-md resize-none"
              placeholder="Edit the recognized text if needed..."
            />
          </CardContent>
        </Card>
      )}
      
    </div>
  );
}