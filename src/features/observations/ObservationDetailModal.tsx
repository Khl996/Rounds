import React, { useState } from 'react';
import { Observation, ObservationUpdate } from '../../types';
import { useObservationUpdates, useObservations } from '../../hooks/useObservations';
import { useAuth } from '../../contexts/AuthContext';
import {
  X,
  MapPin,
  Tag,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  Send,
  Wrench,
  Check,
} from 'lucide-react';
import {
  formatDateTimeArabic,
  formatTimeArabic,
  formatDateArabic,
} from '../../utils/formatters';

interface ObservationDetailModalProps {
  observation: Observation | null;
  onClose: () => void;
  onObservationUpdated?: () => void;
}

export const ObservationDetailModal: React.FC<ObservationDetailModalProps> = ({
  observation,
  onClose,
  onObservationUpdated,
}) => {
  const { appUser } = useAuth();
  const { updates, loading: updatesLoading } = useObservationUpdates(observation?.id);
  const { resolveObservation, reopenObservation, addComment } = useObservations();

  const [commentText, setCommentText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [reopenText, setReopenText] = useState('');
  const [mode, setMode] = useState<'view' | 'resolve' | 'reopen'>('view');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!observation) return null;

  const isOpen = observation.status === 'open';

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await resolveObservation(
        observation.id,
        observation.roundId,
        resolutionText.trim() || undefined
      );
      setMode('view');
      setResolutionText('');
      onObservationUpdated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'تعذر معالجة الملاحظة');
      setSaving(false);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await reopenObservation(
        observation.id,
        observation.roundId,
        reopenText.trim() || undefined
      );
      setMode('view');
      setReopenText('');
      onObservationUpdated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'تعذر إعادة فتح الملاحظة');
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addComment(observation.id, commentText);
      setCommentText('');
      onObservationUpdated?.();
    } catch (err: any) {
      setError(err.message || 'تعذر إضافة التحديث');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                isOpen
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-sky-100 text-sky-800'
              }`}
            >
              #{observation.orderNumber || 1}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">ملاحظة ميدانية</h3>
                {isOpen ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    مفتوحة
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                    تمت المعالجة
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">سجل الملاحظة والتحديثات الميدانية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Meta Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              {observation.locationName}
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              {observation.categoryName}
            </span>
          </div>

          {/* Description Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">نص الملاحظة الميدانية:</span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {observation.description}
            </p>
            {observation.actionTaken && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/70 text-xs text-slate-600">
                <span className="font-bold text-slate-700">الإجراء الميداني الفوري: </span>
                <span>{observation.actionTaken}</span>
              </div>
            )}
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>سُجلت بواسطة: {observation.createdByName}</span>
              <span>{formatDateTimeArabic(observation.createdAt)}</span>
            </div>
          </div>

          {/* If Resolved, show resolved banner */}
          {!isOpen && (
            <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">تمت معالجة هذه الملاحظة بنجاح</p>
                <p className="text-sky-700 mt-0.5">
                  بواسطة: <strong>{observation.resolvedByName || 'المشرف'}</strong> بتاريخ{' '}
                  {formatDateTimeArabic(observation.resolvedAt)}
                </p>
              </div>
            </div>
          )}

          {/* Timeline of Updates (Audit Trail) */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>سجل التحديثات والمعالجة الميدانية ({updates.length})</span>
            </h4>

            {updatesLoading ? (
              <p className="text-xs text-slate-400 animate-pulse">جاري تحميل السجل...</p>
            ) : updates.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                لا توجد تحديثات إضافية بعد. يمكنك إضافة تعليق أو معالجة الملاحظة أدناه.
              </p>
            ) : (
              <div className="space-y-2 border-r-2 border-slate-200 pr-3 mr-1.5">
                {updates.map((up) => {
                  let badge = 'تحديث';
                  let badgeClass = 'bg-slate-100 text-slate-700';

                  if (up.type === 'resolved') {
                    badge = 'تمت المعالجة';
                    badgeClass = 'bg-sky-100 text-sky-800 font-bold';
                  } else if (up.type === 'reopened') {
                    badge = 'إعادة فتح';
                    badgeClass = 'bg-rose-100 text-rose-800 font-bold';
                  }

                  return (
                    <div key={up.id} className="relative group text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${badgeClass}`}>
                            {badge}
                          </span>
                          <span className="font-bold text-slate-800">{up.createdByName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDateTimeArabic(up.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">
                        {up.text || '—'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Comment Input */}
          {mode === 'view' && (
            <form onSubmit={handleAddComment} className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>إضافة تحديث / تعليق ميداني</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="«مثال: تم التنسيق مع فني الصيانة للمباشرة الآن»"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={saving || !commentText.trim()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال</span>
                </button>
              </div>
            </form>
          )}

          {/* Action Resolve Form */}
          {mode === 'resolve' && (
            <form onSubmit={handleResolve} className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900">تأكيد معالجة الملاحظة</span>
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  إلغاء
                </button>
              </div>
              <textarea
                required
                rows={2}
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="«مثال: تم تغيير اللمبة واختبارها والإنارة تعمل بكفاءة»"
                className="w-full px-3 py-2 rounded-xl border border-sky-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ واعتماد المعالجة</span>
              </button>
            </form>
          )}

          {/* Action Reopen Form */}
          {mode === 'reopen' && (
            <form onSubmit={handleReopen} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900">إعادة فتح الملاحظة</span>
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  إلغاء
                </button>
              </div>
              <textarea
                required
                rows={2}
                value={reopenText}
                onChange={(e) => setReopenText(e.target.value)}
                placeholder="«مثال: الخلل تكرر مرة أخرى وتحتاج الصيانة لمتابعة إضافية»"
                className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 bg-white"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>تأكيد إعادة الفتح</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          {isOpen ? (
            <button
              type="button"
              onClick={() => setMode('resolve')}
              disabled={mode === 'resolve'}
              className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تمت المعالجة</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode('reopen')}
              disabled={mode === 'reopen'}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة فتح الملاحظة</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
