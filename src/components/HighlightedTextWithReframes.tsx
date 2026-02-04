import React, { useState, useEffect, useRef } from 'react';
import TextWithStickers from './TextWithStickers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

type Reframe = {
  span: string;
  suggestion: string;
  socratic: string;
};

type Props = {
  text: string;
  reframes?: Reframe[];
};

type HighlightSegment = {
  text: string;
  isHighlight: boolean;
  reframe?: string;
  index?: number;
};

export default function HighlightedTextWithReframes({ text, reframes = [] }: Props) {
  // Detect mobile via touch capability (more reliable than media query for iOS WebView)
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReframe, setSelectedReframe] = useState<string | null>(null);
  const lastTouchTsRef = useRef(0);
  
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
    console.log('[Reframe] Touch device detection:', hasTouch);
  }, []);

  console.log('[Reframe] Render:', { 
    textLength: text?.length, 
    reframesCount: reframes?.length, 
    isTouchDevice,
    dialogOpen,
    reframes 
  });

  // If no reframes, just render plain text with stickers
  if (!reframes || reframes.length === 0) {
    console.log('[Reframe] No reframes, rendering plain text');
    return <TextWithStickers text={text} />;
  }

  // Build highlighted segments
  const buildSegments = (): HighlightSegment[] => {
    const segments: HighlightSegment[] = [];
    let lastIndex = 0;

    const sortedReframes = [...reframes]
      .map((r, idx) => ({ ...r, originalIndex: idx, position: text.indexOf(r.span) }))
      .filter(r => r.position !== -1)
      .sort((a, b) => a.position - b.position);

    console.log('[Reframe] Sorted reframes for highlighting:', sortedReframes);

    sortedReframes.forEach((reframe) => {
      const index = reframe.position;
      
      if (index >= lastIndex) {
        if (index > lastIndex) {
          segments.push({ text: text.slice(lastIndex, index), isHighlight: false });
        }
        
        segments.push({
          text: reframe.span,
          isHighlight: true,
          reframe: reframe.suggestion,
          index: reframe.originalIndex
        });
        
        lastIndex = index + reframe.span.length;
      }
    });

    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), isHighlight: false });
    }

    console.log('[Reframe] Built segments:', segments.length, 'highlighted:', segments.filter(s => s.isHighlight).length);
    return segments;
  };

  const segments = buildSegments();

  // Handle tap on highlight - works for both touch and click
  const handleHighlightTap = (reframe: string, e: React.MouseEvent | React.TouchEvent) => {
    console.log('[Reframe] TAP DETECTED:', { reframe: reframe.slice(0, 50), eventType: e.type });
    e.preventDefault();
    e.stopPropagation();
    setSelectedReframe(reframe);
    setDialogOpen(true);
    console.log('[Reframe] Dialog should now be open');
  };

  return (
    <>
      {/* AlertDialog for reframe display - more reliable than Dialog on iOS */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-primary">
              💡 Reframe Suggestion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground text-base leading-relaxed">
              {selectedReframe}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel className="mt-2">Close</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>

      <TooltipProvider delayDuration={0}>
        <div className="relative">
          <div className="whitespace-pre-wrap break-words">
            {segments.map((segment, i) => {
              if (!segment.isHighlight) {
                return <TextWithStickers key={i} text={segment.text} />;
              }

              // For touch devices: simple button with AlertDialog
              if (isTouchDevice) {
                return (
                  <button
                    key={i}
                    type="button"
                    data-reframe-trigger="true"
                    onTouchEnd={(e) => {
                      // iOS WKWebView: prefer touch handlers; some taps never dispatch click.
                      lastTouchTsRef.current = Date.now();
                      handleHighlightTap(segment.reframe!, e);
                    }}
                    onClick={(e) => {
                      // Avoid double-fire when both touch + click dispatch.
                      if (Date.now() - lastTouchTsRef.current < 650) return;
                      handleHighlightTap(segment.reframe!, e);
                    }}
                    onTouchStart={(e) => {
                      // Prevent parent from handling this touch
                      e.stopPropagation();
                    }}
                    className="inline bg-primary/20 rounded px-0.5 active:bg-primary/40 transition-colors cursor-pointer align-baseline underline decoration-primary/50 decoration-dotted underline-offset-2 select-none touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'rgba(0,0,0,0.1)' }}
                  >
                    <TextWithStickers text={segment.text} />
                  </button>
                );
              }

              // For desktop: use Tooltip (hover) with Popover fallback (click)
              return (
                <Tooltip key={i}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          data-reframe-trigger="true"
                          onClick={(e) => e.stopPropagation()}
                          className="inline bg-primary/20 rounded px-0.5 hover:bg-primary/30 transition-colors cursor-help align-baseline"
                        >
                          <TextWithStickers text={segment.text} />
                        </button>
                      </TooltipTrigger>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="start" className="max-w-[min(92vw,32rem)] whitespace-normal break-words">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-primary uppercase tracking-wide">💡 Reframe Suggestion</div>
                        <p className="text-sm text-foreground">{segment.reframe}</p>
                      </div>
                    </PopoverContent>
                    <TooltipContent side="bottom" align="start" sideOffset={6} className="max-w-[min(92vw,32rem)] whitespace-normal break-words">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-primary uppercase tracking-wide">💡 Reframe Suggestion</div>
                        <p className="text-sm text-foreground">{segment.reframe}</p>
                      </div>
                    </TooltipContent>
                  </Popover>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </TooltipProvider>
    </>
  );
}
