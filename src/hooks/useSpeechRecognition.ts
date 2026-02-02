import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

// Web Speech API types
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  lang?: string;
}

type NativePermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' | 'unknown';

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { onResult, onError, onEnd, lang = 'en-US' } = options;
  
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isNative, setIsNative] = useState(false);
  const [permissionState, setPermissionState] = useState<NativePermissionState>('unknown');
  
  const webRecognitionRef = useRef<any>(null);
  const isNativeRef = useRef(false);
  
  // Check platform and initialize
  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    setIsNative(isNativePlatform);
    isNativeRef.current = isNativePlatform;
    
    if (isNativePlatform) {
      // Check native speech recognition availability
      SpeechRecognition.available().then(({ available }) => {
        setIsSupported(available);
      }).catch(() => {
        setIsSupported(false);
      });

      // Capture current native permission state for diagnostics
      SpeechRecognition.checkPermissions()
        .then((status) => {
          setPermissionState((status?.speechRecognition as NativePermissionState) ?? 'unknown');
        })
        .catch(() => {
          setPermissionState('unknown');
        });
    } else {
      // Check Web Speech API support
      const hasWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsSupported(hasWebSpeech);
      
      if (hasWebSpeech) {
        const SpeechRecognitionClass = window.webkitSpeechRecognition || window.SpeechRecognition;
        webRecognitionRef.current = new SpeechRecognitionClass();
        webRecognitionRef.current.continuous = true;
        webRecognitionRef.current.interimResults = true;
        webRecognitionRef.current.lang = lang;
      }
    }
    
    return () => {
      // Cleanup
      if (webRecognitionRef.current) {
        try {
          webRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, [lang]);
  
  // Setup web speech recognition handlers
  useEffect(() => {
    if (isNativeRef.current || !webRecognitionRef.current) return;
    
    const recognition = webRecognitionRef.current;
    
    recognition.onstart = () => {
      setIsRecording(true);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
      onEnd?.();
    };
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      if (finalTranscript) {
        onResult?.(finalTranscript, true);
      }
      if (interimTranscript) {
        onResult?.(interimTranscript, false);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Web Speech Recognition error:', event.error);
      setIsRecording(false);
      onError?.(event.error || 'Speech recognition error');
    };
  }, [onResult, onError, onEnd]);
  
  // Setup native speech recognition listener
  useEffect(() => {
    if (!isNativeRef.current) return;
    
    let listenerHandle: any = null;
    let listeningHandle: any = null;
    
    const setupListener = async () => {
      try {
        listenerHandle = await SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
          if (data.matches && data.matches.length > 0) {
            // Native plugin gives us the full transcript so far
            onResult?.(data.matches[0], false);
          }
        });

        listeningHandle = await SpeechRecognition.addListener('listeningState', (data: { status: 'started' | 'stopped' }) => {
          setIsRecording(data.status === 'started');
          if (data.status === 'stopped') {
            onEnd?.();
          }
        });
      } catch (error) {
        console.error('Failed to setup native listener:', error);
      }
    };
    
    setupListener();
    
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
      if (listeningHandle) {
        listeningHandle.remove();
      }
    };
  }, [onResult]);
  
  const startRecording = useCallback(async () => {
    if (isRecording) return;
    
    try {
      if (isNativeRef.current) {
        // Native: check + request permission (iOS uses a single alias for speech+mic)
        const before = await SpeechRecognition.checkPermissions().catch(() => ({ speechRecognition: 'unknown' } as any));
        setPermissionState((before?.speechRecognition as NativePermissionState) ?? 'unknown');

        const requested = await SpeechRecognition.requestPermissions();
        setPermissionState((requested?.speechRecognition as NativePermissionState) ?? 'unknown');

        if (requested?.speechRecognition !== 'granted') {
          onError?.('not-allowed');
          return;
        }
        
        await SpeechRecognition.start({
          language: lang,
          partialResults: true,
          popup: false,
        });
      } else {
        // Web: Request microphone permission explicitly for iOS Safari
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        webRecognitionRef.current?.start();
      }
    } catch (error: any) {
      console.error('Start recording error:', error);
      onError?.(error.message || 'Could not start recording');
    }
  }, [isRecording, lang, onError]);
  
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;
    
    try {
      if (isNativeRef.current) {
        await SpeechRecognition.stop();
        setIsRecording(false);
        onEnd?.();
      } else {
        webRecognitionRef.current?.stop();
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      setIsRecording(false);
    }
  }, [isRecording, onEnd]);
  
  return {
    isRecording,
    isSupported,
    isNative,
    permissionState,
    startRecording,
    stopRecording,
  };
}
