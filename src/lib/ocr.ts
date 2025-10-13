import { getOcrUrl } from '@/config/api';

// Convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix if present
      const base64Data = base64.split(',')[1] || base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function processImage(imageBlob: Blob): Promise<string> {
  try {
    console.log('Starting Gemini Vision OCR...');
    const base64Image = await blobToBase64(imageBlob);
    
    const response = await fetch(getOcrUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `OCR API failed: ${response.status}`);
    }

    const { text } = await response.json();
    console.log('Gemini Vision OCR result:', text);
    return text || '';
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('Failed to process handwriting. Please try again.');
  }
}

// No longer needed with Gemini Vision
export async function terminateOCR() {
  // No-op: Gemini Vision doesn't need cleanup
}
