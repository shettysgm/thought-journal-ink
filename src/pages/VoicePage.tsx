import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Square, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntries } from '@/store/useEntries';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { detectWithAI } from '@/lib/aiClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define global interface for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type Detection = {
  span: string;
  type: string;
  reframe: string;
};

export default function VoicePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const { createEntry, updateEntry } = useEntries();
  const { toast } = useToast();
  
  const [entryId, setEntryId] = useState<string | null>(null);
  const [lastSavedText, setLastSavedText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // Real-time detection state
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsRecording(true);
    };

    recognitionInstance.onend = () => {
      setIsRecording(false);
    };

    recognitionInstance.onresult = (event: any) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
      setInterimTranscript(interimText);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [toast]);

  // Auto-save effect - triggers as user speaks
  useEffect(() => {
    if (!transcript.trim() || transcript === lastSavedText) return;

    setSaveStatus('unsaved');
    const saveTimeout = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        if (!entryId) {
          // Create new entry
          const newId = await createEntry({
            text: transcript.trim(),
            tags: ['voice'],
            hasAudio: true,
            hasDrawing: false
          });
          setEntryId(newId);
          console.log('Created new voice entry:', newId);
        } else {
          // Update existing entry
          await updateEntry(entryId, { text: transcript.trim() });
          console.log('Updated voice entry:', entryId);
        }
        setLastSavedText(transcript);
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
    }, 1500); // Auto-save after 1.5 seconds of no new speech

    return () => clearTimeout(saveTimeout);
  }, [transcript, entryId, lastSavedText, createEntry, updateEntry, toast]);

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
          const detectionsList: Detection[] = response.reframes.map(r => ({
            span: r.span,
            type: "Mind Reading",
            reframe: r.suggestion
          }));
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

  const startRecording = () => {
    if (recognition && !isRecording) {
      recognition.start();
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
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
          <TooltipProvider delayDuration={100} key={`highlight-${i}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline">
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
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between px-6 py-3">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
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
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
              {saveStatus === 'saved' && transcript.trim() && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Recording controls - floating button */}
        <div className="fixed bottom-8 right-8 z-30">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              size="lg"
              className="w-16 h-16 rounded-full shadow-lg bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Mic className="w-6 h-6" />
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              size="lg"
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
              {transcript || interimTranscript ? (
                renderHighlightedText()
              ) : (
                <p className="text-muted-foreground italic">
                  {isRecording 
                    ? "Listening... Start speaking"
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
  );
}
