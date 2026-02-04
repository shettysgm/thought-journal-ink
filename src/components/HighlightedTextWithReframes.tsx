import React, { useState } from 'react';
import TextWithStickers from './TextWithStickers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [mobileDialogOpen, setMobileDialogOpen] = useState(false);
  const [selectedReframe, setSelectedReframe] = useState<string | null>(null);
  
  console.log('HighlightedTextWithReframes:', { textLength: text?.length, reframesCount: reframes?.length, isMobile, reframes });

  // If no reframes, just render plain text with stickers
  if (!reframes || reframes.length === 0) {
    console.log('No reframes, rendering plain text');
    return <TextWithStickers text={text} />;
  }

  // Build highlighted segments
  const buildSegments = (): HighlightSegment[] => {
    const segments: HighlightSegment[] = [];
    let lastIndex = 0;

    // Sort reframes by their position in text to avoid overlaps
    const sortedReframes = [...reframes]
      .map((r, idx) => ({ ...r, originalIndex: idx, position: text.indexOf(r.span) }))
      .filter(r => r.position !== -1)
      .sort((a, b) => a.position - b.position);

    sortedReframes.forEach((reframe) => {
      const index = reframe.position;
      
      if (index >= lastIndex) {
        // Add text before highlight
        if (index > lastIndex) {
          segments.push({ text: text.slice(lastIndex, index), isHighlight: false });
        }
        
        // Add highlighted text
        segments.push({
          text: reframe.span,
          isHighlight: true,
          reframe: reframe.suggestion,
          index: reframe.originalIndex
        });
        
        lastIndex = index + reframe.span.length;
      }
    });

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), isHighlight: false });
    }

    return segments;
  };

  const segments = buildSegments();

  // Render highlight content (shared between mobile and desktop)
  const ReframeContent = ({ reframe }: { reframe: string }) => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-primary uppercase tracking-wide">💡 Reframe Suggestion</div>
      <p className="text-sm text-foreground">{reframe}</p>
    </div>
  );

  // Handle mobile tap - open dialog instead of popover
  const handleMobileTap = (reframe: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Reframe] Mobile tap, opening dialog:', reframe);
    setSelectedReframe(reframe);
    setMobileDialogOpen(true);
  };

  return (
    <>
      {/* Mobile Dialog for reframe display */}
      <Dialog open={mobileDialogOpen} onOpenChange={setMobileDialogOpen}>
        <DialogContent className="max-w-[90vw] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2">
              💡 Reframe Suggestion
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground leading-relaxed">{selectedReframe}</p>
        </DialogContent>
      </Dialog>

      <TooltipProvider delayDuration={0}>
        <div className="relative">
          <div className="whitespace-pre-wrap break-words">
            {segments.map((segment, i) => {
              if (!segment.isHighlight) {
                return <TextWithStickers key={i} text={segment.text} />;
              }

              // On mobile: use a simple button that opens a Dialog (more reliable than Popover on iOS)
              if (isMobile) {
                return (
                  <button
                    key={i}
                    type="button"
                    data-reframe-trigger="true"
                    onClick={(e) => handleMobileTap(segment.reframe!, e)}
                    onTouchEnd={(e) => handleMobileTap(segment.reframe!, e)}
                    className="inline bg-primary/20 rounded px-0.5 active:bg-primary/30 transition-colors cursor-pointer align-baseline underline decoration-primary/40 decoration-dotted underline-offset-2"
                    aria-label={`Tap for reframe: ${segment.reframe}`}
                  >
                    <TextWithStickers text={segment.text} />
                  </button>
                );
              }

              // On desktop: use Tooltip (hover) with Popover fallback (click)
              return (
                <Tooltip key={i}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          data-reframe-trigger="true"
                          onClickCapture={(e) => e.stopPropagation()}
                          className="inline bg-primary/20 rounded px-0.5 hover:bg-primary/30 transition-colors cursor-help align-baseline"
                          aria-label={`CBT Reframe: ${segment.reframe}`}
                        >
                          <TextWithStickers text={segment.text} />
                        </button>
                      </TooltipTrigger>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="start" className="max-w-[min(92vw,32rem)] whitespace-normal break-words">
                      <ReframeContent reframe={segment.reframe!} />
                    </PopoverContent>
                    <TooltipContent side="bottom" align="start" sideOffset={6} className="max-w-[min(92vw,32rem)] whitespace-normal break-words">
                      <ReframeContent reframe={segment.reframe!} />
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
