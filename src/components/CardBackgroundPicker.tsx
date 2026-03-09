import React from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Palette, X } from 'lucide-react';

export interface CardPattern {
  id: string;
  name: string;
  style: React.CSSProperties;
}

export const CARD_PATTERNS: CardPattern[] = [
  {
    id: 'none',
    name: 'None',
    style: {},
  },
  {
    id: 'dots',
    name: 'Dots',
    style: {
      backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)',
      backgroundSize: '16px 16px',
    },
  },
  {
    id: 'grid',
    name: 'Grid',
    style: {
      backgroundImage:
        'linear-gradient(hsl(var(--muted-foreground) / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground) / 0.08) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    },
  },
  {
    id: 'diagonal',
    name: 'Diagonal Lines',
    style: {
      backgroundImage:
        'repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.06) 10px, hsl(var(--muted-foreground) / 0.06) 11px)',
    },
  },
  {
    id: 'crosshatch',
    name: 'Crosshatch',
    style: {
      backgroundImage:
        'repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.06) 10px, hsl(var(--muted-foreground) / 0.06) 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, hsl(var(--muted-foreground) / 0.06) 10px, hsl(var(--muted-foreground) / 0.06) 11px)',
    },
  },
  {
    id: 'paper',
    name: 'Lined Paper',
    style: {
      backgroundImage:
        'repeating-linear-gradient(transparent, transparent 27px, hsl(var(--primary) / 0.08) 27px, hsl(var(--primary) / 0.08) 28px)',
    },
  },
  {
    id: 'waves',
    name: 'Waves',
    style: {
      backgroundImage:
        'repeating-linear-gradient(0deg, transparent, transparent 14px, hsl(var(--accent) / 0.12) 14px, hsl(var(--accent) / 0.12) 15px), repeating-linear-gradient(90deg, transparent, transparent 30px, hsl(var(--accent) / 0.06) 30px, hsl(var(--accent) / 0.06) 31px)',
      backgroundSize: '60px 30px',
    },
  },
  {
    id: 'confetti',
    name: 'Confetti',
    style: {
      backgroundImage:
        'radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.08) 2px, transparent 2px), radial-gradient(circle at 60% 70%, hsl(var(--accent) / 0.1) 2px, transparent 2px), radial-gradient(circle at 80% 20%, hsl(var(--secondary) / 0.1) 2px, transparent 2px), radial-gradient(circle at 40% 80%, hsl(var(--primary) / 0.06) 1.5px, transparent 1.5px)',
      backgroundSize: '60px 60px',
    },
  },
  {
    id: 'honeycomb',
    name: 'Honeycomb',
    style: {
      backgroundImage:
        'radial-gradient(circle farthest-side at 0% 50%, transparent 23%, hsl(var(--muted-foreground) / 0.04) 24%, hsl(var(--muted-foreground) / 0.04) 26%, transparent 27%), radial-gradient(circle farthest-side at 100% 50%, transparent 23%, hsl(var(--muted-foreground) / 0.04) 24%, hsl(var(--muted-foreground) / 0.04) 26%, transparent 27%)',
      backgroundSize: '24px 42px',
    },
  },
  {
    id: 'linen',
    name: 'Linen',
    style: {
      backgroundImage:
        'repeating-linear-gradient(0deg, hsl(var(--muted-foreground) / 0.03), hsl(var(--muted-foreground) / 0.03) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, hsl(var(--muted-foreground) / 0.03), hsl(var(--muted-foreground) / 0.03) 1px, transparent 1px, transparent 4px)',
    },
  },
];

export function getPatternStyle(patternId: string | undefined): React.CSSProperties {
  if (!patternId || patternId === 'none') return {};
  return CARD_PATTERNS.find(p => p.id === patternId)?.style || {};
}

interface CardBackgroundPickerProps {
  entryId: string;
  currentPattern?: string;
  onSelect: (entryId: string, patternId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardBackgroundPicker({
  entryId,
  currentPattern,
  onSelect,
  open,
  onOpenChange,
}: CardBackgroundPickerProps) {
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
          <span className="text-xs">Background</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        side="top"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Card Background</p>
            {currentPattern && currentPattern !== 'none' && (
              <button
                onClick={() => onSelect(entryId, 'none')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {CARD_PATTERNS.filter(p => p.id !== 'none').map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => onSelect(entryId, pattern.id)}
                title={pattern.name}
                className={cn(
                  'w-10 h-10 rounded-md border transition-all hover:scale-105',
                  'bg-card',
                  currentPattern === pattern.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'border-border hover:border-foreground/30'
                )}
                style={pattern.style}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
