import { createWorker } from 'tesseract.js';

let worker: Tesseract.Worker | null = null;

async function preprocessForOCR(imageBlob: Blob): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(imageBlob);
      img.onload = () => {
        try {
          const scale = 3; // Upscale for better OCR accuracy
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');

          // Draw and upscale
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Grayscale + adaptive threshold, then strengthen strokes and remove guide lines
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const { data, width, height } = imageData;

          // 1) Adaptive threshold to B/W
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) {
            const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            sum += v;
          }
          const avg = sum / (data.length / 4);
          const threshold = Math.min(235, Math.max(135, avg + 15));

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const val = lum > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
            data[i + 3] = 255;
          }

          // 2) Light dilation to connect broken handwriting strokes
          const dilated = new Uint8ClampedArray(data.length);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              let blackNeighbor = false;
              for (let dy = -1; dy <= 1 && !blackNeighbor; dy++) {
                const ny = y + dy;
                if (ny < 0 || ny >= height) continue;
                for (let dx = -1; dx <= 1; dx++) {
                  const nx = x + dx;
                  if (nx < 0 || nx >= width) continue;
                  const idx = (ny * width + nx) * 4;
                  if (data[idx] === 0) { blackNeighbor = true; break; }
                }
              }
              const i = (y * width + x) * 4;
              const v = blackNeighbor ? 0 : 255;
              dilated[i] = dilated[i + 1] = dilated[i + 2] = v;
              dilated[i + 3] = 255;
            }
          }
          // copy back
          for (let i = 0; i < data.length; i++) {
            data[i] = dilated[i];
          }

          // 3) Remove horizontal guide lines (rows with very high black coverage)
          const rowBlackCounts = new Uint32Array(height);
          for (let y = 0; y < height; y++) {
            let count = 0;
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              if (data[idx] === 0) count++;
            }
            rowBlackCounts[y] = count;
          }
          for (let y = 0; y < height; y++) {
            const ratio = rowBlackCounts[y] / width;
            if (ratio > 0.6) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                data[idx] = data[idx + 1] = data[idx + 2] = 255;
                data[idx + 3] = 255;
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (blob) resolve(blob);
            else reject(new Error('Failed to create preprocessed blob'));
          }, 'image/png');
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for OCR'));
      };
      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}

export async function initializeOCR(): Promise<Tesseract.Worker> {
  if (worker) return worker;
  worker = await createWorker('eng');
  // Improve spacing and DPI for handwriting
  await worker.setParameters({
    preserve_interword_spaces: '1',
    user_defined_dpi: '400',
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:'\"()-–—[]{} ",
    tessedit_pageseg_mode: '4', // Single column of text, variable sizes
  } as any);
  return worker;
}

export async function processImage(imageBlob: Blob): Promise<string> {
  try {
    const ocrWorker = await initializeOCR();
    const preprocessed = await preprocessForOCR(imageBlob);
    const { data: { text } } = await ocrWorker.recognize(preprocessed);
    return text.trim();
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('Failed to process image. Please try again.');
  }
}

export async function terminateOCR() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
