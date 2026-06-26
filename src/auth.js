import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

const googleProvider = new GoogleAuthProvider();

export function observeAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await saveUserProfile(user);
    }
    callback(user);
  });
}

export function loginAnonymously() {
  return signInAnonymously(auth);
}

export function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signupWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function logout() {
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

async function saveUserProfile(user) {
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
