import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smile, X } from 'lucide-react';
import { CANVA_STICKERS, StickerProps } from './CanvaSticker';

interface StickerPickerProps {
  selectedStickers: string[];
  onAddSticker: (sticker: string) => void;
  onRemoveSticker: (sticker: string) => void;
  onStickerClick?: (sticker: string, stickerData?: any) => void; // For inline insertion
  mode?: 'collection' | 'inline'; // collection = add to list, inline = insert directly
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

export default function StickerPicker({ selectedStickers, onAddSticker, onRemoveSticker, onStickerClick, mode = 'collection' }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof STICKER_CATEGORIES | keyof typeof CANVA_STICKERS>('emotions');
  const [stickerType, setStickerType] = useState<'emoji' | 'graphic'>('graphic');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStickerClick = (sticker: string | { id: string; component: any; props: any }) => {
    const stickerId = typeof sticker === 'string' ? sticker : sticker.id;
    
    if (mode === 'inline' && onStickerClick) {
      onStickerClick(stickerId, typeof sticker === 'object' ? sticker : undefined);
      return;
    }
    
    if (selectedStickers.includes(stickerId)) {
      onRemoveSticker(stickerId);
    } else {
      onAddSticker(stickerId);
    }
  };

  const currentCategories = stickerType === 'graphic' ? CANVA_STICKERS : STICKER_CATEGORIES;
  const currentStickers = stickerType === 'graphic' 
    ? currentCategories[activeCategory as keyof typeof CANVA_STICKERS]?.stickers || []
    : currentCategories[activeCategory as keyof typeof STICKER_CATEGORIES]?.stickers || [];

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
        {isExpanded ? 'Hide Stickers' : (mode === 'inline' ? 'Insert Stickers' : 'Add Stickers')}
      </Button>

      {/* Selected Stickers - only show in collection mode */}
      {mode === 'collection' && selectedStickers.length > 0 && (
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
            <CardTitle className="text-lg">
              {mode === 'inline' ? 'Click to Insert Stickers' : 'Choose Stickers'}
            </CardTitle>
            
            {/* Sticker Type Toggle */}
            <div className="flex gap-2 mb-3">
              <Button
                type="button"
                variant={stickerType === 'graphic' ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStickerType('graphic');
                  setActiveCategory('hearts');
                }}
                className="text-xs"
              >
                Graphics
              </Button>
              <Button
                type="button"
                variant={stickerType === 'emoji' ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStickerType('emoji');
                  setActiveCategory('emotions');
                }}
                className="text-xs"
              >
                Emojis
              </Button>
            </div>
            
            {/* Category Selection */}
            <div className="flex gap-1 flex-wrap">
              {Object.entries(currentCategories).map(([key, category]) => (
                <Button
                  key={key}
                  type="button"
                  variant={activeCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(key as any)}
                  className="text-xs"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-6 gap-3">
              {currentStickers.map((sticker: any) => {
                const isGraphicSticker = stickerType === 'graphic';
                const stickerId = isGraphicSticker ? sticker.id : sticker;
                const isSelected = mode === 'collection' && selectedStickers.includes(stickerId);
                
                return (
                  <Button
                    key={stickerId}
                    type="button"
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleStickerClick(sticker)}
                    className="h-12 w-12 p-1 hover:scale-110 transition-transform border border-border/20 hover:border-border/60"
                  >
                    {isGraphicSticker ? (
                      <sticker.component size={24} {...sticker.props} />
                    ) : (
                      <span className="text-lg">{sticker}</span>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}