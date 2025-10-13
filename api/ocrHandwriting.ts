import type { VercelRequest, VercelResponse } from '@vercel/node';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64' });
    }

    // Call Gemini Vision API for OCR
    const geminiResponse = await fetch(
      `https://vertex-gemini-content-creator-755984933994.us-central1.run.app/api/ocr`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          prompt: `Extract all handwritten text from this image. Return ONLY the text you see, preserving line breaks and spacing. If you cannot read any text, return an empty string. Do not include any explanations or descriptions.`,
          gcpProject: 'apt-gear-425423-i9',
          region: 'us-central1',
          model: 'gemini-2.0-flash'
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text().catch(() => '');
      throw new Error(`Gemini API failed: ${geminiResponse.status} - ${errorText}`);
    }

    const data = await geminiResponse.json();
    
    // Extract text from response
    let extractedText = '';
    if (data?.data?.result) {
      extractedText = String(data.data.result).trim();
    } else if (data?.result) {
      extractedText = String(data.result).trim();
    } else if (typeof data === 'string') {
      extractedText = data.trim();
    }

    return res.status(200).json({ text: extractedText });
  } catch (error) {
    console.error('OCR error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'OCR failed' 
    });
  }
}
