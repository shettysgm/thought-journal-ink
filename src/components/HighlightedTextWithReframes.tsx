import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import TextWithStickers from './TextWithStickers';

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // If no reframes, just render plain text with stickers
  if (!reframes || reframes.length === 0) {
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

  const handleMouseEnter = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 4
    });
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="relative">
      <div className="whitespace-pre-wrap break-words">
        {segments.map((segment, i) => {
          if (!segment.isHighlight) {
            return <TextWithStickers key={i} text={segment.text} />;
          }

          return (
            <span
              key={i}
              className="bg-primary/20 rounded px-0.5 cursor-pointer hover:bg-primary/30 transition-colors relative"
              onMouseEnter={(e) => handleMouseEnter(e, segment.index!)}
              onMouseLeave={handleMouseLeave}
            >
              <TextWithStickers text={segment.text} />
            </span>
          );
        })}
      </div>

      {/* Hover overlay */}
      {hoveredIndex !== null && (
        <Card
          className="fixed z-50 max-w-sm p-3 shadow-lg border-primary/20 animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
          }}
        >
          <div className="space-y-2">
            <div className="text-xs font-semibold text-primary uppercase tracking-wide">
              💡 Reframe Suggestion
            </div>
            <p className="text-sm text-foreground">
              {reframes[hoveredIndex]?.suggestion}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
