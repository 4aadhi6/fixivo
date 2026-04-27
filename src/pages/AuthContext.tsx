import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isWorker: boolean;
  supportNumber: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isWorker: false,
  supportNumber: '918078971032',
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [supportNumber, setSupportNumber] = useState('918078971032');

  useEffect(() => {
    // Listen to global settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setSupportNumber(snap.data().supportNumber || '918078971032');
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Listen to user profile changes
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          if (error.message.includes('insufficient permissions')) {
            console.warn("User profile access restricted by security rules. This is expected if the user document hasn't been created yet.");
          } else {
            console.error("Profile snapshot error:", error);
          }
          setLoading(false);
        });
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubSettings();
      unsubscribe();
    };
  }, []);

  const isAdminEmail = user?.email === 'adithyanr350@gmail.com' || user?.email === 'admin@fixivo.com';

  const value = {
    user,
    profile,
    loading,
    isAdmin: isAdminEmail || profile?.role === 'admin',
    isWorker: profile?.role === 'worker',
    supportNumber
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
