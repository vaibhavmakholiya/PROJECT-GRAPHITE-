/**
 * Masking and Formatting Utilities
 * Enforces Rule 5: Never store, log, or return a full Aadhaar number.
 */
/**
 * Returns a masked Aadhaar string given the last 4 digits.
 * Format: XXXX-XXXX-1234
 */
export declare function maskAadhaar(last4: string): string;
/**
 * Generates an offline-resilient receipt number.
 * Format: {groupCode}-{yyyymm}-{deviceShort}-{perDeviceCounter}
 * e.g., "PRAG-202610-DEV1-0042"
 */
export declare function formatReceiptNo(groupCode: string, date: Date | string, deviceShort: string, counter: number): string;
//# sourceMappingURL=masking.d.ts.map