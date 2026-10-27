ww/**
 * Typed environment configuration and validation for Sanchay Web App.
 *
 * Throws a loud, descriptive error at startup if VITE_DATA=firebase is active
 * but required Firebase configuration values are missing.
 */

export interface SanchayEnv {
  dataMode: 'mock' | 'firebase';
  useEmulator: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  emulator: {
    authUrl: string;
    firestoreHost: string;
    firestorePort: number;
    functionsHost: string;
    functionsPort: number;
    region: string;
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (value !== undefined && value !== '') {
    return String(value);
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  return '';
}

export function loadAndValidateEnv(): SanchayEnv {
  const rawDataMode = getEnvVar('VITE_DATA', 'mock').toLowerCase();
  const dataMode: 'mock' | 'firebase' = rawDataMode === 'firebase' ? 'firebase' : 'mock';

  const useEmulator =
    getEnvVar('VITE_USE_EMULATOR', 'false').toLowerCase() === 'true' ||
    getEnvVar('VITE_FIREBASE_PROJECT_ID', '').startsWith('demo-');

  const apiKey = getEnvVar('VITE_FIREBASE_API_KEY');
  const authDomain = getEnvVar('VITE_FIREBASE_AUTH_DOMAIN');
  const projectId = getEnvVar('VITE_FIREBASE_PROJECT_ID');
  const storageBucket = getEnvVar('VITE_FIREBASE_STORAGE_BUCKET');
  const messagingSenderId = getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID');
  const appId = getEnvVar('VITE_FIREBASE_APP_ID');

  if (dataMode === 'firebase') {
    const missing: string[] = [];
    if (!apiKey) missing.push('VITE_FIREBASE_API_KEY');
    if (!authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
    if (!projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
    if (!storageBucket) missing.push('VITE_FIREBASE_STORAGE_BUCKET');
    if (!messagingSenderId) missing.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
    if (!appId) missing.push('VITE_FIREBASE_APP_ID');

    if (missing.length > 0) {
      const errorMsg =
        `[Sanchay Firebase Config Error] VITE_DATA is set to 'firebase' but the following required ` +
        `environment variables are missing or empty: ${missing.join(', ')}.\n` +
        `Please check your .env or .env.local file or use .env.emulator for local development.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  const authUrl = getEnvVar('VITE_EMULATOR_AUTH_URL', 'http://127.0.0.1:9099');
  const firestoreHost = getEnvVar('VITE_EMULATOR_FIRESTORE_HOST', '127.0.0.1');
  const firestorePort = Number(getEnvVar('VITE_EMULATOR_FIRESTORE_PORT', '8085'));
  const functionsHost = getEnvVar('VITE_EMULATOR_FUNCTIONS_HOST', '127.0.0.1');
  const functionsPort = Number(getEnvVar('VITE_EMULATOR_FUNCTIONS_PORT', '5001'));
  const region = getEnvVar('VITE_FUNCTIONS_REGION', 'asia-south1');

  return {
    dataMode,
    useEmulator,
    firebase: {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    },
    emulator: {
      authUrl,
      firestoreHost,
      firestorePort: isNaN(firestorePort) ? 8085 : firestorePort,
      functionsHost,
      functionsPort: isNaN(functionsPort) ? 5001 : functionsPort,
      region,
    },
  };
}

export const env = loadAndValidateEnv();
