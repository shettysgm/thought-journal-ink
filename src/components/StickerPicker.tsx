import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smile, X } from 'lucide-react';

interface StickerPickerProps {
  selectedStickers: string[];
  onAddSticker: (sticker: string) => void;
  onRemoveSticker: (sticker: string) => void;
}

const STICKER_CATEGORIES = {
  emotions: {
    name: 'Emotions',
    stickers: ['😊', '😢', '😡', '😰', '😴', '🤔', '😌', '😤', '🥺', '😔', '🙂', '😬', '😮‍💨', '😓', '🤗', '😇']
  },
  activities: {
    name: 'Activities', 
    stickers: ['🏃‍♂️', '🧘‍♀️', '📚', '🎵', '☕', '🍽️', '💤', '🚶‍♂️', '🎨', '💻', '📝', '🎮', '📺', '🛀', '🧹', '🛒']
  },
  nature: {
    name: 'Nature',
    stickers: ['☀️', '🌙', '⭐', '🌧️', '🌈', '🌺', '🌳', '🦋', '🌊', '⛅', '❄️', '🌸', '🍃', '🌻', '🌵', '🌕']
  },
  symbols: {
    name: 'Symbols',
    stickers: ['💝', '✨', '💫', '🎯', '🔥', '💪', '🙏', '❤️', '💚', '💙', '💜', '🧡', '💛', '🤍', '🖤', '💯']
  }
};

export default function StickerPicker({ selectedStickers, onAddSticker, onRemoveSticker }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof STICKER_CATEGORIES>('emotions');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStickerClick = (sticker: string) => {
    if (selectedStickers.includes(sticker)) {
      onRemoveSticker(sticker);
    } else {
      onAddSticker(sticker);
    }
  };

  return (
    <div className="space-y-3">
      
      {/* Toggle Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full gap-2"
      >
        <Smile className="w-4 h-4" />
        {isExpanded ? 'Hide Stickers' : 'Add Stickers'}
      </Button>

      {/* Selected Stickers */}
      {selectedStickers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStickers.map((sticker) => (
            <Badge
              key={sticker}
              variant="secondary"
              className="text-lg cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={() => onRemoveSticker(sticker)}
            >
              {sticker}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {/* Sticker Picker */}
      {isExpanded && (
        <Card className="border-2 border-dashed border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Choose Stickers</CardTitle>
            <div className="flex gap-1 flex-wrap">
              {Object.entries(STICKER_CATEGORIES).map(([key, category]) => (
                <Button
                  key={key}
                  type="button"
                  variant={activeCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(key as keyof typeof STICKER_CATEGORIES)}
                  className="text-xs"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-8 gap-2">
              {STICKER_CATEGORIES[activeCategory].stickers.map((sticker) => (
                <Button
                  key={sticker}
                  type="button"
                  variant={selectedStickers.includes(sticker) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleStickerClick(sticker)}
                  className="text-lg h-10 w-10 p-0 hover:scale-110 transition-transform"
                >
                  {sticker}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}