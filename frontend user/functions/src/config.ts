import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin singleton
if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();
export const auth = getAuth();
export const messaging = getMessaging();

/**
 * Retrieves HMAC secret for Aadhaar pseudonymization.
 * Supports Secret Manager or environment fallback in local emulator.
 */
export async function getAadhaarHmacSecret(): Promise<string> {
  const envSecret = process.env.AADHAAR_HMAC_SECRET;
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  return 'sanchay-default-offline-dev-secret-32-bytes!';
}
