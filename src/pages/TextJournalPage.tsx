import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, AlertCircle, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEntries } from '@/store/useEntries';
import { format } from 'date-fns';
import CBTReframeReview, { Detection } from '@/components/CBTReframeReview';
import { detectWithAI } from '@/lib/aiClient';

export default function TextJournalPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createEntry, updateEntry, getEntry } = useEntries();
  
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  // CBT Reframe Review state
  const [showReframeReview, setShowReframeReview] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [isProcessingReframes, setIsProcessingReframes] = useState(false);

  // Real-time detection state
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedReframes, setEditedReframes] = useState<{ [key: number]: string }>({});
  const [acceptedIndices, setAcceptedIndices] = useState<Set<number>>(new Set());


  // Debounced detection as user types
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
            span: r.span, // keep full span for accurate inline replace
            type: "Mind Reading" as const,
            reframe: r.suggestion
          }));
          setLiveDetections(detectionsList);
        } else {
          setLiveDetections([]);
        }
      } catch (error) {
        console.error('Real-time detection error:', error);
        setLiveDetections([]);
      } finally {
        setIsDetecting(false);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [text]);

  const handleEditReframe = (index: number) => {
    setEditingIndex(index);
    if (!editedReframes[index]) {
      setEditedReframes(prev => ({
        ...prev,
        [index]: liveDetections[index].reframe
      }));
    }
  };

  const handleSaveEdit = (index: number) => {
    setEditingIndex(null);
  };

  // --- Inline replacement helpers (Grammarly-style) ---
  const normalize = (s: string) => s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  const getSentenceBounds = (src: string, pos: number) => {
    let start = pos;
    let end = pos;
    while (start > 0 && !/[.!?\n]/.test(src[start - 1])) start--;
    while (end < src.length && !/[.!?\n]/.test(src[end])) end++;
    if (end < src.length) end++; // include punctuation
    return { start, end };
  };

  const replaceInline = (src: string, span: string, replacement: string): { out: string; ok: boolean } => {
    // 1) Direct match
    const idx = src.indexOf(span);
    if (idx !== -1) {
      return { out: src.slice(0, idx) + replacement + src.slice(idx + span.length), ok: true };
    }

    // 2) Try normalized quotes/spacing
    const normSpan = normalize(span);
    const normSrc = normalize(src);
    const normIdx = normSrc.indexOf(normSpan);
    if (normIdx !== -1) {
      // Fallback to sentence replacement using approx position
      // Map normIdx back by searching a seed in original
      const seed = normSpan.slice(0, Math.min(40, normSpan.length));
      const origSeedIdx = src.toLowerCase().indexOf(seed.toLowerCase());
      const pos = origSeedIdx !== -1 ? origSeedIdx : Math.max(0, Math.min(src.length - 1, normIdx));
      const { start, end } = getSentenceBounds(src, pos);
      return { out: src.slice(0, start) + replacement + src.slice(end), ok: true };
    }

    // 3) Seed-based search with first N words
    const words = span.split(/\s+/).filter(Boolean);
    for (const n of [8, 6, 5, 4, 3]) {
      if (words.length >= n) {
        const seed = words.slice(0, n).join(' ');
        const i = src.toLowerCase().indexOf(seed.toLowerCase());
        if (i !== -1) {
          const { start, end } = getSentenceBounds(src, i);
          return { out: src.slice(0, start) + replacement + src.slice(end), ok: true };
        }
      }
    }

    return { out: src, ok: false };
  };

  const handleAcceptLiveReframe = (index: number) => {
    const detection = liveDetections[index];
    const reframeText = editedReframes[index] || detection.reframe;

    const { out, ok } = replaceInline(text, detection.span, reframeText);
    if (ok) {
      setText(out);
      setAcceptedIndices(prev => new Set(prev).add(index));
      toast({
        title: "Reframe Applied",
        description: "Your thought has been reframed in the text above."
      });
    } else {
      toast({
        title: "Couldn't apply automatically",
        description: "We couldn't find the exact phrase. You can copy the reframe above.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      toast({
        title: "Empty Entry",
        description: "Please write something before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const entryId = await createEntry({
        text: text.trim(),
        tags: ['text'],
        hasAudio: false,
        hasDrawing: false
      });

      toast({
        title: "Entry Saved",
        description: "Analyzing for thought patterns..."
      });

      setSavedEntryId(entryId);

      // Try to detect distortions and show reframe review
      try {
        const response = await detectWithAI(text.trim());
        
        // Convert reframes to Detection format
        if (response.reframes && response.reframes.length > 0) {
          const detectionsList: Detection[] = response.reframes.map(r => ({
            span: r.span, // keep full span for accurate inline replace
            type: "Mind Reading" as const, // Default type, can be enhanced later
            reframe: r.suggestion
          }));
          
          setDetections(detectionsList);
          setShowReframeReview(true);
        } else {
          // No reframes found, just navigate
          navigate('/journal');
        }
      } catch (aiError) {
        console.error('AI detection error:', aiError);
        // Still save entry, just skip reframe review
        toast({
          title: "Entry Saved",
          description: "Your entry was saved, but we couldn't analyze it right now."
        });
        navigate('/journal');
      }
    } catch (error) {
      console.error('TextJournalPage save error:', error);
      toast({
        title: "Save Failed",
        description: "Could not save your entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptReframe = async (index: number, acceptedText: string) => {
    if (!savedEntryId) return;
    
    setIsProcessingReframes(true);
    try {
      const detection = detections[index];
      const reframe = {
        span: detection.span,
        suggestion: acceptedText,
        socratic: detection.type
      };
      
      // Merge with any existing reframes on the entry
      const current = await getEntry(savedEntryId);
      const existing = current?.reframes ?? [];
      await updateEntry(savedEntryId, {
        reframes: [...existing, reframe]
      });
      
      console.log('Reframe accepted:', reframe);
    } catch (error) {
      console.error('Failed to save reframe:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the reframe.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingReframes(false);
    }
  };

  const handleAcceptAllReframes = async (acceptedItems: { index: number; text: string }[]) => {
    if (!savedEntryId) return;
    
    setIsProcessingReframes(true);
    try {
      const current = await getEntry(savedEntryId);
      const existing = current?.reframes ?? [];

      const reframes = acceptedItems.map(item => {
        const detection = detections[item.index];
        return {
          span: detection.span,
          suggestion: item.text,
          socratic: detection.type
        };
      });
      
      await updateEntry(savedEntryId, { reframes: [...existing, ...reframes] });
      
      toast({
        title: "Reframes Saved",
        description: "Your thought reframes have been saved."
      });
      
      // Close dialog and navigate
      setShowReframeReview(false);
      navigate('/journal');
    } catch (error) {
      console.error('Failed to save reframes:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the reframes.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingReframes(false);
    }
  };

  const handleDiscard = () => {
    if (text.trim()) {
      if (confirm('Are you sure you want to discard this entry?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-therapeutic p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Text Journal</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleDiscard}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Discard
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || !text.trim()}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              What's on your mind?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Text Input */}
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                placeholder="Start typing your thoughts here... Express yourself freely and honestly. This is your safe space."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[300px] resize-none text-base leading-relaxed"
                autoFocus
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{text.length} characters</span>
                <span>{text.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
              </div>
            </div>

            {/* Writing Tips */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-foreground">💡 Writing Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Write in stream-of-consciousness style - don't worry about grammar</li>
                <li>• Include both positive and challenging thoughts</li>
                <li>• Notice any patterns in your thinking</li>
                <li>• Be compassionate with yourself</li>
              </ul>
            </div>
            
          </CardContent>
        </Card>

        {/* Real-time Distortion Detection */}
        {text.trim().length > 20 && (
          <Card className="shadow-soft border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-primary" />
                Would you like to reframe your thoughts?
                {isDetecting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDetecting && liveDetections.length === 0 ? (
                <p className="text-sm text-muted-foreground">Analyzing your thoughts...</p>
              ) : liveDetections.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keep writing... We'll help you identify thought patterns.</p>
              ) : (
                <div className="space-y-4">
                  {liveDetections.map((detection, index) => {
                    const isAccepted = acceptedIndices.has(index);
                    
                    return (
                      <div 
                        key={index} 
                        className={`rounded-lg p-4 space-y-3 transition-all ${
                          isAccepted 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm rounded-full bg-primary/10 text-primary px-3 py-1 font-bold">
                                {detection.type}
                              </span>
                              {isAccepted && (
                                <span className="text-xs text-primary font-medium">✓ Applied</span>
                              )}
                            </div>
                          <p className="text-sm text-foreground font-medium">
                            "{detection.span.length > 140 ? detection.span.slice(0, 140) + '…' : detection.span}"
                          </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Reframe Suggestion
                            </label>
                            {editingIndex !== index && !isAccepted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditReframe(index)}
                                className="h-7 text-xs gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </Button>
                            )}
                          </div>
                          
                          {editingIndex === index ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editedReframes[index] || detection.reframe}
                                onChange={(e) => setEditedReframes(prev => ({
                                  ...prev,
                                  [index]: e.target.value
                                }))}
                                className="min-h-[80px] text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(index)}
                                className="w-full"
                              >
                                Save Edit
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-foreground bg-background/50 rounded p-3">
                                {editedReframes[index] || detection.reframe}
                              </p>
                              {!isAccepted && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptLiveReframe(index)}
                                  className="w-full"
                                >
                                  Accept & Replace in Text
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CBT Reframe Review Dialog */}
        <CBTReframeReview
          open={showReframeReview}
          onOpenChange={(open) => {
            setShowReframeReview(open);
            if (!open && savedEntryId) {
              // If user closes without accepting, navigate to journal
              navigate('/journal');
            }
          }}
          detections={detections}
          onAccept={handleAcceptReframe}
          onAcceptAll={handleAcceptAllReframes}
          busy={isProcessingReframes}
        />

      </div>
    </div>
  );
}