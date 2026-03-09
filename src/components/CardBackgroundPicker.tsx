import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Palette, X } from 'lucide-react';

/* ── Background Patterns ── */

export interface CardPattern {
  id: string;
  name: string;
  style: React.CSSProperties;
}

export const CARD_PATTERNS: CardPattern[] = [
  { id: 'none', name: 'None', style: {} },
  {
    id: 'dots', name: 'Dots',
    style: { backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)', backgroundSize: '16px 16px' },
  },
  {
    id: 'grid', name: 'Grid',
    style: { backgroundImage: 'linear-gradient(hsl(var(--muted-foreground) / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground) / 0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' },
  },
  {
    id: 'diagonal', name: 'Diagonal Lines',
    style: { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.06) 10px, hsl(var(--muted-foreground) / 0.06) 11px)' },
  },
  {
    id: 'crosshatch', name: 'Crosshatch',
    style: { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.06) 10px, hsl(var(--muted-foreground) / 0.06) 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.06) 10px, hsl(var(--muted-foreground) / 0.06) 11px)' },
  },
  {
    id: 'paper', name: 'Lined Paper',
    style: { backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, hsl(var(--primary) / 0.08) 27px, hsl(var(--primary) / 0.08) 28px)' },
  },
  {
    id: 'waves', name: 'Waves',
    style: { backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 14px, hsl(var(--accent) / 0.12) 14px, hsl(var(--accent) / 0.12) 15px), repeating-linear-gradient(90deg, transparent, transparent 30px, hsl(var(--accent) / 0.06) 30px, hsl(var(--accent) / 0.06) 31px)', backgroundSize: '60px 30px' },
  },
  {
    id: 'confetti', name: 'Confetti',
    style: { backgroundImage: 'radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.08) 2px, transparent 2px), radial-gradient(circle at 60% 70%, hsl(var(--accent) / 0.1) 2px, transparent 2px), radial-gradient(circle at 80% 20%, hsl(var(--secondary) / 0.1) 2px, transparent 2px), radial-gradient(circle at 40% 80%, hsl(var(--primary) / 0.06) 1.5px, transparent 1.5px)', backgroundSize: '60px 60px' },
  },
  {
    id: 'honeycomb', name: 'Honeycomb',
    style: { backgroundImage: 'radial-gradient(circle farthest-side at 0% 50%, transparent 23%, hsl(var(--muted-foreground) / 0.04) 24%, hsl(var(--muted-foreground) / 0.04) 26%, transparent 27%), radial-gradient(circle farthest-side at 100% 50%, transparent 23%, hsl(var(--muted-foreground) / 0.04) 24%, hsl(var(--muted-foreground) / 0.04) 26%, transparent 27%)', backgroundSize: '24px 42px' },
  },
  {
    id: 'linen', name: 'Linen',
    style: { backgroundImage: 'repeating-linear-gradient(0deg, hsl(var(--muted-foreground) / 0.03), hsl(var(--muted-foreground) / 0.03) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, hsl(var(--muted-foreground) / 0.03), hsl(var(--muted-foreground) / 0.03) 1px, transparent 1px, transparent 4px)' },
  },
];

export function getPatternStyle(patternId: string | undefined): React.CSSProperties {
  if (!patternId || patternId === 'none') return {};
  return CARD_PATTERNS.find(p => p.id === patternId)?.style || {};
}

/* ── Border Styles ── */

export interface CardBorderStyle {
  id: string;
  name: string;
  className: string; // Tailwind classes for the border
}

