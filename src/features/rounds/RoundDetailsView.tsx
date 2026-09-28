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
import {
  Printer,
  ArrowRight,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Tag,
  FileText,
  RotateCcw,
} from 'lucide-react';

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
  const { observations, loading } = useObservations(round.id);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const openCount = observations.filter((o) => o.status === 'open').length;
  const resolvedCount = observations.filter((o) => o.status === 'resolved').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الجولات</span>
        </button>

        <div className="flex items-center gap-2">
          {round.status === 'in_progress' && onContinueRound && (
            <button
              onClick={onContinueRound}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              متابعة الجولة الميدانية
            </button>
          )}

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="inline-flex items-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* Main Round Card Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-extrabold ${
                  round.type === 'maintenance'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}
              >
                {getRoundTypeLabel(round.type)}
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">
                #{round.id.slice(0, 6).toUpperCase()}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  round.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {round.status === 'completed' ? 'جولة مكتملة' : 'قيد التنفيذ'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              تفاصيل تقرير الجولة الإشرافية
            </h1>
          </div>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>معاينة للطباعة</span>
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs border-b border-slate-100">
          <div>
            <span className="text-slate-400 block mb-1">المشرف المسؤول:</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{round.supervisorName}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">تاريخ الجولة:</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDateArabic(round.startedAt)}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">وقت البدء والانتهاء:</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {formatTimeArabic(round.startedAt)} -{' '}
                {round.completedAt ? formatTimeArabic(round.completedAt) : 'قيد الإجراء'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">المدة الإجمالية:</span>
            <div className="font-extrabold text-emerald-800 text-sm">
              {calculateDurationString(round.startedAt, round.completedAt)}
            </div>
          </div>
        </div>

        {/* Optional Round Summary */}
        {round.summary && (
          <div className="pt-4 text-xs">
            <span className="font-bold text-slate-600 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>ملخص وتوصيات الجولة:</span>
            </span>
            <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
              {round.summary}
            </p>
          </div>
        )}

        {/* Metrics Banner */}
        <div className="grid grid-cols-3 gap-3 pt-5 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium block">إجمالي الملاحظات</span>
            <span className="text-xl font-black text-slate-900">{observations.length}</span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-xs text-emerald-800 font-medium block">تمت المعالجة</span>
            <span className="text-xl font-black text-emerald-900">{resolvedCount}</span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <span className="text-xs text-amber-800 font-medium block">مفتوحة للمتابعة</span>
            <span className="text-xl font-black text-amber-900">{openCount}</span>
          </div>
        </div>
      </div>

      {/* Observations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            الملاحظات الميدانية المسجلة ({observations.length})
          </h2>
          <span className="text-xs text-slate-500">
            اضغط على الملاحظة للاطلاع على سجل التحديثات أو معالجتها
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold animate-pulse">جاري تحميل الملاحظات...</p>
          </div>
        ) : observations.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-sm font-bold text-slate-700">لم تسجل أي ملاحظات خلال هذه الجولة.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {observations.map((obs, idx) => {
              const isOpen = obs.status === 'open';
              return (
                <div
                  key={obs.id}
                  onClick={() => onObservationClick(obs)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">
                        {obs.orderNumber || idx + 1}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {obs.locationName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {obs.categoryName}
                      </span>
                    </div>

                    {isOpen ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>مفتوحة</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تمت المعالجة</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 leading-relaxed mb-3">
                    {obs.description}
                  </p>

                  {obs.actionTaken && (
                    <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                      <span className="font-bold text-slate-800">الإجراء الميداني الفوري: </span>
                      <span>{obs.actionTaken}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>سجلت في: {formatTimeArabic(obs.createdAt)}</span>
                      <span>بواسطة: {obs.createdByName}</span>
                    </div>

                    {!isOpen && (
                      <div className="text-emerald-700 font-bold">
                        تمت المعالجة بواسطة {obs.resolvedByName || 'المشرف'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PDF Report Modal */}
      <RoundPdfReport
        round={round}
        observations={observations}
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </div>
  );
};
