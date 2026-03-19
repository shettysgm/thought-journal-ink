/**
 * Compress an image Blob by resizing and converting to JPEG.
 * - Max dimension: 1200px (preserves aspect ratio)
 * - Quality: 0.8 (80% JPEG)
 * - Typical reduction: 3-8MB → 100-300KB
 */
export async function compressImage(
  blob: Blob,
  maxDimension = 1200,
  quality = 0.8,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if exceeds max dimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (result) => {
          if (result) {
            console.log(
              `[compressImage] ${(blob.size / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB (${width}×${height})`,
            );
            resolve(result);
          } else {
            // Fallback: return original if compression fails
            resolve(blob);
          }
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Return original on decode failure (e.g. SVG, corrupt file)
      resolve(blob);
    };

    img.src = url;
  });
}

/**
 * Compress multiple image blobs in parallel.
 */
export async function compressImages(
  blobs: Blob[],
  maxDimension = 1200,
  quality = 0.8,
): Promise<Blob[]> {
  return Promise.all(blobs.map((b) => compressImage(b, maxDimension, quality)));
}
