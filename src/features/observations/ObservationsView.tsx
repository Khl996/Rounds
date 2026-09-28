import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Observation } from '../../types';
import { Segmented } from '../../components/ui/Segmented';
import { ObservationRow } from './ObservationRow';
import { dayKey, formatDayLabel, normalizeArabic } from '../../utils/formatters';

type StatusTab = 'open' | 'resolved' | 'all';

interface ObservationsViewProps {
  /** Newest first. */
  observations: Observation[];
  loading: boolean;
  error: string | null;
  onOpenObservation: (id: string) => void;
}

/** The follow-up queue: what still needs attention. */
export const ObservationsView: React.FC<ObservationsViewProps> = ({ observations, loading, error, onOpenObservation }) => {
  const [tab, setTab] = useState<StatusTab>('open');
  const [search, setSearch] = useState('');

  const openCount = useMemo(() => observations.filter((o) => o.status === 'open').length, [observations]);

  const groups = useMemo(() => {
    const term = normalizeArabic(search);
    const filtered = observations.filter((obs) => {
      if (tab !== 'all' && obs.status !== tab) return false;
      if (!term) return true;
      return normalizeArabic(`${obs.description} ${obs.locationName} ${obs.categoryName} ${obs.createdByName}`).includes(term);
    });

    const byDay: { key: string; label: string; items: Observation[] }[] = [];
    for (const obs of filtered) {
      const key = dayKey(obs.createdAt);
      const last = byDay[byDay.length - 1];
      if (last?.key === key) last.items.push(obs);
      else byDay.push({ key, label: formatDayLabel(obs.createdAt), items: [obs] });
    }
    return byDay;
  }, [observations, tab, search]);

  const emptyText = search.trim()
    ? 'لا توجد نتائج.'
    : tab === 'open'
      ? 'لا توجد ملاحظات مفتوحة.'
      : tab === 'resolved'
        ? 'لا توجد ملاحظات مغلقة.'
        : 'لا توجد ملاحظات بعد.';

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:pb-12">
      <h1 className="text-xl font-bold text-slate-900">الملاحظات</h1>

      <Segmented
        className="mt-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'open', label: 'مفتوحة', count: openCount },
          { value: 'resolved', label: 'مغلقة', count: observations.length - openCount },
          { value: 'all', label: 'الكل' },
        ]}
      />

      <label className="relative mt-3 block">
        <Search className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-[18px] text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث"
          aria-label="بحث في الملاحظات"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white ps-10 pe-3.5 text-base placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
      </label>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? null : groups.length === 0 ? (
        <p className="mt-16 text-center text-slate-400">{emptyText}</p>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="mt-6">
            <h2 className="px-1 text-sm font-medium text-slate-500">{group.label}</h2>
            <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {group.items.map((obs) => (
                <ObservationRow
                  key={obs.id}
                  observation={obs}
                  showStatus={tab === 'all'}
                  onClick={() => onOpenObservation(obs.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};
