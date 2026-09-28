import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Observation, ObservationUpdate, LocationItem, CategoryItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useObservations(roundId?: string) {
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

    const q = roundId
      ? query(
          collection(db, 'observations'),
          where('roundId', '==', roundId),
          orderBy('createdAt', 'asc')
        )
      : query(collection(db, 'observations'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
        setLoading(false);
      },
      (firestoreError) => {
        console.error('Observations subscription failed:', firestoreError);
        setError('تعذر تحميل الملاحظات من قاعدة البيانات.');
        setObservations([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser, roundId]);

  const addObservation = async (
    targetRoundId: string,
    location: LocationItem,
    category: CategoryItem,
    description: string,
    actionTaken?: string
  ): Promise<string> => {
    if (!appUser) throw new Error('يجب تسجيل الدخول لإضافة ملاحظة');
    if (!description.trim()) throw new Error('اكتب الملاحظة قبل الحفظ.');

    const nextOrder = observations.filter((o) => o.roundId === targetRoundId).length + 1;
    const batch = writeBatch(db);
    const newObsRef = doc(collection(db, 'observations'));

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

    batch.update(doc(db, 'rounds', targetRoundId), {
      observationCount: increment(1),
      openCount: increment(1),
    });

    if (actionTaken?.trim()) {
      batch.set(doc(collection(db, 'observationUpdates')), {
        observationId: newObsRef.id,
        type: 'comment',
        text: `إجراء مبدئي أثناء الجولة: ${actionTaken.trim()}`,
        createdBy: appUser.id,
        createdByName: appUser.fullName,
        createdAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
      return newObsRef.id;
    } catch (writeError) {
      console.error('Add observation failed:', writeError);
      throw new Error('تعذر حفظ الملاحظة في قاعدة البيانات.');
    }
  };

  const resolveObservation = async (
    obsId: string,
    targetRoundId: string,
    resolutionNote?: string
  ): Promise<void> => {
    if (!appUser) throw new Error('يجب تسجيل الدخول لمعالجة الملاحظة');

    const batch = writeBatch(db);
    batch.update(doc(db, 'observations', obsId), {
      status: 'resolved',
      resolvedBy: appUser.id,
      resolvedByName: appUser.fullName,
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(collection(db, 'observationUpdates')), {
      observationId: obsId,
      type: 'resolved',
      text: resolutionNote?.trim() || 'تمت معالجة الملاحظة والتأكد من سلامة الموقع',
      createdBy: appUser.id,
      createdByName: appUser.fullName,
      createdAt: serverTimestamp(),
    });

    if (targetRoundId) {
      batch.update(doc(db, 'rounds', targetRoundId), {
        openCount: increment(-1),
        resolvedCount: increment(1),
      });
    }

    try {
      await batch.commit();
    } catch (writeError) {
      console.error('Resolve observation failed:', writeError);
      throw new Error('تعذر حفظ معالجة الملاحظة.');
    }
  };

  const reopenObservation = async (
    obsId: string,
    targetRoundId: string,
    reopenReason?: string
  ): Promise<void> => {
    if (!appUser) throw new Error('يجب تسجيل الدخول لإعادة فتح الملاحظة');

    const batch = writeBatch(db);
    batch.update(doc(db, 'observations', obsId), {
      status: 'open',
      resolvedBy: null,
      resolvedByName: null,
      resolvedAt: null,
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(collection(db, 'observationUpdates')), {
      observationId: obsId,
      type: 'reopened',
      text: reopenReason?.trim() || 'تمت إعادة فتح الملاحظة لمتابعة المعالجة',
      createdBy: appUser.id,
      createdByName: appUser.fullName,
      createdAt: serverTimestamp(),
    });

    if (targetRoundId) {
      batch.update(doc(db, 'rounds', targetRoundId), {
        openCount: increment(1),
        resolvedCount: increment(-1),
      });
    }

    try {
      await batch.commit();
    } catch (writeError) {
      console.error('Reopen observation failed:', writeError);
      throw new Error('تعذر إعادة فتح الملاحظة.');
    }
  };

  const addComment = async (obsId: string, text: string): Promise<void> => {
    if (!appUser) throw new Error('يجب تسجيل الدخول لإضافة تحديث');
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
      throw new Error('تعذر حفظ التحديث.');
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
        setUpdates(snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<ObservationUpdate, 'id'>),
        })));
        setLoading(false);
      },
      (firestoreError) => {
        console.error('Observation updates subscription failed:', firestoreError);
        setError('تعذر تحميل سجل التحديثات.');
        setUpdates([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [observationId]);

  return { updates, loading, error };
}
