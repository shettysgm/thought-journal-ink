import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEntries } from '@/store/useEntries';
import { format } from 'date-fns';
import { detectWithAI } from '@/lib/aiClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Detection = {
  span: string;
  type: string;
  reframe: string;
};

export default function TextJournalPage() {
  const { toast } = useToast();
  const { createEntry, updateEntry } = useEntries();
  
  const [text, setText] = useState('');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [lastSavedText, setLastSavedText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Real-time detection state
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Auto-save effect
  useEffect(() => {
    if (!text.trim() || text === lastSavedText) return;

    setSaveStatus('unsaved');
    const saveTimeout = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        if (!entryId) {
          // Create new entry
          const newId = await createEntry({
            text: text.trim(),
            tags: ['text'],
            hasAudio: false,
            hasDrawing: false
          });
          setEntryId(newId);
        } else {
          // Update existing entry
          await updateEntry(entryId, { text: text.trim() });
        }
        setLastSavedText(text);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('unsaved');
        toast({
          title: "Save Failed",
          description: "Could not auto-save your entry.",
          variant: "destructive"
        });
      }
    }, 1500); // Auto-save after 1.5 seconds of no typing

    return () => clearTimeout(saveTimeout);
  }, [text, entryId, lastSavedText, createEntry, updateEntry, toast]);

  // Debounced AI detection as user types
  useEffect(() => {
    if (!text.trim() || text.trim().length < 20) {
      setLiveDetections([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsDetecting(true);
      try {
        const response = await detectWithAI(text.trim());
        
        if (response.reframes && response.reframes.length > 0) {
          const detectionsList: Detection[] = response.reframes.map(r => ({
            span: r.span,
            type: "Mind Reading",
            reframe: r.suggestion
          }));
          setLiveDetections(detectionsList);
          
          // Auto-save reframes to entry
          if (entryId) {
            const reframes = detectionsList.map(d => ({
              span: d.span,
              suggestion: d.reframe,
              socratic: d.type
            }));
            await updateEntry(entryId, { reframes });
          }
        } else {
          setLiveDetections([]);
        }
      } catch (error) {
        console.error('Real-time detection error:', error);
        setLiveDetections([]);
      } finally {
        setIsDetecting(false);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [text, entryId, updateEntry]);

  // Render highlighted text for overlay
  const renderHighlightedText = () => {
    if (liveDetections.length === 0) return text;
    
    const segments: { text: string; isHighlight: boolean; reframe?: string; type?: string }[] = [];
    let lastIndex = 0;
    
    const sortedDetections = [...liveDetections].sort((a, b) => {
      const aIndex = text.indexOf(a.span);
      const bIndex = text.indexOf(b.span);
      return aIndex - bIndex;
    });
    
    sortedDetections.forEach(detection => {
      const index = text.indexOf(detection.span, lastIndex);
      if (index !== -1 && index >= lastIndex) {
        if (index > lastIndex) {
          segments.push({ text: text.slice(lastIndex, index), isHighlight: false });
        }
        segments.push({ 
          text: detection.span, 
          isHighlight: true, 
          reframe: detection.reframe,
          type: detection.type 
        });
        lastIndex = index + detection.span.length;
      }
    });
    
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), isHighlight: false });
    }
    
    return segments;
  };

  return (
    <div className="min-h-screen bg-gradient-therapeutic p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Minimal header */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-6 py-3">
            <Link to="/journal">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Journal
              </Button>
            </Link>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {format(new Date(), 'MMM d, yyyy • h:mm a')}
              </span>
              {saveStatus === 'saving' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && text.trim() && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Document-style editor */}
        <div className="px-6 py-8">
          <div className="relative bg-card rounded-lg shadow-sm border min-h-[calc(100vh-200px)] overflow-visible">
            
            {/* Highlight overlay */}
            <div 
              className="absolute inset-0 p-8 pointer-events-none whitespace-pre-wrap break-words text-base leading-relaxed text-transparent rounded-lg z-10"
              style={{ 
                font: 'inherit',
                letterSpacing: 'inherit',
                wordSpacing: 'inherit',
                lineHeight: '1.75'
              }}
              aria-hidden="true"
            >
              {(() => {
                const highlighted = renderHighlightedText();
                if (typeof highlighted === 'string') {
                  return highlighted;
                }
                return highlighted.map((segment: any, i: number) => (
                  segment.isHighlight ? (
                    <TooltipProvider delayDuration={100} key={`prov-${i}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline pointer-events-auto">
                            <span className="bg-primary/20 rounded px-0.5 hover:bg-primary/30 transition-colors cursor-help">
                              {segment.text}
                            </span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" sideOffset={6} className="max-w-[min(92vw,32rem)] whitespace-normal break-words">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold rounded-full bg-primary/10 text-primary px-2 py-0.5">
                                {segment.type}
                              </span>
                            </div>
                            <p className="text-sm text-foreground">{segment.reframe}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span key={i} className="pointer-events-none">{segment.text}</span>
                  )
                ));
              })()}
            </div>
            
            {/* Actual textarea */}
            <Textarea
              ref={textareaRef}
              placeholder="Start writing your thoughts..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[calc(100vh-200px)] resize-none text-base leading-relaxed relative bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-8"
              style={{ lineHeight: '1.75' }}
              autoFocus
            />
          </div>

          {/* Word count footer */}
          <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
            <span>{text.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
            <span>{text.length} characters</span>
          </div>

          {/* Detection status */}
          {isDetecting && (
            <div className="mt-4 text-center">
              <span className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Analyzing thought patterns...
              </span>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
