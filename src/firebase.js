import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyBl43n3qCb9jelgpWyS30SCY8bvzupRSD4',
  authDomain: 'dream-library-b732a.firebaseapp.com',
  projectId: 'dream-library-b732a',
  storageBucket: 'dream-library-b732a.firebasestorage.app',
  messagingSenderId: '120637221874',
  appId: '1:120637221874:web:609a6694d4a19ac792196b',
  measurementId: 'G-LM4XVDQ241'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const analyticsReady = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);
