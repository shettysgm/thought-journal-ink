import React from 'react';
import { ALL_STICKERS } from './KawaiiStickers';

interface TextWithStickersProps {
  text: string;
  className?: string;
}

export default function TextWithStickers({ text, className }: TextWithStickersProps) {
  const allStickersMap = ALL_STICKERS.reduce((acc, sticker) => {
    acc[sticker.id] = sticker;
    return acc;
  }, {} as Record<string, any>);

  const parseTextWithStickers = (text: string) => {
    const parts: any[] = [];
    let lastIndex = 0;
    const stickerRegex = /\[([^\]]+)\]/g;
    let match;

    while ((match = stickerRegex.exec(text)) !== null) {
      const [fullMatch, stickerId] = match;
      const matchStart = match.index;

      if (matchStart > lastIndex) {
        const textPart = text.substring(lastIndex, matchStart);
        if (textPart) parts.push({ type: 'text', content: textPart, key: `text-${parts.length}` });
      }

      const stickerData = allStickersMap[stickerId];
      if (stickerData) {
        parts.push({ type: 'sticker', stickerId, stickerData, key: `sticker-${parts.length}` });
      } else {
        parts.push({ type: 'text', content: fullMatch, key: `placeholder-${parts.length}` });
      }

      lastIndex = matchStart + fullMatch.length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex), key: `text-final` });
    }

    return parts;
  };

  const parts = parseTextWithStickers(text);

  if (parts.length === 0) return <span className={className}>{text}</span>;

  return (
    <span className={className}>
      {parts.map((part) => {
        if (part.type === 'text') {
          return <span key={part.key} style={{ whiteSpace: 'pre-wrap' }}>{part.content}</span>;
        } else if (part.type === 'sticker') {
          const StickerComponent = part.stickerData.component;
          return (
            <span key={part.key} className="inline-block align-middle mx-1">
              <StickerComponent size={28} {...part.stickerData.props} />
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}
