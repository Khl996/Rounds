import React, { useState } from 'react';
import { Sparkles, Wrench } from 'lucide-react';
import { RoundType } from '../../types';
import { Sheet } from '../../components/ui/Sheet';
import { ErrorText } from '../../components/ui/Field';

interface StartRoundSheetProps {
  onClose: () => void;
  onStart: (type: RoundType) => Promise<void>;
}

const TYPES: { type: RoundType; label: string; icon: typeof Wrench }[] = [
  { type: 'maintenance', label: 'صيانة', icon: Wrench },
  { type: 'cleaning', label: 'نظافة', icon: Sparkles },
];

export const StartRoundSheet: React.FC<StartRoundSheetProps> = ({ onClose, onStart }) => {
  const [starting, setStarting] = useState<RoundType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (type: RoundType) => {
    setStarting(type);
    setError(null);
    try {
      await onStart(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر بدء الجولة.');
      setStarting(null);
    }
  };

  return (
    <Sheet title="نوع الجولة" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 pt-2">
        {TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            disabled={starting !== null}
            onClick={() => start(type)}
            className="flex h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-900 transition-colors hover:border-sky-400 active:bg-sky-50 disabled:opacity-60"
          >
            <Icon className="size-8 text-sky-600" strokeWidth={1.8} />
            {starting === type ? 'جارٍ البدء…' : label}
          </button>
        ))}
      </div>
      {error && <div className="mt-4"><ErrorText>{error}</ErrorText></div>}
    </Sheet>
  );
};
