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

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { onResult, onError, onEnd, lang = 'en-US' } = options;
  
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isNative, setIsNative] = useState(false);
  
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
    
    const setupListener = async () => {
      try {
        listenerHandle = await SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
          if (data.matches && data.matches.length > 0) {
            // Native plugin gives us the full transcript so far
            onResult?.(data.matches[0], false);
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
    };
  }, [onResult]);
  
  const startRecording = useCallback(async () => {
    if (isRecording) return;
    
    try {
      if (isNativeRef.current) {
        // Native: Request permission first
        const { speechRecognition } = await SpeechRecognition.requestPermissions();
        
        if (speechRecognition !== 'granted') {
          onError?.('Microphone permission denied');
          return;
        }
        
        await SpeechRecognition.start({
          language: lang,
          partialResults: true,
          popup: false,
        });
        
        setIsRecording(true);
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
    startRecording,
    stopRecording,
  };
}
