import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile } from 'lucide-react';
import { KAWAII_STICKERS } from './KawaiiStickers';

interface StickerPickerProps {
  onStickerClick: (sticker: string, stickerData?: any) => void;
}

export default function StickerPicker({ onStickerClick }: StickerPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('animals');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStickerClick = (sticker: { id: string; component: any; props: any }) => {
    onStickerClick(sticker.id, sticker);
  };

  const currentStickers = KAWAII_STICKERS[activeCategory]?.stickers || [];

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full gap-2"
      >
        <Smile className="w-4 h-4" />
        {isExpanded ? 'Hide Stickers' : 'Insert Stickers'}
      </Button>

      {isExpanded && (
        <Card className="border-2 border-dashed border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Click to Insert Stickers</CardTitle>
            <div className="flex gap-1 flex-wrap">
              {Object.entries(KAWAII_STICKERS).map(([key, category]) => (
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
            <div className="grid grid-cols-4 gap-3">
              {currentStickers.map((sticker) => (
                <Button
                  key={sticker.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStickerClick(sticker)}
                  className="h-16 w-16 p-1 hover:scale-110 transition-transform border border-border/20 hover:border-border/60 bg-gradient-to-br from-background to-muted/30"
                >
                  <sticker.component size={40} {...sticker.props} />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
