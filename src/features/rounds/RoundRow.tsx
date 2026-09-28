import React from 'react';
import { Round } from '../../types';
import { formatDayLabel, formatObservationCount, formatTime, roundTitle } from '../../utils/formatters';
import { getRoundCode } from '../../utils/roundCode';

interface RoundRowProps {
  round: Round;
  observationCount: number;
  openCount: number;
  onClick: () => void;
}

export const RoundRow: React.FC<RoundRowProps> = ({ round, observationCount, openCount, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3.5 text-start transition-colors hover:bg-slate-50 active:bg-slate-100"
  >
    <span className="min-w-0">
      <span className="block text-[15px] text-slate-900">
        {roundTitle(round.type)}
        <span className="text-slate-400"> · </span>
        <span className="text-slate-600">{round.supervisorName}</span>
      </span>
      <span className="mt-0.5 block text-[13px] text-slate-500">
        {formatDayLabel(round.startedAt, false)} · {formatTime(round.startedAt)} · {formatObservationCount(observationCount)}
      </span>
    </span>
    <span className="flex shrink-0 flex-col items-end gap-1">
      <span className="text-xs text-slate-400 tabular-nums" dir="ltr">
        {getRoundCode(round)}
      </span>
      {round.status === 'in_progress' ? (
        <span className="text-xs font-medium text-sky-700">جارية</span>
      ) : (
        openCount > 0 && <span className="text-xs font-medium text-amber-700">{openCount} مفتوحة</span>
      )}
    </span>
  </button>
);
