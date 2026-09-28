import React, { useState } from 'react';
import { RoundType } from '../../types';
import { X, Wrench, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">بدء جولة إشرافية جديدة</h3>
            <p className="text-xs text-slate-500 font-medium">اختر نوع الجولة الميدانية</p>
          </div>
          <button
            onClick={onClose}
            disabled={starting}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            سيتم تسجيل وقت البدء وحساب المدة واسم المشرف آليًا فور اختيار نوع الجولة.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Maintenance Option */}
            <button
              type="button"
              disabled={starting}
              onClick={() => handleSelect('maintenance')}
              className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 hover:border-blue-400 active:scale-[0.98] transition-all text-right group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-xs">
                <Wrench className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1">جولة صيانة</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                كهرباء، تكييف، سباكة، أعمال مدنية ومعدات
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-700">
                <span>ابدأ الآن</span>
                <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Cleaning Option */}
            <button
              type="button"
              disabled={starting}
              onClick={() => handleSelect('cleaning')}
              className="p-4 rounded-2xl border-2 border-teal-200 bg-teal-50/50 hover:bg-teal-100/70 hover:border-teal-400 active:scale-[0.98] transition-all text-right group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-3 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1">جولة نظافة</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                نظافة عامة، تعقيم، إدارة نفايات وسلامة بيئية
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-teal-700">
                <span>ابدأ الآن</span>
                <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {starting && (
            <p className="text-center text-xs font-bold text-slate-500 animate-pulse pt-2">
              جاري تجهيز وبدء الجولة...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
