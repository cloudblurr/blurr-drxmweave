import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC81rlfkBY0lfD1yLG4otunxTrkpUdiqco",
  authDomain: "muse-ooda.firebaseapp.com",
  projectId: "muse-ooda",
  storageBucket: "muse-ooda.firebasestorage.app",
  messagingSenderId: "1003682916238",
  appId: "1:1003682916238:web:45776d90267946762466df",
  measurementId: "G-MKNZ4B4YYM"
};

// Initialize Firebase (prevent duplicate initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
