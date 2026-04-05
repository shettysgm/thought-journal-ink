import React, { useState } from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_STICKERS, type StickerDef } from './KawaiiStickers';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const HEADER_COLORS = [
  { id: 'white', label: 'White', value: 'hsl(0 0% 100%)' },
  { id: 'lavender', label: 'Lavender', value: 'hsl(270 60% 95%)' },
  { id: 'mint', label: 'Mint', value: 'hsl(160 50% 94%)' },
  { id: 'peach', label: 'Peach', value: 'hsl(20 80% 94%)' },
  { id: 'sky', label: 'Sky', value: 'hsl(200 70% 94%)' },
  { id: 'blush', label: 'Blush', value: 'hsl(340 60% 94%)' },
  { id: 'butter', label: 'Butter', value: 'hsl(48 80% 94%)' },
  { id: 'lilac', label: 'Lilac', value: 'hsl(290 40% 93%)' },
];

interface HeaderCustomizerProps {
  headerColor: string;
  headerStickers: string[]; // sticker IDs (max 3)
  onColorChange: (color: string) => void;
  onStickersChange: (stickerIds: string[]) => void;
}

export default function HeaderCustomizer({
  headerColor,
  headerStickers,
  onColorChange,
  onStickersChange,
}: HeaderCustomizerProps) {
  const [tab, setTab] = useState<'color' | 'stickers'>('color');

  const toggleSticker = (id: string) => {
    if (headerStickers.includes(id)) {
      onStickersChange(headerStickers.filter(s => s !== id));
    } else if (headerStickers.length < 3) {
      onStickersChange([...headerStickers, id]);
    } else {
      // Replace the last one
      onStickersChange([...headerStickers.slice(0, 2), id]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="absolute top-1 right-1 z-20 p-1.5 rounded-full bg-background/70 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Customize header"
        >
          <Palette className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3" onClick={e => e.stopPropagation()}>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Customize Header
        </p>

        {/* Tabs */}
        <div className="flex rounded-lg bg-muted/50 p-0.5 mb-3">
          <button
            onClick={() => setTab('color')}
            className={cn(
              'flex-1 text-xs py-1.5 rounded-md transition-colors font-medium flex items-center justify-center gap-1',
              tab === 'color'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Palette className="w-3 h-3" /> Color
          </button>
          <button
            onClick={() => setTab('stickers')}
            className={cn(
              'flex-1 text-xs py-1.5 rounded-md transition-colors font-medium flex items-center justify-center gap-1',
              tab === 'stickers'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Sparkles className="w-3 h-3" /> Stickers
          </button>
        </div>

        {tab === 'color' && (
          <div className="grid grid-cols-4 gap-2">
            {HEADER_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => onColorChange(c.value)}
                className={cn(
                  'w-full aspect-square rounded-lg border-2 transition-all hover:scale-105',
                  headerColor === c.value
                    ? 'border-primary ring-1 ring-primary/30'
                    : 'border-border/50',
                )}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        )}

        {tab === 'stickers' && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-2">
              Pick up to 3 stickers for your header
            </p>
            <div className="grid grid-cols-5 gap-1.5 max-h-[200px] overflow-y-auto pr-1">
              {ALL_STICKERS.map(sticker => {
                const Comp = sticker.component;
                const isSelected = headerStickers.includes(sticker.id);
                return (
                  <button
                    key={sticker.id}
                    onClick={() => toggleSticker(sticker.id)}
                    className={cn(
                      'flex items-center justify-center p-1.5 rounded-lg hover:bg-accent/50 transition-colors aspect-square',
                      isSelected && 'ring-2 ring-primary bg-accent/30',
                    )}
                  >
                    <Comp size={28} {...(sticker.props as any)} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
