import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface FinishRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (summary?: string) => Promise<void>;
}

export const FinishRoundModal: React.FC<FinishRoundModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">إنهاء الجولة</h3>
          <button
            onClick={onClose}
            disabled={finishing}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFinish} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ملخص الجولة (اختياري) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملخص الجولة (اختياري)
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="ملاحظات ختامية حول سير الجولة..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors placeholder:text-slate-400"
            />
          </div>

          {/* Buttons: إلغاء / إنهاء الجولة */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={finishing}
              className="flex-1 py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              {finishing ? 'جاري الإنهاء...' : 'إنهاء الجولة'}
            </button>
            <button
              type="button"
              disabled={finishing}
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
