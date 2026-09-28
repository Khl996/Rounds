import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Round, RoundType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { calculateDurationMinutes } from '../utils/formatters';

export function useRounds() {
  const { appUser } = useAuth();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setRounds([]);
      setActiveRound(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, 'rounds'), orderBy('startedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Round[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Round, 'id'>),
        }));

        setRounds(list);
        const myActive = list.find(
          (r) => r.status === 'in_progress' &&
            (r.supervisorId === appUser.id || appUser.role === 'admin')
        );
        setActiveRound(myActive || null);
        setLoading(false);
      },
      (firestoreError) => {
        console.error('Rounds subscription failed:', firestoreError);
        setError('تعذر تحميل الجولات من قاعدة البيانات.');
        setRounds([]);
        setActiveRound(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser]);

  const startRound = async (type: RoundType): Promise<string> => {
    if (!appUser) throw new Error('يجب تسجيل الدخول لبدء جولة');

    const payload = {
      type,
      supervisorId: appUser.id,
      supervisorName: appUser.fullName,
      status: 'in_progress' as const,
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      observationCount: 0,
      openCount: 0,
      resolvedCount: 0,
      summary: '',
    };

    try {
      const ref = await addDoc(collection(db, 'rounds'), payload);
      return ref.id;
    } catch (writeError) {
      console.error('Start round failed:', writeError);
      throw new Error('تعذر بدء الجولة وحفظها في قاعدة البيانات.');
    }
  };

  const finishRound = async (roundId: string, summary?: string): Promise<void> => {
    const targetRound = rounds.find((r) => r.id === roundId) || activeRound;
    if (!targetRound) throw new Error('تعذر العثور على الجولة.');

    const duration = calculateDurationMinutes(targetRound.startedAt, new Date());

    try {
      await updateDoc(doc(db, 'rounds', roundId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        durationMinutes: duration,
        summary: summary?.trim() || '',
      });
    } catch (writeError) {
      console.error('Finish round failed:', writeError);
      throw new Error('تعذر إنهاء الجولة وحفظها في قاعدة البيانات.');
    }
  };

  return {
    rounds,
    activeRound,
    loading,
    error,
    startRound,
    finishRound,
  };
}
