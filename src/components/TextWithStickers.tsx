import React from 'react';
import { CANVA_STICKERS } from './CanvaSticker';
import { MODERN_STICKERS } from './ModernStickers';

interface TextWithStickersProps {
  text: string;
  className?: string;
}

export default function TextWithStickers({ text, className }: TextWithStickersProps) {
  // Create a map of all available stickers
  const allStickers = {
    ...Object.values(CANVA_STICKERS).reduce((acc, category) => {
      category.stickers.forEach(sticker => {
        acc[sticker.id] = sticker;
      });
      return acc;
    }, {} as any),
    ...Object.values(MODERN_STICKERS).reduce((acc, category) => {
      category.stickers.forEach(sticker => {
        acc[sticker.id] = sticker;
      });
      return acc;
    }, {} as any),
  };

  // Parse text and replace sticker placeholders with actual components
  const parseTextWithStickers = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    
    // Regex to match sticker placeholders like [sticker-id]
    const stickerRegex = /\[([^\]]+)\]/g;
    let match;
    
    while ((match = stickerRegex.exec(text)) !== null) {
      const [fullMatch, stickerId] = match;
      const matchStart = match.index;
      
      // Add text before the sticker
      if (matchStart > lastIndex) {
        const textPart = text.substring(lastIndex, matchStart);
        if (textPart) {
          parts.push({
            type: 'text',
            content: textPart,
            key: `text-${parts.length}`
          });
        }
      }
      
      // Add the sticker component if it exists
      const stickerData = allStickers[stickerId];
      if (stickerData) {
        parts.push({
          type: 'sticker',
          stickerId,
          stickerData,
          key: `sticker-${parts.length}`
        });
      } else {
        // If sticker not found, keep the original placeholder
        parts.push({
          type: 'text',
          content: fullMatch,
          key: `placeholder-${parts.length}`
        });
      }
      
      lastIndex = matchStart + fullMatch.length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push({
          type: 'text',
          content: remainingText,
          key: `text-final`
        });
      }
    }
    
    return parts;
  };

  const parts = parseTextWithStickers(text);
  
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part) => {
        if (part.type === 'text') {
          return (
            <span key={part.key} style={{ whiteSpace: 'pre-wrap' }}>
              {part.content}
            </span>
          );
        } else if (part.type === 'sticker') {
          const StickerComponent = part.stickerData.component;
          return (
            <span key={part.key} className="inline-block align-middle mx-1">
              <StickerComponent size={20} {...part.stickerData.props} />
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}
