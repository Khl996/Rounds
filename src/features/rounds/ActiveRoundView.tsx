import React, { useState } from 'react';
import { Round, Observation, LocationItem, CategoryItem } from '../../types';
import { useObservations } from '../../hooks/useObservations';
import { useMasterData } from '../../hooks/useMasterData';
import { AddObservationModal } from './AddObservationModal';
import { FinishRoundModal } from './FinishRoundModal';
import { Plus, ArrowRight, Check } from 'lucide-react';
import { formatTimeArabic, getRoundTypeLabel } from '../../utils/formatters';

interface ActiveRoundViewProps {
  round: Round;
  onFinishRound: (summary?: string) => Promise<void>;
  onObservationClick: (obs: Observation) => void;
  onBackToDashboard: () => void;
}

export const ActiveRoundView: React.FC<ActiveRoundViewProps> = ({
  round,
  onFinishRound,
  onObservationClick,
  onBackToDashboard,
}) => {
  const { observations, addObservation } = useObservations(round.id);
  const { locations, categories } = useMasterData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSaveObservation = async (
    location: LocationItem,
    category: CategoryItem,
    description: string,
    actionTaken?: string
  ) => {
    await addObservation(round.id, location, category, description, actionTaken);
    setToast('تم حفظ الملاحظة بنجاح');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Back button */}
      <div>
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </button>
      </div>

      {/* Header:
          جولة صيانة
          بدأت 08:15
          3 ملاحظات
      */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900">
          {getRoundTypeLabel(round.type)}
        </h1>
        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
          <span>بدأت {formatTimeArabic(round.startedAt)}</span>
          <span>•</span>
          <span className="font-semibold text-slate-700">
            {observations.length} ملاحظات
          </span>
        </div>
      </div>

      {/* Primary Action Button: + إضافة ملاحظة */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-base font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>إضافة ملاحظة</span>
      </button>

      {/* List of Observations in this round */}
      <div className="space-y-2.5">
        {observations.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
            لم تسجل أي ملاحظات في هذه الجولة بعد. اضغط «إضافة ملاحظة» للبدء.
          </div>
        ) : (
          observations.map((obs, idx) => {
            const isOpen = obs.status === 'open';
            return (
              <div
                key={obs.id}
                onClick={() => onObservationClick(obs)}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">#{idx + 1}</span>
                    <span className="font-bold text-sky-700">{obs.categoryName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">{obs.locationName}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      isOpen
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isOpen ? 'مفتوحة' : 'تمت المعالجة'}
                  </span>
                </div>
                <p className="text-sm text-slate-900 leading-snug">
                  {obs.description}
                </p>
                {obs.actionTaken && (
                  <p className="text-xs text-slate-500">
                    الإجراء: {obs.actionTaken}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Button: إنهاء الجولة */}
      <div className="pt-2">
        <button
          onClick={() => setIsFinishModalOpen(true)}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-sm font-bold transition-colors cursor-pointer"
        >
          إنهاء الجولة
        </button>
      </div>

      {/* Add Observation Modal */}
      <AddObservationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        locations={locations}
        categories={categories}
        onSave={handleSaveObservation}
      />

      {/* Finish Round Modal */}
      <FinishRoundModal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        onConfirm={onFinishRound}
      />
    </div>
  );
};
