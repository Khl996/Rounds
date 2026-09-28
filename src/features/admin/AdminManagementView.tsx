import React, { useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import { MasterData } from '../../hooks/useMasterData';
import { AppUser, CategoryItem, LocationItem, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { Sheet } from '../../components/ui/Sheet';
import { ErrorText, Field, inputClass } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { formatCount } from '../../utils/formatters';

type AdminTab = 'users' | 'locations' | 'categories';

type Editing =
  | { kind: 'user'; item?: AppUser }
  | { kind: 'location'; item?: LocationItem }
  | { kind: 'category'; item?: CategoryItem };

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'supervisor', label: 'مشرف' },
  { value: 'admin', label: 'مدير' },
];

export const AdminManagementView: React.FC<{ master: MasterData }> = ({ master }) => {
  const { appUser } = useAuth();
  const { users, loading: usersLoading, error: usersError, updateUser } = useUsers();
  const showToast = useToast();
  const [tab, setTab] = useState<AdminTab>('users');
  const [editing, setEditing] = useState<Editing | null>(null);
  const [seeding, setSeeding] = useState(false);

  const seed = async () => {
    setSeeding(true);
    try {
      await master.seedDefaults();
      showToast('أُضيفت القائمة الأساسية');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'تعذرت الإضافة');
    }
    setSeeding(false);
  };

  const countLabel =
    tab === 'users'
      ? formatCount(users.length, { zero: 'لا يوجد مستخدمون', one: 'مستخدم واحد', two: 'مستخدمان', few: 'مستخدمين', many: 'مستخدمًا' })
      : tab === 'locations'
        ? formatCount(master.locations.length, { zero: 'لا توجد مواقع', one: 'موقع واحد', two: 'موقعان', few: 'مواقع', many: 'موقعًا' })
        : formatCount(master.categories.length, { zero: 'لا توجد تصنيفات', one: 'تصنيف واحد', two: 'تصنيفان', few: 'تصنيفات', many: 'تصنيفًا' });

  const emptyMaster = (tab === 'locations' && master.locations.length === 0) || (tab === 'categories' && master.categories.length === 0);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:pb-12">
      <h1 className="text-xl font-bold text-slate-900">الإدارة</h1>

      <Segmented
        className="mt-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'users', label: 'المستخدمون' },
          { value: 'locations', label: 'المواقع' },
          { value: 'categories', label: 'التصنيفات' },
        ]}
      />

      <div className="mt-5 flex items-center justify-between">
        <p className="px-1 text-sm text-slate-500">{countLabel}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setEditing(tab === 'users' ? { kind: 'user' } : tab === 'locations' ? { kind: 'location' } : { kind: 'category' })
          }
        >
          <Plus className="size-4" />
          إضافة
        </Button>
      </div>

      {(usersError || master.error) && <p className="mt-3 text-sm text-red-600">{tab === 'users' ? usersError : master.error}</p>}

      {tab === 'users' && usersLoading ? null : emptyMaster && !master.loading ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center">
          <p className="text-slate-500">أضف {tab === 'locations' ? 'المواقع' : 'التصنيفات'} يدويًا، أو ابدأ بالقائمة الأساسية.</p>
          <Button variant="secondary" size="sm" className="mt-4" disabled={seeding} onClick={seed}>
            إضافة القائمة الأساسية
          </Button>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {tab === 'users' &&
            users.map((user) => (
              <AdminRow
                key={user.id}
                title={user.id === appUser?.id ? `${user.fullName} (أنت)` : user.fullName}
                subtitle={
                  <>
                    {user.role === 'admin' ? 'مدير' : 'مشرف'} · <span dir="ltr">{user.email}</span>
                  </>
                }
                inactive={!user.active}
                onClick={() => setEditing({ kind: 'user', item: user })}
              />
            ))}
          {tab === 'locations' &&
            master.locations.map((loc) => (
              <AdminRow
                key={loc.id}
                title={loc.name}
                subtitle={[loc.building, loc.floor].filter(Boolean).join(' · ') || undefined}
                inactive={loc.active === false}
                onClick={() => setEditing({ kind: 'location', item: loc })}
              />
            ))}
          {tab === 'categories' &&
            master.categories.map((cat) => (
              <AdminRow
                key={cat.id}
                title={cat.name}
                inactive={cat.active === false}
                onClick={() => setEditing({ kind: 'category', item: cat })}
              />
            ))}
        </div>
      )}

      {editing?.kind === 'user' && (
        <UserSheet
          user={editing.item}
          isSelf={editing.item?.id === appUser?.id}
          onUpdate={updateUser}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === 'location' && (
        <LocationSheet location={editing.item} master={master} onClose={() => setEditing(null)} />
      )}
      {editing?.kind === 'category' && (
        <CategorySheet category={editing.item} master={master} onClose={() => setEditing(null)} />
      )}
    </div>
  );
};

