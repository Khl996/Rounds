import React, { useState, useEffect } from 'react';
import { useMasterData } from '../../hooks/useMasterData';
import { useAuth } from '../../contexts/AuthContext';
import { LocationItem, CategoryItem, AppUser, UserRole } from '../../types';
import { collection, onSnapshot, query, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  MapPin,
  Tag,
  Users,
  Plus,
  Check,
  X,
  AlertCircle,
  Database,
  Building,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { formatDateArabic } from '../../utils/formatters';

export const AdminManagementView: React.FC = () => {
  const { createUserInSystem } = useAuth();
  const {
    locations,
    categories,
    addLocation,
    updateLocation,
    toggleLocationActive,
    addCategory,
    updateCategory,
    toggleCategoryActive,
    seedNow,
  } = useMasterData();

  const [activeTab, setActiveTab] = useState<'locations' | 'categories' | 'users'>('locations');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Locations modal / form state
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [locName, setLocName] = useState('');
  const [locBuilding, setLocBuilding] = useState('');
  const [locFloor, setLocFloor] = useState('');
  const [locDept, setLocDept] = useState('');

  // Categories modal / form state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [catName, setCatName] = useState('');

  // Users modal / form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('supervisor');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch users collection
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: AppUser[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<AppUser, 'id'>),
        }));
        setUsers(list);
        setUsersLoading(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setUsersLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleAddLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addLocation({
        name: locName.trim(),
        building: locBuilding.trim() || undefined,
        floor: locFloor.trim() || undefined,
        department: locDept.trim() || undefined,
        active: true,
        sortOrder: locations.length + 1,
      });
      setLocName('');
      setLocBuilding('');
      setLocFloor('');
      setLocDept('');
      setShowAddLocation(false);
      setMessage('تمت إضافة الموقع بنجاح');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'تعذر إضافة الموقع');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addCategory({
        name: catName.trim(),
        active: true,
        sortOrder: categories.length + 1,
      });
      setCatName('');
      setShowAddCategory(false);
      setMessage('تمت إضافة التصنيف بنجاح');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'تعذر إضافة التصنيف');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName.trim() || !userEmail.trim() || !userPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (userPassword.length < 6) {
      setError('كلمة المرور يجب ألا تقل عن 6 خانات');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createUserInSystem(userFullName, userEmail, userPassword, userRole);
      setUserFullName('');
      setUserEmail('');
      setUserPassword('');
      setUserRole('supervisor');
      setShowAddUser(false);
      setMessage('تم إنشاء حساب المستخدم في النظام بنجاح ويمكنه تسجيل الدخول فوراً');
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'تعذر إنشاء المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserRole = async (targetUser: AppUser) => {
    try {
      const nextRole: UserRole = targetUser.role === 'admin' ? 'supervisor' : 'admin';
      await updateDoc(doc(db, 'users', targetUser.id), { role: nextRole });
      setMessage(`تم تغيير صلاحية ${targetUser.fullName} إلى ${nextRole === 'admin' ? 'مدير' : 'مشرف'}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError('تعذر تغيير الدور');
    }
  };

  const handleToggleUserActive = async (targetUser: AppUser) => {
    try {
      const nextActive = !targetUser.active;
      await updateDoc(doc(db, 'users', targetUser.id), { active: nextActive });
      setMessage(`تم ${nextActive ? 'تفعيل' : 'إيقاف'} حساب ${targetUser.fullName}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError('تعذر تغيير حالة الحساب');
    }
  };

  const handleSeedDefaults = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await seedNow();
      setMessage(`تم فحص وتهيئة البيانات: ${res.locationsCount} موقع و ${res.categoriesCount} تصنيف.`);
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError('تعذر تهيئة البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">لوحة إدارة النظام</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            إدارة المواقع الميدانية، التصنيفات، والمستخدمين المصرح لهم
          </p>
        </div>

        <button
          onClick={handleSeedDefaults}
          disabled={submitting}
          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          title="التأكد من وجود المواقع والتصنيفات الافتراضية"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>تهيئة البيانات الافتراضية</span>
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'locations'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>إدارة المواقع ({locations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-4 h-4 text-emerald-600" />
          <span>التصنيفات ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>المستخدمون ({users.length})</span>
        </button>
      </div>

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              تظهر هذه المواقع في قوائم الاختيار السريع أثناء تسجيل الملاحظات
            </p>
            <button
              onClick={() => setShowAddLocation(true)}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موقع جديد</span>
            </button>
          </div>

          {/* Add Location Modal */}
          {showAddLocation && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">إضافة موقع جديد</h3>
                <button
                  onClick={() => setShowAddLocation(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddLocationSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموقع *</label>
                    <input
                      type="text"
                      required
                      value={locName}
                      onChange={(e) => setLocName(e.target.value)}
                      placeholder="مثال: قسم الطوارئ"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">المبنى (اختياري)</label>
                    <input
                      type="text"
                      value={locBuilding}
                      onChange={(e) => setLocBuilding(e.target.value)}
                      placeholder="مثال: المبنى الرئيسي"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الدور (اختياري)</label>
                    <input
                      type="text"
                      value={locFloor}
                      onChange={(e) => setLocFloor(e.target.value)}
                      placeholder="مثال: الدور الأرضي"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">القسم (اختياري)</label>
                    <input
                      type="text"
                      value={locDept}
                      onChange={(e) => setLocDept(e.target.value)}
                      placeholder="مثال: الطوارئ"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    حفظ الموقع
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddLocation(false)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Locations List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {locations.map((loc) => {
                const isActive = loc.active !== false;
                return (
                  <div
                    key={loc.id}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 ${
                      !isActive ? 'bg-slate-50/70 opacity-60' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{loc.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          {loc.building || 'عام'} {loc.floor ? `• ${loc.floor}` : ''}{' '}
                          {loc.department ? `• ${loc.department}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleLocationActive(loc.id, isActive)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>نشط</span>
                          </>
                        ) : (
                          <span>معطل</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              تصنيفات الأعمال الميدانية (صيانة، نظافة، سلامة...)
            </p>
            <button
              onClick={() => setShowAddCategory(true)}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تصنيف جديد</span>
            </button>
          </div>

          {/* Add Category Form */}
          {showAddCategory && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">إضافة تصنيف جديد</h3>
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCategorySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم التصنيف *</label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="مثال: أمن وسلامة"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    حفظ التصنيف
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const isActive = cat.active !== false;
              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isActive ? 'bg-white border-slate-200' : 'bg-slate-50/70 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      <Tag className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{cat.name}</span>
                  </div>

                  <button
                    onClick={() => toggleCategoryActive(cat.id, isActive)}
                    className={`py-1 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>نشط</span>
                      </>
                    ) : (
                      <span>معطل</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              إدارة مستخدمي ومُشرفي جولات الصيانة (التسجيل يتم من داخل النظام فقط)
            </p>
            <button
              onClick={() => setShowAddUser(true)}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </button>
          </div>

          {/* Add User Modal */}
          {showAddUser && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">إنشاء حساب مستخدم جديد بالنظام</h3>
                </div>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                    <input
                      type="text"
                      required
                      value={userFullName}
                      onChange={(e) => setUserFullName(e.target.value)}
                      placeholder="مثال: سعود العتيبي"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      required
                      dir="ltr"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="name@hospital.sa"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور *</label>
                    <input
                      type="password"
                      required
                      dir="ltr"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="•••••••• (6 خانات على الأقل)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الدور والصلاحية *</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                    >
                      <option value="supervisor">مشرف صيانة ميداني</option>
                      <option value="admin">مدير نظام</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    حفظ وإنشاء المستخدم
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {usersLoading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500 font-semibold animate-pulse">جاري تحميل المستخدمين...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
              {users.map((u) => {
                const isAdm = u.role === 'admin';
                const isActive = u.active !== false;

                return (
                  <div
                    key={u.id}
                    className={`p-4 flex flex-wrap items-center justify-between gap-3 ${
                      !isActive ? 'bg-slate-50 opacity-60' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isAdm
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isAdm ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{u.fullName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAdm
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isAdm ? 'مدير النظام' : 'مشرف ميداني'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleUserRole(u)}
                        className="py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        title="تغيير بين مدير ومشرف"
                      >
                        تبديل إلى {isAdm ? 'مشرف' : 'مدير'}
                      </button>

                      <button
                        onClick={() => handleToggleUserActive(u)}
                        className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                        }`}
                      >
                        {isActive ? 'نشط' : 'موقوف'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
