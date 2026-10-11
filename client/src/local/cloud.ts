import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { validateSave, type Save } from './session';
const app = initializeApp({ apiKey: import.meta.env.VITE_FIREBASE_API_KEY, authDomain: 'dream-library-b732a.firebaseapp.com', projectId: 'dream-library-b732a', appId: '1:120637221874:web:609a6694d4a19ac792196b' });
export const auth = getAuth(app);
const db = getFirestore(app);
export async function login(): Promise<void> { await signInWithPopup(auth, new GoogleAuthProvider()); }
export async function logout(): Promise<void> { await signOut(auth); }
function saveRef() { if (!auth.currentUser) throw new Error('Google 로그인이 필요합니다.'); return doc(db, 'localSaves', auth.currentUser.uid); }
export async function cloudLoad(): Promise<Save | null> { const snapshot = await getDoc(saveRef()); return snapshot.exists() ? validateSave(JSON.parse(snapshot.data()['payload'])) : null; }
export async function cloudSave(save: Save): Promise<void> {
  const valid = validateSave({ ...save, updatedAt: Date.now() });
  await setDoc(saveRef(), { uid: auth.currentUser!.uid, schemaVersion: 1, mode: 'local', payload: JSON.stringify(valid), updatedAt: serverTimestamp() });
}
