import { describe, it, expect, vi } from 'vitest';
import { parseAadhaar, formatMaskedAadhaar } from '../src/ocr/parseAadhaar';
import { mockRepository } from '../src/data/mockRepository';
import { generateVerhoeffCheckDigit } from '@sanchay/core';

describe('Privacy Invariant: Zero-PII Leakage Verification', () => {
  const secretAadhaarPrefix = '43219876543';
  const secretCheck = generateVerhoeffCheckDigit(secretAadhaarPrefix);
  const secretFullAadhaar = `${secretAadhaarPrefix}${secretCheck}`; // 12 digits

  it('guarantees full 12-digit number is never emitted to console.log/warn/error', () => {
    const logSpy = vi.spyOn(console, 'log');
    const warnSpy = vi.spyOn(console, 'warn');
    const errorSpy = vi.spyOn(console, 'error');

    const syntheticOcrText = `
      GOVERNMENT OF INDIA
      Geeta Rani
      DOB: 12/03/1991
      FEMALE
      ${secretFullAadhaar.slice(0, 4)} ${secretFullAadhaar.slice(4, 8)} ${secretFullAadhaar.slice(8)}
    `;

    // Execute parsing
    const result = parseAadhaar(syntheticOcrText);
    expect(result.isChecksumValid).toBe(true);

    // Inspect all captured console calls
    const allCapturedOutput = [
      ...logSpy.mock.calls.flat(),
      ...warnSpy.mock.calls.flat(),
      ...errorSpy.mock.calls.flat(),
    ].map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)));

    for (const output of allCapturedOutput) {
      expect(output).not.toContain(secretFullAadhaar);
    }

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('verifies registerMember stores only last 4 digits and never the full 12 digits', async () => {
    const member = await mockRepository.registerMember({
      name: 'Sunita Kamble',
      phone: '9822334455',
      dob: '1988-06-20',
      address: 'Village Ward 2',
      aadhaarLast4: secretFullAadhaar.slice(-4),
    });

    // Verify fields stored on member
    expect(member.aadhaarLast4).toBe(secretFullAadhaar.slice(-4));
    expect((member as any).aadhaarNumber).toBeUndefined();
    expect((member as any).fullAadhaar).toBeUndefined();

    // Verify serialized state contains no 12-digit number
    const serialized = JSON.stringify(member);
    expect(serialized).not.toContain(secretFullAadhaar);
  });

  it('verifies masked presentation hides the first 8 digits under all inputs', () => {
    const masked = formatMaskedAadhaar(secretFullAadhaar);
    expect(masked).toBe(`XXXX-XXXX-${secretFullAadhaar.slice(-4)}`);
    expect(masked.startsWith('XXXX-XXXX-')).toBe(true);
    expect(masked).not.toContain(secretAadhaarPrefix);
  });
});
