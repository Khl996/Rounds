import React, { useState } from 'react';
import { ChevronLeft, ClipboardCheck, LogOut } from 'lucide-react';
import { AppUser } from '../../types';
import { NavItem, NavTab } from './Navbar';

interface HeaderProps {
  user: AppUser;
  navItems: NavItem[];
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  /** Shown when the user has a round in progress and is not already looking at it. */
  onResumeRound?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  navItems,
  currentTab,
  onTabChange,
  onResumeRound,
  onLogout,
}) => (
  <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-sky-600 text-white">
          <ClipboardCheck className="size-[18px]" />
        </span>
        <span className="font-semibold text-slate-900">الجولات الإشرافية</span>
      </div>

      <nav className="hidden h-full items-stretch gap-1 sm:flex">
        {navItems.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 text-sm transition-colors ${
                active ? 'border-sky-600 font-medium text-sky-700' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
              {!!item.badge && (
                <span className="rounded-full bg-amber-100 px-2 text-xs leading-5 font-medium text-amber-800 tabular-nums">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="ms-auto flex items-center gap-2">
        {onResumeRound && (
          <button
            type="button"
            onClick={onResumeRound}
            className="hidden h-9 cursor-pointer items-center gap-2 rounded-full bg-sky-50 px-3 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 sm:flex"
          >
            <span className="size-2 rounded-full bg-sky-500" aria-hidden="true" />
            جولتك مستمرة
          </button>
        )}
        <AccountMenu user={user} onLogout={onLogout} />
      </div>
    </div>

    {onResumeRound && (
      <button
        type="button"
        onClick={onResumeRound}
        className="flex h-11 w-full cursor-pointer items-center justify-between bg-sky-600 px-4 text-sm text-white sm:hidden"
      >
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-white" aria-hidden="true" />
          جولتك مستمرة
        </span>
        <span className="flex items-center gap-1 font-medium">
          متابعة
          <ChevronLeft className="size-4" />
        </span>
      </button>
    )}
  </header>
);

const AccountMenu: React.FC<{ user: AppUser; onLogout: () => void }> = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="الحساب"
        className="grid size-9 cursor-pointer place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
      >
        {user.fullName.trim().charAt(0) || '؟'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute end-0 top-11 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
            <div className="px-3 py-2">
              <p className="truncate font-medium text-slate-900">{user.fullName}</p>
              <p className="truncate text-sm text-slate-500">
                {user.role === 'admin' ? 'مدير' : user.role === 'management' ? 'إدارة' : 'مشرف'} ·{' '}
                <span dir="ltr">
                  {user.username ||
                    (user.email.endsWith('@rounds.app')
                      ? user.email.replace('@rounds.app', '')
                      : user.email)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-slate-700 transition-colors hover:bg-slate-100"
            >
              <LogOut className="size-[18px]" />
              تسجيل الخروج
            </button>
          </div>
        </>
      )}
    </div>
  );
};
