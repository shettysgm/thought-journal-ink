import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Square, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntries } from '@/store/useEntries';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { detectWithAI } from '@/lib/aiClient';
import { setPendingSave } from '@/lib/pendingSave';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

type Detection = {
  span: string;
  type: string;
  reframe: string;
};

export default function VoicePage() {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const { createEntry, updateEntry, findTodaysEntries, getEntry } = useEntries();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [entryId, setEntryId] = useState<string | null>(null);
  const [lastSavedText, setLastSavedText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isLoadingEntry, setIsLoadingEntry] = useState(true);
  const transcriptRef = useRef(transcript);
  const entryIdRef = useRef(entryId);
  const lastSavedTextRef = useRef(lastSavedText);
  const interimRef = useRef(interimTranscript);
  
  // Real-time detection state
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // Speech recognition handlers — sync refs immediately so save paths always have latest text
  const handleSpeechResult = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setTranscript(prev => {
        const updated = prev + text;
        transcriptRef.current = updated; // sync ref immediately (don't wait for effect)
        return updated;
      });
      setInterimTranscript('');
      interimRef.current = '';
    } else {
      setInterimTranscript(text);
      interimRef.current = text;
    }
  }, []);

  const handleSpeechError = useCallback((error: string) => {
    console.error('Speech recognition error:', error);
    toast({
      title: "Recording Error",
      description: error === 'not-allowed' 
        ? "Microphone or Speech Recognition access denied. Please enable it in iPhone Settings."
        : "Could not access microphone. Please check permissions.",
      variant: "destructive"
    });
  }, [toast]);

  const handleSpeechEnd = useCallback(() => {
    // Clear interim transcript when recording ends
    setInterimTranscript('');
  }, []);

  const { isRecording, isSupported, isNative, permissionState, startRecording, stopRecording } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: handleSpeechError,
    onEnd: handleSpeechEnd,
  });

  // Load or create today's entry on mount
  useEffect(() => {
    const initializeTodaysEntry = async () => {
      setIsLoadingEntry(true);
      try {
        const todaysEntries = await findTodaysEntries();
        const voiceEntry = todaysEntries.find(e => e.tags?.includes('voice'));
        
        if (voiceEntry) {
          setEntryId(voiceEntry.id);
          const entry = await getEntry(voiceEntry.id);
          if (entry?.text) {
            setTranscript(entry.text + '\n\n');
            setLastSavedText(entry.text + '\n\n');
          }
          console.log('Continuing today\'s voice entry:', voiceEntry.id);
        } else {
          console.log('No voice entry for today, will create new one');
        }
      } catch (error) {
        console.error('Error loading today\'s entry:', error);
      } finally {
        setIsLoadingEntry(false);
      }
    };
    
    initializeTodaysEntry();
  }, [findTodaysEntries, getEntry]);

  // Keep refs in sync for unmount save
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { entryIdRef.current = entryId; }, [entryId]);
  useEffect(() => { lastSavedTextRef.current = lastSavedText; }, [lastSavedText]);
  useEffect(() => { interimRef.current = interimTranscript; }, [interimTranscript]);

  // Save when recording ends
  useEffect(() => {
    if (isRecording) return; // Only run when recording stops
    
    const saveOnEnd = async () => {
      try {
        // Use refs — state may be stale after stopRecording
        const fullText = (transcriptRef.current + interimRef.current).trim();
        const currentEntryId = entryIdRef.current;
        const currentLastSaved = lastSavedTextRef.current;
        console.log('[VoicePage] save-on-stop:', { fullTextLen: fullText.length, hasId: !!currentEntryId });
        if (fullText && fullText !== currentLastSaved?.trim()) {
          if (!currentEntryId) {
            const newId = await createEntry({
              text: fullText,
              tags: ['voice'],
              hasAudio: true,
              hasDrawing: false
            });
            setEntryId(newId);
            entryIdRef.current = newId;
            console.log('Created voice entry on stop:', newId);
          } else {
            await updateEntry(currentEntryId, { text: fullText });
            console.log('Updated voice entry on stop:', currentEntryId);
          }
          setLastSavedText(fullText);
          lastSavedTextRef.current = fullText;
          setSaveStatus('saved');
        }
      } catch (e) {
        console.error('Save on stop failed:', e);
      }
    };
    
    const fullText = (transcriptRef.current + interimRef.current).trim();
    if (fullText) {
      saveOnEnd();
    }
  }, [isRecording, createEntry, updateEntry]);

  // Save on unmount (e.g., navigating via bottom nav)
  useEffect(() => {
    return () => {
      // On native, transcript may be empty while interim has the live text
      const finalText = (transcriptRef.current || '') + (interimRef.current || '');
      const id = entryIdRef.current;
      const lastSaved = lastSavedTextRef.current;
      if (finalText.trim() && finalText.trim() !== lastSaved?.trim()) {
        console.log('[VoicePage] Unmount save, text length:', finalText.trim().length);
        let savePromise: Promise<void>;
        if (id) {
          savePromise = updateEntry(id, { text: finalText.trim() })
            .then(() => console.log('[VoicePage] Unmount save completed'))
            .catch(e => console.error('Unmount save failed:', e));
        } else {
          savePromise = createEntry({ text: finalText.trim(), tags: ['voice'], hasAudio: true, hasDrawing: false })
            .then(() => console.log('[VoicePage] Unmount create completed'))
            .catch(e => console.error('Unmount create failed:', e)) as Promise<void>;
        }
        // Store promise so JournalPage can await it
        setPendingSave(savePromise);
      }
    };
  }, [createEntry, updateEntry]);

  // Auto-save effect - triggers as user speaks (also watches interimTranscript for native)
  const fullLiveText = transcript + interimTranscript;
  useEffect(() => {
    if (!fullLiveText.trim() || fullLiveText === lastSavedText || isLoadingEntry) return;

    setSaveStatus('unsaved');
    const saveTimeout = setTimeout(async () => {
      const textToSave = fullLiveText.trim();
      setSaveStatus('saving');
      try {
        if (!entryId) {
          const newId = await createEntry({
            text: textToSave,
            tags: ['voice'],
            hasAudio: true,
            hasDrawing: false
          });
          setEntryId(newId);
          console.log('Created new voice entry for today:', newId);
          toast({ title: 'Voice entry saved', description: 'Auto-saved to Journal.' });
        } else {
          await updateEntry(entryId, { text: textToSave });
          console.log('Updated today\'s voice entry:', entryId);
        }
        setLastSavedText(fullLiveText);
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
  }, [fullLiveText, entryId, lastSavedText, isLoadingEntry, createEntry, updateEntry, toast]);

  // Debounced AI detection - analyzes as user speaks
  useEffect(() => {
    if (!transcript.trim() || transcript.trim().length < 20) {
      setLiveDetections([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsDetecting(true);
      console.log('Starting AI detection for voice transcript...');
      try {
        const response = await detectWithAI(transcript.trim());
        console.log('AI detection response:', response);
        
        if (response.reframes && response.reframes.length > 0) {
          // Match reframes with their distortion types
          const detectionsList: Detection[] = response.reframes.map(r => {
            // Find matching distortion by span
            const matchingDistortion = response.distortions?.find(d => d.span === r.span);
            return {
              span: r.span,
              type: matchingDistortion?.type || r.socratic || "Cognitive Distortion",
              reframe: r.suggestion
            };
          });
          setLiveDetections(detectionsList);
          console.log('Found detections:', detectionsList);
          
          // Auto-save reframes to entry
          if (entryId) {
            const reframes = detectionsList.map(d => ({
              span: d.span,
              suggestion: d.reframe,
              socratic: d.type
            }));
            await updateEntry(entryId, { reframes });
            console.log('Saved reframes to entry');
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
    }, 2500); // Analyze after 2.5 seconds of no new speech

    return () => clearTimeout(timeoutId);
  }, [transcript, entryId, updateEntry]);

  // startRecording and stopRecording now come from useSpeechRecognition hook

  const handleBack = async () => {
    try {
      await stopRecording();
      // Wait for late-arriving native partial results to be captured by the hook
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch {}
    try {
      // Use REFS not state — state is stale after await stopRecording()
      const fullText = (transcriptRef.current + interimRef.current).trim();
      console.log('[VoicePage] handleBack save:', { fullTextLen: fullText.length, entryId: entryIdRef.current });
      if (fullText && fullText !== lastSavedTextRef.current?.trim()) {
        setSaveStatus('saving');
        if (!entryIdRef.current) {
          const newId = await createEntry({
            text: fullText,
            tags: ['voice'],
            hasAudio: true,
            hasDrawing: false,
          });
          setEntryId(newId);
          entryIdRef.current = newId;
        } else {
          await updateEntry(entryIdRef.current, { text: fullText });
        }
        lastSavedTextRef.current = fullText;
        setSaveStatus('saved');
      }
    } catch (e) {
      console.error('Save on back failed:', e);
    }
    navigate('/journal');
  };

  const saveNow = async () => {
    try {
      const fullText = (transcriptRef.current + interimRef.current).trim();
      if (fullText) {
        setSaveStatus('saving');
        if (!entryIdRef.current) {
          const newId = await createEntry({
            text: fullText,
            tags: ['voice'],
            hasAudio: true,
            hasDrawing: false,
          });
          setEntryId(newId);
          entryIdRef.current = newId;
          toast({ title: 'Voice entry saved', description: 'Saved to Journal.' });
        } else {
          await updateEntry(entryIdRef.current, { text: fullText });
          toast({ title: 'Voice entry updated', description: 'Journal updated.' });
        }
        lastSavedTextRef.current = fullText;
        setSaveStatus('saved');
      }
    } catch (e) {
      console.error('Manual save failed:', e);
      toast({ title: 'Save failed', description: 'Could not save your entry.', variant: 'destructive' });
    }
  };

  // Render highlighted text with tooltips
  const renderHighlightedText = () => {
    const fullText = transcript + interimTranscript;
    if (liveDetections.length === 0) {
      // No highlights, just render text with interim in italic
      return (
        <>
          <span className="text-foreground">{transcript}</span>
          {interimTranscript && (
            <span className="text-muted-foreground italic">{interimTranscript}</span>
          )}
        </>
      );
    }
    
    const segments: { text: string; isHighlight: boolean; reframe?: string; type?: string; isInterim?: boolean }[] = [];
    let lastIndex = 0;
    
    const sortedDetections = [...liveDetections].sort((a, b) => {
      const aIndex = transcript.indexOf(a.span);
      const bIndex = transcript.indexOf(b.span);
      return aIndex - bIndex;
    });
    
    sortedDetections.forEach(detection => {
      const index = transcript.indexOf(detection.span, lastIndex);
      if (index !== -1 && index >= lastIndex) {
        if (index > lastIndex) {
          segments.push({ text: transcript.slice(lastIndex, index), isHighlight: false });
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
    
    if (lastIndex < transcript.length) {
      segments.push({ text: transcript.slice(lastIndex), isHighlight: false });
    }
    
    // Add interim transcript at the end
    if (interimTranscript) {
      segments.push({ text: interimTranscript, isHighlight: false, isInterim: true });
    }
    
    return segments.map((segment: any, i: number) => {
      if (segment.isHighlight) {
        return (
          <Tooltip key={`highlight-${i}`}>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline bg-primary/20 rounded px-0.5 hover:bg-primary/30 transition-colors cursor-help align-baseline"
                    aria-label={`${segment.type}: ${segment.reframe}`}
                    title={`${segment.type}: ${segment.reframe}`}
                  >
                    {segment.text}
                  </button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="max-w-[min(92vw,32rem)] whitespace-normal break-words">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold rounded-full bg-primary/10 text-primary px-2 py-0.5">
                      {segment.type}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{segment.reframe}</p>
                </div>
              </PopoverContent>
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
            </Popover>
          </Tooltip>
        );
      }
      
      return (
        <span 
          key={`text-${i}`}
          className={segment.isInterim ? "text-muted-foreground italic" : "text-foreground"}
        >
          {segment.text}
        </span>
      );
    });
  };

  if (!isSupported) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between px-6 py-3">
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          </header>
          
          <div className="px-6 py-8">
            <div className="bg-card rounded-lg shadow-sm border p-8 text-center">
              <MicOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Voice Recording Not Supported</h3>
              <p className="text-muted-foreground">
                Voice dictation is not supported in this browser. Please try using a modern browser like Safari, Chrome, or Edge.
              </p>
            </div>
          </div>
        </div>
      </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-gradient-therapeutic p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Minimal header */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-6 py-3">
            <Button variant="ghost" size="sm" className="gap-2" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
              Back to Journal
            </Button>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {format(new Date(), 'MMM d, yyyy')}
                {entryId && !isLoadingEntry && (
                  <span className="ml-2 text-xs text-primary">• Today&apos;s Entry</span>
                )}
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
              {saveStatus === 'saved' && transcript.trim() && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
              {transcript.trim() && saveStatus !== 'saving' && (
                <Button variant="outline" size="sm" onClick={saveNow}>
                  Save now
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Recording controls - floating button */}
        <div
          className="fixed z-50"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)', right: 'calc(env(safe-area-inset-right, 0px) + 2rem)' }}
        >
          {!isRecording ? (
            <Button
              onClick={startRecording}
              size="lg"
              aria-label="Start recording"
              className="w-16 h-16 rounded-full shadow-lg bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Mic className="w-6 h-6" />
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              size="lg"
              aria-label="Stop recording"
              variant="destructive"
              className="w-16 h-16 rounded-full shadow-lg animate-pulse"
            >
              <Square className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* Document-style editor */}
        <div className="px-6 py-8">
          <div className="relative bg-card rounded-lg shadow-sm border min-h-[calc(100vh-200px)] overflow-visible">
            
            {/* Transcript with highlights */}
            <div 
              className="p-8 whitespace-pre-wrap break-words text-base leading-relaxed rounded-lg"
              style={{ lineHeight: '1.75' }}
            >
              {isLoadingEntry ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading today&apos;s entry...</span>
                </div>
              ) : transcript || interimTranscript ? (
                renderHighlightedText()
              ) : (
                <p className="text-muted-foreground italic">
                  {isRecording 
                    ? "Listening... Start speaking"
                    : entryId 
                      ? "Continue today's entry - tap mic to add more"
                      : "Tap the microphone button to start recording your thoughts"
                  }
                </p>
              )}
            </div>
          </div>

          {/* Word count footer */}
          {transcript && (
            <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
              <span>{transcript.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
              <span>{transcript.length} characters</span>
            </div>
          )}

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
      </TooltipProvider>
  );
}
