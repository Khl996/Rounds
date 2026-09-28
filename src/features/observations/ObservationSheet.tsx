import React, { useState } from 'react';
import { Observation, ObservationUpdate } from '../../types';
import { DEFAULT_REOPEN_TEXT, DEFAULT_RESOLVE_TEXT, useObservationUpdates } from '../../hooks/useObservations';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { ErrorText } from '../../components/ui/Field';
import { useToast } from '../../components/ui/Toast';
import { StatusText } from './ObservationRow';
import { formatWhen } from '../../utils/formatters';

interface ObservationSheetProps {
  observation: Observation;
  onClose: () => void;
  onComment: (text: string) => Promise<void>;
  onResolve: (note?: string) => Promise<void>;
  onReopen: (reason?: string) => Promise<void>;
}

// Auto-generated texts (including ones written by earlier versions) add nothing under the event title.
const BOILERPLATE = new Set([
  DEFAULT_RESOLVE_TEXT,
  DEFAULT_REOPEN_TEXT,
  'تمت المعالجة',
  'تمت معالجة الملاحظة والتأكد من سلامة الموقع',
  'إعادة فتح الملاحظة',
  'تمت إعادة فتح الملاحظة لمتابعة المعالجة',
]);

interface TimelineEntry {
  id: string;
  when: unknown;
  who: string;
  title?: string;
  text?: string;
  tone: 'neutral' | 'info' | 'success' | 'warning';
}

function toEntry(update: ObservationUpdate): TimelineEntry {
  const text = update.text && !BOILERPLATE.has(update.text.trim()) ? update.text : undefined;
  const base = { id: update.id, when: update.createdAt, who: update.createdByName };
  if (update.type === 'resolved') return { ...base, title: 'أُغلقت الملاحظة', text, tone: 'success' };
  if (update.type === 'reopened') return { ...base, title: 'أُعيد فتح الملاحظة', text, tone: 'warning' };
  return { ...base, text: update.text, tone: 'info' };
}

const DOT: Record<TimelineEntry['tone'], string> = {
  neutral: 'bg-slate-400',
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
};

const TITLE: Record<TimelineEntry['tone'], string> = {
  neutral: 'text-slate-900',
  info: 'text-slate-900',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
};

/** "وش صار على هذه الملاحظة؟" — the history is the main content. */
export const ObservationSheet: React.FC<ObservationSheetProps> = ({
  observation,
  onClose,
  onComment,
  onResolve,
  onReopen,
}) => {
  const { updates, error: updatesError } = useObservationUpdates(observation.id);
  const showToast = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = observation.status === 'open';

  const entries: TimelineEntry[] = [
    {
      id: 'created',
      when: observation.createdAt,
      who: observation.createdByName,
      title: 'سُجّلت الملاحظة',
      tone: 'neutral',
    },
    ...updates.map(toEntry),
  ];

  const run = async (action: () => Promise<void>, doneMessage?: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setText('');
      if (doneMessage) {
        showToast(doneMessage);
        onClose();
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ. حاول مرة أخرى.');
    }
    setBusy(false);
  };

  // A typed note goes with the status change, e.g. "تم تغيير اللمبة" + إغلاق.
  const toggleStatus = () =>
    isOpen
      ? run(() => onResolve(text.trim() || undefined), 'أُغلقت الملاحظة')
      : run(() => onReopen(text.trim() || undefined), 'أُعيد فتح الملاحظة');

  const addUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) run(() => onComment(text.trim()));
  };

  return (
    <Sheet
      onClose={onClose}
      title={
        <div>
          <StatusText status={observation.status} />
          <h2 className="mt-1.5 text-lg leading-snug font-semibold text-slate-900">{observation.description}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {observation.locationName} · {observation.categoryName}
          </p>
        </div>
      }
      footer={
        <div className="space-y-3">
          {error && <ErrorText>{error}</ErrorText>}
          <form onSubmit={addUpdate} className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب تحديثًا…"
              aria-label="تحديث"
              className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 text-base placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            <Button type="submit" variant="secondary" disabled={busy || !text.trim()}>
              إضافة
            </Button>
          </form>
          <Button variant={isOpen ? 'success' : 'secondary'} size="lg" full disabled={busy} onClick={toggleStatus}>
            {isOpen ? 'إغلاق الملاحظة' : 'إعادة فتح'}
          </Button>
        </div>
      }
    >
      <ol className="relative mt-3 space-y-5 ps-6 before:absolute before:inset-y-2 before:start-[5px] before:w-px before:bg-slate-200">
        {entries.map((entry) => (
          <li key={entry.id} className="relative">
            <span
              className={`absolute top-1.5 -start-6 size-[11px] rounded-full ring-4 ring-white ${DOT[entry.tone]}`}
              aria-hidden="true"
            />
            <p className="text-[13px] text-slate-500">
              {formatWhen(entry.when)} — {entry.who}
            </p>
            {entry.title && <p className={`mt-0.5 font-medium ${TITLE[entry.tone]}`}>{entry.title}</p>}
            {entry.text && <p className="mt-0.5 leading-relaxed whitespace-pre-line text-slate-800">{entry.text}</p>}
          </li>
        ))}
      </ol>
      {updatesError && <p className="mt-4 text-sm text-red-600">{updatesError}</p>}
    </Sheet>
  );
};
