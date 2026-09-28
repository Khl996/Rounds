import React from 'react';

type Variant = 'primary' | 'success' | 'secondary' | 'ghost';
type Size = 'lg' | 'md' | 'sm';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
  secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
};

const SIZES: Record<Size, string> = {
  lg: 'h-14 px-5 text-base rounded-2xl',
  md: 'h-12 px-4 text-[15px] rounded-xl',
  sm: 'h-9 px-3 text-sm rounded-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  full = false,
  type = 'button',
  className = '',
  ...props
}) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 font-semibold select-none cursor-pointer transition-colors disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
    {...props}
  />
);
