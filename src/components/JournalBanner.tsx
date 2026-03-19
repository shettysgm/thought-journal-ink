import React, { useState, useRef, useCallback, useEffect } from 'react';
import { compressImages } from '@/lib/compressImage';
import { ImagePlus, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ALL_STICKERS } from './KawaiiStickers';

const BANNER_STICKERS = ALL_STICKERS;

interface JournalBannerProps {
  imageBlobs: Blob[];
  selectedSticker: string | null;
  onImagesChange: (blobs: Blob[]) => void;
  onStickerChange: (stickerId: string | null) => void;
  className?: string;
}

function BlobBanner({ blob }: { blob: Blob }) {
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
      alt="Journal banner"
      className="w-full h-full object-cover flex-shrink-0 snap-center"
    />
  );
}

export default function JournalBanner({
  imageBlobs,
  selectedSticker,
  onImagesChange,
  onStickerChange,
  className,
}: JournalBannerProps) {
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
      if (!validFiles.length) return;
      const compressed = await compressImages(validFiles);
      onImagesChange([...imageBlobs, ...compressed]);
      onStickerChange(null);
      e.target.value = '';
    },
    [imageBlobs, onImagesChange, onStickerChange],
  );

  const handleStickerSelect = useCallback(
    (id: string) => {
      onStickerChange(id);
      onImagesChange([]);
      setShowStickerPicker(false);
    },
    [onImagesChange, onStickerChange],
  );

  const clearBanner = useCallback(() => {
    onImagesChange([]);
    onStickerChange(null);
    setCurrentIndex(0);
  }, [onImagesChange, onStickerChange]);

  const removeImage = useCallback(
    (index: number) => {
      const updated = imageBlobs.filter((_, i) => i !== index);
      onImagesChange(updated);
      setCurrentIndex(prev => Math.min(prev, Math.max(0, updated.length - 1)));
    },
    [imageBlobs, onImagesChange],
  );

  const hasContent = imageBlobs.length > 0 || !!selectedSticker;

  const activeStickerDef = selectedSticker
    ? BANNER_STICKERS.find(s => s.id === selectedSticker)
    : null;

  return (
    <div className={cn('relative', className)}>
      {/* Banner display area */}
      <div
        className={cn(
          'relative w-full rounded-t-lg overflow-hidden transition-all duration-300',
          hasContent ? 'h-40 sm:h-52' : 'h-20',
          !hasContent && 'border-b border-dashed border-border bg-muted/30',
        )}
      >
        {imageBlobs.length > 0 && (
          <div className="relative w-full h-full">
            <BlobBanner blob={imageBlobs[currentIndex] || imageBlobs[0]} />
            {/* Image counter */}
            {imageBlobs.length > 1 && (
              <>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {imageBlobs.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        i === currentIndex ? 'bg-white scale-125' : 'bg-white/50',
                      )}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  className={cn(
                    'absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/60 backdrop-blur p-1',
                    currentIndex === 0 && 'opacity-30 pointer-events-none',
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(imageBlobs.length - 1, prev + 1))}
                  className={cn(
                    'absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/60 backdrop-blur p-1',
                    currentIndex === imageBlobs.length - 1 && 'opacity-30 pointer-events-none',
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}

        {activeStickerDef && imageBlobs.length === 0 && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5">
            <activeStickerDef.component
              size={80}
              {...(activeStickerDef.props as any)}
              className="drop-shadow-lg"
            />
          </div>
        )}

        {/* Overlay controls */}
        {hasContent && (
          <div className="absolute top-2 right-2 flex gap-1">
            {imageBlobs.length > 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-background/80 backdrop-blur p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Add more photos"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
            )}
            {imageBlobs.length > 1 && (
              <button
                onClick={() => removeImage(currentIndex)}
                className="rounded-full bg-background/80 backdrop-blur p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Remove this photo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={clearBanner}
              className="rounded-full bg-background/80 backdrop-blur p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Remove all"
            >
              {imageBlobs.length <= 1 ? <X className="w-4 h-4" /> : <span className="text-xs font-medium px-1">Clear All</span>}
            </button>
          </div>
        )}

        {/* Empty state actions */}
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-4 h-4" />
              <span className="text-xs">Add Photos</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setShowStickerPicker(prev => !prev)}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs">Add Sticker</span>
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file input - supports multiple */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Sticker picker dropdown */}
      {showStickerPicker && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover p-3 shadow-lg max-h-52 overflow-y-auto">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {BANNER_STICKERS.map(sticker => {
              const Comp = sticker.component;
              return (
                <button
                  key={sticker.id}
                  onClick={() => handleStickerSelect(sticker.id)}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-md hover:bg-accent/50 transition-colors',
                    selectedSticker === sticker.id && 'ring-2 ring-primary bg-accent/30',
                  )}
                >
                  <Comp size={28} {...(sticker.props as any)} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
