import React, { useMemo } from 'react';
import { Round, Observation } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, PlayCircle } from 'lucide-react';
import { formatDateArabic, getRoundTypeLabel } from '../../utils/formatters';

interface DashboardViewProps {
  rounds: Round[];
  observations: Observation[];
  activeRound: Round | null;
  onStartRoundClick: () => void;
  onResumeActiveRound: () => void;
  onSelectRound: (round: Round) => void;
  onNavigateToObservations: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  rounds,
  observations,
  activeRound,
  onStartRoundClick,
  onResumeActiveRound,
  onSelectRound,
  onNavigateToObservations,
}) => {
  const { appUser } = useAuth();

  // Calculate today's stats
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayRoundsCount = useMemo(() => {
    return rounds.filter((r) => {
      if (!r.startedAt) return false;
      let d: Date | null = null;
      if (typeof (r.startedAt as any).toDate === 'function') {
        d = (r.startedAt as any).toDate();
      } else {
        d = new Date(r.startedAt as any);
      }
      return d && d >= today;
    }).length;
  }, [rounds, today]);

  const openObservationsCount = useMemo(() => {
    return observations.filter((o) => o.status === 'open').length;
  }, [observations]);

  // Maximum 5 recent rounds
  const recentRounds = useMemo(() => rounds.slice(0, 5), [rounds]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-5">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">الجولات الإشرافية</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          مرحبًا، {appUser?.fullName || 'المشرف'}
        </p>
      </div>

      {/* Main Action Button */}
      <div>
        {activeRound ? (
          <button
            onClick={onResumeActiveRound}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-base font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlayCircle className="w-5 h-5" />
            <span>متابعة الجولة الحالية</span>
          </button>
        ) : (
          <button
            onClick={onStartRoundClick}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-base font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>بدء جولة</span>
          </button>
        )}
      </div>

      {/* Two Small Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: الملاحظات المفتوحة */}
        <div
          onClick={onNavigateToObservations}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-300 transition-colors"
        >
          <span className="text-xs font-medium text-slate-500 block">الملاحظات المفتوحة</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {openObservationsCount}
          </div>
        </div>

        {/* Card 2: جولات اليوم */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">جولات اليوم</span>
          <div className="text-2xl font-bold text-sky-600 mt-1">
            {todayRoundsCount}
          </div>
        </div>
      </div>

      {/* آخر الجولات (Recent Rounds - Max 5) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">آخر الجولات</h2>
        </div>

        {recentRounds.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            لا توجد جولات مسجلة بعد.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentRounds.map((round) => {
              const isCompleted = round.status === 'completed';
              return (
                <div
                  key={round.id}
                  onClick={() => onSelectRound(round)}
                  className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {getRoundTypeLabel(round.type)}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">{round.supervisorName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>{formatDateArabic(round.startedAt)}</span>
                      <span>•</span>
                      <span>{round.observationCount || 0} ملاحظة</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {isCompleted ? 'مكتملة' : 'قيد التنفيذ'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
