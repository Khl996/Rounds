import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AppUser, UserRole } from '../types';

/** Admin-only list of system users. */
export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUsers(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AppUser, 'id'>),
          }))
        );
        setLoading(false);
      },
      (firestoreError) => {
        console.error('Users subscription failed:', firestoreError);
        setError('تعذر تحميل المستخدمين.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateUser = async (id: string, data: { fullName?: string; role?: UserRole; active?: boolean }) => {
    try {
      await updateDoc(doc(db, 'users', id), data);
    } catch (writeError) {
      console.error('Update user failed:', writeError);
      throw new Error('تعذر حفظ التعديل.');
    }
  };

  return { users, loading, error, updateUser };
}
