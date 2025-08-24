"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { ref, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { auth, googleProvider, githubProvider, database, ensureClientInitialized } from '@/lib/firebase.client';

// console.log('AuthContext loading...');

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | null = null;
    let mounted = true;

    // Ensure client firebase is initialized (may fetch runtime config from server)
    ensureClientInitialized().then(() => {
      if (!mounted) return;

      if (!auth) {
        setLoading(false);
        return;
      }

      unsub = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        setLoading(false);

        if (user && database) {
          try {
            // Set user as online in database
            const userStatusRef = ref(database, `users/${user.uid}/status`);
            const userInfoRef = ref(database, `users/${user.uid}/info`);

            // Set user info
            const userInfo = {
              displayName: user.displayName || 'Anonymous User',
              email: user.email || null,
              photoURL: user.photoURL || null,
              lastSeen: serverTimestamp(),
            };
            await set(userInfoRef, userInfo);

            // Set online status
            const userStatus = {
              online: true,
              available: false, // Default to not available until user sets themselves as available
              lastSeen: serverTimestamp(),
            };
            await set(userStatusRef, userStatus);

            // Set offline when disconnected
            onDisconnect(userStatusRef).set({
              online: false,
              lastSeen: serverTimestamp(),
            });
          } catch (e) {
            // ignore DB errors
          }
        }
      });
    });

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      try {
        if (unsub) unsub();
      } catch (e) {
        // ignore
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
  if (!auth) throw new Error('Auth not initialized');
  await signInWithPopup(auth, googleProvider);
    } catch (error) {
      throw error;
    }
  };

  const signInWithGithub = async () => {
    try {
  if (!auth) throw new Error('Auth not initialized');
  await signInWithPopup(auth, githubProvider);
    } catch (error) {
      throw error;
    }
  };

  const signInAsGuest = async () => {
    try {
  if (!auth) throw new Error('Auth not initialized');
  await signInAnonymously(auth);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        // Set user as offline before signing out
        if (database) {
          const userStatusRef = ref(database, `users/${user.uid}/status`);
          await set(userStatusRef, {
            online: false,
            lastSeen: serverTimestamp(),
          });
        }
      }
      if (!auth) throw new Error('Auth not initialized');
      await firebaseSignOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithGithub,
    signInAsGuest,
    signOut,
    isOnline,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
