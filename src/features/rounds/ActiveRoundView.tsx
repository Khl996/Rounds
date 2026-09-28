import React, { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { CategoryItem, LocationItem, Observation, Round } from '../../types';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useNow } from '../../hooks/useNow';
import { ObservationRow } from '../observations/ObservationRow';
import { AddObservationSheet } from './AddObservationSheet';
import { FinishRoundSheet } from './FinishRoundSheet';
import { formatElapsed, formatObservationCount, roundTitle } from '../../utils/formatters';

interface ActiveRoundViewProps {
  round: Round;
  /** Oldest first. */
  observations: Observation[];
  locations: LocationItem[];
  categories: CategoryItem[];
  onAddObservation: (location: LocationItem, category: CategoryItem, description: string, actionTaken?: string) => Promise<void>;
  onFinish: (summary?: string) => Promise<void>;
  onOpenObservation: (id: string) => void;
  onBack: () => void;
}

/** Focus mode for the round in progress: record what you see, then finish. */
export const ActiveRoundView: React.FC<ActiveRoundViewProps> = ({
  round,
  observations,
  locations,
  categories,
  onAddObservation,
  onFinish,
  onOpenObservation,
  onBack,
}) => {
  const now = useNow();
  const showToast = useToast();
  const [adding, setAdding] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [lastLocationId, setLastLocationId] = useState<string | undefined>(
    observations[observations.length - 1]?.locationId
  );

  const save = async (location: LocationItem, category: CategoryItem, description: string, actionTaken?: string) => {
    await onAddObservation(location, category, description, actionTaken);
    setLastLocationId(location.id);
    setAdding(false);
    showToast('تم الحفظ');
  };

  const newestFirst = [...observations].reverse();

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[15px] text-slate-600 hover:bg-slate-100"
          >
            <ArrowRight className="size-5" />
            الرئيسية
          </button>
          <Button variant="ghost" size="sm" className="h-11 px-3 text-[15px]" onClick={() => setFinishing(true)}>
            إنهاء الجولة
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6 pb-36">
        <h1 className="text-2xl font-bold text-slate-900">{roundTitle(round.type)}</h1>
        <p className="mt-1 text-slate-500">
          {formatElapsed(round.startedAt, now)} · {formatObservationCount(observations.length)}
        </p>

        {newestFirst.length === 0 ? (
          <p className="mt-16 text-center text-slate-400">سجّل أي شيء تلاحظه أثناء الجولة.</p>
        ) : (
          <div className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {newestFirst.map((obs) => (
              <ObservationRow
                key={obs.id}
                observation={obs}
                showAuthor={false}
                showStatus={obs.status === 'resolved'}
                onClick={() => onOpenObservation(obs.id)}
              />
            ))}
          </div>
        )}
      </main>

      <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <Button size="lg" full onClick={() => setAdding(true)}>
            <Plus className="size-5" strokeWidth={2.5} />
            ملاحظة
          </Button>
        </div>
      </div>

      {adding && (
        <AddObservationSheet
          locations={locations}
          categories={categories}
          initialLocationId={lastLocationId}
          onClose={() => setAdding(false)}
          onSave={save}
        />
      )}

      {finishing && (
        <FinishRoundSheet
          round={round}
          observationCount={observations.length}
          onClose={() => setFinishing(false)}
          onConfirm={onFinish}
        />
      )}
    </div>
  );
};
