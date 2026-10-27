import { createWorker, OEM } from 'tesseract.js';
import type { OCRWord } from './parseAadhaar';

export interface OCRProgressEvent {
  status: string;
  progress: number; // 0 to 100
}

/**
 * Executes on-device OCR using self-hosted Tesseract.js assets.
 * Assets are loaded from /tesseract/ directly from the origin.
 */
export async function recognizeAadhaarImage(
  imageSource: Blob | HTMLCanvasElement | string,
  onProgress?: (progress: number, status: string) => void,
  abortSignal?: AbortSignal
): Promise<{ text: string; words: OCRWord[] }> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  try {
    if (abortSignal?.aborted) {
      throw new DOMException('OCR process was aborted by the user', 'AbortError');
    }

    onProgress?.(10, 'Initializing on-device OCR engine...');

    // Pinned self-hosted worker and core paths
    worker = await createWorker('eng', OEM.DEFAULT, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/core',
      langPath: '/tesseract/lang',
      gzip: true,
      logger: (m: { status?: string; progress?: number }) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          // Map recognition progress from 30% to 95%
          const pct = Math.min(95, Math.round(30 + m.progress * 65));
          onProgress?.(pct, 'Reading text from card...');
        } else if (m.status === 'loading language traineddata') {
          onProgress?.(20, 'Loading language model...');
        }
      },
    });

    if (abortSignal?.aborted) {
      throw new DOMException('OCR process was aborted by the user', 'AbortError');
    }

    onProgress?.(35, 'Analyzing card layout...');

    // Set OCR parameters for optimal alphanumeric recognition
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/:,-. ()',
    });

    if (abortSignal?.aborted) {
      throw new DOMException('OCR process was aborted by the user', 'AbortError');
    }

    const result = await worker.recognize(imageSource);

    onProgress?.(100, 'Processing complete');

    const rawWords: any[] = (result.data as any).words || [];
    const words: OCRWord[] = rawWords.map((w: any) => ({
      text: w.text || '',
      confidence: typeof w.confidence === 'number' ? w.confidence : 0,
      bbox: w.bbox
        ? {
            x0: w.bbox.x0,
            y0: w.bbox.y0,
            x1: w.bbox.x1,
            y1: w.bbox.y1,
          }
        : undefined,
    }));

    return {
      text: result.data.text || '',
      words,
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // Ignore termination error
      }
    }
  }
}
