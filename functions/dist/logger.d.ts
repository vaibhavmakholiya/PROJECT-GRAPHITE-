/**
 * Safe Logger Wrapper
 * Enforces Rule 5: Never store, log, or return a full Aadhaar number.
 * Enforces Rule 6: Never log personal data (name, phone, Aadhaar fragments) in Cloud Functions.
 */
/**
 * Recursively sanitizes objects to scrub personal or sensitive data.
 */
export declare function sanitizeLogPayload(obj: any): any;
export declare const safeLogger: {
    info: (message: string, payload?: any) => void;
    warn: (message: string, payload?: any) => void;
    error: (message: string, payload?: any) => void;
};
//# sourceMappingURL=logger.d.ts.map