/**
 * Validates whether an input Aadhaar number has a valid Verhoeff checksum.
 * Standard Aadhaar is exactly 12 digits, cannot start with 0 or 1.
 */
export declare function verhoeffValid(aadhaar: string): boolean;
/**
 * Generates a Verhoeff checksum digit for an 11-digit prefix.
 * Useful for test fixtures / seed data generation.
 */
export declare function generateVerhoeffCheckDigit(numStr: string): number;
//# sourceMappingURL=verhoeff.d.ts.map