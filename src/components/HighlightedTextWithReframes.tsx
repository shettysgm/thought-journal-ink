import React from 'react';
import TextWithStickers from './TextWithStickers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  console.log('HighlightedTextWithReframes:', { textLength: text?.length, reframesCount: reframes?.length, reframes });

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

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative">
        <div className="whitespace-pre-wrap break-words">
          {segments.map((segment, i) => {
            if (!segment.isHighlight) {
              return <TextWithStickers key={i} text={segment.text} />;
            }

            return (
              <Tooltip key={i}>
                <Popover>
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline bg-primary/20 rounded px-0.5 hover:bg-primary/30 transition-colors cursor-help align-baseline"
                        aria-label={`CBT Reframe: ${segment.reframe}`}
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
  );
}
