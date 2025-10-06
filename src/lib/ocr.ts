import { createWorker } from 'tesseract.js';

let worker: Tesseract.Worker | null = null;

async function preprocessForOCR(imageBlob: Blob): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(imageBlob);
      img.onload = () => {
        try {
          const scale = 2; // Upscale for better OCR accuracy
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');

          // Draw and upscale
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Grayscale + threshold to remove page lines and enhance strokes
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Simple adaptive threshold
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) {
            const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            sum += v;
          }
          const avg = sum / (data.length / 4);
          const threshold = Math.min(230, Math.max(140, avg + 10));

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const val = lum > threshold ? 255 : 0;
            // Make foreground solid black, background solid white
            data[i] = data[i + 1] = data[i + 2] = val;
            data[i + 3] = 255;
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
    user_defined_dpi: '300',
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:'\"()-–—[]{} ",
    tessedit_pageseg_mode: '6', // Assume a uniform block of text
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