const AdminRow: React.FC<{
  title: string;
  subtitle?: React.ReactNode;
  inactive?: boolean;
  onClick: () => void;
}> = ({ title, subtitle, inactive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-start transition-colors hover:bg-slate-50 active:bg-slate-100"
  >
    <span className="min-w-0">
      <span className={`block truncate text-[15px] ${inactive ? 'text-slate-400' : 'text-slate-900'}`}>{title}</span>
      {subtitle && <span className="mt-0.5 block truncate text-[13px] text-slate-500">{subtitle}</span>}
    </span>
    <span className="flex shrink-0 items-center gap-2 text-slate-400">
      {inactive && <span className="text-xs">معطّل</span>}
      <ChevronLeft className="size-5" />
    </span>
  </button>
);

interface EditSheetProps {
  title: string;
  onClose: () => void;
  onSave: () => Promise<void>;
  /** Activate / deactivate action for existing items. */
  toggle?: { label: string; run: () => Promise<void> };
  children: React.ReactNode;
}

const EditSheet: React.FC<EditSheetProps> = ({ title, onClose, onSave, toggle, children }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ.');
      setBusy(false);
    }
  };

  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <div className="space-y-2">
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit" form="admin-edit-form" size="lg" full disabled={busy}>
            {busy ? 'جارٍ الحفظ…' : 'حفظ'}
          </Button>
          {toggle && (
            <Button variant="ghost" full disabled={busy} onClick={() => run(toggle.run)}>
              {toggle.label}
            </Button>
          )}
        </div>
      }
    >
      <form
        id="admin-edit-form"
        className="space-y-4 pt-1"
        onSubmit={(e) => {
          e.preventDefault();
          run(onSave);
        }}
      >
        {children}
      </form>
    </Sheet>
  );
};

const UserSheet: React.FC<{
  user?: AppUser;
  isSelf: boolean;
  onUpdate: ReturnType<typeof useUsers>['updateUser'];
  onClose: () => void;
}> = ({ user, isSelf, onUpdate: updateUser, onClose }) => {
  const { createUserInSystem } = useAuth();
  const showToast = useToast();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'supervisor');

  const save = async () => {
    if (!fullName.trim()) throw new Error('اكتب الاسم.');
    if (user) {
      await updateUser(user.id, { fullName: fullName.trim(), ...(isSelf ? {} : { role }) });
      showToast('تم الحفظ');
    } else {
      if (!email.trim()) throw new Error('اكتب البريد الإلكتروني.');
      if (password.length < 6) throw new Error('كلمة المرور 6 أحرف على الأقل.');
      await createUserInSystem(fullName.trim(), email.trim(), password, role);
      showToast('أُضيف المستخدم');
    }
    onClose();
  };

  const toggle =
    user && !isSelf
      ? {
          label: user.active ? 'تعطيل الحساب' : 'تفعيل الحساب',
          run: async () => {
            await updateUser(user.id, { active: !user.active });
            showToast(user.active ? 'عُطّل الحساب' : 'فُعّل الحساب');
            onClose();
          },
        }
      : undefined;

  return (
    <EditSheet title={user ? 'تعديل المستخدم' : 'مستخدم جديد'} onClose={onClose} onSave={save} toggle={toggle}>
      <Field label="الاسم">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
      </Field>
      {user ? (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">البريد الإلكتروني</span>
          <p className="text-slate-600" dir="ltr">
            {user.email}
          </p>
        </div>
      ) : (
        <>
          <Field label="البريد الإلكتروني">
            <input
              type="email"
              dir="ltr"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} text-left`}
            />
          </Field>
          <Field label="كلمة المرور">
            <input
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              className={`${inputClass} text-left`}
            />
          </Field>
        </>
      )}
      {!isSelf && (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">الصلاحية</span>
          <Segmented value={role} onChange={setRole} options={ROLE_OPTIONS} />
        </div>
      )}
    </EditSheet>
  );
};

const LocationSheet: React.FC<{ location?: LocationItem; master: MasterData; onClose: () => void }> = ({
  location,
  master,
  onClose,
}) => {
  const showToast = useToast();
  const [name, setName] = useState(location?.name ?? '');
  const [building, setBuilding] = useState(location?.building ?? '');
  const [floor, setFloor] = useState(location?.floor ?? '');

  const save = async () => {
    if (!name.trim()) throw new Error('اكتب اسم الموقع.');
    const data = { name: name.trim(), building: building.trim(), floor: floor.trim() };
    if (location) {
      await master.updateLocation(location.id, data);
    } else {
      await master.addLocation({ ...data, sortOrder: master.locations.length + 1 });
    }
    showToast('تم الحفظ');
    onClose();
  };

  const toggle = location
    ? {
        label: location.active !== false ? 'تعطيل الموقع' : 'تفعيل الموقع',
        run: async () => {
          await master.updateLocation(location.id, { active: location.active === false });
          onClose();
        },
      }
    : undefined;

  return (
    <EditSheet title={location ? 'تعديل الموقع' : 'موقع جديد'} onClose={onClose} onSave={save} toggle={toggle}>
      <Field label="اسم الموقع">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="قسم الطوارئ" className={inputClass} />
      </Field>
      <Field label="المبنى" optional>
        <input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="المبنى الرئيسي" className={inputClass} />
      </Field>
      <Field label="الدور" optional>
        <input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="الدور الأرضي" className={inputClass} />
      </Field>
    </EditSheet>
  );
};

const CategorySheet: React.FC<{ category?: CategoryItem; master: MasterData; onClose: () => void }> = ({
  category,
  master,
  onClose,
}) => {
  const showToast = useToast();
  const [name, setName] = useState(category?.name ?? '');

  const save = async () => {
    if (!name.trim()) throw new Error('اكتب اسم التصنيف.');
    if (category) {
      await master.updateCategory(category.id, { name: name.trim() });
    } else {
      await master.addCategory({ name: name.trim(), sortOrder: master.categories.length + 1 });
    }
    showToast('تم الحفظ');
    onClose();
  };

  const toggle = category
    ? {
        label: category.active !== false ? 'تعطيل التصنيف' : 'تفعيل التصنيف',
        run: async () => {
          await master.updateCategory(category.id, { active: category.active === false });
          onClose();
        },
      }
    : undefined;

  return (
    <EditSheet title={category ? 'تعديل التصنيف' : 'تصنيف جديد'} onClose={onClose} onSave={save} toggle={toggle}>
      <Field label="اسم التصنيف">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="كهرباء" className={inputClass} />
      </Field>
    </EditSheet>
  );
};
