interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
}

export function Segmented<T extends string>({ value, onChange, options, className = '' }: SegmentedProps<T>) {
  return (
    <div role="tablist" className={`grid grid-flow-col auto-cols-fr gap-1 rounded-xl bg-slate-200/70 p-1 ${className}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`h-9 cursor-pointer rounded-lg text-sm transition-colors ${
              selected ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`ms-1.5 tabular-nums ${selected ? 'text-slate-500' : 'text-slate-400'}`}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
