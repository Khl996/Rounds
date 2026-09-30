import React, { useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { AppUser, Round } from '../../types';
import { Button } from '../../components/ui/Button';
import { RoundRow } from '../rounds/RoundRow';
import { RoundCounts } from '../../utils/observations';
import { formatObservationCount, formatTime, greeting, roundTitle } from '../../utils/formatters';

interface HomeViewProps {
  user: AppUser;
  loading: boolean;
  error: string | null;
  activeRound: Round | null;
  rounds: Round[];
  countsByRound: Map<string, RoundCounts>;
  openObservationCount: number;
  onStartRound: () => void;
  onResumeRound: () => void;
  onOpenRound: (roundId: string) => void;
  onOpenObservations: () => void;
  onAddObservation?: () => void;
}

const PAGE_SIZE = 5;

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  loading,
  error,
  activeRound,
  rounds,
  countsByRound,
  openObservationCount,
  onStartRound,
  onResumeRound,
  onOpenRound,
  onOpenObservations,
  onAddObservation,
}) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const history = rounds.filter((r) => r.id !== activeRound?.id);
  const activeCount = activeRound ? countsByRound.get(activeRound.id)?.total ?? 0 : 0;
  const isManagement = user.role === 'management';

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:pb-12">
      <h1 className="text-xl font-bold text-slate-900">
        {greeting()}، {user.fullName}
      </h1>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5">
        {loading ? (
          <div className="h-14 rounded-2xl bg-slate-200/60" aria-hidden="true" />
        ) : isManagement ? (
          <Button size="lg" full onClick={onAddObservation || onOpenObservations}>
            <Plus className="size-5" strokeWidth={2.5} />
            إضافة ملاحظة
          </Button>
        ) : activeRound ? (
          <section className="rounded-3xl bg-sky-600 p-5 text-white">
            <p className="text-sm text-sky-100">جولتك مستمرة</p>
            <h2 className="mt-1 text-2xl font-bold">{roundTitle(activeRound.type)}</h2>
            <p className="mt-1 text-sky-100">
              بدأت {formatTime(activeRound.startedAt)} · {formatObservationCount(activeCount)}
            </p>
            <button
              type="button"
              onClick={onResumeRound}
              className="mt-5 h-12 w-full cursor-pointer rounded-xl bg-white text-[15px] font-semibold text-sky-700 transition-colors hover:bg-sky-50"
            >
              متابعة الجولة
            </button>
          </section>
        ) : (
          <Button size="lg" full onClick={onStartRound}>
            <Plus className="size-5" strokeWidth={2.5} />
            ابدأ جولة
          </Button>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenObservations}
        className="mt-4 flex w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-start transition-colors hover:bg-slate-50"
      >
        <span className="flex items-center gap-3">
          <span
            className={`size-2 rounded-full ${openObservationCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            aria-hidden="true"
          />
          <span className="text-[15px] text-slate-800">
            {openObservationCount > 0 ? 'ملاحظات مفتوحة' : 'لا توجد ملاحظات مفتوحة'}
          </span>
        </span>
        <span className="flex items-center gap-2 text-slate-400">
          {openObservationCount > 0 && (
            <span className="text-lg font-semibold text-slate-900 tabular-nums">{openObservationCount}</span>
          )}
          <ChevronLeft className="size-5" />
        </span>
      </button>

      <section className="mt-8">
        <h2 className="px-1 text-sm font-medium text-slate-500">آخر الجولات</h2>
        {history.length === 0 ? (
          !loading && <p className="mt-2 px-1 text-sm text-slate-400">لا توجد جولات سابقة.</p>
        ) : (
          <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {history.slice(0, visibleCount).map((round) => {
              const counts = countsByRound.get(round.id);
              return (
                <RoundRow
                  key={round.id}
                  round={round}
                  observationCount={counts?.total ?? 0}
                  openCount={counts?.open ?? 0}
                  onClick={() => onOpenRound(round.id)}
                />
              );
            })}
          </div>
        )}
        {history.length > visibleCount && (
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE * 2)}
            className="mt-1 h-12 w-full cursor-pointer text-sm font-medium text-sky-700"
          >
            عرض المزيد
          </button>
        )}
      </section>
    </div>
  );
};
