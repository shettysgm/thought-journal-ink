import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEntries } from '@/store/useEntries';
import { useToast } from '@/hooks/use-toast';

// Define global interface for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoicePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);
  const { createEntry } = useEntries();
  const { toast } = useToast();

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

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  const saveEntry = async () => {
    if (!transcript.trim()) {
      toast({
        title: "Nothing to Save",
        description: "Please record some speech before saving.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createEntry({
        text: transcript.trim(),
        hasAudio: true,
        tags: ['voice']
      });

      toast({
        title: "Saved Successfully",
        description: "Your voice entry has been saved and analyzed.",
      });

      clearTranscript();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save your entry. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-therapeutic p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Voice Journal</h1>
              <p className="text-muted-foreground">Speak your thoughts aloud</p>
            </div>
          </header>

          <Card className="shadow-medium">
            <CardContent className="p-8 text-center">
              <MicOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Voice Recording Not Supported</h3>
              <p className="text-muted-foreground">
                Voice dictation is not supported in this browser. Please try using a modern browser like Safari, Chrome, or Edge.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-therapeutic p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Voice Journal</h1>
            <p className="text-muted-foreground">Speak your thoughts aloud</p>
          </div>
        </header>

        {/* Recording Controls */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-center">
              {isRecording ? 'Recording...' : 'Ready to Record'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            
            {/* Recording Button */}
            <div className="flex justify-center">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="w-20 h-20 rounded-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  <Mic className="w-8 h-8" />
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="w-20 h-20 rounded-full"
                >
                  <Square className="w-8 h-8" />
                </Button>
              )}
            </div>

            {/* Status */}
            <p className="text-muted-foreground">
              {isRecording 
                ? 'Listening... Tap the square to stop'
                : 'Tap the microphone to start recording'
              }
            </p>

            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-500 font-medium">Recording</span>
              </div>
            )}
            
          </CardContent>
        </Card>

        {/* Transcript */}
        {(transcript || interimTranscript) && (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 min-h-[200px]">
                <p className="text-foreground">
                  {transcript}
                  <span className="text-muted-foreground italic">
                    {interimTranscript}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {transcript && (
          <div className="flex gap-4">
            <Button
              onClick={clearTranscript}
              variant="outline"
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              onClick={saveEntry}
              className="flex-1"
            >
              Save & Analyze
            </Button>
          </div>
        )}
        
      </div>
    </div>
  );
}