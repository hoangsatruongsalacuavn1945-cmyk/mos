import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

const customDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = customDbId && customDbId !== '(default)'
  ? getFirestore(app, customDbId)
  : getFirestore(app);

// Connection test as required by Firebase integration skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or internet connection.");
    }
    return false;
  }
}

// Initial connection test
testFirestoreConnection().catch(() => {});

export async function signInWithGoogle(): Promise<{ user: FirebaseUser; accessToken?: string } | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    return { user: result.user, accessToken };
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export async function firebaseSignOut(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Firebase sign-out failed:', error);
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };
