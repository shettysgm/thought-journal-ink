import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnifiedSpeechDictation } from '@/hooks/useUnifiedSpeechDictation';

// Mock useSpeechRecognition
const mockStartRecording = vi.fn();
const mockStopRecording = vi.fn();
let mockOnResult: ((text: string, isFinal: boolean) => void) | undefined;
let mockOnEnd: (() => void) | undefined;

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: (opts: any) => {
    mockOnResult = opts.onResult;
    mockOnEnd = opts.onEnd;
    return {
      isRecording: false,
      isSupported: true,
      isNative: false,
      permissionState: 'unknown',
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
    };
  },
}));

describe('useUnifiedSpeechDictation', () => {
  let onFinalTranscript: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onFinalTranscript = vi.fn();
    onError = vi.fn();
  });

  it('exposes start and stop functions', () => {
    const { result } = renderHook(() =>
      useUnifiedSpeechDictation({ onFinalTranscript, onError })
    );
    expect(result.current.start).toBe(mockStartRecording);
    expect(result.current.stop).toBe(mockStopRecording);
  });

  it('calls onFinalTranscript when isFinal=true', () => {
    renderHook(() =>
      useUnifiedSpeechDictation({ onFinalTranscript, onError })
    );
    act(() => {
      mockOnResult?.('Hello world', true);
    });
    expect(onFinalTranscript).toHaveBeenCalledWith('Hello world');
  });

  it('sets interimTranscript for non-final results', () => {
    const { result } = renderHook(() =>
      useUnifiedSpeechDictation({ onFinalTranscript, onError })
    );
    act(() => {
      mockOnResult?.('Hel', false);
    });
    expect(result.current.interimTranscript).toBe('Hel');
    expect(onFinalTranscript).not.toHaveBeenCalled();
  });

  it('clears interimTranscript on final result', () => {
    const { result } = renderHook(() =>
      useUnifiedSpeechDictation({ onFinalTranscript, onError })
    );
    act(() => {
      mockOnResult?.('Hel', false);
    });
    expect(result.current.interimTranscript).toBe('Hel');
    act(() => {
      mockOnResult?.('Hello', true);
    });
    expect(result.current.interimTranscript).toBe('');
  });

  it('clears interimTranscript on end', () => {
    const { result } = renderHook(() =>
      useUnifiedSpeechDictation({ onFinalTranscript, onError })
    );
    act(() => {
      mockOnResult?.('partial text', false);
    });
    expect(result.current.interimTranscript).toBe('partial text');
    act(() => {
      mockOnEnd?.();
    });
    expect(result.current.interimTranscript).toBe('');
  });

  it('exposes isSupported and isNative', () => {
    const { result } = renderHook(() =>
      useUnifiedSpeechDictation({ onFinalTranscript, onError })
    );
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isNative).toBe(false);
  });
});
