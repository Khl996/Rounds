import React, { useState } from 'react';
import { Observation } from '../../types';
import { useObservationUpdates, useObservations } from '../../hooks/useObservations';
import { formatTimeArabic } from '../../utils/formatters';
import { X, Send, AlertCircle } from 'lucide-react';

interface ObservationDetailModalProps {
  observation: Observation | null;
  onClose: () => void;
}

export const ObservationDetailModal: React.FC<ObservationDetailModalProps> = ({
  observation,
  onClose,
}) => {
  const { updates } = useObservationUpdates(observation?.id);
  const { resolveObservation, reopenObservation, addComment } = useObservations();

  const [updateText, setUpdateText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!observation) return null;

  const isOpen = observation.status === 'open';

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addComment(observation.id, updateText.trim());
      setUpdateText('');
    } catch (err: any) {
      setError(err.message || 'تعذر إضافة التحديث');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isOpen) {
        await resolveObservation(observation.id, observation.roundId, 'تمت المعالجة');
      } else {
        await reopenObservation(observation.id, observation.roundId, 'إعادة فتح الملاحظة');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'تعذر تغيير حالة الملاحظة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sky-700 text-sm">
                {observation.categoryName}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-600">
                {observation.locationName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="p-3 mx-4 mt-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Chronological Timeline */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Initial Entry: 09:35 — خالد / لمبة الممر أمام غرفة 12 لا تعمل */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400">
              {formatTimeArabic(observation.createdAt)} — {observation.createdByName}
            </div>
            <p className="text-sm font-medium text-slate-900 leading-snug">
              {observation.description}
            </p>
          </div>

          {/* Chronological updates */}
          {updates.map((upd) => (
            <div key={upd.id} className="space-y-1 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400">
                {formatTimeArabic(upd.createdAt)} — {upd.createdByName}
              </div>
              <p className="text-xs text-slate-800 leading-snug">
                {upd.text}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Area: إضافة تحديث + تمت المعالجة / إعادة فتح */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
          {/* Add update form */}
          <form onSubmit={handleAddUpdate} className="flex gap-2">
            <input
              type="text"
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="إضافة تحديث..."
              className="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={saving || !updateText.trim()}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Action button */}
          <div>
            {isOpen ? (
              <button
                type="button"
                disabled={saving}
                onClick={handleToggleStatus}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                {saving ? 'جاري المعالجة...' : 'تمت المعالجة'}
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleToggleStatus}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                {saving ? 'جاري إعادة الفتح...' : 'إعادة فتح'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
