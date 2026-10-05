import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { appendUserRegistrationToSheet, appendUserLoginToSheet } from '../services/googleSheetsService';

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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

export interface SyncedUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher' | 'admin' | 'guest';
  studentCode?: string;
  classRoom?: string;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  targetSubject?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  photoURL?: string | null;
  provider?: string;
}

/**
 * Investigates and synchronizes the Firestore 'users' collection document with the user's metadata upon sign-up or login.
 * Guarantees that first-time users get a properly initialized profile in Firestore,
 * and notifies the owner/admin backend and Google Sheets centralized logging.
 */
export async function syncFirebaseUserDoc(
  user: FirebaseUser, 
  additionalMetadata?: Partial<SyncedUserProfile>
): Promise<SyncedUserProfile> {
  const userDocPath = `users/${user.uid}`;
  const userDocRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  // Root Super Admin check for owner email
  const isSuperAdminEmail = user.email?.toLowerCase() === 'hoangsatruongsalacuavn1945@gmail.com' ||
                           user.email?.toLowerCase() === 'admin@mosmaster.edu.vn';
  const role: 'student' | 'teacher' | 'admin' | 'guest' = isSuperAdminEmail 
    ? 'admin' 
    : (additionalMetadata?.role || 'student');

  let existingData: any = null;

  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      existingData = docSnap.data();
    }
  } catch (err) {
    console.warn(`Firestore read warning for ${userDocPath}:`, err);
  }

  if (!existingData) {
    // First-time sign up: initialize new user document in Firestore
    const newProfile: SyncedUserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || additionalMetadata?.displayName || 'Học viên MOS',
      role,
      studentCode: additionalMetadata?.studentCode || 'HV-' + user.uid.substring(0, 6).toUpperCase(),
      classRoom: additionalMetadata?.classRoom || 'Lớp MOS Master Quốc Tế',
      assignedTeacherId: additionalMetadata?.assignedTeacherId || 't-excel-02',
      assignedTeacherName: additionalMetadata?.assignedTeacherName || 'ThS. Trần Thị Bích Mai',
      targetSubject: additionalMetadata?.targetSubject || 'all',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      photoURL: user.photoURL || null,
      provider: user.providerData?.[0]?.providerId || 'google.com',
    };

    try {
      await setDoc(userDocRef, newProfile);
    } catch (writeErr) {
      handleFirestoreError(writeErr, OperationType.WRITE, userDocPath);
    }

    // Synchronize to the backend so the owner immediately sees the new user in OwnerPortal & Audit Logs
    fetch('/api/auth/quick-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProfile.displayName,
        email: newProfile.email,
        role: newProfile.role,
        studentCode: newProfile.studentCode,
        classRoom: newProfile.classRoom,
        assignedTeacherId: newProfile.assignedTeacherId,
      }),
    }).catch((apiErr) => console.warn('Backend sync error for new Firebase user:', apiErr));

    // Append to master Google Sheets for owner
    appendUserRegistrationToSheet({
      uid: newProfile.uid,
      name: newProfile.displayName,
      email: newProfile.email,
      role: newProfile.role,
      studentCode: newProfile.studentCode,
      classRoom: newProfile.classRoom,
      teacherName: newProfile.assignedTeacherName,
      provider: `Firebase Auth (${newProfile.provider})`,
    }).catch((sheetErr) => console.warn('Google Sheets auto-registration sync warning:', sheetErr));

    return newProfile;
  } else {
    // Existing user: update last login and timestamp
    const updatedProfile: SyncedUserProfile = {
      ...existingData,
      uid: user.uid,
      email: user.email || existingData.email,
      displayName: existingData.displayName || user.displayName || additionalMetadata?.displayName || 'Học viên MOS',
      role: isSuperAdminEmail ? 'admin' : (existingData.role || role),
      lastLoginAt: now,
      updatedAt: now,
    };

    try {
      await updateDoc(userDocRef, {
        lastLoginAt: now,
        updatedAt: now,
        photoURL: user.photoURL || existingData.photoURL || null,
      });
    } catch (updateErr) {
      console.warn(`Firestore update warning for ${userDocPath}:`, updateErr);
    }

    // Auto-record login in Google Sheets
    appendUserLoginToSheet({
      uid: updatedProfile.uid,
      name: updatedProfile.displayName,
      email: updatedProfile.email,
      role: updatedProfile.role,
      provider: 'Firebase Auth',
    }).catch((sheetErr) => console.warn('Google Sheets login sync warning:', sheetErr));

    return updatedProfile;
  }
}

export async function signInWithGoogle(): Promise<{ user: FirebaseUser; accessToken?: string } | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (result.user) {
      await syncFirebaseUserDoc(result.user);
    }

    return { user: result.user, accessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.warn('Google Sign-In popup was closed by user.');
      return null;
    }
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
