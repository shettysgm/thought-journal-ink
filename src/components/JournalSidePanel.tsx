import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ImagePlus, X, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CANVA_STICKERS } from './CanvaSticker';
import { MODERN_STICKERS } from './ModernStickers';
import { KAWAII_STICKERS } from './KawaiiStickers';

const BANNER_STICKERS = [
  ...Object.values(KAWAII_STICKERS).flatMap(cat => cat.stickers),
  ...Object.values(CANVA_STICKERS).flatMap(cat => cat.stickers),
  ...Object.values(MODERN_STICKERS).flatMap(cat => cat.stickers),
];

interface JournalSidePanelProps {
  imageBlob: Blob | null;
  selectedSticker: string | null;
  onImageChange: (blob: Blob | null) => void;
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
  imageBlob,
  selectedSticker,
  onImageChange,
  onStickerChange,
  className,
}: JournalSidePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'photo' | 'sticker'>('sticker');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) return;
      onImageChange(file);
      onStickerChange(null);
    },
    [onImageChange, onStickerChange],
  );

  const handleStickerSelect = useCallback(
    (id: string) => {
      onStickerChange(selectedSticker === id ? null : id);
      onImageChange(null);
    },
    [onImageChange, onStickerChange, selectedSticker],
  );

  const clearAll = useCallback(() => {
    onImageChange(null);
    onStickerChange(null);
  }, [onImageChange, onStickerChange]);

  const hasContent = !!imageBlob || !!selectedSticker;
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
              Photo
            </button>
          </div>

          {/* Selected preview */}
          {hasContent && (
            <div className="rounded-lg border bg-muted/20 p-3 flex items-center justify-center min-h-[80px]">
              {imageBlob && <BlobPreview blob={imageBlob} />}
              {activeStickerDef && !imageBlob && (
                <activeStickerDef.component
                  size={64}
                  {...(activeStickerDef.props as any)}
                  className="drop-shadow-lg"
                />
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
                {imageBlob ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">Max 5MB • JPG, PNG, GIF</p>
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
