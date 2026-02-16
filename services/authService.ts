import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export type { User };

// Google Sign-In
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Email / Password Sign-Up
export async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

// Email / Password Sign-In
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// Sign Out — clears local cached data so the next user starts clean
export async function signOut(): Promise<void> {
  // Dynamic import to avoid circular dependency
  const { clearLocalUserData } = await import('./storage');
  clearLocalUserData();
  await firebaseSignOut(auth);
}

// Auth state listener
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Get current user (sync check)
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
