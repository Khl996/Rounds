import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Observation, ObservationUpdate, LocationItem, CategoryItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

function getStoredObservations(): Observation[] {
  try {
    const cached = localStorage.getItem('sr_obs_cache');
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function saveStoredObservations(list: Observation[]) {
  try {
    localStorage.setItem('sr_obs_cache', JSON.stringify(list));
  } catch {}
}

export function useObservations(roundId?: string) {
  const { appUser } = useAuth();
  const [observations, setObservations] = useState<Observation[]>(() => {
    const all = getStoredObservations();
    return roundId ? all.filter((o) => o.roundId === roundId) : all;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setObservations([]);
      setLoading(false);
      return;
    }

    try {
      let q;
      if (roundId) {
        q = query(
          collection(db, 'observations'),
          where('roundId', '==', roundId),
          orderBy('createdAt', 'asc')
        );
      } else {
        q = query(collection(db, 'observations'), orderBy('createdAt', 'desc'));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Observation[] = snapshot.docs.map((docSnap, index) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                orderNumber: data.orderNumber || index + 1,
                roundId: data.roundId,
                locationId: data.locationId,
                locationName: data.locationName || '',
                categoryId: data.categoryId,
                categoryName: data.categoryName || '',
                description: data.description || '',
                actionTaken: data.actionTaken || '',
                status: data.status || 'open',
                createdBy: data.createdBy,
                createdByName: data.createdByName || '',
                createdAt: data.createdAt,
                resolvedBy: data.resolvedBy,
                resolvedByName: data.resolvedByName,
                resolvedAt: data.resolvedAt,
                updatedAt: data.updatedAt,
              };
            });
            setObservations(list);
            saveStoredObservations(list);
          }
          setLoading(false);
        },
        () => {
          // Fallback to local cache
          const all = getStoredObservations();
          setObservations(roundId ? all.filter((o) => o.roundId === roundId) : all);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, [appUser, roundId]);

  const addObservation = async (
    targetRoundId: string,
    location: LocationItem,
    category: CategoryItem,
    description: string,
    actionTaken?: string
  ): Promise<string> => {
    if (!appUser) throw new Error('يجب تسجيل الدخول لإضافة ملاحظة');

    const localId = `obs_${Date.now()}`;
    const nextOrder = observations.filter((o) => o.roundId === targetRoundId).length + 1;

    const newObs: Observation = {
      id: localId,
      roundId: targetRoundId,
      orderNumber: nextOrder,
      locationId: location.id,
      locationName: location.name,
      categoryId: category.id,
      categoryName: category.name,
      description: description.trim(),
      actionTaken: actionTaken?.trim() || '',
      status: 'open',
      createdBy: appUser.id,
      createdByName: appUser.fullName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const batch = writeBatch(db);
      const obsCol = collection(db, 'observations');
      const newObsRef = doc(obsCol);
      newObs.id = newObsRef.id;

      batch.set(newObsRef, {
        roundId: targetRoundId,
        orderNumber: nextOrder,
        locationId: location.id,
        locationName: location.name,
        categoryId: category.id,
        categoryName: category.name,
        description: description.trim(),
        actionTaken: actionTaken?.trim() || '',
        status: 'open',
        createdBy: appUser.id,
        createdByName: appUser.fullName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const roundRef = doc(db, 'rounds', targetRoundId);
      batch.update(roundRef, {
        observationCount: increment(1),
        openCount: increment(1),
      });

      if (actionTaken && actionTaken.trim()) {
        const updateRef = doc(collection(db, 'observationUpdates'));
        batch.set(updateRef, {
          observationId: newObsRef.id,
          type: 'comment',
          text: `إجراء مبدئي أثناء الجولة: ${actionTaken.trim()}`,
          createdBy: appUser.id,
          createdByName: appUser.fullName,
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();
    } catch {
      // Local fallback handled smoothly
    }

    setObservations((prev) => {
      const updated = [newObs, ...prev];
      const allCached = getStoredObservations();
      saveStoredObservations([newObs, ...allCached.filter((o) => o.id !== newObs.id)]);
      return updated;
    });

    return newObs.id;
  };

  const resolveObservation = async (
    obsId: string,
    targetRoundId: string,
    resolutionNote?: string
  ): Promise<void> => {
    if (!appUser) throw new Error('يجب تسجيل الدخول لمعالجة الملاحظة');

    try {
      const batch = writeBatch(db);
      const obsRef = doc(db, 'observations', obsId);

      batch.update(obsRef, {
        status: 'resolved',
        resolvedBy: appUser.id,
        resolvedByName: appUser.fullName,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const updateRef = doc(collection(db, 'observationUpdates'));
      batch.set(updateRef, {
        observationId: obsId,
        type: 'resolved',
        text: resolutionNote?.trim() || 'تمت معالجة الملاحظة والتأكد من سلامة الموقع',
        createdBy: appUser.id,
        createdByName: appUser.fullName,
        createdAt: serverTimestamp(),
      });

      if (targetRoundId) {
        const roundRef = doc(db, 'rounds', targetRoundId);
        batch.update(roundRef, {
          openCount: increment(-1),
          resolvedCount: increment(1),
        });
      }

      await batch.commit();
    } catch {
      // Local fallback
    }

    setObservations((prev) => {
      const updated = prev.map((o) =>
        o.id === obsId
          ? {
              ...o,
              status: 'resolved' as const,
              resolvedBy: appUser.id,
              resolvedByName: appUser.fullName,
              resolvedAt: new Date(),
              updatedAt: new Date(),
            }
          : o
      );
      const allCached = getStoredObservations();
      saveStoredObservations(
        allCached.map((o) => (o.id === obsId ? { ...o, status: 'resolved' as const, resolvedByName: appUser.fullName } : o))
      );
      return updated;
    });
  };

  const reopenObservation = async (
    obsId: string,
    targetRoundId: string,
    reopenReason?: string
  ): Promise<void> => {
    if (!appUser) throw new Error('يجب تسجيل الدخول لإعادة فتح الملاحظة');

    try {
      const batch = writeBatch(db);
      const obsRef = doc(db, 'observations', obsId);

      batch.update(obsRef, {
        status: 'open',
        resolvedBy: null,
        resolvedByName: null,
        resolvedAt: null,
        updatedAt: serverTimestamp(),
      });

      const updateRef = doc(collection(db, 'observationUpdates'));
      batch.set(updateRef, {
        observationId: obsId,
        type: 'reopened',
        text: reopenReason?.trim() || 'تمت إعادة فتح الملاحظة لمتابعة المعالجة',
        createdBy: appUser.id,
        createdByName: appUser.fullName,
        createdAt: serverTimestamp(),
      });

      if (targetRoundId) {
        const roundRef = doc(db, 'rounds', targetRoundId);
        batch.update(roundRef, {
          openCount: increment(1),
          resolvedCount: increment(-1),
        });
      }

      await batch.commit();
    } catch {
      // Local fallback
    }

    setObservations((prev) => {
      const updated = prev.map((o) =>
        o.id === obsId
          ? {
              ...o,
              status: 'open' as const,
              resolvedBy: undefined,
              resolvedByName: undefined,
              resolvedAt: undefined,
              updatedAt: new Date(),
            }
          : o
      );
      const allCached = getStoredObservations();
      saveStoredObservations(
        allCached.map((o) => (o.id === obsId ? { ...o, status: 'open' as const } : o))
      );
      return updated;
    });
  };

  const addComment = async (obsId: string, text: string): Promise<void> => {
    if (!appUser) throw new Error('يجب تسجيل الدخول لإضافة تحديث');
    if (!text.trim()) return;

    try {
      const batch = writeBatch(db);
      const updateRef = doc(collection(db, 'observationUpdates'));

      batch.set(updateRef, {
        observationId: obsId,
        type: 'comment',
        text: text.trim(),
        createdBy: appUser.id,
        createdByName: appUser.fullName,
        createdAt: serverTimestamp(),
      });

      const obsRef = doc(db, 'observations', obsId);
      batch.update(obsRef, {
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch {
      // Local fallback
    }
  };

  return {
    observations,
    loading,
    error,
    addObservation,
    resolveObservation,
    reopenObservation,
    addComment,
  };
}

export function useObservationUpdates(observationId?: string) {
  const [updates, setUpdates] = useState<ObservationUpdate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!observationId) {
      setUpdates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'observationUpdates'),
        where('observationId', '==', observationId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: ObservationUpdate[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ObservationUpdate, 'id'>),
          }));
          setUpdates(list);
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, [observationId]);

  return { updates, loading };
}
