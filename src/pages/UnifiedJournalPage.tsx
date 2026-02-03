import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Loader2, Check, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEntries } from '@/store/useEntries';
import { useSettings } from '@/store/useSettings';
import { format } from 'date-fns';
import { detectWithAI } from '@/lib/aiClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useUnifiedSpeechDictation } from '@/hooks/useUnifiedSpeechDictation';
import { VoiceDiagnostics } from '@/components/VoiceDiagnostics';

type Detection = {
  span: string;
  type: string;
  reframe: string;
  confidence?: number;
};

type AudioSegment = {
  id: string;
  timestamp: number;
  transcript: string;
  duration?: number;
};

export default function UnifiedJournalPage() {
  const { toast } = useToast();
  const { createEntry, updateEntry, getEntry, findTodaysEntries, appendToEntry, loadEntries } = useEntries();
  const { aiAnalysisEnabled, autoDetectDistortions } = useSettings();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editEntryId = searchParams.get('edit');
  
  const [text, setText] = useState('');
  const [entryId, setEntryId] = useState<string | null>(editEntryId);
  const [lastSavedText, setLastSavedText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isNewSession, setIsNewSession] = useState(true); // Track if this is a new session
  
  // Voice state
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  
  // Real-time detection state
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Voice diagnostics
  const [lastSpeechError, setLastSpeechError] = useState<string | null>(null);

  // Load existing entry if editing
  useEffect(() => {
    const initialize = async () => {
      // Load all entries first
      await loadEntries();
      
      if (editEntryId) {
        // Loading specific entry for editing
        setIsNewSession(false);
        try {
          const entry = await getEntry(editEntryId);
          if (entry) {
            setText(entry.text || '');
            setLastSavedText(entry.text || '');
            setEntryId(editEntryId);
            if (entry.reframes) {
              const detectionsList: Detection[] = entry.reframes.map(r => ({
                span: r.span,
                type: r.socratic || "Cognitive Distortion",
                reframe: r.suggestion
              }));
              setLiveDetections(detectionsList);
            }
          }
        } catch (error) {
          console.error('Error loading entry:', error);
          toast({
            title: "Load Failed",
            description: "Could not load the entry.",
            variant: "destructive"
          });
        }
      } else {
        // New session - check if we should append to today's entry
        const todaysEntries = findTodaysEntries();
        const todaysUnifiedEntry = todaysEntries.find(e => e.tags?.includes('unified'));
        
        if (todaysUnifiedEntry) {
          console.log('Found existing entry for today:', todaysUnifiedEntry.id);
          setEntryId(todaysUnifiedEntry.id);
          // Preload with a timestamp divider so typing appends naturally
          const base = (todaysUnifiedEntry.text || '');
          const header = `${base ? '\n\n' : ''}— Added ${format(new Date(), 'h:mm a')} —\n`;
          const initial = `${base}${header}`;
          setText(initial);
          setLastSavedText(initial); // avoid saving until user types
          setIsNewSession(false);
        } else {
          console.log('No entry found for today, will create new one');
          setIsNewSession(true);
        }
      }
    };
    
    initialize();
  }, [editEntryId, getEntry, toast, loadEntries, findTodaysEntries]);

  const handleFinalTranscript = useCallback((finalText: string) => {
    const trimmed = (finalText || '').trim();
    if (!trimmed) return;

    const segment: AudioSegment = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      transcript: trimmed,
    };
    setAudioSegments((prev) => [...prev, segment]);

    // Append to editor text (preserve spacing from recognizer)
    setText((prev) => prev + finalText);
  }, []);

  const handleSpeechError = useCallback(
    (error: string) => {
      console.error('Speech recognition error:', error);
      setLastSpeechError(error);
      
      // Different messages for different errors
      let description = 'Could not access microphone. Please check permissions or use keyboard dictation 🎤.';
      if (error === 'not-allowed') {
        description = 'Access denied. On iPhone: enable Microphone + Speech Recognition in Settings, or use keyboard dictation 🎤.';
      } else if (error === 'aborted') {
        description = 'Recording was interrupted. Try again and speak immediately after tapping Record.';
      } else if (error === 'not-secure') {
        description = 'Secure connection required. Please use HTTPS.';
      }
      
      toast({
        title: 'Recording Error',
        description,
        variant: 'destructive',
      });
    },
    [toast]
  );

  const {
    isRecording,
    isSupported,
    isNative,
    permissionState,
    interimTranscript,
    start,
    stop,
  } = useUnifiedSpeechDictation({
    lang: 'en-US',
    onFinalTranscript: handleFinalTranscript,
    onError: handleSpeechError,
  });

  // Auto-save effect
  useEffect(() => {
    if (!text.trim() || text === lastSavedText) return;

    setSaveStatus('unsaved');
    const saveTimeout = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        if (!entryId) {
          // Create new entry for today
          const newId = await createEntry({
            text: text.trim(),
            tags: ['unified'],
            hasAudio: audioSegments.length > 0,
            hasDrawing: false
          });
          setEntryId(newId);
          setIsNewSession(false);
        } else {
          // Check if we're in a new session with existing entry ID
          if (isNewSession && entryId) {
            // Append to existing entry
            await appendToEntry(entryId, {
              text: text.trim(),
              hasAudio: audioSegments.length > 0,
            });
            setIsNewSession(false);
            toast({
              title: "Added to Today's Entry",
              description: "Your new content was appended.",
            });
          } else {
            // Regular update
            await updateEntry(entryId, { text: text.trim() });
          }
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
    }, 1500);

    return () => clearTimeout(saveTimeout);
  }, [text, entryId, lastSavedText, createEntry, updateEntry, toast, audioSegments.length, isNewSession, appendToEntry]);

  // Debounced AI detection - respects user's AI settings
  useEffect(() => {
    // Skip AI analysis if disabled in settings
    if (!aiAnalysisEnabled || !autoDetectDistortions) {
      setLiveDetections([]);
      return;
    }

    if (!text.trim() || text.trim().length < 20) {
      setLiveDetections([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsDetecting(true);
      try {
        const response = await detectWithAI(text.trim());
        
        // Map distortions with confidence scores
        if (response.distortions && response.distortions.length > 0) {
          const detectionsList: Detection[] = response.distortions.map((d, idx) => ({
            span: d.span,
            type: d.type || "Cognitive Distortion",
            reframe: response.reframes[idx]?.suggestion || "",
            confidence: d.confidence
          }));
          setLiveDetections(detectionsList);
          
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

  const toggleRecording = async () => {
    if (!isSupported) return;
    try {
      if (isRecording) {
        await stop();
      } else {
        await start();
      }
    } catch (e) {
      console.error('Toggle recording failed:', e);
    }
  };
  // Prevent double-execution on touch devices
  const isNavigatingRef = useRef(false);
  
  const handleBack = async () => {
    // Prevent double execution
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    
    try {
      await stop();
    } catch {}

    const currentText = (text || '').trim();
    const needsSave = currentText && currentText !== lastSavedText.trim();
    
    if (needsSave) {
      setSaveStatus('saving');
      
      try {
        let savedId = entryId;
        
        if (!entryId) {
          // Create new entry
          savedId = await createEntry({
            text: currentText,
            tags: ['unified'],
            hasAudio: audioSegments.length > 0,
            hasDrawing: false
          });
          console.log('Created new entry:', savedId);
        } else if (isNewSession && entryId) {
          // Append to existing entry
          await appendToEntry(entryId, {
            text: currentText,
            hasAudio: audioSegments.length > 0,
          });
          console.log('Appended to entry:', entryId);
        } else {
          // Update existing entry
          await updateEntry(entryId, { text: currentText });
          console.log('Updated entry:', entryId);
        }
        
        // Force reload entries to ensure persistence
        await loadEntries();
        
        // Small delay to ensure IndexedDB transaction commits (critical for iOS)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setSaveStatus('saved');
        console.log('Save completed successfully');
        
      } catch (e) {
        console.error('Save on back failed:', e);
        toast({
          title: "Save Failed",
          description: "Could not save your entry. Please try again.",
          variant: "destructive"
        });
        isNavigatingRef.current = false;
        return;
      }
    }

    navigate('/journal');
  };

  // Render highlighted text
  const renderHighlightedText = () => {
    const fullText = text + (isRecording ? interimTranscript : '');
    if (liveDetections.length === 0) return fullText;
    
    const segments: { text: string; isHighlight: boolean; reframe?: string; type?: string; confidence?: number; isInterim?: boolean }[] = [];
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
          type: detection.type,
          confidence: detection.confidence
        });
        lastIndex = index + detection.span.length;
      }
    });
    
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), isHighlight: false });
    }
    
    if (isRecording && interimTranscript) {
      segments.push({ text: interimTranscript, isHighlight: false, isInterim: true });
    }
    
    return segments;
  };

  const toggleAudioPlayback = (segmentId: string) => {
    if (playingSegmentId === segmentId) {
      setPlayingSegmentId(null);
    } else {
      setPlayingSegmentId(segmentId);
      // Simulate playback end after 2 seconds
      setTimeout(() => setPlayingSegmentId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Minimal header - simplified on mobile */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 px-2 sm:px-3 touch-manipulation" 
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Journal</span>
            </Button>
            
            {/* Desktop controls */}
            <div className="hidden sm:flex items-center gap-3">
              <Button
                onClick={toggleRecording}
                disabled={!isSupported}
                size="sm"
                className={cn(
                  "gap-2 transition-all duration-300 px-3 touch-manipulation",
                  isRecording 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-green-500 hover:bg-green-600 text-white"
                )}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    <span>Record</span>
                  </>
                )}
              </Button>
              
              <span className="text-xs text-muted-foreground">
                {format(new Date(), 'MMM d, yyyy • h:mm a')}
              </span>

              {/* Diagnostics (helps verify native vs web + iOS permission state) */}
              <span className="text-[11px] text-muted-foreground">
                • {isNative ? 'Native' : 'Web'}
                {isNative && permissionState !== 'unknown' ? ` • Speech: ${permissionState}` : ''}
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
              <Button 
                onClick={handleBack} 
                size="sm" 
                variant="outline" 
                className="px-3 touch-manipulation"
              >
                Done
              </Button>
            </div>

            {/* Mobile: just show save status */}
            <div className="flex sm:hidden items-center gap-2">
              {saveStatus === 'saving' && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {saveStatus === 'saved' && text.trim() && (
                <Check className="w-4 h-4 text-muted-foreground" />
              )}
              {isRecording && (
                <span className="text-green-500 text-xs font-medium animate-pulse">● REC</span>
              )}
            </div>
          </div>
        </header>

        {/* Mobile bottom action bar - fixed to bottom with iOS safe area */}
        <div 
          className="fixed left-0 right-0 z-[9999] bg-background/95 backdrop-blur border-t p-4 flex sm:hidden items-center justify-between gap-3"
          style={{ 
            bottom: 0,
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
          }}
        >
          <Button
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleRecording();
            }}
            disabled={!isSupported}
            className={cn(
              "flex-1 min-h-[44px] h-12 gap-2 text-base font-medium transition-all duration-300 touch-manipulation",
              isRecording 
                ? "bg-red-500 hover:bg-red-600 text-white" 
                : "bg-green-500 hover:bg-green-600 text-white"
            )}
          >
            {isRecording ? (
              <>
                <MicOff className="h-5 w-5" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                <span>Record</span>
              </>
            )}
          </Button>
          
          <Button 
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBack();
            }}
            variant="outline" 
            className="flex-1 min-h-[44px] h-12 text-base font-medium touch-manipulation"
          >
            Done
          </Button>
        </div>

        {/* Unified editor */}
        <div className="px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8">
          <div className={cn(
            "relative bg-card rounded-lg shadow-sm border min-h-[calc(100vh-200px)] overflow-visible transition-all duration-500",
            isRecording && "ring-2 ring-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.15)]"
          )}>
            
            {/* Highlight overlay - only show when there are detections */}
            {liveDetections.length > 0 && (
              <div 
                className="absolute inset-0 p-8 whitespace-pre-wrap break-words text-base leading-relaxed pointer-events-none rounded-lg z-20"
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
                          <span className="inline pointer-events-auto cursor-pointer">
                            <span className="bg-primary/20 hover:bg-primary/30 rounded px-0.5 transition-colors">
                              {segment.text}
                            </span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" sideOffset={6} className="max-w-[min(92vw,32rem)] whitespace-normal break-words">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold rounded-full bg-primary/10 text-primary px-2 py-0.5">
                                {segment.type}
                              </span>
                              {segment.confidence !== undefined && (
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full",
                                  segment.confidence >= 0.85 ? "bg-green-100 text-green-700" :
                                  segment.confidence >= 0.7 ? "bg-amber-100 text-amber-700" :
                                  "bg-muted text-muted-foreground"
                                )}>
                                  {segment.confidence >= 0.85 ? "High confidence" :
                                   segment.confidence >= 0.7 ? "Likely" : "Possible"}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{segment.reframe}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span 
                      key={i} 
                      className={cn(
                        "pointer-events-none",
                        segment.isInterim && "text-muted-foreground italic opacity-60"
                      )}
                    >
                      {segment.text}
                    </span>
                  )
                ));
              })()}
            </div>
            )}
            
            {/* Recording waveform overlay */}
            {isRecording && (
              <div className="absolute inset-0 pointer-events-none z-5 overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-green-500/10 to-green-500/5 animate-pulse" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-[slide-in-right_2s_ease-in-out_infinite]" />
              </div>
            )}
            
            {/* Input area */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={isRecording ? "Listening... (you can also type)" : "Type or tap Record to speak"}
                value={text + (isRecording ? interimTranscript : '')}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Allow editing even during recording, but adjust for interim text
                  if (isRecording) {
                    // Remove interim transcript portion before updating
                    const withoutInterim = newValue.replace(interimTranscript, '');
                    setText(withoutInterim);
                  } else {
                    setText(newValue);
                  }
                }}
                className={cn(
                  "min-h-[calc(100vh-200px)] resize-none text-base leading-relaxed relative bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-8 transition-all duration-300"
                )}
                style={{ lineHeight: '1.75' }}
                autoFocus
              />
            </div>
            
            {/* Audio segments */}
            {audioSegments.length > 0 && (
              <div className="px-8 pb-8 space-y-2">
                <div className="text-xs text-muted-foreground mb-3">Voice segments:</div>
                {audioSegments.map((segment) => (
                  <div 
                    key={segment.id}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                  >
                    <Button
                      onClick={() => toggleAudioPlayback(segment.id)}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full flex-shrink-0"
                    >
                      {playingSegmentId === segment.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{segment.transcript}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(segment.timestamp, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-2 px-2">
            <div className="flex gap-4">
              <span>{text.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
              <span>{text.length} characters</span>
              {audioSegments.length > 0 && (
                <span>{audioSegments.length} voice segments</span>
              )}
            </div>
            {isRecording && (
              <span className="text-green-500 font-medium animate-pulse">● Recording</span>
            )}
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

          {/* Voice diagnostics panel */}
          <VoiceDiagnostics lastError={lastSpeechError} />
        </div>
        
      </div>
    </div>
  );
}
