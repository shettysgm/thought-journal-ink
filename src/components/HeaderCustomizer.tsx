import React, { useState } from 'react';
import { Palette, Sparkles, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_STICKERS } from './KawaiiStickers';
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

export interface GridPattern {
  id: string;
  label: string;
  style: React.CSSProperties;
}

export const GRID_PATTERNS: GridPattern[] = [
  { id: 'none', label: 'None', style: {} },
  {
    id: 'grid-sm',
    label: 'Small Grid',
    style: {
      backgroundImage:
        'linear-gradient(to right, hsl(220 14% 86% / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(220 14% 86% / 0.4) 1px, transparent 1px)',
      backgroundSize: '14px 14px',
    },
  },
  {
    id: 'grid-md',
    label: 'Medium Grid',
    style: {
      backgroundImage:
        'linear-gradient(to right, hsl(220 14% 86% / 0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(220 14% 86% / 0.5) 1px, transparent 1px)',
      backgroundSize: '22px 22px',
    },
  },
  {
    id: 'dots',
    label: 'Dots',
    style: {
      backgroundImage: 'radial-gradient(circle, hsl(220 14% 76% / 0.45) 1px, transparent 1px)',
      backgroundSize: '16px 16px',
    },
  },
  {
    id: 'dots-lg',
    label: 'Large Dots',
    style: {
      backgroundImage: 'radial-gradient(circle, hsl(220 14% 76% / 0.4) 1.5px, transparent 1.5px)',
      backgroundSize: '24px 24px',
    },
  },
  {
    id: 'lines-h',
    label: 'Lined',
    style: {
      backgroundImage: 'linear-gradient(to bottom, hsl(220 14% 86% / 0.45) 1px, transparent 1px)',
      backgroundSize: '100% 18px',
    },
  },
  {
    id: 'diagonal',
    label: 'Diagonal',
    style: {
      backgroundImage:
        'repeating-linear-gradient(45deg, hsl(220 14% 86% / 0.35) 0, hsl(220 14% 86% / 0.35) 1px, transparent 1px, transparent 12px)',
      backgroundSize: '17px 17px',
    },
  },
  {
    id: 'crosshatch',
    label: 'Crosshatch',
    style: {
      backgroundImage:
        'repeating-linear-gradient(45deg, hsl(220 14% 86% / 0.3) 0, hsl(220 14% 86% / 0.3) 1px, transparent 1px, transparent 14px), repeating-linear-gradient(-45deg, hsl(220 14% 86% / 0.3) 0, hsl(220 14% 86% / 0.3) 1px, transparent 1px, transparent 14px)',
      backgroundSize: '20px 20px',
    },
  },
];

interface HeaderCustomizerProps {
  headerColor: string;
  headerStickers: string[];
  headerPattern: string;
  onColorChange: (color: string) => void;
  onStickersChange: (stickerIds: string[]) => void;
  onPatternChange: (patternId: string) => void;
}

export default function HeaderCustomizer({
  headerColor,
  headerStickers,
  headerPattern,
  onColorChange,
  onStickersChange,
  onPatternChange,
}: HeaderCustomizerProps) {
  const [tab, setTab] = useState<'color' | 'pattern' | 'stickers'>('color');

  const toggleSticker = (id: string) => {
    if (headerStickers.includes(id)) {
      onStickersChange([]);
    } else {
      onStickersChange([id]);
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
          {(['color', 'pattern', 'stickers'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 text-[11px] py-1.5 rounded-md transition-colors font-medium flex items-center justify-center gap-1',
                tab === t
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'color' && <Palette className="w-3 h-3" />}
              {t === 'pattern' && <Grid3X3 className="w-3 h-3" />}
              {t === 'stickers' && <Sparkles className="w-3 h-3" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
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

        {tab === 'pattern' && (
          <div className="grid grid-cols-4 gap-2">
            {GRID_PATTERNS.map(p => (
              <button
                key={p.id}
                onClick={() => onPatternChange(p.id)}
                className={cn(
                  'w-full aspect-square rounded-lg border-2 transition-all hover:scale-105',
                  headerPattern === p.id
                    ? 'border-primary ring-1 ring-primary/30'
                    : 'border-border/50',
                )}
                style={{ backgroundColor: 'hsl(0 0% 100%)', ...p.style }}
                title={p.label}
              />
            ))}
          </div>
        )}

        {tab === 'stickers' && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-2">
              Pick a sticker for your header
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
