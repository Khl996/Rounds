import React, { useState, useEffect } from 'react';
import { useMasterData } from '../../hooks/useMasterData';
import { useAuth } from '../../contexts/AuthContext';
import { LocationItem, CategoryItem, AppUser, UserRole } from '../../types';
import { collection, onSnapshot, query, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Check, X, AlertCircle, Edit2 } from 'lucide-react';

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
  } = useMasterData();

  // 3 tabs: المستخدمون / المواقع / التصنيفات
  const [activeTab, setActiveTab] = useState<'users' | 'locations' | 'categories'>('users');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Forms
  const [showAddUser, setShowAddUser] = useState(false);
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('supervisor');

  const [showAddLocation, setShowAddLocation] = useState(false);
  const [locName, setLocName] = useState('');
  const [locBuilding, setLocBuilding] = useState('');
  const [locFloor, setLocFloor] = useState('');

  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editLocName, setEditLocName] = useState('');

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [catName, setCatName] = useState('');

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setUsers(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AppUser, 'id'>),
          }))
        );
        setUsersLoading(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setUsersLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFullName.trim() || !userEmail.trim() || !userPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createUserInSystem(
        userFullName.trim(),
        userEmail.trim(),
        userPassword,
        userRole
      );
      setUserFullName('');
      setUserEmail('');
      setUserPassword('');
      setShowAddUser(false);
      setMessage('تم إنشاء المستخدم بنجاح');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'تعذر إنشاء المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserActive = async (user: AppUser) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        active: !user.active,
      });
      setMessage('تم تحديث حالة المستخدم');
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      setError('تعذر تحديث حالة المستخدم');
    }
  };

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
        active: true,
        sortOrder: locations.length + 1,
      });
      setLocName('');
      setLocBuilding('');
      setLocFloor('');
      setShowAddLocation(false);
      setMessage('تمت إضافة الموقع بنجاح');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'تعذر إضافة الموقع');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEditLocation = async (id: string) => {
    if (!editLocName.trim()) return;
    try {
      await updateLocation(id, { name: editLocName.trim() });
      setEditingLocationId(null);
      setMessage('تم تعديل الموقع');
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      setError('تعذر تعديل الموقع');
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

  const handleSaveEditCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    try {
      await updateCategory(id, { name: editCatName.trim() });
      setEditingCategoryId(null);
      setMessage('تم تعديل التصنيف');
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      setError('تعذر تعديل التصنيف');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">لوحة الإدارة</h1>
        <p className="text-xs text-slate-500 mt-0.5">إدارة المستخدمين والمواقع والتصنيفات</p>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Tabs: المستخدمون / المواقع / التصنيفات */}
      <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          المستخدمون
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'locations'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          المواقع
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          التصنيفات
        </button>
      </div>

      {/* TAB 1: المستخدمون */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700">قائمة المستخدمين ({users.length})</h2>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مستخدم</span>
            </button>
          </div>

          {/* Add User Form */}
          {showAddUser && (
            <form onSubmit={handleAddUserSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">إضافة مستخدم جديد</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    placeholder="م. أحمد محمد"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="user@hospital.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">الدور *</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="supervisor">مشرف ميداني</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  {submitting ? 'جاري الإنشاء...' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {usersLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">جاري التحميل...</div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">لا يوجد مستخدمون مسجلون.</div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{u.fullName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        {u.role === 'admin' ? 'مدير' : 'مشرف'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{u.email}</span>
                  </div>

                  <button
                    onClick={() => handleToggleUserActive(u)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      u.active
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {u.active ? 'نشط' : 'معطل'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: المواقع */}
      {activeTab === 'locations' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700">قائمة المواقع ({locations.length})</h2>
            <button
              onClick={() => setShowAddLocation(!showAddLocation)}
              className="py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة موقع</span>
            </button>
          </div>

          {/* Add Location Form */}
          {showAddLocation && (
            <form onSubmit={handleAddLocationSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">إضافة موقع ميداني جديد</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">اسم الموقع *</label>
                  <input
                    type="text"
                    required
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    placeholder="قسم الطوارئ"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">المبنى</label>
                  <input
                    type="text"
                    value={locBuilding}
                    onChange={(e) => setLocBuilding(e.target.value)}
                    placeholder="المبنى الرئيسي"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">الدور</label>
                  <input
                    type="text"
                    value={locFloor}
                    onChange={(e) => setLocFloor(e.target.value)}
                    placeholder="الدور الأرضي"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLocation(false)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Locations List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {locations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">لا توجد مواقع مسجلة.</div>
            ) : (
              locations.map((loc) => {
                const isEditing = editingLocationId === loc.id;
                return (
                  <div key={loc.id} className="p-3 flex items-center justify-between text-xs">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 ml-2">
                        <input
                          type="text"
                          value={editLocName}
                          onChange={(e) => setEditLocName(e.target.value)}
                          className="px-2.5 py-1.5 rounded border border-slate-300 text-xs flex-1"
                        />
                        <button
                          onClick={() => handleSaveEditLocation(loc.id)}
                          className="px-2.5 py-1.5 bg-sky-600 text-white rounded text-xs font-bold"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingLocationId(null)}
                          className="px-2 py-1.5 bg-slate-100 text-slate-600 rounded text-xs"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{loc.name}</span>
                          <button
                            onClick={() => {
                              setEditingLocationId(loc.id);
                              setEditLocName(loc.name);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title="تعديل الاسم"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        {(loc.building || loc.floor) && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {[loc.building, loc.floor].filter(Boolean).join(' › ')}
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => toggleLocationActive(loc.id, loc.active !== false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        loc.active !== false
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {loc.active !== false ? 'نشط' : 'معطل'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: التصنيفات */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700">قائمة التصنيفات ({categories.length})</h2>
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة تصنيف</span>
            </button>
          </div>

          {/* Add Category Form */}
          {showAddCategory && (
            <form onSubmit={handleAddCategorySubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">إضافة تصنيف جديد</h3>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">اسم التصنيف *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="أعمال سباكة"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Categories List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {categories.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">لا توجد تصنيفات مسجلة.</div>
            ) : (
              categories.map((cat) => {
                const isEditing = editingCategoryId === cat.id;
                return (
                  <div key={cat.id} className="p-3 flex items-center justify-between text-xs">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 ml-2">
                        <input
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="px-2.5 py-1.5 rounded border border-slate-300 text-xs flex-1"
                        />
                        <button
                          onClick={() => handleSaveEditCategory(cat.id)}
                          className="px-2.5 py-1.5 bg-sky-600 text-white rounded text-xs font-bold"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingCategoryId(null)}
                          className="px-2 py-1.5 bg-slate-100 text-slate-600 rounded text-xs"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{cat.name}</span>
                        <button
                          onClick={() => {
                            setEditingCategoryId(cat.id);
                            setEditCatName(cat.name);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                          title="تعديل الاسم"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => toggleCategoryActive(cat.id, cat.active !== false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                        cat.active !== false
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {cat.active !== false ? 'نشط' : 'معطل'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
