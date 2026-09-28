import React, { useState } from 'react';
import { Round, Observation } from '../../types';
import { useObservations } from '../../hooks/useObservations';
import { RoundPdfReport } from '../reports/RoundPdfReport';
import {
  formatDateArabic,
  formatTimeArabic,
  calculateDurationString,
  getRoundTypeLabel,
} from '../../utils/formatters';
import { ArrowRight, Printer } from 'lucide-react';

interface RoundDetailsViewProps {
  round: Round;
  onBack: () => void;
  onObservationClick: (obs: Observation) => void;
  onContinueRound?: () => void;
}

export const RoundDetailsView: React.FC<RoundDetailsViewProps> = ({
  round,
  onBack,
  onObservationClick,
  onContinueRound,
}) => {
  const { observations } = useObservations(round.id);
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  const isInProgress = round.status === 'in_progress';

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-4">
      {/* Top Bar: Back button + PDF button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </button>

        <div className="flex items-center gap-2">
          {isInProgress && onContinueRound && (
            <button
              onClick={onContinueRound}
              className="py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              متابعة الجولة
            </button>
          )}
          <button
            onClick={() => setIsPdfOpen(true)}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* Round Details Summary Card:
          نوع الجولة
          المشرف
          التاريخ
          وقت البداية
          وقت النهاية
          المدة
          عدد الملاحظات
      */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h1 className="text-base font-bold text-slate-900">
            {getRoundTypeLabel(round.type)}
          </h1>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
              isInProgress
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isInProgress ? 'قيد التنفيذ' : 'جولة مكتملة'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          <div>
            <span className="text-slate-400 block text-[11px]">المشرف</span>
            <span className="font-bold text-slate-800">{round.supervisorName}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">التاريخ</span>
            <span className="font-bold text-slate-800">{formatDateArabic(round.startedAt)}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">وقت البداية</span>
            <span className="font-bold text-slate-800">{formatTimeArabic(round.startedAt)}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">وقت النهاية</span>
            <span className="font-bold text-slate-800">
              {round.completedAt ? formatTimeArabic(round.completedAt) : 'قيد التنفيذ'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">المدة</span>
            <span className="font-bold text-slate-800">
              {calculateDurationString(round.startedAt, round.completedAt || new Date())}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">عدد الملاحظات</span>
            <span className="font-bold text-slate-800">{observations.length} ملاحظة</span>
          </div>
        </div>

        {round.summary && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-0.5">ملخص الجولة</span>
            <p className="text-slate-700 leading-relaxed">{round.summary}</p>
          </div>
        )}
      </div>

      {/* Observations List */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-600 px-1">الملاحظات المرصودة</h2>
        {observations.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
            لا توجد ملاحظات مسجلة في هذه الجولة.
          </div>
        ) : (
          <div className="space-y-2">
            {observations.map((obs, idx) => {
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
            })}
          </div>
        )}
      </div>

      {/* PDF Export Modal */}
      <RoundPdfReport
        round={round}
        observations={observations}
        isOpen={isPdfOpen}
        onClose={() => setIsPdfOpen(false)}
      />
    </div>
  );
};
