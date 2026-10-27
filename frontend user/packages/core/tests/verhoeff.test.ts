import { describe, it, expect } from 'vitest';
import {
  verhoeffValid,
  generateVerhoeffCheckDigit,
  maskAadhaar,
  formatReceiptNo
} from '../src/index.js';

describe('Verhoeff Algorithm & Aadhaar Validation', () => {
  it('should validate valid Aadhaar numbers', () => {
    // Generate valid 12-digit Aadhaar test numbers using the algorithm itself
    const prefix1 = '23456789012';
    const check1 = generateVerhoeffCheckDigit(prefix1);
    const validAadhaar1 = `${prefix1}${check1}`;
    expect(verhoeffValid(validAadhaar1)).toBe(true);

    const prefix2 = '98765432109';
    const check2 = generateVerhoeffCheckDigit(prefix2);
    const validAadhaar2 = `${prefix2}${check2}`;
    expect(verhoeffValid(validAadhaar2)).toBe(true);
  });

  it('should reject numbers with single-digit errors', () => {
    const prefix = '54321678901';
    const check = generateVerhoeffCheckDigit(prefix);
    const valid = `${prefix}${check}`;
    expect(verhoeffValid(valid)).toBe(true);

    // Tamper single digit
    const tampered = `${prefix.slice(0, 5)}9${prefix.slice(6)}${check}`;
    expect(verhoeffValid(tampered)).toBe(false);
  });

  it('should reject numbers with transposed adjacent digits', () => {
    const prefix = '78901234567';
    const check = generateVerhoeffCheckDigit(prefix);
    const valid = `${prefix}${check}`;
    expect(verhoeffValid(valid)).toBe(true);

    // Swap digits at index 2 and 3
    const chars = valid.split('');
    const tmp = chars[2];
    chars[2] = chars[3];
    chars[3] = tmp;
    const transposed = chars.join('');
    expect(verhoeffValid(transposed)).toBe(false);
  });

  it('should reject invalid formats and invalid lengths', () => {
    expect(verhoeffValid('')).toBe(false);
    expect(verhoeffValid('1234567890')).toBe(false); // 10 digits
    expect(verhoeffValid('1234567890123')).toBe(false); // 13 digits
    expect(verhoeffValid('012345678901')).toBe(false); // starts with 0
    expect(verhoeffValid('112345678901')).toBe(false); // starts with 1
    expect(verhoeffValid('23456abc9012')).toBe(false); // non-numeric
  });
});

describe('Masking and Receipt Formatting', () => {
  it('should mask Aadhaar preserving only last 4 digits', () => {
    expect(maskAadhaar('4321')).toBe('XXXX-XXXX-4321');
    expect(maskAadhaar('0001')).toBe('XXXX-XXXX-0001');
  });

  it('should throw on invalid last4 length or content', () => {
    expect(() => maskAadhaar('123')).toThrow();
    expect(() => maskAadhaar('12345')).toThrow();
    expect(() => maskAadhaar('abcd')).toThrow();
  });

  it('should format receipt numbers consistently with groupCode, date, device, and counter', () => {
    const receiptNo = formatReceiptNo('PRAGATI', new Date('2026-10-15T00:00:00Z'), 'DEV01', 42);
    expect(receiptNo).toBe('PRAG-202610-DEV0-0042');
  });
});
