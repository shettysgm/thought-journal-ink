import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ImagePlus, X, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ALL_STICKERS } from './KawaiiStickers';

const BANNER_STICKERS = ALL_STICKERS;

interface JournalSidePanelProps {
  imageBlobs: Blob[];
  selectedSticker: string | null;
  onImagesChange: (blobs: Blob[]) => void;
  onStickerChange: (stickerId: string | null) => void;
  className?: string;
}

function BlobPreview({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (!url) return null;
  return (
    <img
      src={url}
      alt="Journal photo"
      className="w-full rounded-lg object-cover max-h-48"
    />
  );
}

export default function JournalSidePanel({
  imageBlobs,
  selectedSticker,
  onImagesChange,
  onStickerChange,
  className,
}: JournalSidePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'photo' | 'sticker'>('sticker');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const valid = files.filter(f => f.size <= 5 * 1024 * 1024);
      if (!valid.length) return;
      onImagesChange([...imageBlobs, ...valid]);
      onStickerChange(null);
      e.target.value = '';
    },
    [imageBlobs, onImagesChange, onStickerChange],
  );

  const handleStickerSelect = useCallback(
    (id: string) => {
      onStickerChange(selectedSticker === id ? null : id);
      onImagesChange([]);
    },
    [onImagesChange, onStickerChange, selectedSticker],
  );

  const clearAll = useCallback(() => {
    onImagesChange([]);
    onStickerChange(null);
  }, [onImagesChange, onStickerChange]);

  const hasContent = imageBlobs.length > 0 || !!selectedSticker;
  const activeStickerDef = selectedSticker
    ? BANNER_STICKERS.find(s => s.id === selectedSticker)
    : null;

  return (
    <div className={cn('relative flex flex-col', className)}>
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(prev => !prev)}
        className="absolute -left-3 top-4 z-10 rounded-full bg-card border shadow-sm p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {isCollapsed ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Personalize</span>
            {hasContent && (
              <button onClick={clearAll} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg bg-muted/50 p-0.5">
            <button
              onClick={() => setActiveTab('sticker')}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-md transition-colors font-medium',
                activeTab === 'sticker'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Stickers
            </button>
            <button
              onClick={() => setActiveTab('photo')}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-md transition-colors font-medium',
                activeTab === 'photo'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Photos
            </button>
          </div>

          {/* Selected preview */}
          {hasContent && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              {imageBlobs.map((blob, i) => (
                <div key={i} className="relative">
                  <BlobPreview blob={blob} />
                  <button
                    onClick={() => onImagesChange(imageBlobs.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 rounded-full bg-background/80 backdrop-blur p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {activeStickerDef && imageBlobs.length === 0 && (
                <div className="flex items-center justify-center min-h-[80px]">
                  <activeStickerDef.component
                    size={64}
                    {...(activeStickerDef.props as any)}
                    className="drop-shadow-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Photo tab */}
          {activeTab === 'photo' && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {imageBlobs.length > 0 ? `Add More (${imageBlobs.length})` : 'Upload Photos'}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">Max 5MB each • JPG, PNG, GIF</p>
            </div>
          )}

          {/* Sticker tab */}
          {activeTab === 'sticker' && (
            <div className="grid grid-cols-4 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
              {BANNER_STICKERS.map(sticker => {
                const Comp = sticker.component;
                return (
                  <button
                    key={sticker.id}
                    onClick={() => handleStickerSelect(sticker.id)}
                    className={cn(
                      'flex items-center justify-center p-2 rounded-lg hover:bg-accent/50 transition-colors aspect-square',
                      selectedSticker === sticker.id && 'ring-2 ring-primary bg-accent/30',
                    )}
                  >
                    <Comp size={24} {...(sticker.props as any)} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Hidden file input - supports multiple */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
