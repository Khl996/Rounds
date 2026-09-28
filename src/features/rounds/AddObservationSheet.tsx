import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { CategoryItem, LocationItem } from '../../types';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { ErrorText, Field, inputClass } from '../../components/ui/Field';

interface AddObservationSheetProps {
  locations: LocationItem[];
  categories: CategoryItem[];
  /** Pre-selected location: supervisors often record several issues in the same place. */
  initialLocationId?: string;
  onClose: () => void;
  onSave: (location: LocationItem, category: CategoryItem, description: string, actionTaken?: string) => Promise<void>;
}

function locationLabel(loc: LocationItem): string {
  return loc.floor ? `${loc.name} — ${loc.floor}` : loc.name;
}

export const AddObservationSheet: React.FC<AddObservationSheetProps> = ({
  locations,
  categories,
  initialLocationId,
  onClose,
  onSave,
}) => {
  const [locationId, setLocationId] = useState(
    initialLocationId && locations.some((l) => l.id === initialLocationId) ? initialLocationId : ''
  );
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [showAction, setShowAction] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group by building so each option can stay short.
  const groups = useMemo(() => {
    const map = new Map<string, LocationItem[]>();
    for (const loc of locations) {
      const key = loc.building || '';
      map.set(key, [...(map.get(key) || []), loc]);
    }
    return [...map.entries()];
  }, [locations]);

  const save = async () => {
    const location = locations.find((l) => l.id === locationId);
    const category = categories.find((c) => c.id === categoryId);
    if (!location) return setError('اختر الموقع.');
    if (!category) return setError('اختر النوع.');
    if (!description.trim()) return setError('اكتب الملاحظة.');

    setSaving(true);
    setError(null);
    try {
      await onSave(location, category, description.trim(), actionTaken.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'لم تُحفظ الملاحظة.');
      setSaving(false);
    }
  };

  if (locations.length === 0 || categories.length === 0) {
    return (
      <Sheet title="ملاحظة جديدة" onClose={onClose}>
        <p className="py-4 text-slate-600">
          لم تُضف {locations.length === 0 ? 'المواقع' : 'الأنواع'} بعد. اطلب من مدير النظام إضافتها من صفحة الإدارة.
        </p>
      </Sheet>
    );
  }

  return (
    <Sheet
      title="ملاحظة جديدة"
      onClose={onClose}
      footer={
        <div className="space-y-3">
          {error && <ErrorText>{error}</ErrorText>}
          <Button size="lg" full onClick={save} disabled={saving}>
            {saving ? 'جارٍ الحفظ…' : 'حفظ'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pt-1">
        <Field label="الموقع">
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className={`${inputClass} appearance-auto`}
          >
            <option value="" disabled>
              اختر الموقع
            </option>
            {groups.map(([building, items]) =>
              building ? (
                <optgroup key={building} label={building}>
                  {items.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {locationLabel(loc)}
                    </option>
                  ))}
                </optgroup>
              ) : (
                items.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {locationLabel(loc)}
                  </option>
                ))
              )
            )}
          </select>
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">النوع</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="النوع">
            {categories.map((cat) => {
              const selected = cat.id === categoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategoryId(cat.id)}
                  className={`h-11 cursor-pointer rounded-full border px-4 text-[15px] transition-colors ${
                    selected
                      ? 'border-sky-600 bg-sky-600 font-medium text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="الملاحظة">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="مثال: لمبة الممر أمام غرفة 12 لا تعمل"
            className={`${inputClass} min-h-28 resize-none text-[17px] leading-relaxed`}
          />
        </Field>

        {showAction ? (
          <Field label="الإجراء" optional>
            <input
              type="text"
              autoFocus
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="مثال: تم إبلاغ فني الكهرباء"
              className={inputClass}
            />
          </Field>
        ) : (
          <button
            type="button"
            onClick={() => setShowAction(true)}
            className="-ms-1 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-1 text-[15px] font-medium text-sky-700"
          >
            <Plus className="size-4" />
            أضف إجراء
          </button>
        )}
      </div>
    </Sheet>
  );
};
