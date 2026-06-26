import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function env(name) {
  return import.meta.env[name]?.trim?.() ?? '';
}

export const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: env('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('VITE_FIREBASE_APP_ID'),
  measurementId: env('VITE_FIREBASE_MEASUREMENT_ID')
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
export const firebaseMissingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);
export const firebaseReady = firebaseMissingKeys.length === 0;

export const app = firebaseReady ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export const analyticsReady = app
  ? isSupported()
      .then((supported) => (supported && firebaseConfig.measurementId ? getAnalytics(app) : null))
      .catch(() => null)
  : Promise.resolve(null);
