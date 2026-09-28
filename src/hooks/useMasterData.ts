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
import { INITIAL_LOCATIONS, INITIAL_CATEGORIES, seedInitialDataIfNeeded } from '../firebase/seed';

const FALLBACK_LOCATIONS: LocationItem[] = INITIAL_LOCATIONS.map((l, idx) => ({
  id: `loc_${idx + 1}`,
  name: l.name,
  building: l.building,
  floor: l.floor,
  department: l.department,
  sortOrder: l.sortOrder,
  active: true,
}));

const FALLBACK_CATEGORIES: CategoryItem[] = INITIAL_CATEGORIES.map((c, idx) => ({
  id: `cat_${idx + 1}`,
  name: c.name,
  sortOrder: c.sortOrder,
  active: true,
}));

export function useMasterData() {
  const [locations, setLocations] = useState<LocationItem[]>(FALLBACK_LOCATIONS);
  const [categories, setCategories] = useState<CategoryItem[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try auto-seeding if empty on mount
    seedInitialDataIfNeeded().catch(() => {});

    try {
      const locQ = query(collection(db, 'locations'), orderBy('sortOrder', 'asc'));
      const catQ = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));

      const unsubLoc = onSnapshot(
        locQ,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: LocationItem[] = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<LocationItem, 'id'>),
            }));
            setLocations(list);
          }
          setLoading(false);
        },
        () => {
          // On permission / api disabled, use fallback locations
          setLoading(false);
        }
      );

      const unsubCat = onSnapshot(
        catQ,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: CategoryItem[] = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...(docSnap.data() as Omit<CategoryItem, 'id'>),
            }));
            setCategories(list);
          }
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );

      return () => {
        unsubLoc();
        unsubCat();
      };
    } catch {
      setLoading(false);
    }
  }, []);

  const addLocation = async (data: Omit<LocationItem, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'locations'), {
        ...data,
        active: true,
        createdAt: serverTimestamp(),
      });
      setLocations((prev) => [...prev, { id: docRef.id, ...data, active: true }]);
    } catch {
      const localId = `loc_local_${Date.now()}`;
      setLocations((prev) => [...prev, { id: localId, ...data, active: true }]);
    }
  };

  const updateLocation = async (id: string, data: Partial<LocationItem>) => {
    try {
      const ref = doc(db, 'locations', id);
      await updateDoc(ref, data);
    } catch {
      // update local
    }
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, ...data } : loc))
    );
  };

  const toggleLocationActive = async (id: string, currentActive: boolean) => {
    try {
      const ref = doc(db, 'locations', id);
      await updateDoc(ref, { active: !currentActive });
    } catch {
      // update local
    }
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, active: !currentActive } : loc))
    );
  };

  const addCategory = async (data: Omit<CategoryItem, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...data,
        active: true,
        createdAt: serverTimestamp(),
      });
      setCategories((prev) => [...prev, { id: docRef.id, ...data, active: true }]);
    } catch {
      const localId = `cat_local_${Date.now()}`;
      setCategories((prev) => [...prev, { id: localId, ...data, active: true }]);
    }
  };

  const updateCategory = async (id: string, data: Partial<CategoryItem>) => {
    try {
      const ref = doc(db, 'categories', id);
      await updateDoc(ref, data);
    } catch {
      // update local
    }
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...data } : cat))
    );
  };

  const toggleCategoryActive = async (id: string, currentActive: boolean) => {
    try {
      const ref = doc(db, 'categories', id);
      await updateDoc(ref, { active: !currentActive });
    } catch {
      // update local
    }
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, active: !currentActive } : cat))
    );
  };

  const activeLocations = locations.filter((l) => l.active !== false);
  const activeCategories = categories.filter((c) => c.active !== false);

  return {
    locations,
    activeLocations,
    categories,
    activeCategories,
    loading,
    error,
    addLocation,
    updateLocation,
    toggleLocationActive,
    addCategory,
    updateCategory,
    toggleCategoryActive,
    seedNow: seedInitialDataIfNeeded,
  };
}
