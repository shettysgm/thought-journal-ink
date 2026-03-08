import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ImagePlus, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ALL_STICKERS } from './KawaiiStickers';

const BANNER_STICKERS = ALL_STICKERS;

interface JournalBannerProps {
  imageBlob: Blob | null;
  selectedSticker: string | null;
  onImageChange: (blob: Blob | null) => void;
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
      className="w-full h-full object-cover"
    />
  );
}

export default function JournalBanner({
  imageBlob,
  selectedSticker,
  onImageChange,
  onStickerChange,
  className,
}: JournalBannerProps) {
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Limit to 5MB
      if (file.size > 5 * 1024 * 1024) return;
      onImageChange(file);
      onStickerChange(null); // clear sticker when image is set
    },
    [onImageChange, onStickerChange],
  );

  const handleStickerSelect = useCallback(
    (id: string) => {
      onStickerChange(id);
      onImageChange(null); // clear image when sticker is set
      setShowStickerPicker(false);
    },
    [onImageChange, onStickerChange],
  );

  const clearBanner = useCallback(() => {
    onImageChange(null);
    onStickerChange(null);
  }, [onImageChange, onStickerChange]);

  const hasContent = !!imageBlob || !!selectedSticker;

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
        {imageBlob && <BlobBanner blob={imageBlob} />}

        {activeStickerDef && !imageBlob && (
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
          <button
            onClick={clearBanner}
            className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Remove banner"
          >
            <X className="w-4 h-4" />
          </button>
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
              <span className="text-xs">Add Photo</span>
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
