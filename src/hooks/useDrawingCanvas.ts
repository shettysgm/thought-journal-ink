import { useRef, useCallback } from 'react';

export interface UseDrawingCanvasReturn {
  exportToBlob: () => Promise<Blob | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function useDrawingCanvas(): UseDrawingCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const exportToBlob = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }, []);

  return {
    exportToBlob,
    canvasRef,
  };
}
