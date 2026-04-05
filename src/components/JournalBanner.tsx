import React, { useState, useRef, useCallback, useEffect } from 'react';
import { compressImages } from '@/lib/compressImage';
import { ImagePlus, X, Sparkles } from 'lucide-react';
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
  }, [onImagesChange, onStickerChange]);

  const removeImage = useCallback(
    (index: number) => {
      const updated = imageBlobs.filter((_, i) => i !== index);
      onImagesChange(updated);
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
        {imageBlobs.length === 1 && (
          <div className="relative w-full h-full">
            <BlobBanner blob={imageBlobs[0]} />
          </div>
        )}

        {imageBlobs.length === 2 && (
          <div className="relative w-full h-full grid grid-cols-2 gap-0.5">
            {imageBlobs.map((blob, i) => (
              <div key={i} className="relative overflow-hidden">
                <BlobBanner blob={blob} />
              </div>
            ))}
          </div>
        )}

        {imageBlobs.length === 3 && (
          <div className="relative w-full h-full grid grid-cols-2 gap-0.5">
            <div className="relative overflow-hidden row-span-2">
              <BlobBanner blob={imageBlobs[0]} />
            </div>
            <div className="relative overflow-hidden">
              <BlobBanner blob={imageBlobs[1]} />
            </div>
            <div className="relative overflow-hidden">
              <BlobBanner blob={imageBlobs[2]} />
            </div>
          </div>
        )}

        {imageBlobs.length >= 4 && (
          <div className="relative w-full h-full grid grid-cols-3 grid-rows-2 gap-0.5">
            <div className="relative overflow-hidden col-span-2 row-span-2">
              <BlobBanner blob={imageBlobs[0]} />
            </div>
            {imageBlobs.slice(1, 4).map((blob, i) => (
              <div key={i} className="relative overflow-hidden">
                <BlobBanner blob={blob} />
                {i === 2 && imageBlobs.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">+{imageBlobs.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
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
