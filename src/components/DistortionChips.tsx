import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Hit } from '@/types';
import { getDistortionInfo, generateReframePrompt } from '@/lib/distortions';
import { Info, RefreshCw } from 'lucide-react';

interface DistortionChipsProps {
  hits: Hit[];
  text: string;
}

export function DistortionChips({ hits, text }: DistortionChipsProps) {
  if (hits.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No cognitive distortions detected! 🎉
      </div>
    );
  }

  const renderTextWithHighlights = () => {
    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    hits
      .sort((a, b) => a.start - b.start)
      .forEach((hit, index) => {
        // Add text before the highlight
        if (hit.start > lastIndex) {
          elements.push(
            <span key={`text-${index}`}>
              {text.slice(lastIndex, hit.start)}
            </span>
          );
        }

        // Add highlighted text
        elements.push(
          <span
            key={`highlight-${index}`}
            className="bg-warning/20 border-b-2 border-warning px-1 rounded-sm"
            title={hit.type}
          >
            {text.slice(hit.start, hit.end)}
          </span>
        );

        lastIndex = hit.end;
      });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  const groupedHits = hits.reduce((acc, hit) => {
    if (!acc[hit.type]) acc[hit.type] = [];
    acc[hit.type].push(hit);
    return acc;
  }, {} as Record<string, Hit[]>);

  return (
    <div className="space-y-4">
      
      {/* Highlighted text */}
      <div className="bg-muted/30 p-4 rounded-lg border">
        <p className="text-sm leading-relaxed">
          {renderTextWithHighlights()}
        </p>
      </div>

      {/* Distortion summary */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          Detected Patterns ({hits.length} total):
        </h4>
        
        <div className="flex flex-wrap gap-2">
          {Object.entries(groupedHits).map(([type, typeHits]) => {
            const distortionInfo = getDistortionInfo(type);
            
            return (
              <Dialog key={type}>
                <DialogTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80 gap-1"
                  >
                    {type} ({typeHits.length})
                    <Info className="w-3 h-3" />
                  </Badge>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{type}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {distortionInfo?.description || 'A common thinking pattern that may not be helpful.'}
                    </p>
                    
                    <div>
                      <h5 className="font-medium mb-2">Your phrases:</h5>
                      <div className="space-y-1">
                        {typeHits.map((hit, index) => (
                          <div key={index} className="text-sm bg-muted/30 p-2 rounded">
                            "{hit.phrase}"
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Reframe suggestion:</h5>
                      <div className="bg-accent/10 p-3 rounded border-l-4 border-accent">
                        <p className="text-sm">
                          {generateReframePrompt(type)}
                        </p>
                      </div>
                    </div>

                    {distortionInfo?.examples && (
                      <div>
                        <h5 className="font-medium mb-2">Common examples:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {distortionInfo.examples.map((example, index) => (
                            <li key={index}>• "{example}"</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}