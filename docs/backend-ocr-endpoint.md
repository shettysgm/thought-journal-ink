# Backend OCR Endpoint

Add this endpoint to your Google Cloud Run backend (`vertexthought`) to enable handwriting recognition.

## Endpoint: POST /api/ocr

### Request Body
```json
{
  "image": "<base64-encoded-image>",
  "mimeType": "image/png"
}
```

### Response
```json
{
  "text": "extracted handwritten text",
  "confidence": 0.95,
  "success": true
}
```

## Implementation (Node.js/Express)

```javascript
const vision = require('@google-cloud/vision');

// Initialize Vision client (uses Application Default Credentials)
const visionClient = new vision.ImageAnnotatorClient();

app.post('/api/ocr', async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image provided' 
      });
    }

    // Call Google Cloud Vision API for document text detection
    // DOCUMENT_TEXT_DETECTION is optimized for handwriting
    const [result] = await visionClient.documentTextDetection({
      image: {
        content: image, // base64 string
      },
    });

    const fullTextAnnotation = result.fullTextAnnotation;
    
    if (!fullTextAnnotation) {
      return res.json({
        text: '',
        confidence: 0,
        success: true,
        message: 'No text detected in image'
      });
    }

    // Calculate average confidence from detected blocks
    let totalConfidence = 0;
    let blockCount = 0;
    
    if (fullTextAnnotation.pages) {
      for (const page of fullTextAnnotation.pages) {
        for (const block of page.blocks || []) {
          if (block.confidence) {
            totalConfidence += block.confidence;
            blockCount++;
          }
        }
      }
    }

    const avgConfidence = blockCount > 0 ? totalConfidence / blockCount : 0;

    res.json({
      text: fullTextAnnotation.text || '',
      confidence: avgConfidence,
      success: true
    });

  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'OCR processing failed'
    });
  }
});
```

## Required Setup

1. **Enable Cloud Vision API** in your GCP project:
   ```bash
   gcloud services enable vision.googleapis.com
   ```

2. **Install the Vision client**:
   ```bash
   npm install @google-cloud/vision
   ```

3. **Authentication**: Your Cloud Run service should already have default credentials via the service account.

## CORS Configuration

Add CORS headers for iOS WebView support:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
```
