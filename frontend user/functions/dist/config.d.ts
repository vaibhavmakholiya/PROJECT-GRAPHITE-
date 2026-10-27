export declare const db: FirebaseFirestore.Firestore;
export declare const auth: import("firebase-admin/auth").Auth;
export declare const messaging: import("firebase-admin/messaging").Messaging;
/**
 * Retrieves HMAC secret for Aadhaar pseudonymization.
 * Supports Secret Manager or environment fallback in local emulator.
 */
export declare function getAadhaarHmacSecret(): Promise<string>;
//# sourceMappingURL=config.d.ts.map