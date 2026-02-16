"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange } from '../services/authService';
import { migrateLocalStorageToBunny } from '../services/bunnyClient';
import { syncFromBunnyDB } from '../services/storage';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        // User signed out — wipe cached data so the next user starts clean
        const { clearLocalUserData } = await import('../services/storage');
        clearLocalUserData();
      }

      if (firebaseUser) {
        // Auto-migrate localStorage data on first sign-in
        if (localStorage.getItem('bunny_migrated') !== 'true') {
          try {
            await migrateLocalStorageToBunny();
            console.log('[Auth] localStorage data migrated to BunnyDB');
          } catch (err) {
            console.warn('[Auth] Migration failed, will retry next session', err);
          }
        }

        // Pull BunnyDB data into localStorage for fast sync reads
        try {
          await syncFromBunnyDB();
        } catch (err) {
          console.warn('[Auth] BunnyDB sync failed', err);
        }
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
