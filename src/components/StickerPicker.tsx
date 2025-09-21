import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smile, X } from 'lucide-react';
import { CANVA_STICKERS, StickerProps } from './CanvaSticker';
import { MODERN_STICKERS } from './ModernStickers';

interface StickerPickerProps {
  onStickerClick: (sticker: string, stickerData?: any) => void; // For inline insertion only
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

export default function StickerPicker({ onStickerClick }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('premium');
  const [stickerType, setStickerType] = useState<'emoji' | 'graphic' | 'modern'>('modern');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStickerClick = (sticker: string | { id: string; component: any; props: any }) => {
    const stickerId = typeof sticker === 'string' ? sticker : sticker.id;
    onStickerClick(stickerId, typeof sticker === 'object' ? sticker : undefined);
  };

  const getCurrentCategories = () => {
    if (stickerType === 'modern') return MODERN_STICKERS;
    if (stickerType === 'graphic') return CANVA_STICKERS;
    return STICKER_CATEGORIES;
  };

  const getCurrentStickers = () => {
    if (stickerType === 'modern') {
      const category = MODERN_STICKERS[activeCategory as keyof typeof MODERN_STICKERS];
      return category ? category.stickers : [];
    }
    if (stickerType === 'graphic') {
      const category = CANVA_STICKERS[activeCategory as keyof typeof CANVA_STICKERS];
      return category ? category.stickers : [];
    }
    const category = STICKER_CATEGORIES[activeCategory as keyof typeof STICKER_CATEGORIES];
    return category ? category.stickers : [];
  };

  const currentCategories = getCurrentCategories();
  const currentStickers = getCurrentStickers();

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
        {isExpanded ? 'Hide Stickers' : 'Insert Stickers'}
      </Button>

      {/* Sticker Picker */}
      {isExpanded && (
        <Card className="border-2 border-dashed border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Click to Insert Stickers
            </CardTitle>
            
            {/* Sticker Type Toggle */}
            <div className="flex gap-2 mb-3">
              <Button
                type="button"
                variant={stickerType === 'modern' ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStickerType('modern');
                  setActiveCategory('premium');
                }}
                className="text-xs"
              >
                Premium
              </Button>
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
              {Object.entries(currentCategories).map(([key, category]: [string, any]) => (
                <Button
                  key={key}
                  type="button"
                  variant={activeCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(key)}
                  className="text-xs"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-5 gap-3">
              {currentStickers.map((sticker: any) => {
                const isGraphicSticker = stickerType === 'graphic' || stickerType === 'modern';
                const stickerId = isGraphicSticker ? sticker.id : sticker;
                
                return (
                  <Button
                    key={stickerId}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStickerClick(sticker)}
                    className="h-14 w-14 p-1 hover:scale-110 transition-transform border border-border/20 hover:border-border/60 bg-gradient-to-br from-background to-muted/30"
                  >
                    {isGraphicSticker ? (
                      <sticker.component size={stickerType === 'modern' ? 32 : 24} {...sticker.props} />
                    ) : (
                      <span className="text-xl">{sticker}</span>
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