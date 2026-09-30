import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  addDoc,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Observation, ObservationUpdate, LocationItem, CategoryItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Stored when an observation is closed or reopened without a note.
export const DEFAULT_RESOLVE_TEXT = 'تم إغلاق الملاحظة';
export const DEFAULT_REOPEN_TEXT = 'تمت إعادة فتح الملاحظة';

export function useObservations() {
  const { appUser } = useAuth();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setObservations([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, 'observations'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setObservations(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data({ serverTimestamps: 'estimate' });
            return {
              id: docSnap.id,
              orderNumber: data.orderNumber,
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
          })
        );
        setLoading(false);
      },
      (firestoreError) => {
        console.error('Observations subscription failed:', firestoreError);
        setError('تعذر تحميل الملاحظات.');
        setObservations([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser]);

  const addObservation = async (
    targetRoundId: string | null | undefined,
    location: LocationItem,
    category: CategoryItem,
    description: string,
    actionTaken?: string
  ): Promise<string> => {
    if (!appUser) throw new Error('سجّل الدخول أولًا.');
    if (!description.trim()) throw new Error('اكتب الملاحظة.');

    const isDirect = !targetRoundId;
    const batch = writeBatch(db);
    const newObsRef = doc(collection(db, 'observations'));

    const nextOrder = !isDirect
      ? observations.filter((o) => o.roundId === targetRoundId).length + 1
      : undefined;

    const payload: Record<string, unknown> = {
      roundId: targetRoundId || null,
      source: isDirect ? 'management' : 'round',
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
    };

    if (nextOrder !== undefined) {
      payload.orderNumber = nextOrder;
    }

    batch.set(newObsRef, payload);

    if (!isDirect && targetRoundId) {
      batch.update(doc(db, 'rounds', targetRoundId), {
        observationCount: increment(1),
        openCount: increment(1),
      });
    }

    try {
      await batch.commit();
    } catch (writeError) {
      console.error('Add observation failed:', writeError);
      throw new Error('لم تُحفظ الملاحظة. تحقق من الاتصال وحاول مرة أخرى.');
    }

    if (actionTaken?.trim()) {
      // Written after the batch (the update rule requires the observation to exist). Not awaited:
      // the observation itself is already saved.
      void addDoc(collection(db, 'observationUpdates'), {
        observationId: newObsRef.id,
        type: 'comment',
        text: `إجراء: ${actionTaken.trim()}`,
        createdBy: appUser.id,
        createdByName: appUser.fullName,
        createdAt: serverTimestamp(),
      }).catch((err: unknown) => {
        console.warn('Initial observation update log non-fatal error:', err);
      });
    }

    return newObsRef.id;
  };

  const resolveObservation = async (
    obs: Observation,
    note?: string,
    activeRoundId?: string | null
  ): Promise<void> => {
    if (!appUser) throw new Error('سجّل الدخول أولًا.');
    if (obs.status === 'resolved') return;

    const batch = writeBatch(db);
    const updatePayload: Record<string, unknown> = {
      status: 'resolved',
      resolvedBy: appUser.id,
      resolvedByName: appUser.fullName,
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (activeRoundId) {
      updatePayload.resolvedDuringRoundId = activeRoundId;
    }

    batch.update(doc(db, 'observations', obs.id), updatePayload);

    const updateText = activeRoundId
      ? 'تمت معالجة الملاحظة أثناء الجولة'
      : (note?.trim() || DEFAULT_RESOLVE_TEXT);

    batch.set(doc(collection(db, 'observationUpdates')), {
      observationId: obs.id,
      type: 'resolved',
      text: updateText,
      createdBy: appUser.id,
      createdByName: appUser.fullName,
      createdAt: serverTimestamp(),
    });

    if (obs.roundId) {
      batch.update(doc(db, 'rounds', obs.roundId), {
        openCount: increment(-1),
        resolvedCount: increment(1),
      });
    }

    try {
      await batch.commit();
    } catch (writeError) {
      console.error('Resolve observation failed:', writeError);
      throw new Error('تعذر إغلاق الملاحظة. حاول مرة أخرى.');
    }
  };

  const reopenObservation = async (obs: Observation, reason?: string): Promise<void> => {
    if (!appUser) throw new Error('سجّل الدخول أولًا.');
    if (obs.status === 'open') return;

    const batch = writeBatch(db);
    batch.update(doc(db, 'observations', obs.id), {
      status: 'open',
      resolvedBy: null,
      resolvedByName: null,
      resolvedAt: null,
      resolvedDuringRoundId: null,
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(collection(db, 'observationUpdates')), {
      observationId: obs.id,
      type: 'reopened',
      text: reason?.trim() || DEFAULT_REOPEN_TEXT,
      createdBy: appUser.id,
      createdByName: appUser.fullName,
      createdAt: serverTimestamp(),
    });

    if (obs.roundId) {
      batch.update(doc(db, 'rounds', obs.roundId), {
        openCount: increment(1),
        resolvedCount: increment(-1),
      });
    }

    try {
      await batch.commit();
    } catch (writeError) {
      console.error('Reopen observation failed:', writeError);
      throw new Error('تعذر إعادة فتح الملاحظة. حاول مرة أخرى.');
    }
  };

  const addComment = async (obsId: string, text: string): Promise<void> => {
    if (!appUser) throw new Error('سجّل الدخول أولًا.');
    if (!text.trim()) return;

    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'observationUpdates')), {
      observationId: obsId,
      type: 'comment',
      text: text.trim(),
      createdBy: appUser.id,
      createdByName: appUser.fullName,
      createdAt: serverTimestamp(),
    });

    batch.update(doc(db, 'observations', obsId), {
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (writeError) {
      console.error('Add observation comment failed:', writeError);
      throw new Error('لم يُحفظ التحديث. حاول مرة أخرى.');
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!observationId) {
      setUpdates([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'observationUpdates'),
      where('observationId', '==', observationId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUpdates(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data({ serverTimestamps: 'estimate' }) as Omit<ObservationUpdate, 'id'>),
          }))
        );
        setLoading(false);
      },
      (firestoreError) => {
        console.error('Observation updates subscription failed:', firestoreError);
        setError('تعذر تحميل السجل.');
        setUpdates([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [observationId]);

  return { updates, loading, error };
}
