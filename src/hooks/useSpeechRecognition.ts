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

function normalizeSpeechError(err: any): string {
  const name = String(err?.name || '');
  const message = String(err?.message || err || '');

  // Map browser getUserMedia denials + native plugin denials into our common code
  if (name === 'NotAllowedError') return 'not-allowed';
  if (/not-allowed/i.test(message)) return 'not-allowed';

  return message || 'Speech recognition error';
}

function debugErrorObject(err: any) {
  // Avoid circular structure crashes
  try {
    return {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
      raw: typeof err === 'string' ? err : undefined,
    };
  } catch {
    return { raw: String(err) };
  }
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { onResult, onError, onEnd, lang = 'en-US' } = options;
  
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isNative, setIsNative] = useState(false);
  const [permissionState, setPermissionState] = useState<NativePermissionState>('unknown');
  
  const webRecognitionRef = useRef<any>(null);
  const webStreamRef = useRef<MediaStream | null>(null);
  const isNativeRef = useRef(false);
  const isStartingRef = useRef(false); // Guard against double-start
  const isStoppingRef = useRef(false); // Guard against double-stop/cleanup race
  const lastNativePartialRef = useRef<string>(''); // Track last native partial for finalization
  
  // Check platform and initialize
  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    console.debug('[Speech] Platform init:', { isNativePlatform, platform: Capacitor.getPlatform() });
    setIsNative(isNativePlatform);
    isNativeRef.current = isNativePlatform;
    
    if (isNativePlatform) {
      // Check native speech recognition availability
      SpeechRecognition.available()
        .then(({ available }) => {
          console.debug('[Speech] available() =', available);
          setIsSupported(available);
        })
        .catch((e) => {
          console.error('[Speech] available() failed:', debugErrorObject(e));
          setIsSupported(false);
        });

      // Capture current native permission state for diagnostics
      SpeechRecognition.checkPermissions()
        .then((status) => {
          console.debug('[Speech] checkPermissions() =', status);
          setPermissionState((status?.speechRecognition as NativePermissionState) ?? 'unknown');
        })
        .catch((e) => {
          console.error('[Speech] checkPermissions() failed:', debugErrorObject(e));
          setPermissionState('unknown');
        });
    } else {
      // Check Web Speech API support
      const hasWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      console.debug('[Speech] Web Speech API support:', hasWebSpeech);
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
      // Cleanup - ensure both web and native are stopped
      if (webRecognitionRef.current) {
        try {
          webRecognitionRef.current.stop();
        } catch {}
      }
      // Native cleanup on unmount
      if (isNativeRef.current) {
        SpeechRecognition.stop().catch(() => {});
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
    if (!isNativeRef.current) {
      console.debug('[Speech] Skipping native listener setup (not native platform)');
      return;
    }
    
    console.debug('[Speech] Setting up native event listeners...');
    let listenerHandle: any = null;
    let listeningHandle: any = null;
    let errorHandle: any = null;
    
    const setupListener = async () => {
      try {
        console.debug('[Speech] Registering partialResults listener...');
        listenerHandle = await SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
          console.debug('[Speech] partialResults:', data.matches?.[0]?.slice(0, 50));
          if (data.matches && data.matches.length > 0) {
            // Native plugin gives us the full transcript so far
            lastNativePartialRef.current = data.matches[0];
            onResult?.(data.matches[0], false);
          }
        });
        console.debug('[Speech] partialResults listener registered');

        console.debug('[Speech] Registering listeningState listener...');
        listeningHandle = await SpeechRecognition.addListener('listeningState', (data: { status: 'started' | 'stopped' }) => {
          console.debug('[Speech] listeningState:', data.status);
          setIsRecording(data.status === 'started');
          if (data.status === 'stopped') {
            isStartingRef.current = false;
            isStoppingRef.current = false;
            // Note: onEnd is called from stopRecording, not here, to avoid double-calls
          }
        });
        console.debug('[Speech] listeningState listener registered');

        // Listen for errors from native plugin (if supported)
        try {
          console.debug('[Speech] Registering error listener...');
          errorHandle = await (SpeechRecognition as any).addListener('error', (data: { message: string }) => {
            console.error('[Speech] native error event:', data.message);
            onError?.(data.message || 'recognition-error');
          });
          console.debug('[Speech] error listener registered');
        } catch (e) {
          // Error listener may not be available in all plugin versions
          console.debug('[Speech] error listener not available:', e);
        }
        
        console.debug('[Speech] All native listeners registered successfully');
      } catch (error) {
        console.error('[Speech] Failed to setup native listener:', debugErrorObject(error));
      }
    };
    
    setupListener();
    
    return () => {
      listenerHandle?.remove();
      listeningHandle?.remove();
      errorHandle?.remove();
    };
  }, [onResult, onError, onEnd]);
  
  const startRecording = useCallback(async () => {
    // Guard against double-start (critical for iOS)
    if (isRecording || isStartingRef.current) {
      console.debug('[Speech] startRecording() blocked - already recording or starting');
      return;
    }
    isStartingRef.current = true;
    
    try {
      console.debug('[Speech] startRecording()', {
        isNative: isNativeRef.current,
        lang,
        isSecureContext: window.isSecureContext,
        protocol: location.protocol,
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      });

      // Secure context check (mic requires HTTPS on real device)
      if (!window.isSecureContext) {
        console.error('[Speech] Not a secure context - mic will fail');
        onError?.('not-secure');
        isStartingRef.current = false;
        return;
      }

      if (isNativeRef.current) {
        // Native: check + request permission (iOS uses a single alias for speech+mic)
        const before = await SpeechRecognition.checkPermissions().catch((e) => {
          console.warn('[Speech] checkPermissions() failed', debugErrorObject(e));
          return { speechRecognition: 'unknown' } as any;
        });
        setPermissionState((before?.speechRecognition as NativePermissionState) ?? 'unknown');

        console.debug('[Speech] permissions(before):', before);

        const requested = await SpeechRecognition.requestPermissions().catch((e) => {
          console.error('[Speech] requestPermissions() failed', debugErrorObject(e));
          throw e;
        });
        setPermissionState((requested?.speechRecognition as NativePermissionState) ?? 'unknown');

        console.debug('[Speech] permissions(after):', requested);

        if (requested?.speechRecognition !== 'granted') {
          console.warn('[Speech] permission not granted -> not-allowed', {
            speechRecognition: requested?.speechRecognition,
          });
          onError?.('not-allowed');
          return;
        }
        
        // Ensure any previous session is fully stopped before starting new one
        try {
          await SpeechRecognition.stop();
          // Small delay to let iOS audio session fully release
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch {
          // Ignore - might not have been running
        }
        
        try {
          // iOS-specific options to prevent audio session conflicts (plugin v7.2+)
          // Use on-device recognition when available (doesn't require internet)
          const startOptions: Record<string, unknown> = {
            language: lang,
            partialResults: true,
            popup: false,
            audioSessionCategory: 'playAndRecord',
            deactivateAudioSessionOnStop: true,
            // Try on-device recognition first (iOS 13+, more reliable)
            requiresOnDeviceRecognition: false,
            // Increase silence threshold to prevent premature abort
            silenceThreshold: 5000,
          };
          console.debug('[Speech] calling native start() with options:', startOptions);
          lastNativePartialRef.current = '';
          await SpeechRecognition.start(startOptions as any);
          console.debug('[Speech] native start() succeeded');
          setIsRecording(true);
        } catch (e: any) {
          // If recognition failed, log detailed error for debugging
          console.error('[Speech] native start() failed', debugErrorObject(e));
          console.error('[Speech] error code:', e?.code, 'message:', e?.message);
          onError?.(normalizeSpeechError(e));
          isStartingRef.current = false;
          return;
        }
      } else {
        // Web: Request microphone permission explicitly for iOS Safari
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            // Use simple constraints that work best on iOS
            console.debug('[Speech] calling getUserMedia()');
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
              },
            });
            // Store stream ref so we can properly clean up tracks
            webStreamRef.current = stream;
            console.debug('[Speech] getUserMedia() succeeded, tracks:', stream.getTracks().length);
          } catch (e) {
            console.error('[Speech] getUserMedia() failed', debugErrorObject(e));
            onError?.(normalizeSpeechError(e));
            isStartingRef.current = false;
            return;
          }
        }
        
        try {
          webRecognitionRef.current?.start();
        } catch (e) {
          console.error('[Speech] web recognition start() failed', debugErrorObject(e));
          onError?.(normalizeSpeechError(e));
          isStartingRef.current = false;
          return;
        }
      }
      isStartingRef.current = false;
    } catch (error: any) {
      console.error('[Speech] Start recording error (outer):', debugErrorObject(error));
      onError?.(normalizeSpeechError(error));
      isStartingRef.current = false;
    }
  }, [isRecording, lang, onError]);
  
  const stopRecording = useCallback(async () => {
    if ((!isRecording && !isStartingRef.current) || isStoppingRef.current) return;
    isStoppingRef.current = true;
    
    try {
      if (isNativeRef.current) {
        console.debug('[Speech] stopping native recognition');
        await SpeechRecognition.stop();
        // Finalize the last partial result as final transcript
        if (lastNativePartialRef.current) {
          onResult?.(lastNativePartialRef.current, true);
          lastNativePartialRef.current = '';
        }
        // Small delay to let iOS audio session fully release before calling onEnd
        await new Promise((resolve) => setTimeout(resolve, 50));
        setIsRecording(false);
        onEnd?.();
      } else {
        console.debug('[Speech] stopping web recognition');
        webRecognitionRef.current?.stop();
        
        // Clean up audio tracks to prevent "Invalidating grant" issues
        if (webStreamRef.current) {
          webStreamRef.current.getTracks().forEach((track) => {
            console.debug('[Speech] stopping track:', track.kind, track.label);
            track.stop();
          });
          webStreamRef.current = null;
        }
      }
    } catch (error) {
      console.error('[Speech] Stop recording error:', debugErrorObject(error));
      setIsRecording(false);
    }
    isStartingRef.current = false;
    isStoppingRef.current = false;
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
