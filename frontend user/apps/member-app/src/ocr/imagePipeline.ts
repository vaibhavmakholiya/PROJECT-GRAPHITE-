/**
 * Image preprocessing and memory hygiene pipeline for on-device Aadhaar OCR.
 *
 * Strict Privacy Rules Enforced:
 * 1. Image is redrawn onto canvas immediately, stripping all EXIF and location metadata.
 * 2. Revokes object URLs and clears canvas buffers immediately on disposal.
 * 3. Never writes to disk, localStorage, or remote endpoints.
 */

export interface PreprocessOptions {
  targetWidth?: number;
  contrast?: number;       // e.g. 1.2
  brightness?: number;     // e.g. 5
  grayscale?: boolean;
}

export interface ImageQualityCheck {
  isAcceptable: boolean;
  meanBrightness: number; // 0 - 255
  contrastRange: number;  // 0 - 255
  warning?: string;
}

/**
 * Loads an image File or Blob safely into an HTMLImageElement
 */
export function loadImageSafely(blob: Blob): Promise<{ img: HTMLImageElement; blobUrl: string }> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(blob);
    const img = new Image();
    // Note: Do not set crossOrigin on local blob URLs to avoid CORS taint in Chromium/WebKit

    img.onload = () => {
      resolve({ img, blobUrl });
    };

    img.onerror = (err) => {
      safeRevokeUrl(blobUrl);
      reject(new Error(`Failed to load image: ${err}`));
    };

    img.src = blobUrl;
  });
}

/**
 * Strips EXIF metadata and normalizes image onto an offscreen canvas
 */
export function stripExifAndNormalize(
  img: HTMLImageElement,
  options: PreprocessOptions = {}
): HTMLCanvasElement {
  const targetWidth = options.targetWidth || 1600;
  let width = img.naturalWidth || img.width || 1200;
  let height = img.naturalHeight || img.height || 800;

  if (width <= 0) width = 1200;
  if (height <= 0) height = 800;

  if (width > targetWidth) {
    const scale = targetWidth / width;
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not obtain 2D rendering context');
  }

  // Drawing onto canvas strips all EXIF/GPS metadata
  ctx.drawImage(img, 0, 0, width, height);

  // Apply Grayscale and Contrast Enhancement if requested
  if (options.grayscale !== false) {
    applyGrayscaleAndContrast(ctx, width, height, options.contrast ?? 1.25, options.brightness ?? 5);
  }

  return canvas;
}

/**
 * Applies luminance grayscale conversion and contrast stretching
 */
export function applyGrayscaleAndContrast(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  contrast: number = 1.2,
  brightness: number = 0
): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // contrast factor
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < data.length; i += 4) {
    // Standard perceptual luminance weights
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Contrast adjustment
    let adjusted = factor * (gray - 128) + 128 + brightness;
    if (adjusted < 0) adjusted = 0;
    if (adjusted > 255) adjusted = 255;

    data[i] = adjusted;
    data[i + 1] = adjusted;
    data[i + 2] = adjusted;
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Checks image quality (brightness and contrast) to catch blurry or dark captures early
 */
export function assessImageQuality(canvas: HTMLCanvasElement): ImageQualityCheck {
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width <= 0 || canvas.height <= 0) {
    return { isAcceptable: true, meanBrightness: 128, contrastRange: 100 };
  }

  // Sample a central 200x200 patch
  const sampleW = Math.min(200, canvas.width);
  const sampleH = Math.min(200, canvas.height);
  const startX = Math.floor((canvas.width - sampleW) / 2);
  const startY = Math.floor((canvas.height - sampleH) / 2);

  const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
  const data = imgData.data;

  let totalLuma = 0;
  let minLuma = 255;
  let maxLuma = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const luma = data[i]; // Already grayscale
    totalLuma += luma;
    if (luma < minLuma) minLuma = luma;
    if (luma > maxLuma) maxLuma = luma;
  }

  const meanBrightness = totalLuma / pixelCount;
  const contrastRange = maxLuma - minLuma;

  let warning: string | undefined;
  let isAcceptable = true;

  if (meanBrightness < 45) {
    isAcceptable = false;
    warning = 'Photo is too dark. Please take it in better lighting.';
  } else if (contrastRange < 50) {
    isAcceptable = false;
    warning = 'Photo lacks contrast or text is washed out.';
  }

  return { isAcceptable, meanBrightness, contrastRange, warning };
}

/**
 * Rotates a canvas by given degrees (90, 180, 270)
 */
export function rotateCanvas(canvas: HTMLCanvasElement, degrees: 90 | 180 | 270): HTMLCanvasElement {
  const rotated = document.createElement('canvas');
  const rad = (degrees * Math.PI) / 180;

  if (degrees === 90 || degrees === 270) {
    rotated.width = canvas.height;
    rotated.height = canvas.width;
  } else {
    rotated.width = canvas.width;
    rotated.height = canvas.height;
  }

  const ctx = rotated.getContext('2d');
  if (!ctx) throw new Error('Could not create rotated canvas context');

  ctx.translate(rotated.width / 2, rotated.height / 2);
  ctx.rotate(rad);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  // Free original canvas
  wipeCanvas(canvas);

  return rotated;
}

/**
 * Crops a specific region from a canvas
 */
export function cropCanvas(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): HTMLCanvasElement {
  const cropped = document.createElement('canvas');
  cropped.width = Math.max(1, Math.round(width));
  cropped.height = Math.max(1, Math.round(height));

  const ctx = cropped.getContext('2d');
  if (!ctx) throw new Error('Could not create cropped canvas context');

  ctx.drawImage(
    canvas,
    Math.round(x),
    Math.round(y),
    Math.round(width),
    Math.round(height),
    0,
    0,
    cropped.width,
    cropped.height
  );

  return cropped;
}

/**
 * Converts canvas to Blob and immediately executes callback, ensuring cleanup
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = 'image/jpeg',
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert canvas to blob'));
      }
    }, type, quality);
  });
}

/**
 * Zeroes canvas dimensions and memory buffers to prevent memory leaks or retained image data
 */
export function wipeCanvas(canvas: HTMLCanvasElement | null | undefined): void {
  if (!canvas) return;
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 1;
    canvas.height = 1;
  } catch {
    // Ignore cleanup error
  }
}

/**
 * Safely revokes an object URL if valid
 */
export function safeRevokeUrl(url: string | null | undefined): void {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore cleanup error
    }
  }
}
