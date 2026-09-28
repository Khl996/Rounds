import React, { useState } from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { Observation, Round } from '../../types';
import { Button } from '../../components/ui/Button';
import { ObservationRow } from '../observations/ObservationRow';
import { RoundReport } from '../reports/RoundReport';
import { formatDate, formatDuration, formatObservationCount, formatTime, roundTitle } from '../../utils/formatters';
import { getRoundCode } from '../../utils/roundCode';

interface RoundDetailsViewProps {
  round: Round;
  /** Oldest first. */
  observations: Observation[];
  onBack: () => void;
  onOpenObservation: (id: string) => void;
  /** Set when this is the user's own round in progress. */
  onContinue?: () => void;
}

export const RoundDetailsView: React.FC<RoundDetailsViewProps> = ({
  round,
  observations,
  onBack,
  onOpenObservation,
  onContinue,
}) => {
  const [reportOpen, setReportOpen] = useState(false);
  const inProgress = round.status === 'in_progress';
  const openCount = observations.filter((o) => o.status === 'open').length;

  const details: [string, React.ReactNode][] = [
    ['رقم الجولة', <span dir="ltr" className="tabular-nums">{getRoundCode(round)}</span>],
    ['المشرف', round.supervisorName],
    ['التاريخ', formatDate(round.startedAt)],
    [
      'الوقت',
      inProgress
        ? `بدأت ${formatTime(round.startedAt)}`
        : `${formatTime(round.startedAt)} – ${formatTime(round.completedAt)} · ${formatDuration(round.startedAt, round.completedAt)}`,
    ],
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pt-3 pb-28 sm:pb-12">
      <button
        type="button"
        onClick={onBack}
        className="-ms-2 flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-[15px] text-slate-600 hover:bg-slate-100"
      >
        <ArrowRight className="size-5" />
        رجوع
      </button>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{roundTitle(round.type)}</h1>
        {inProgress && (
          <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-sm font-medium text-sky-700">جارية</span>
        )}
      </div>

      <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {details.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
            <dd className="text-end text-[15px] text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex gap-3">
        {onContinue && (
          <Button full onClick={onContinue}>
            متابعة الجولة
          </Button>
        )}
        <Button variant={onContinue ? 'secondary' : 'primary'} full onClick={() => setReportOpen(true)}>
          <FileText className="size-5" />
          تقرير PDF
        </Button>
      </div>

      {round.summary && (
        <section className="mt-8">
          <h2 className="px-1 text-sm font-medium text-slate-500">ملخص الجولة</h2>
          <p className="mt-2 px-1 leading-relaxed whitespace-pre-line text-slate-800">{round.summary}</p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="px-1 text-sm font-medium text-slate-500">
          {formatObservationCount(observations.length)}
          {openCount > 0 && <span className="text-amber-700"> · {openCount} مفتوحة</span>}
        </h2>
        {observations.length > 0 && (
          <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {observations.map((obs, index) => (
              <ObservationRow
                key={obs.id}
                observation={obs}
                number={index + 1}
                showAuthor={obs.createdBy !== round.supervisorId}
                onClick={() => onOpenObservation(obs.id)}
              />
            ))}
          </div>
        )}
      </section>

      {reportOpen && <RoundReport round={round} observations={observations} onClose={() => setReportOpen(false)} />}
    </div>
  );
};
