import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Round, RoundType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { calculateDurationMinutes } from '../utils/formatters';
import { buildRoundCode } from '../utils/roundCode';

export function useRounds() {
  const { appUser } = useAuth();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setRounds([]);
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
        setRounds(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data({ serverTimestamps: 'estimate' }) as Omit<Round, 'id'>),
          }))
        );
        setLoading(false);
      },
      (firestoreError) => {
        console.error('Rounds subscription failed:', firestoreError);
        setError('تعذر تحميل الجولات.');
        setRounds([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser]);

  // Only the signed-in user's own round counts as "their" active round.
  const activeRound =
    (appUser && rounds.find((r) => r.status === 'in_progress' && r.supervisorId === appUser.id)) || null;

  const startRound = async (type: RoundType): Promise<string> => {
    if (!appUser) throw new Error('سجّل الدخول أولًا.');
    if (activeRound) return activeRound.id;

    const now = new Date();

    try {
      // The code is derived from the new document ID; re-roll the ID in the unlikely case the code is taken.
      for (let attempt = 0; attempt < 5; attempt++) {
        const ref = doc(collection(db, 'rounds'));
        const roundCode = buildRoundCode(now, ref.id);
        const clash = await getDocs(
          query(collection(db, 'rounds'), where('roundCode', '==', roundCode), limit(1))
        );
        if (!clash.empty) continue;

        await setDoc(ref, {
          roundCode,
          type,
          supervisorId: appUser.id,
          supervisorName: appUser.fullName,
          status: 'in_progress',
          startedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          observationCount: 0,
          openCount: 0,
          resolvedCount: 0,
          summary: '',
        });
        return ref.id;
      }
    } catch (writeError) {
      console.error('Start round failed:', writeError);
    }
    throw new Error('تعذر بدء الجولة. تحقق من الاتصال وحاول مرة أخرى.');
  };

  const finishRound = async (roundId: string, summary?: string): Promise<void> => {
    const targetRound = rounds.find((r) => r.id === roundId);
    if (!targetRound) throw new Error('تعذر العثور على الجولة.');

    try {
      await updateDoc(doc(db, 'rounds', roundId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        durationMinutes: calculateDurationMinutes(targetRound.startedAt, new Date()),
        summary: summary?.trim() || '',
      });
    } catch (writeError) {
      console.error('Finish round failed:', writeError);
      throw new Error('تعذر إنهاء الجولة. تحقق من الاتصال وحاول مرة أخرى.');
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
