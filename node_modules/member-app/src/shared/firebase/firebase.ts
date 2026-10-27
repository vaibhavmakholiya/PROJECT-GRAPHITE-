/**
 * Firebase Client SDK Initialization with Multi-Tab Offline Persistence
 * and local emulator connectivity for Auth, Firestore, and Functions.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { env } from './env';

// Track singleton instances
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let functions: Functions;
let emulatorsConnected = false;

if (getApps().length === 0) {
  // If in mock mode without full firebase config, provide fallback demo config
  const firebaseConfig = env.firebase.apiKey
    ? env.firebase
    : {
        apiKey: 'demo-api-key',
        authDomain: 'demo-sanchay.firebaseapp.com',
        projectId: 'demo-sanchay',
        storageBucket: 'demo-sanchay.appspot.com',
        messagingSenderId: '000000000000',
        appId: '1:000000000000:web:000000000000',
      };

  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

try {
  // Initialize multi-tab persistent cache
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // Fallback if already initialized (e.g. during HMR)
  db = getFirestore(app);
}

auth = getAuth(app);
functions = getFunctions(app, env.emulator.region || 'asia-south1');

// Connect to local emulators if configured
if (env.useEmulator && !emulatorsConnected) {
  try {
    connectAuthEmulator(auth, env.emulator.authUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, env.emulator.firestoreHost, env.emulator.firestorePort);
    connectFunctionsEmulator(functions, env.emulator.functionsHost, env.emulator.functionsPort);
    emulatorsConnected = true;
    console.info(
      `[Sanchay Firebase] Connected to emulators -> Auth: ${env.emulator.authUrl}, ` +
      `Firestore: ${env.emulator.firestoreHost}:${env.emulator.firestorePort}, ` +
      `Functions: ${env.emulator.functionsHost}:${env.emulator.functionsPort} (${env.emulator.region})`
    );
  } catch (err) {
    // Prevent double connection warning during Vite HMR
    console.warn('[Sanchay Firebase] Emulator connection notice:', err);
  }
}

export { app, db, auth, functions };
