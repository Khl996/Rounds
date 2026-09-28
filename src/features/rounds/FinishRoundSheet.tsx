import React, { useState } from 'react';
import { Round } from '../../types';
import { Sheet } from '../../components/ui/Sheet';
import { Button } from '../../components/ui/Button';
import { ErrorText, Field, inputClass } from '../../components/ui/Field';
import { formatDuration, formatObservationCount } from '../../utils/formatters';

interface FinishRoundSheetProps {
  round: Round;
  observationCount: number;
  onClose: () => void;
  onConfirm: (summary?: string) => Promise<void>;
}

export const FinishRoundSheet: React.FC<FinishRoundSheetProps> = ({ round, observationCount, onClose, onConfirm }) => {
  const [summary, setSummary] = useState('');
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    setFinishing(true);
    setError(null);
    try {
      await onConfirm(summary.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إنهاء الجولة.');
      setFinishing(false);
    }
  };

  const duration = formatDuration(round.startedAt);

  return (
    <Sheet
      title="إنهاء الجولة"
      onClose={onClose}
      footer={
        <div className="space-y-3">
          {error && <ErrorText>{error}</ErrorText>}
          <Button size="lg" full onClick={finish} disabled={finishing}>
            {finishing ? 'جارٍ الإنهاء…' : 'إنهاء الجولة'}
          </Button>
        </div>
      }
    >
      <p className="text-slate-600">
        {observationCount > 0
          ? `${formatObservationCount(observationCount)} خلال ${duration}.`
          : `لم تُسجَّل ملاحظات خلال ${duration}.`}
      </p>
      <Field label="ملخص الجولة" optional className="mt-5">
        <textarea
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="انطباع عام عن الجولة"
          className={`${inputClass} resize-none`}
        />
      </Field>
    </Sheet>
  );
};
