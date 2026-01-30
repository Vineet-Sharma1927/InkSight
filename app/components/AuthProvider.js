'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';

const AuthContext = createContext({ user: null, loading: true, logout: async () => {} });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u && process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        // Auto-login with demo credentials in production
        try {
          await signInWithEmailAndPassword(
            auth,
            'vineet11vinu@gmail.com',
            'vineet@1821'
          );
        } catch (error) {
          // Demo account might not exist yet, just continue
          console.warn('Demo auto-login failed:', error.message);
          setLoading(false);
        }
      } else {
        setUser(u);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}


