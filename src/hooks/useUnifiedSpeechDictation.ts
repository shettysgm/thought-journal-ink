import { useCallback, useState } from 'react';

import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

type UseUnifiedSpeechDictationOptions = {
  lang?: string;
  onFinalTranscript: (text: string) => void;
  onError?: (error: string) => void;
};

/**
 * Small adapter hook for UnifiedJournalPage:
 * - Uses the shared native-capable useSpeechRecognition
 * - Exposes `interimTranscript` state for inline composition
 */
export function useUnifiedSpeechDictation(options: UseUnifiedSpeechDictationOptions) {
  const { lang = 'en-US', onFinalTranscript, onError } = options;
  const [interimTranscript, setInterimTranscript] = useState('');

  const handleResult = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        setInterimTranscript('');
        onFinalTranscript(text);
        return;
      }
      setInterimTranscript(text);
    },
    [onFinalTranscript]
  );

  const handleEnd = useCallback(() => {
    setInterimTranscript('');
  }, []);

  const sr = useSpeechRecognition({
    lang,
    onResult: handleResult,
    onError,
    onEnd: handleEnd,
  });

  return {
    ...sr,
    interimTranscript,
    start: sr.startRecording,
    stop: sr.stopRecording,
  };
}
