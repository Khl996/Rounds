import React, { useState } from 'react';
import { RoundType } from '../../types';
import { X, Wrench, Sparkles, AlertCircle } from 'lucide-react';

interface StartRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (type: RoundType) => Promise<void>;
}

export const StartRoundModal: React.FC<StartRoundModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = async (type: RoundType) => {
    setStarting(true);
    setError(null);
    try {
      await onStart(type);
      onClose();
    } catch (err: any) {
      setError(err.message || 'تعذر بدء الجولة. حاول مرة أخرى.');
      setStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">بدء جولة</h3>
          <button
            onClick={onClose}
            disabled={starting}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Maintenance */}
            <button
              type="button"
              disabled={starting}
              onClick={() => handleSelect('maintenance')}
              className="p-5 rounded-xl border-2 border-slate-200 bg-white hover:border-sky-500 hover:bg-sky-50/40 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="font-bold text-slate-900 text-base">صيانة</span>
            </button>

            {/* Cleaning */}
            <button
              type="button"
              disabled={starting}
              onClick={() => handleSelect('cleaning')}
              className="p-5 rounded-xl border-2 border-slate-200 bg-white hover:border-sky-500 hover:bg-sky-50/40 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="font-bold text-slate-900 text-base">نظافة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
