/**
 * OCR Client for Google Cloud Vision API
 * Sends drawing blobs to the backend for text extraction
 */

import { API_CONFIG } from '@/config/api';

interface OCRResult {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}

/**
 * Convert a Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Send drawing image to backend for OCR processing
 */
export async function extractTextFromDrawing(drawingBlob: Blob): Promise<OCRResult> {
  try {
    const base64Image = await blobToBase64(drawingBlob);
    
    const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        mimeType: drawingBlob.type || 'image/png',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OCR API error:', response.status, errorText);
      return {
        text: '',
        confidence: 0,
        success: false,
        error: `OCR failed: ${response.status}`,
      };
    }

    const data = await response.json();
    
    return {
      text: data.text || '',
      confidence: data.confidence || 0,
      success: true,
    };
  } catch (error) {
    console.error('OCR request failed:', error);
    return {
      text: '',
      confidence: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
