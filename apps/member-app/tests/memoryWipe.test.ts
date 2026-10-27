import { describe, it, expect, vi } from 'vitest';
import { wipeCanvas, safeRevokeUrl } from '../src/ocr/imagePipeline';

describe('Memory Hygiene & Lifecycle Zeroing Unit Tests', () => {
  it('safely revokes object URLs on cancel/completion', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    // Blob URL should be revoked
    const blobUrl = 'blob:http://localhost:5173/3f9a-12bc-44de';
    safeRevokeUrl(blobUrl);
    expect(revokeSpy).toHaveBeenCalledWith(blobUrl);

    // Non-blob or null/undefined URLs should not throw and should not call revokeObjectURL
    revokeSpy.mockClear();
    safeRevokeUrl('https://example.com/logo.png');
    safeRevokeUrl(null);
    safeRevokeUrl(undefined);
    expect(revokeSpy).not.toHaveBeenCalled();

    revokeSpy.mockRestore();
  });

  it('wipes canvas dimensions and clears image buffer to release memory', () => {
    // In node/vitest, create a mock canvas element
    const clearRectMock = vi.fn();
    const mockCanvas = {
      width: 1600,
      height: 1000,
      getContext: vi.fn().mockReturnValue({
        clearRect: clearRectMock,
      }),
    } as unknown as HTMLCanvasElement;

    wipeCanvas(mockCanvas);

    expect(clearRectMock).toHaveBeenCalledWith(0, 0, 1600, 1000);
    expect(mockCanvas.width).toBe(1);
    expect(mockCanvas.height).toBe(1);
  });

  it('handles null/undefined gracefully during wipeCanvas', () => {
    expect(() => wipeCanvas(null)).not.toThrow();
    expect(() => wipeCanvas(undefined)).not.toThrow();
  });
});
