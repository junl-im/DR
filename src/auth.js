import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseReady } from './firebase.js';

const FIREBASE_PROFILE_WRITE_GUARD_PATCH = 'v1082-firebase-free-write-budget';
const PROFILE_WRITE_KEY = 'dream-library-profile-write-guard-v1082';
const PROFILE_WRITE_TTL_MS = 12 * 60 * 60 * 1000;

const googleProvider = firebaseReady ? new GoogleAuthProvider() : null;
if (googleProvider) {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

function shouldUseGoogleRedirect(error) {
  const code = error?.code || '';
  return code === 'auth/popup-blocked'
    || code === 'auth/popup-closed-by-user'
    || code === 'auth/cancelled-popup-request'
    || code === 'auth/operation-not-supported-in-this-environment'
    || code === 'auth/unauthorized-domain';
}

function assertFirebaseReady() {
  if (!firebaseReady || !auth) {
    throw Object.assign(new Error('Firebase configuration is missing.'), { code: 'firebase/missing-config' });
  }
}

export function observeAuth(callback) {
  if (!firebaseReady || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await saveUserProfile(user).catch(() => null);
    }
    callback(user);
  });
}

export function loginAnonymously() {
  assertFirebaseReady();
  return signInAnonymously(auth);
}

export async function loginWithGoogle() {
  assertFirebaseReady();
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (shouldUseGoogleRedirect(error)) {
      try { sessionStorage.setItem('dream-library-google-redirect-pending', '1'); } catch {}
      await signInWithRedirect(auth, googleProvider);
      throw Object.assign(new Error('Google redirect started.'), { code: 'auth/redirect-started' });
    }
    throw error;
  }
}

export async function completeGoogleRedirect() {
  if (!firebaseReady || !auth) return null;
  return getRedirectResult(auth);
}

export function loginWithEmail(email, password) {
  assertFirebaseReady();
  return signInWithEmailAndPassword(auth, email, password);
}

export function signupWithEmail(email, password) {
  assertFirebaseReady();
  return createUserWithEmailAndPassword(auth, email, password);
}

export function logout() {
  assertFirebaseReady();
  return signOut(auth);
}

export function getDisplayName(user) {
  if (!user) return 'Guest';
  if (user.displayName) return user.displayName.slice(0, 32);
  if (user.email) return user.email.split('@')[0].slice(0, 32);
  return `Guest-${user.uid.slice(0, 5)}`;
}

function getProvider(user) {
  const providerData = user.providerData?.[0]?.providerId;
  if (providerData) return providerData;
  return user.isAnonymous ? 'anonymous' : 'firebase';
}

function canWriteUserProfile(user) {
  if (!user?.uid) return false;
  try {
    const raw = localStorage.getItem(PROFILE_WRITE_KEY);
    const guard = raw ? JSON.parse(raw) : {};
    const key = `${user.uid}:${getProvider(user)}:${getDisplayName(user)}`;
    const skip = guard.key === key && Date.now() - Number(guard.at || 0) < PROFILE_WRITE_TTL_MS;
    document.body?.setAttribute('data-firebase-profile-write-guard', `${FIREBASE_PROFILE_WRITE_GUARD_PATCH}-${skip ? 'cache' : 'write'}`);
    if (skip) return false;
    localStorage.setItem(PROFILE_WRITE_KEY, JSON.stringify({ key, at: Date.now() }));
    return true;
  } catch {
    return true;
  }
}

async function saveUserProfile(user) {
  if (!db || !canWriteUserProfile(user)) return;
  await setDoc(
    doc(db, 'users', user.uid),
    {
      uid: user.uid,
      displayName: getDisplayName(user),
      email: user.email ?? null,
      provider: getProvider(user),
      photoURL: user.photoURL ?? null,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
