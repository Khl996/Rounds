import React from 'react';
import { Observation, ObservationStatus } from '../../types';
import { formatTime, OBSERVATION_STATUS_LABEL } from '../../utils/formatters';

export const StatusText: React.FC<{ status: ObservationStatus }> = ({ status }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
      status === 'open' ? 'text-amber-700' : 'text-emerald-700'
    }`}
  >
    <span className={`size-1.5 rounded-full ${status === 'open' ? 'bg-amber-500' : 'bg-emerald-500'}`} aria-hidden="true" />
    {OBSERVATION_STATUS_LABEL[status]}
  </span>
);

interface ObservationRowProps {
  observation: Observation;
  onClick: () => void;
  /** Sequence number within its round. */
  number?: number;
  showAuthor?: boolean;
  showStatus?: boolean;
}

export const ObservationRow: React.FC<ObservationRowProps> = ({
  observation,
  onClick,
  number,
  showAuthor = true,
  showStatus = true,
}) => {
  const meta = [observation.categoryName, showAuthor ? observation.createdByName : null, formatTime(observation.createdAt)]
    .filter(Boolean)
    .join(' • ');

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer gap-3 px-4 py-3.5 text-start transition-colors hover:bg-slate-50 active:bg-slate-100"
    >
      {number !== undefined && (
        <span className="w-5 shrink-0 pt-0.5 text-sm text-slate-400 tabular-nums">{number}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-[15px] leading-snug text-slate-900">{observation.description}</span>
          {showStatus && <span className="pt-0.5"><StatusText status={observation.status} /></span>}
        </span>
        <span className="mt-1 block text-sm text-slate-600">{observation.locationName}</span>
        <span className="mt-0.5 block text-[13px] text-slate-500">{meta}</span>
      </span>
    </button>
  );
};
