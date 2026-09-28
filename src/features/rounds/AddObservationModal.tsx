import React, { useState, useMemo } from 'react';
import { LocationItem, CategoryItem } from '../../types';
import { X, Check, Plus, AlertCircle, MapPin, Tag, Wrench } from 'lucide-react';

interface AddObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationItem[];
  categories: CategoryItem[];
  onSave: (
    location: LocationItem,
    category: CategoryItem,
    description: string,
    actionTaken?: string
  ) => Promise<void>;
}

export const AddObservationModal: React.FC<AddObservationModalProps> = ({
  isOpen,
  onClose,
  locations,
  categories,
  onSave,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group locations by Building / Floor
  const groupedLocations = useMemo(() => {
    const active = locations.filter((l) => l.active !== false);
    const groups: { [groupKey: string]: LocationItem[] } = {};

    active.forEach((loc) => {
      const groupKey = loc.building
        ? `${loc.building}${loc.floor ? ` - ${loc.floor}` : ''}`
        : 'المواقع العامة';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(loc);
    });

    return groups;
  }, [locations]);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.active !== false),
    [categories]
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const loc = locations.find((l) => l.id === selectedLocationId);
    if (!loc) {
      setError('يرجى اختيار الموقع من القائمة.');
      return;
    }

    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (!cat) {
      setError('يرجى اختيار التصنيف.');
      return;
    }

    if (!description.trim()) {
      setError('يرجى كتابة وصف الملاحظة.');
      return;
    }

    setSaving(true);
    try {
      await onSave(loc, cat, description.trim(), actionTaken.trim() || undefined);
      // Reset form
      setDescription('');
      setActionTaken('');
      // Keep category or reset
      onClose();
    } catch (err: any) {
      setError(err.message || 'تعذر حفظ الملاحظة. حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">إضافة ملاحظة جديدة</h3>
              <p className="text-xs text-slate-500 font-medium">تسجيل ملاحظة ميدانية سريعة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Location Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>الموقع الميداني *</span>
            </label>
            <select
              required
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            >
              <option value="">— اختر الموقع —</option>
              {Object.entries(groupedLocations).map(([groupTitle, locs]) => (
                <optgroup key={groupTitle} label={groupTitle}>
                  {locs.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>التصنيف *</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {activeCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all text-center truncate ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
            {!selectedCategoryId && (
              <p className="text-[11px] text-slate-400 mt-1">اضغط لاختيار التصنيف المناسب</p>
            )}
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              وصف الملاحظة *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="«مثال: لمبة الممر أمام غرفة 12 لا تعمل»"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Action Taken Optional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-slate-500" />
              <span>الإجراء المتخذ أثناء الجولة (اختياري)</span>
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="«مثال: تم إبلاغ فني الكهرباء»"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors placeholder:text-slate-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>حفظ الملاحظة</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
