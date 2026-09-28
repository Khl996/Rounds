import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const INITIAL_LOCATIONS = [
  { name: 'العيادات الخارجية', building: 'المبنى الرئيسي', floor: 'الدور الأرضي', department: 'العيادات', sortOrder: 1 },
  { name: 'قسم الطوارئ', building: 'المبنى الرئيسي', floor: 'الدور الأرضي', department: 'الطوارئ', sortOrder: 2 },
  { name: 'قسم تنويم الرجال', building: 'المبنى الرئيسي', floor: 'الدور الأول', department: 'التنويم', sortOrder: 3 },
  { name: 'قسم تنويم النساء والأطفال', building: 'المبنى الرئيسي', floor: 'الدور الأول', department: 'التنويم', sortOrder: 4 },
  { name: 'العناية المركزة (ICU)', building: 'المبنى الرئيسي', floor: 'الدور الثاني', department: 'الحرجة', sortOrder: 5 },
  { name: 'غرف العمليات الجراحية', building: 'المبنى الرئيسي', floor: 'الدور الثاني', department: 'العمليات', sortOrder: 6 },
  { name: 'الإدارة الطبية والمكاتب', building: 'المبنى الإداري', floor: 'الدور الأول', department: 'الإدارة', sortOrder: 7 },
  { name: 'المستودع والمخازن الطبية', building: 'المبنى المساند', floor: 'الدور الأرضي', department: 'المستودعات', sortOrder: 8 },
  { name: 'المطبخ المركزي والتغذية', building: 'المبنى المساند', floor: 'الدور الأرضي', department: 'التغذية', sortOrder: 9 },
  { name: 'محطة التكييف والتبريد والمحولات', building: 'المبنى الفني', floor: 'القبو', department: 'الخدمات الفنية', sortOrder: 10 }
];

export const INITIAL_CATEGORIES = [
  { name: 'كهرباء', sortOrder: 1 },
  { name: 'تكييف وتبريد', sortOrder: 2 },
  { name: 'سباكة', sortOrder: 3 },
  { name: 'مدني', sortOrder: 4 },
  { name: 'نظافة', sortOrder: 5 },
  { name: 'سلامة', sortOrder: 6 },
  { name: 'أخرى', sortOrder: 7 }
];

export async function seedInitialDataIfNeeded(): Promise<{ locationsCount: number; categoriesCount: number }> {
  try {
    const locationsCol = collection(db, 'locations');
    const categoriesCol = collection(db, 'categories');

    const [locSnap, catSnap] = await Promise.all([
      getDocs(locationsCol),
      getDocs(categoriesCol)
    ]);

    let locationsCount = locSnap.size;
    let categoriesCount = catSnap.size;

    const batch = writeBatch(db);
    let needCommit = false;

    if (locSnap.empty) {
      for (const loc of INITIAL_LOCATIONS) {
        const newRef = doc(locationsCol);
        batch.set(newRef, {
          ...loc,
          active: true,
          createdAt: serverTimestamp()
        });
      }
      locationsCount = INITIAL_LOCATIONS.length;
      needCommit = true;
    }

    if (catSnap.empty) {
      for (const cat of INITIAL_CATEGORIES) {
        const newRef = doc(categoriesCol);
        batch.set(newRef, {
          ...cat,
          active: true,
          createdAt: serverTimestamp()
        });
      }
      categoriesCount = INITIAL_CATEGORIES.length;
      needCommit = true;
    }

    if (needCommit) {
      await batch.commit();
    }

    return { locationsCount, categoriesCount };
  } catch (error) {
    console.error('Seed initial data error:', error);
    throw error;
  }
}
