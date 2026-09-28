import React from 'react';

export const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50 disabled:text-slate-500';

interface FieldProps {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, optional, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
      {optional && <span className="font-normal text-slate-400"> — اختياري</span>}
    </span>
    {children}
  </label>
);

export const ErrorText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p role="alert" className="text-sm text-red-600">
    {children}
  </p>
);
