import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  createUserInSystem: (fullName: string, email: string, pass: string, role: UserRole) => Promise<void>;
  error: string | null;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial primary administrator emails
const INITIAL_ADMIN_EMAILS = ['khalid.a.kh990@gmail.com', 'admin@hospital.sa'];

// Default master seed accounts
const DEFAULT_SEED_USERS: Array<Omit<AppUser, 'createdAt'> & { password?: string }> = [
  {
    id: 'admin_khalid',
    fullName: 'م. خالد (مدير النظام)',
    email: 'khalid.a.kh990@gmail.com',
    password: 'Khalid@5452',
    role: 'admin',
    active: true,
  },
  {
    id: 'sup_saud',
    fullName: 'سعود العتيبي (مشرف صيانة)',
    email: 'saud@hospital.sa',
    password: 'password123',
    role: 'supervisor',
    active: true,
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and seed default accounts in Firestore if not present
  useEffect(() => {
    const initUsers = async () => {
      try {
        const usersCol = collection(db, 'users');
        const snap = await getDocs(query(usersCol, limit(1)));
        if (snap.empty) {
          for (const u of DEFAULT_SEED_USERS) {
            await setDoc(doc(db, 'users', u.id), {
              ...u,
              createdAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        // Safe fallback if Firestore offline or initializing
      }
    };
    initUsers();
  }, []);

  // Restore session
  useEffect(() => {
    // 1. Check if standard Firebase Auth has a session
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const profile: AppUser = {
              id: firebaseUser.uid,
              fullName: data.fullName || 'المشرف',
              email: data.email || firebaseUser.email || '',
              role: data.role || 'supervisor',
              active: data.active !== false,
              createdAt: data.createdAt,
            };
            if (!profile.active) {
              await signOut(auth);
              setAppUser(null);
              localStorage.removeItem('sr_maintenance_user');
            } else {
              setAppUser(profile);
              localStorage.setItem('sr_maintenance_user', JSON.stringify(profile));
            }
          }
        } catch {
          // fallback
        }
      } else {
        // 2. Check local stored session
        const saved = localStorage.getItem('sr_maintenance_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.email) {
              setAppUser(parsed);
            }
          } catch {
            setAppUser(null);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // 1. Try Firebase Auth first if project has Email/Password enabled
      let authUser: FirebaseUser | null = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
        authUser = cred.user;
      } catch (authErr: any) {
        // If auth/operation-not-allowed or user-not-found in Firebase Auth,
        // we check the internal system database (Firestore `users`)
      }

      if (authUser) {
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.active === false) {
            await signOut(auth);
            throw new Error('تم تعطيل هذا الحساب من قبل الإدارة.');
          }
          const profile: AppUser = {
            id: authUser.uid,
            fullName: data.fullName || 'المشرف',
            email: normalizedEmail,
            role: data.role || (INITIAL_ADMIN_EMAILS.includes(normalizedEmail) ? 'admin' : 'supervisor'),
            active: true,
            createdAt: data.createdAt || new Date(),
          };
          setAppUser(profile);
          localStorage.setItem('sr_maintenance_user', JSON.stringify(profile));
          return;
        }
      }

      // 2. Query Firestore users collection by email
      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('email', '==', normalizedEmail));
      const userSnap = await getDocs(q);

      if (!userSnap.empty) {
        const userDoc = userSnap.docs[0];
        const data = userDoc.data();

        if (data.active === false) {
          throw new Error('تم تعطيل هذا الحساب من قبل الإدارة.');
        }

        // Verify password
        if (data.password && data.password !== pass) {
          throw new Error('كلمة المرور غير صحيحة.');
        }

        const profile: AppUser = {
          id: userDoc.id,
          fullName: data.fullName,
          email: data.email,
          role: data.role || (INITIAL_ADMIN_EMAILS.includes(normalizedEmail) ? 'admin' : 'supervisor'),
          active: true,
          createdAt: data.createdAt || new Date(),
        };

        setAppUser(profile);
        localStorage.setItem('sr_maintenance_user', JSON.stringify(profile));
        return;
      }

      // 3. Check pre-configured default admin seed if not yet in database
      const matchedSeed = DEFAULT_SEED_USERS.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (matchedSeed) {
        if (matchedSeed.password !== pass) {
          throw new Error('كلمة المرور غير صحيحة.');
        }

        const profile: AppUser = {
          id: matchedSeed.id,
          fullName: matchedSeed.fullName,
          email: matchedSeed.email,
          role: matchedSeed.role,
          active: true,
          createdAt: new Date(),
        };

        // Save to Firestore
        try {
          await setDoc(doc(db, 'users', matchedSeed.id), {
            ...profile,
            password: matchedSeed.password,
            createdAt: serverTimestamp(),
          });
        } catch {
          // ignore
        }

        setAppUser(profile);
        localStorage.setItem('sr_maintenance_user', JSON.stringify(profile));
        return;
      }

      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } catch (err: any) {
      const msg = err.message || 'تعذر تسجيل الدخول. يرجى التأكد من البيانات.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Admin creates new users from inside the system
  const createUserInSystem = async (
    fullName: string,
    email: string,
    pass: string,
    role: UserRole
  ) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const usersCol = collection(db, 'users');
    const existing = await getDocs(query(usersCol, where('email', '==', normalizedEmail)));
    if (!existing.empty) {
      throw new Error('البريد الإلكتروني مسجل مسبقًا في النظام.');
    }

    const newId = 'usr_' + Date.now();
    const newUserRecord = {
      id: newId,
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: pass,
      role,
      active: true,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', newId), newUserRecord);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setAppUser(null);
    localStorage.removeItem('sr_maintenance_user');
  };

  const refreshUser = async () => {
    if (appUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', appUser.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setAppUser({
            ...appUser,
            fullName: data.fullName || appUser.fullName,
            role: data.role || appUser.role,
            active: data.active !== false,
          });
        }
      } catch {
        // ignore
      }
    }
  };

  const isAdmin = appUser?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        appUser,
        loading,
        isAdmin,
        login,
        logout,
        createUserInSystem,
        error,
        clearError: () => setError(null),
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
