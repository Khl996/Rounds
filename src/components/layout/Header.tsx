import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Round } from '../../types';
import {
  ClipboardCheck,
  User,
  LogOut,
  ShieldCheck,
  PlayCircle,
  Clock,
} from 'lucide-react';
import { formatTimeArabic } from '../../utils/formatters';

interface HeaderProps {
  activeRound: Round | null;
  onNavigateToActiveRound: () => void;
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeRound,
  onNavigateToActiveRound,
}) => {
  const { appUser, logout, isAdmin } = useAuth();

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">جولات الصيانة</h1>
            <p className="text-xs text-slate-500 font-medium">متابعة ومراقبة الجولات الميدانية</p>
          </div>
        </div>

        {/* User and active round indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {activeRound && (
            <button
              onClick={onNavigateToActiveRound}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-semibold hover:bg-sky-100 transition-colors animate-pulse"
              title="جولة نشطة حاليًا"
            >
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <PlayCircle className="w-3.5 h-3.5" />
              <span>جولة نشطة</span>
              <span className="hidden sm:inline text-sky-600 text-[11px]">
                ({formatTimeArabic(activeRound.startedAt)})
              </span>
            </button>
          )}

          {appUser && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800">{appUser.fullName}</span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                  {isAdmin ? (
                    <span className="text-sky-600 font-medium flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> مدير
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium flex items-center gap-0.5">
                      <User className="w-3 h-3" /> مشرف
                    </span>
                  )}
                </span>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
