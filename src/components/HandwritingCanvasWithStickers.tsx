import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Pen, 
  Eraser, 
  Undo, 
  RotateCcw, 
  Save, 
  Eye,
  Palette,
  Minus,
  Plus,
  Sticker
} from 'lucide-react';
import { processImage } from '@/lib/ocr';

type Tool = 'pen' | 'eraser' | 'sticker';

interface StickerPlacement {
  sticker: string;
  x: number;
  y: number;
  id: string;
  isGraphic?: boolean;
  stickerData?: any;
}

interface HandwritingCanvasWithStickersProps {
  onSave: (imageBlob: Blob, text?: string, stickers?: StickerPlacement[]) => Promise<void>;
  onOCR: (imageBlob: Blob) => Promise<string>;
  selectedSticker?: string;
  selectedStickerData?: any;
}

const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];

export default function HandwritingCanvasWithStickers({ onSave, onOCR, selectedSticker, selectedStickerData }: HandwritingCanvasWithStickersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>('');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [stickerPlacements, setStickerPlacements] = useState<StickerPlacement[]>([]);

  const drawLinedBackground = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    const lineSpacing = 40;
    for (let y = lineSpacing; y < canvas.height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(canvas.width - 20, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw background
    drawLinedBackground(ctx, canvas);
    
    // Redraw stickers
    stickerPlacements.forEach(placement => {
      if (placement.isGraphic && placement.stickerData) {
        // For graphic stickers, we'll draw a placeholder circle with text
        ctx.save();
        ctx.fillStyle = '#f0f0f0';
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(placement.x, placement.y, 16, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📎', placement.x, placement.y);
        ctx.restore();
      } else {
        // Regular emoji stickers
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(placement.sticker, placement.x, placement.y);
      }
    });
  }, [drawLinedBackground, stickerPlacements]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      drawLinedBackground(ctx, canvas);
      saveToHistory();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawLinedBackground]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-9), imageData]);
  };

  const undo = () => {
    if (history.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const previousState = history[history.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(prev => prev.slice(0, -1));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    drawLinedBackground(ctx, canvas);
    setStickerPlacements([]);
    setHistory([]);
    setOcrResult('');
    saveToHistory();
  };

  const getEventPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'sticker' && selectedSticker) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      const newSticker: StickerPlacement = {
        sticker: selectedSticker,
        x: pos.x,
        y: pos.y,
        id: Date.now().toString(),
        isGraphic: !!selectedStickerData,
        stickerData: selectedStickerData
      };
      
      setStickerPlacements(prev => [...prev, newSticker]);
      saveToHistory();
      
      // Redraw with new sticker
      setTimeout(() => redrawCanvas(), 0);
    }
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Don't start drawing in sticker mode
    if (currentTool === 'sticker') {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    const pos = getEventPos(e);

    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool === 'sticker') return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pos = getEventPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToHistory();
  };

  const getCanvasBlob = (): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(new Blob());
        return;
      }
      
      // Create a temporary canvas with stickers rendered
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Draw the main canvas content
        tempCtx.drawImage(canvas, 0, 0);
        
        // Draw stickers on top
        stickerPlacements.forEach(placement => {
          if (placement.isGraphic && placement.stickerData) {
            // For graphic stickers, draw a visual representation
            tempCtx.save();
            tempCtx.fillStyle = '#ff6b9d';
            tempCtx.strokeStyle = '#fff';
            tempCtx.lineWidth = 2;
            tempCtx.beginPath();
            tempCtx.arc(placement.x, placement.y, 16, 0, 2 * Math.PI);
            tempCtx.fill();
            tempCtx.stroke();
            
            tempCtx.fillStyle = '#fff';
            tempCtx.font = '16px Arial';
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'middle';
            tempCtx.fillText('♥', placement.x, placement.y);
            tempCtx.restore();
          } else {
            // Regular emoji stickers
            tempCtx.font = '32px Arial';
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'middle';
            tempCtx.fillText(placement.sticker, placement.x, placement.y);
          }
        });
      }
      
      tempCanvas.toBlob((blob) => {
        resolve(blob || new Blob());
      }, 'image/png');
    });
  };

  const handleOCR = async () => {
    setIsProcessingOCR(true);
    try {
      const blob = await getCanvasBlob();
      const result = await onOCR(blob);
      setOcrResult(result);
    } catch (error) {
      console.error('OCR failed:', error);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const blob = await getCanvasBlob();
      await onSave(blob, ocrResult, stickerPlacements);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const removeStickerPlacement = (id: string) => {
    setStickerPlacements(prev => prev.filter(s => s.id !== id));
    setTimeout(() => redrawCanvas(), 0);
  };

  useEffect(() => {
    if (selectedSticker) {
      setCurrentTool('sticker');
    }
  }, [selectedSticker, selectedStickerData]);

  return (
    <Card className="w-full shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="w-5 h-5" />
          Digital Canvas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Tools */}
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
          <Button
            variant={currentTool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('pen')}
            className="gap-2"
          >
            <Pen className="w-4 h-4" />
            Pen
          </Button>
          
          <Button
            variant={currentTool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('eraser')}
            className="gap-2"
          >
            <Eraser className="w-4 h-4" />
            Eraser
          </Button>

          <Button
            variant={currentTool === 'sticker' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTool('sticker')}
            className="gap-2"
            disabled={!selectedSticker}
          >
            <Sticker className="w-4 h-4" />
            {selectedSticker ? `Place ${selectedSticker}` : 'Sticker'}
          </Button>
          
          <div className="flex items-center gap-2 ml-4">
            <Palette className="w-4 h-4" />
            {colors.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border-2 ${
                  selectedColor === color ? 'border-foreground' : 'border-border'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-sm min-w-[20px] text-center">{strokeWidth}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 1))}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="border-2 border-dashed border-border rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className={`w-full h-96 touch-none ${
              currentTool === 'sticker' ? 'cursor-pointer' : 'cursor-crosshair'
            }`}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onClick={handleCanvasClick}
          />
        </div>

        {/* Placed Stickers */}
        {stickerPlacements.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Placed Stickers:</label>
            <div className="flex flex-wrap gap-2">
              {stickerPlacements.map((placement) => (
                <Badge
                  key={placement.id}
                  variant="secondary"
                  className="text-lg cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={() => removeStickerPlacement(placement.id)}
                >
                  {placement.sticker}
                  <span className="ml-1 text-xs opacity-70">×</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={undo}
            disabled={history.length === 0}
            className="gap-2"
          >
            <Undo className="w-4 h-4" />
            Undo
          </Button>
          
          <Button
            variant="outline"
            onClick={clearCanvas}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </Button>
          
          <Button
            variant="outline"
            onClick={handleOCR}
            disabled={isProcessingOCR}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            {isProcessingOCR ? 'Reading...' : 'Read Text'}
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 ml-auto"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* OCR Result */}
        {ocrResult && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Recognized Text:</label>
            <Textarea
              value={ocrResult}
              onChange={(e) => setOcrResult(e.target.value)}
              className="min-h-[100px] text-sm"
              placeholder="Text recognized from your handwriting will appear here..."
            />
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}