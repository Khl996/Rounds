import React, { useState, useEffect } from 'react';
import { Round, Observation, LocationItem, CategoryItem } from '../../types';
import { useObservations } from '../../hooks/useObservations';
import { useMasterData } from '../../hooks/useMasterData';
import { AddObservationModal } from './AddObservationModal';
import { FinishRoundModal } from './FinishRoundModal';
import {
  Clock,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Tag,
  ArrowRight,
  Flame,
  Check,
} from 'lucide-react';
import {
  formatTimeArabic,
  calculateDurationString,
  getRoundTypeLabel,
} from '../../utils/formatters';

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
  const { observations, addObservation, loading } = useObservations(round.id);
  const { locations, categories } = useMasterData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [currentDuration, setCurrentDuration] = useState<string>('');

  // Live timer update
  useEffect(() => {
    const updateTimer = () => {
      setCurrentDuration(calculateDurationString(round.startedAt, new Date()));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 10000); // every 10s
    return () => clearInterval(interval);
  }, [round.startedAt]);

  const handleSaveObservation = async (
    location: LocationItem,
    category: CategoryItem,
    description: string,
    actionTaken?: string
  ) => {
    await addObservation(round.id, location, category, description, actionTaken);
    setSuccessToast(`تمت إضافة ملاحظة جديدة في ${location.name}`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const openCount = observations.filter((o) => o.status === 'open').length;
  const resolvedCount = observations.filter((o) => o.status === 'resolved').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 pb-28">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </button>

        <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
          <span>جولة جارية الآن</span>
        </span>
      </div>

      {/* Active Round Card Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                  round.type === 'maintenance'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                }`}
              >
                {getRoundTypeLabel(round.type)}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">الجولة الإشرافية الميدانية</h2>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>المشرف: <strong className="text-slate-800">{round.supervisorName}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>البدء: <strong className="text-slate-800">{formatTimeArabic(round.startedAt)}</strong></span>
              </span>
            </div>
          </div>

          {/* Live Timer Pill */}
          <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 font-semibold block">مدة الجولة الحالية</span>
            <span className="text-sm font-black text-slate-800 font-mono tracking-tight">
              {currentDuration || '...'}
            </span>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-3 gap-2 pt-3 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">الملاحظات المسجلة</span>
            <span className="text-base font-extrabold text-slate-900">{observations.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100">
            <span className="text-[11px] text-amber-700 font-medium block">مفتوحة للمتابعة</span>
            <span className="text-base font-extrabold text-amber-900">{openCount}</span>
          </div>
          <div className="p-2 rounded-xl bg-sky-50/60 border border-sky-100">
            <span className="text-[11px] text-sky-700 font-medium block">تمت معالجتها</span>
            <span className="text-base font-extrabold text-sky-900">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="mb-4 p-3 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Main Large Mobile CTA: + إضافة ملاحظة */}
      <div className="mb-6">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full py-4 px-6 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-2xl font-extrabold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer transform active:scale-[0.99]"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
            <Plus className="w-5 h-5 stroke-[3]" />
          </div>
          <span>إضافة ملاحظة جديدة</span>
        </button>
      </div>

      {/* Recorded Observations List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">
            الملاحظات المسجلة في هذه الجولة ({observations.length})
          </h3>
          <span className="text-xs text-slate-500">اضغط على أي ملاحظة للمتابعة</span>
        </div>

        {loading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold animate-pulse">جاري تحميل الملاحظات...</p>
          </div>
        ) : observations.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">لم تسجل أي ملاحظات في هذه الجولة بعد.</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              تجوّل في مرافق المستشفى واضغط على زر «إضافة ملاحظة جديدة» لتوثيق أي خلل ميداني.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {observations.map((obs, idx) => {
              const isOpen = obs.status === 'open';
              return (
                <div
                  key={obs.id}
                  onClick={() => onObservationClick(obs)}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                        {obs.orderNumber || idx + 1}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {obs.locationName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {obs.categoryName}
                      </span>
                    </div>

                    {isOpen ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>مفتوحة</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-sky-600" />
                        <span>معالجة</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 leading-relaxed mb-2 pr-8">
                    {obs.description}
                  </p>

                  {obs.actionTaken && (
                    <div className="mr-8 mb-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="font-bold text-slate-700">الإجراء أثناء الجولة: </span>
                      <span>{obs.actionTaken}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pr-8 pt-1 border-t border-slate-50">
                    <span>وقت التسجيل: {formatTimeArabic(obs.createdAt)}</span>
                    <span className="text-sky-700 font-bold hover:underline">
                      عرض التحديثات والمعالجة ←
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Finish Round Bar on mobile/desktop */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 shadow-xl max-w-3xl mx-auto flex items-center justify-between gap-3">
        <div className="hidden sm:block">
          <p className="text-xs font-bold text-slate-800">إنهاء هذه الجولة الإشرافية</p>
          <p className="text-[11px] text-slate-500">سيتم حفظ وقت الانتهاء والمدة وإتاحة تصدير تقرير PDF</p>
        </div>

        <button
          onClick={() => setIsFinishModalOpen(true)}
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-sky-400" />
          <span>إنهاء الجولة</span>
        </button>
      </div>

      {/* Modals */}
      <AddObservationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        locations={locations}
        categories={categories}
        onSave={handleSaveObservation}
      />

      <FinishRoundModal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        onConfirm={onFinishRound}
        openCount={openCount}
        totalCount={observations.length}
      />
    </div>
  );
};
