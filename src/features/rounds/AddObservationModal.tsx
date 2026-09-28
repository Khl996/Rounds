import React, { useState, useMemo } from 'react';
import { LocationItem, CategoryItem } from '../../types';
import { X, AlertCircle } from 'lucide-react';

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

  const activeLocations = useMemo(
    () => locations.filter((l) => l.active !== false),
    [locations]
  );

  const activeCategories = useMemo(
    () => categories.filter((c) => c.active !== false),
    [categories]
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const loc = activeLocations.find((l) => l.id === selectedLocationId);
    if (!loc) {
      setError('يرجى اختيار الموقع.');
      return;
    }

    const cat = activeCategories.find((c) => c.id === selectedCategoryId);
    if (!cat) {
      setError('يرجى اختيار التصنيف.');
      return;
    }

    if (!description.trim()) {
      setError('يرجى كتابة الملاحظة.');
      return;
    }

    setSaving(true);
    try {
      await onSave(loc, cat, description.trim(), actionTaken.trim() || undefined);
      // Reset form
      setSelectedLocationId('');
      setSelectedCategoryId('');
      setDescription('');
      setActionTaken('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'تعذر حفظ الملاحظة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">إضافة ملاحظة</h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. الموقع * */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              الموقع *
            </label>
            <select
              required
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
            >
              <option value="">— اختر الموقع —</option>
              {activeLocations.map((loc) => {
                // Show simple hierarchy visually: المبنى الرئيسي › الدور الأول › قسم الرجال
                const hierarchy = [loc.building, loc.floor, loc.name]
                  .filter(Boolean)
                  .join(' › ');
                return (
                  <option key={loc.id} value={loc.id}>
                    {hierarchy}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. التصنيف * */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              التصنيف *
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {activeCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border transition-colors text-center truncate cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. الملاحظة * */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              الملاحظة *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف المشكلة الميدانية..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors placeholder:text-slate-400"
            />
          </div>

          {/* 4. الإجراء المتخذ (اختياري) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              الإجراء المتخذ (اختياري)
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="مثال: تم إبلاغ الفني..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors placeholder:text-slate-400"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
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
