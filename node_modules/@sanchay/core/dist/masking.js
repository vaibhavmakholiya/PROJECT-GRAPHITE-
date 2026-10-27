/**
 * Masking and Formatting Utilities
 * Enforces Rule 5: Never store, log, or return a full Aadhaar number.
 */
/**
 * Returns a masked Aadhaar string given the last 4 digits.
 * Format: XXXX-XXXX-1234
 */
export function maskAadhaar(last4) {
    if (!last4 || last4.length !== 4 || !/^\d{4}$/.test(last4)) {
        throw new Error('last4 must be exactly 4 numeric digits');
    }
    return `XXXX-XXXX-${last4}`;
}
/**
 * Generates an offline-resilient receipt number.
 * Format: {groupCode}-{yyyymm}-{deviceShort}-{perDeviceCounter}
 * e.g., "PRAG-202610-DEV1-0042"
 */
export function formatReceiptNo(groupCode, date, deviceShort, counter) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyymm = `${year}${month}`;
    const cleanGroup = groupCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
    const cleanDevice = deviceShort.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4);
    const paddedCounter = String(counter).padStart(4, '0');
    return `${cleanGroup}-${yyyymm}-${cleanDevice}-${paddedCounter}`;
}
//# sourceMappingURL=masking.js.map