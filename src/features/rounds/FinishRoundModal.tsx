import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface FinishRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (summary?: string) => Promise<void>;
  openCount: number;
  totalCount: number;
}

export const FinishRoundModal: React.FC<FinishRoundModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  openCount,
  totalCount,
}) => {
  const [summary, setSummary] = useState('');
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFinishing(true);
    setError(null);
    try {
      await onConfirm(summary.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'تعذر إنهاء الجولة. حاول مرة أخرى.');
      setFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">إنهاء الجولة الإشرافية</h3>
              <p className="text-xs text-slate-500 font-medium">تأكيد إتمام الجولة واحتساب المدة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={finishing}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFinish} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Counts Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">إجمالي الملاحظات المسجلة</p>
              <p className="text-lg font-extrabold text-slate-800">{totalCount}</p>
            </div>
            {openCount > 0 ? (
              <div className="text-left">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{openCount} مفتوحة للمتابعة</span>
                </span>
              </div>
            ) : (
              <div className="text-left">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>جميعها معالجة</span>
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            عند إنهاء الجولة سيتم اعتماد وقت الانتهاء وحساب المدة المستغرقة تلقائيًا. تبقى الملاحظات المفتوحة قابلة للمتابعة والمعالجة في أي وقت.
          </p>

          {/* Optional Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>ملخص الجولة (اختياري)</span>
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="«مثال: تمت جولة قسم الطوارئ بالكامل، وتوجد بعض ملاحظات الإنارة تم إبلاغ الصيانة بها»"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors placeholder:text-slate-400"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={finishing}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {finishing ? (
                <span>جاري إنهاء الجولة...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>تأكيد إنهاء الجولة</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={finishing}
              onClick={onClose}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              متابعة الجولة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
