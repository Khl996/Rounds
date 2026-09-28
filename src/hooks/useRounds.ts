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
  const [rounds, setRounds] = useState<Round[]>(() => {
    try {
      const cached = localStorage.getItem('sr_rounds_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setRounds([]);
      setActiveRound(null);
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'rounds'), orderBy('startedAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Round[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Round, 'id'>),
          }));

          setRounds(list);
          try {
            localStorage.setItem('sr_rounds_cache', JSON.stringify(list));
          } catch {}

          const myActive = list.find(
            (r) => r.status === 'in_progress' && (r.supervisorId === appUser.id || appUser.role === 'admin')
          );
          setActiveRound(myActive || null);
          setLoading(false);
        },
        () => {
          // If Firestore is offline or disabled, rely on cached rounds
          try {
            const cached = localStorage.getItem('sr_rounds_cache');
            if (cached) {
              const parsed = JSON.parse(cached);
              setRounds(parsed);
              const myActive = parsed.find(
                (r: Round) => r.status === 'in_progress' && (r.supervisorId === appUser.id || appUser.role === 'admin')
              );
              setActiveRound(myActive || null);
            }
          } catch {}
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, [appUser]);

  const startRound = async (type: RoundType): Promise<string> => {
    if (!appUser) throw new Error('يجب تسجيل الدخول لبدء جولة');
    const localId = `round_${Date.now()}`;
    const newRoundData: Round = {
      id: localId,
      type,
      supervisorId: appUser.id,
      supervisorName: appUser.fullName,
      status: 'in_progress',
      startedAt: new Date(),
      createdAt: new Date(),
      observationCount: 0,
      openCount: 0,
      resolvedCount: 0,
      summary: '',
    };

    try {
      const newRoundRef = await addDoc(collection(db, 'rounds'), {
        ...newRoundData,
        startedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      newRoundData.id = newRoundRef.id;
    } catch {
      // safe fallback to localId
    }

    setRounds((prev) => {
      const updated = [newRoundData, ...prev.filter((r) => r.id !== newRoundData.id)];
      try {
        localStorage.setItem('sr_rounds_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setActiveRound(newRoundData);
    return newRoundData.id;
  };

  const finishRound = async (roundId: string, summary?: string): Promise<void> => {
    const targetRound = rounds.find((r) => r.id === roundId) || activeRound;
    const duration = targetRound?.startedAt ? calculateDurationMinutes(targetRound.startedAt, new Date()) : 0;

    try {
      const roundRef = doc(db, 'rounds', roundId);
      await updateDoc(roundRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        durationMinutes: duration,
        summary: summary?.trim() || '',
      });
    } catch {
      // update local
    }

    setRounds((prev) => {
      const updated = prev.map((r) =>
        r.id === roundId
          ? {
              ...r,
              status: 'completed' as const,
              completedAt: new Date(),
              durationMinutes: duration,
              summary: summary?.trim() || '',
            }
          : r
      );
      try {
        localStorage.setItem('sr_rounds_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setActiveRound(null);
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
