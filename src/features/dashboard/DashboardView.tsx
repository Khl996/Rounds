import React, { useMemo } from 'react';
import { Round, Observation } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowLeft,
  Footprints,
  MapPin,
  Tag,
  ClipboardList,
} from 'lucide-react';
import {
  formatDateArabic,
  formatTimeArabic,
  getRoundTypeLabel,
  calculateDurationString,
} from '../../utils/formatters';

interface DashboardViewProps {
  rounds: Round[];
  observations: Observation[];
  activeRound: Round | null;
  onStartRoundClick: () => void;
  onResumeActiveRound: () => void;
  onNavigateToRounds: () => void;
  onNavigateToObservations: () => void;
  onSelectRound: (round: Round) => void;
  onSelectObservation: (obs: Observation) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  rounds,
  observations,
  activeRound,
  onStartRoundClick,
  onResumeActiveRound,
  onNavigateToRounds,
  onNavigateToObservations,
  onSelectRound,
  onSelectObservation,
}) => {
  const { appUser } = useAuth();

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = (val: unknown) => {
      if (!val) return false;
      let d: Date | null = null;
      if (typeof (val as any).toDate === 'function') d = (val as any).toDate();
      else d = new Date(val as any);
      return d && d >= today;
    };

    const todayRounds = rounds.filter((r) => isToday(r.startedAt));
    const todayObs = observations.filter((o) => isToday(o.createdAt));
    const todayResolved = observations.filter(
      (o) => o.status === 'resolved' && isToday(o.resolvedAt || o.updatedAt)
    );
    const totalOpen = observations.filter((o) => o.status === 'open');

    return {
      roundsCount: todayRounds.length,
      todayObservationsCount: todayObs.length,
      todayResolvedCount: todayResolved.length,
      openObservationsCount: totalOpen.length,
    };
  }, [rounds, observations]);

  // Recent 3 rounds
  const recentRounds = useMemo(() => rounds.slice(0, 3), [rounds]);

  // Most recent open observations (up to 4)
  const recentOpenObservations = useMemo(
    () => observations.filter((o) => o.status === 'open').slice(0, 4),
    [observations]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            أهلاً، {appUser?.fullName || 'مشرف الجولة'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            اليوم {formatDateArabic(new Date())} • متابعة مرافق ومنشآت المستشفى
          </p>
        </div>

        {/* Quick Action Button */}
        <div>
          {activeRound ? (
            <button
              onClick={onResumeActiveRound}
              className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <PlayCircle className="w-4 h-4" />
              <span>متابعة الجولة الجارية</span>
            </button>
          ) : (
            <button
              onClick={onStartRoundClick}
              className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>بدء جولة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Round Card Alert if any */}
      {activeRound && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Footprints className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping"></span>
                <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                  جولة نشطة حاليًا
                </span>
              </div>
              <h3 className="text-base font-extrabold mt-0.5">
                {getRoundTypeLabel(activeRound.type)} — المشرف: {activeRound.supervisorName}
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                بدأت في {formatTimeArabic(activeRound.startedAt)} ({calculateDurationString(activeRound.startedAt, new Date())})
              </p>
            </div>
          </div>

          <button
            onClick={onResumeActiveRound}
            className="py-2.5 px-4 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            الدخول لشاشة الجولة ←
          </button>
        </div>
      )}

      {/* Dashboard KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: جولات اليوم */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">جولات اليوم</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{todayStats.roundsCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">جولات إشرافية منفذة</span>
        </div>

        {/* Card 2: الملاحظات المفتوحة */}
        <div
          onClick={onNavigateToObservations}
          className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800">الملاحظات المفتوحة</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900">{todayStats.openObservationsCount}</div>
          <span className="text-[11px] text-amber-700 mt-1 block font-medium">بحاجة للمتابعة والمعالجة</span>
        </div>

        {/* Card 3: معالجات اليوم */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800">عولجت اليوم</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900">{todayStats.todayResolvedCount}</div>
          <span className="text-[11px] text-emerald-700 mt-1 block font-medium">ملاحظة أُنجزت اليوم</span>
        </div>

        {/* Card 4: إجمالي ملاحظات اليوم */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي ملاحظات اليوم</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{todayStats.todayObservationsCount}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">رُصدت خلال اليوم</span>
        </div>
      </div>

      {/* Two columns: Urgent Open Observations & Recent Rounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Urgent Open Observations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-sm text-slate-900">ملاحظات مفتوحة للمتابعة</h3>
              </div>
              <button
                onClick={onNavigateToObservations}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
              >
                <span>عرض الكل</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentOpenObservations.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">لا توجد ملاحظات مفتوحة حاليًا.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">كافة الملاحظات تمت معالجتها بنجاح.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentOpenObservations.map((obs) => (
                  <div
                    key={obs.id}
                    onClick={() => onSelectObservation(obs)}
                    className="p-3 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {obs.locationName}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-amber-200 font-semibold">
                        {obs.categoryName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-900 font-medium line-clamp-2">
                      {obs.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>{obs.createdByName}</span>
                      <span>{formatTimeArabic(obs.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Rounds */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">آخر الجولات الإشرافية</h3>
              </div>
              <button
                onClick={onNavigateToRounds}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
              >
                <span>كافة الجولات</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentRounds.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs font-bold text-slate-700">لم يتم تسجيل أي جولات بعد.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">اضغط على «بدء جولة جديدة» للبدء.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentRounds.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectRound(r)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.type === 'maintenance'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-teal-50 text-teal-700'
                          }`}
                        >
                          {getRoundTypeLabel(r.type)}
                        </span>
                        <span className="font-bold text-slate-800">{r.supervisorName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatDateArabic(r.startedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>المدة: {calculateDurationString(r.startedAt, r.completedAt)}</span>
                      <span className="font-bold text-slate-700">
                        {r.observationCount || 0} ملاحظة
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
