/**
 * Safe Logger Wrapper
 * Enforces Rule 5: Never store, log, or return a full Aadhaar number.
 * Enforces Rule 6: Never log personal data (name, phone, Aadhaar fragments) in Cloud Functions.
 */
import { logger as baseLogger } from 'firebase-functions';
const SENSITIVE_KEYS = [
    'name',
    'phone',
    'dob',
    'address',
    'aadhaar',
    'aadhaarnumber',
    'aadhaarhash',
    'aadhaarlast4',
    'password',
    'token',
    'secret'
];
/**
 * Recursively sanitizes objects to scrub personal or sensitive data.
 */
export function sanitizeLogPayload(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj !== 'object') {
        if (typeof obj === 'string' && /^\+?\d{10,12}$/.test(obj)) {
            return '[REDACTED_PHONE_OR_NUM]';
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeLogPayload);
    }
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
            sanitized[key] = '[REDACTED_PII]';
        }
        else {
            sanitized[key] = sanitizeLogPayload(value);
        }
    }
    return sanitized;
}
export const safeLogger = {
    info: (message, payload) => {
        if (payload !== undefined) {
            baseLogger.info(message, sanitizeLogPayload(payload));
        }
        else {
            baseLogger.info(message);
        }
    },
    warn: (message, payload) => {
        if (payload !== undefined) {
            baseLogger.warn(message, sanitizeLogPayload(payload));
        }
        else {
            baseLogger.warn(message);
        }
    },
    error: (message, payload) => {
        if (payload !== undefined) {
            baseLogger.error(message, sanitizeLogPayload(payload));
        }
        else {
            baseLogger.error(message);
        }
    }
};
//# sourceMappingURL=logger.js.map