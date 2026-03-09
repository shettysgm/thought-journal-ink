import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CORNER_STICKERS, type CornerStickerDef } from '@/components/KawaiiStickers';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

export type CornerPositions = {
  topLeft?: string;
  topRight?: string;
  bottomLeft?: string;
  bottomRight?: string;
};

interface CornerDecorationsDisplayProps {
  corners: CornerPositions;
  className?: string;
}

/** Renders corner sticker images positioned absolutely in the 4 corners */
export function CornerDecorationsDisplay({ corners, className }: CornerDecorationsDisplayProps) {
  const hasAny = corners.topLeft || corners.topRight || corners.bottomLeft || corners.bottomRight;
  if (!hasAny) return null;

  const renderCorner = (stickerId: string | undefined, position: string, rotation: string) => {
    if (!stickerId) return null;
    const def = CORNER_STICKERS.find(s => s.id === stickerId);
    if (!def) return null;
    return (
      <img
        src={def.src}
        alt=""
        className={cn('absolute w-14 h-14 sm:w-16 sm:h-16 pointer-events-none opacity-85', position)}
        style={{ transform: rotation, objectFit: 'contain' }}
      />
    );
  };

  return (
    <div className={cn('absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-lg', className)}>
      {renderCorner(corners.topLeft, 'top-0 left-0', 'rotate(0deg)')}
      {renderCorner(corners.topRight, 'top-0 right-0', 'scaleX(-1)')}
      {renderCorner(corners.bottomLeft, 'bottom-0 left-0', 'scaleY(-1)')}
      {renderCorner(corners.bottomRight, 'bottom-0 right-0', 'scale(-1, -1)')}
    </div>
  );
}

interface CornerPickerProps {
  corners: CornerPositions;
  onChange: (corners: CornerPositions) => void;
  className?: string;
}

/** Picker UI: tap a corner zone to assign a washi-tape sticker */
export function CornerPicker({ corners, onChange, className }: CornerPickerProps) {
  const [activeCorner, setActiveCorner] = useState<keyof CornerPositions | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const cornerLabels: Record<keyof CornerPositions, string> = {
    topLeft: 'Top Left',
    topRight: 'Top Right',
    bottomLeft: 'Bottom Left',
    bottomRight: 'Bottom Right',
  };

  const handleStickerSelect = (stickerId: string) => {
    if (!activeCorner) return;
    const newCorners = { ...corners };
    // Toggle off if same sticker re-selected
    if (newCorners[activeCorner] === stickerId) {
      delete newCorners[activeCorner];
    } else {
      newCorners[activeCorner] = stickerId;
    }
    onChange(newCorners);
    setActiveCorner(null);
  };

  const clearAll = () => {
    onChange({});
    setActiveCorner(null);
  };

  const hasAnyCorner = Object.values(corners).some(Boolean);

  return (
    <div className={cn('space-y-2', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Sparkles className="w-4 h-4" />
        <span>Corner Decorations</span>
        {hasAnyCorner && (
          <span className="ml-auto text-xs text-primary">✓ Applied</span>
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3 pt-1">
          {/* Corner zone selector - visual mini preview */}
          <div className="relative w-full aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 max-w-[180px] mx-auto">
            {/* Corner buttons */}
            {(Object.keys(cornerLabels) as (keyof CornerPositions)[]).map((key) => {
              const positionClass = {
                topLeft: 'top-1 left-1',
                topRight: 'top-1 right-1',
                bottomLeft: 'bottom-1 left-1',
                bottomRight: 'bottom-1 right-1',
              }[key];
              
              const selected = corners[key];
              const def = selected ? CORNER_STICKERS.find(s => s.id === selected) : null;
              const rotationStyle = {
                topLeft: 'rotate(0deg)',
                topRight: 'scaleX(-1)',
                bottomLeft: 'scaleY(-1)',
                bottomRight: 'scale(-1, -1)',
              }[key];

              return (
                <button
                  key={key}
                  onClick={() => setActiveCorner(activeCorner === key ? null : key)}
                  className={cn(
                    'absolute w-10 h-10 rounded-md flex items-center justify-center transition-all',
                    positionClass,
                    activeCorner === key
                      ? 'ring-2 ring-primary bg-primary/10'
                      : 'hover:bg-accent/50',
                    !def && 'border border-dashed border-muted-foreground/30'
                  )}
                >
                  {def ? (
                    <img src={def.src} alt="" className="w-8 h-8 object-contain" style={{ transform: rotationStyle }} />
                  ) : (
                    <span className="text-xs text-muted-foreground">+</span>
                  )}
                </button>
              );
            })}
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/50">
              Tap a corner
            </span>
          </div>

          {/* Sticker selection grid (shown when a corner is active) */}
          {activeCorner && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground text-center">
                Pick for <span className="font-medium text-foreground">{cornerLabels[activeCorner]}</span>
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {CORNER_STICKERS.map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => handleStickerSelect(sticker.id)}
                    className={cn(
                      'flex items-center justify-center p-1.5 rounded-md hover:bg-accent/50 transition-colors aspect-square',
                      corners[activeCorner] === sticker.id && 'ring-2 ring-primary bg-accent/30'
                    )}
                  >
                    <img src={sticker.src} alt={sticker.name} className="w-8 h-8 object-contain" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasAnyCorner && (
            <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={clearAll}>
              <X className="w-3 h-3" />
              Clear All Corners
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
