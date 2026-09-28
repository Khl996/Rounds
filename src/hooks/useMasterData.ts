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
import { LocationItem, CategoryItem } from '../types';
import { seedInitialDataIfNeeded } from '../firebase/seed';

// Firestore rejects `undefined` field values.
function withoutUndefined<T extends object>(data: T): Partial<T> {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export function useMasterData() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const locQ = query(collection(db, 'locations'), orderBy('sortOrder', 'asc'));
    const catQ = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));

    let locReady = false;
    let catReady = false;
    const markReady = () => {
      if (locReady && catReady) setLoading(false);
    };

    const unsubLoc = onSnapshot(
      locQ,
      (snapshot) => {
        setLocations(snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<LocationItem, 'id'>),
        })));
        locReady = true;
        markReady();
      },
      (firestoreError) => {
        console.error('Locations subscription failed:', firestoreError);
        setError('تعذر تحميل المواقع.');
        locReady = true;
        markReady();
      }
    );

    const unsubCat = onSnapshot(
      catQ,
      (snapshot) => {
        setCategories(snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<CategoryItem, 'id'>),
        })));
        catReady = true;
        markReady();
      },
      (firestoreError) => {
        console.error('Categories subscription failed:', firestoreError);
        setError('تعذر تحميل التصنيفات.');
        catReady = true;
        markReady();
      }
    );

    return () => {
      unsubLoc();
      unsubCat();
    };
  }, []);

  const addLocation = async (data: Omit<LocationItem, 'id' | 'createdAt' | 'active'>) => {
    try {
      await addDoc(collection(db, 'locations'), {
        ...withoutUndefined(data),
        active: true,
        createdAt: serverTimestamp(),
      });
    } catch (writeError) {
      console.error('Add location failed:', writeError);
      throw new Error('تعذر إضافة الموقع.');
    }
  };

  const updateLocation = async (id: string, data: Partial<Omit<LocationItem, 'id'>>) => {
    try {
      await updateDoc(doc(db, 'locations', id), withoutUndefined(data));
    } catch (writeError) {
      console.error('Update location failed:', writeError);
      throw new Error('تعذر حفظ الموقع.');
    }
  };

  const addCategory = async (data: Omit<CategoryItem, 'id' | 'createdAt' | 'active'>) => {
    try {
      await addDoc(collection(db, 'categories'), {
        ...withoutUndefined(data),
        active: true,
        createdAt: serverTimestamp(),
      });
    } catch (writeError) {
      console.error('Add category failed:', writeError);
      throw new Error('تعذر إضافة التصنيف.');
    }
  };

  const updateCategory = async (id: string, data: Partial<Omit<CategoryItem, 'id'>>) => {
    try {
      await updateDoc(doc(db, 'categories', id), withoutUndefined(data));
    } catch (writeError) {
      console.error('Update category failed:', writeError);
      throw new Error('تعذر حفظ التصنيف.');
    }
  };

  const seedDefaults = async () => {
    try {
      await seedInitialDataIfNeeded();
    } catch {
      throw new Error('تعذر إضافة القائمة الأساسية.');
    }
  };

  return {
    locations,
    activeLocations: locations.filter((l) => l.active !== false),
    categories,
    activeCategories: categories.filter((c) => c.active !== false),
    loading,
    error,
    addLocation,
    updateLocation,
    addCategory,
    updateCategory,
    seedDefaults,
  };
}

export type MasterData = ReturnType<typeof useMasterData>;
