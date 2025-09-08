import { createWorker } from 'tesseract.js';

let worker: Tesseract.Worker | null = null;

export async function initializeOCR(): Promise<Tesseract.Worker> {
  if (worker) return worker;
  
  worker = await createWorker('eng');
  return worker;
}

export async function processImage(imageBlob: Blob): Promise<string> {
  try {
    const ocrWorker = await initializeOCR();
    
    const { data: { text } } = await ocrWorker.recognize(imageBlob);
    
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