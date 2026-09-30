import React, { createContext, useContext, useEffect, useState } from 'react';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  deleteUser,
  getAuth,
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
} from 'firebase/firestore';
import { auth, db, getActiveFirebaseConfig } from '../firebase/config';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  isManagement: boolean;
  isSupervisor: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  createUserInSystem: (
    fullName: string,
    emailOrUsername: string,
    pass: string,
    role: UserRole,
    username?: string
  ) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// One-time bootstrap account. The Firebase Auth account itself must exist.
// On its first successful sign-in, the matching Firestore admin profile is created.
const BOOTSTRAP_ADMIN_EMAIL = 'khalid.a.kh990@gmail.com';

function mapAuthError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'البريد أو كلمة المرور غير صحيحة.';
  }
  if (code === 'auth/invalid-email') {
    return 'البريد الإلكتروني غير صحيح.';
  }
  if (code === 'auth/too-many-requests') {
    return 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.';
  }
  if (code === 'auth/network-request-failed') {
    return 'لا يوجد اتصال. تحقق من الإنترنت وحاول مرة أخرى.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'الدخول بالبريد غير مفعّل. تواصل مع مدير النظام.';
  }
  return 'تعذر تسجيل الدخول. حاول مرة أخرى.';
}

async function loadProfile(firebaseUid: string, firebaseEmail: string | null): Promise<AppUser | null> {
  const userRef = doc(db, 'users', firebaseUid);
  let userDoc = await getDoc(userRef);

  // Secure bootstrap: only the preconfigured Firebase Auth email may create its own admin profile.
  if (!userDoc.exists() && firebaseEmail?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL) {
    await setDoc(userRef, {
      id: firebaseUid,
      fullName: 'مدير النظام',
      email: firebaseEmail.toLowerCase(),
      role: 'admin',
      active: true,
      createdAt: serverTimestamp(),
    });
    userDoc = await getDoc(userRef);
  }

  if (!userDoc.exists()) return null;

  const data = userDoc.data();
  const emailVal = data.email || firebaseEmail || '';
  const usernameVal =
    data.username ||
    (emailVal.endsWith('@rounds.app') ? emailVal.replace('@rounds.app', '') : undefined);

  let mappedRole: UserRole = 'supervisor';
  if (data.role === 'admin') mappedRole = 'admin';
  else if (data.role === 'management') mappedRole = 'management';

  return {
    id: firebaseUid,
    fullName: data.fullName || 'المستخدم',
    email: emailVal,
    username: usernameVal,
    role: mappedRole,
    active: data.active === true,
    createdAt: data.createdAt,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await loadProfile(firebaseUser.uid, firebaseUser.email);

        if (!profile) {
          await signOut(auth);
          setAppUser(null);
          setError('هذا الحساب غير مضاف للنظام. تواصل مع مدير النظام.');
          return;
        }

        if (!profile.active) {
          await signOut(auth);
          setAppUser(null);
          setError('هذا الحساب معطّل. تواصل مع مدير النظام.');
          return;
        }

        setAppUser(profile);
        setError(null);
      } catch {
        await signOut(auth).catch(() => undefined);
        setAppUser(null);
        setError('تعذر تحميل بيانات الحساب. حاول مرة أخرى.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, pass: string) => {
    setError(null);

    const trimmed = identifier.trim().toLowerCase();
    const emailToUse = trimmed.includes('@') ? trimmed : `${trimmed}@rounds.app`;

    try {
      // Profile loading is handled by onAuthStateChanged. The form stays mounted on a failed
      // attempt, so the typed email/username is kept.
      await signInWithEmailAndPassword(auth, emailToUse, pass);
    } catch (authError) {
      const message = mapAuthError(authError);
      setError(message);
      throw new Error(message);
    }
  };

  const createUserInSystem = async (
    fullName: string,
    emailOrUsername: string,
    pass: string,
    role: UserRole,
    customUsername?: string
  ) => {
    if (!appUser || appUser.role !== 'admin') {
      throw new Error('هذه العملية لمدير النظام فقط.');
    }

    const trimmedInput = emailOrUsername.trim().toLowerCase();
    const normalizedEmail = trimmedInput.includes('@')
      ? trimmedInput
      : `${trimmedInput}@rounds.app`;

    const username =
      customUsername?.trim().toLowerCase() ||
      (!trimmedInput.includes('@') ? trimmedInput : undefined);

    const secondaryApp = initializeApp(
      getActiveFirebaseConfig(),
      `user-provisioning-${Date.now()}`
    );
    const secondaryAuth = getAuth(secondaryApp);
    let createdUser: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>['user'] | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, pass);
      createdUser = credential.user;

      const profilePayload: Record<string, unknown> = {
        id: createdUser.uid,
        fullName: fullName.trim(),
        email: normalizedEmail,
        role,
        active: true,
        createdAt: serverTimestamp(),
      };

      if (username) {
        profilePayload.username = username;
      }

      await setDoc(doc(db, 'users', createdUser.uid), profilePayload);

      await signOut(secondaryAuth);
    } catch (userError: any) {
      if (createdUser) {
        await deleteUser(createdUser).catch(() => undefined);
      }

      if (userError?.code === 'auth/email-already-in-use') {
        throw new Error('هذا الحساب أو اسم المستخدم مسجّل مسبقًا.');
      }
      if (userError?.code === 'auth/invalid-email') {
        throw new Error('اسم المستخدم أو البريد غير صحيح.');
      }
      if (userError?.code === 'auth/weak-password') {
        throw new Error('كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.');
      }

      throw new Error('تعذر إنشاء المستخدم. حاول مرة أخرى.');
    } finally {
      await deleteApp(secondaryApp).catch(() => undefined);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setAppUser(null);
  };

  const isAdmin = appUser?.role === 'admin';
  const isManagement = appUser?.role === 'management';
  const isSupervisor = appUser?.role === 'supervisor';

  return (
    <AuthContext.Provider
      value={{
        appUser,
        loading,
        isAdmin,
        isManagement,
        isSupervisor,
        login,
        logout,
        createUserInSystem,
        error,
        clearError: () => setError(null),
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