export const CARD_BORDERS: CardBorderStyle[] = [
  { id: 'none', name: 'Default', className: '' },
  { id: 'rose', name: 'Rose', className: 'border-2 border-rose-300 dark:border-rose-500/60' },
  { id: 'sky', name: 'Sky', className: 'border-2 border-sky-300 dark:border-sky-500/60' },
  { id: 'amber', name: 'Amber', className: 'border-2 border-amber-300 dark:border-amber-500/60' },
  { id: 'emerald', name: 'Emerald', className: 'border-2 border-emerald-300 dark:border-emerald-500/60' },
  { id: 'violet', name: 'Violet', className: 'border-2 border-violet-300 dark:border-violet-500/60' },
  { id: 'orange', name: 'Orange', className: 'border-2 border-orange-300 dark:border-orange-500/60' },
  { id: 'dashed', name: 'Dashed', className: 'border-2 border-dashed border-muted-foreground/30' },
  { id: 'double', name: 'Double', className: 'border-4 border-double border-muted-foreground/25' },
  { id: 'thick', name: 'Thick', className: 'border-[3px] border-foreground/15' },
];

export function getBorderClassName(borderId: string | undefined): string {
  if (!borderId || borderId === 'none') return '';
  return CARD_BORDERS.find(b => b.id === borderId)?.className || '';
}

/* ── Border color swatches for preview ── */
const BORDER_SWATCH_COLORS: Record<string, string> = {
  rose: 'bg-rose-300',
  sky: 'bg-sky-300',
  amber: 'bg-amber-300',
  emerald: 'bg-emerald-300',
  violet: 'bg-violet-300',
  orange: 'bg-orange-300',
};

/* ── Picker Component ── */

interface CardBackgroundPickerProps {
  entryId: string;
  currentPattern?: string;
  currentBorder?: string;
  onSelectPattern: (entryId: string, patternId: string) => void;
  onSelectBorder: (entryId: string, borderId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardBackgroundPicker({
  entryId,
  currentPattern,
  currentBorder,
  onSelectPattern,
  onSelectBorder,
  open,
  onOpenChange,
}: CardBackgroundPickerProps) {
  const [tab, setTab] = useState<'bg' | 'border'>('bg');
  const hasCustomization = (currentPattern && currentPattern !== 'none') || (currentBorder && currentBorder !== 'none');

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => e.stopPropagation()}
          className="gap-1.5 text-muted-foreground hover:text-primary"
        >
          <Palette className="w-4 h-4" />
          <span className="text-xs">Style</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3 z-50"
        side="top"
        align="start"
        onClick={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Card Style</p>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg bg-muted/50 p-0.5">
            <button
              onClick={() => setTab('bg')}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-md transition-colors font-medium',
                tab === 'bg' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Background
            </button>
            <button
              onClick={() => setTab('border')}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-md transition-colors font-medium',
                tab === 'border' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Border
            </button>
          </div>

          {/* Background patterns */}
          {tab === 'bg' && (
            <div className="grid grid-cols-5 gap-2">
              {CARD_PATTERNS.filter(p => p.id !== 'none').map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => onSelectPattern(entryId, pattern.id)}
                  title={pattern.name}
                  className={cn(
                    'w-10 h-10 rounded-md border transition-all hover:scale-105 bg-card',
                    currentPattern === pattern.id ? 'ring-2 ring-primary border-primary' : 'border-border hover:border-foreground/30'
                  )}
                  style={pattern.style}
                />
              ))}
            </div>
          )}

          {/* Border styles */}
          {tab === 'border' && (
            <div className="grid grid-cols-5 gap-2">
              {CARD_BORDERS.filter(b => b.id !== 'none').map((border) => {
                const swatchColor = BORDER_SWATCH_COLORS[border.id];
                return (
                  <button
                    key={border.id}
                    onClick={() => onSelectBorder(entryId, border.id)}
                    title={border.name}
                    className={cn(
                      'w-10 h-10 rounded-md transition-all hover:scale-105 bg-card',
                      border.className,
                      currentBorder === border.id ? 'ring-2 ring-primary ring-offset-1' : ''
                    )}
                  >
                    {swatchColor && (
                      <div className={cn('w-full h-full rounded-[3px]', swatchColor, 'opacity-20')} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
