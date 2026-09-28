import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Footprints, AlertCircle, Settings } from 'lucide-react';

export type NavTab = 'dashboard' | 'rounds' | 'observations' | 'admin';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  openObservationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  openObservationsCount = 0,
}) => {
  const { isAdmin } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'الرئيسية',
      icon: LayoutDashboard,
    },
    {
      id: 'rounds' as NavTab,
      label: 'الجولات',
      icon: Footprints,
    },
    {
      id: 'observations' as NavTab,
      label: 'الملاحظات',
      icon: AlertCircle,
      badge: openObservationsCount > 0 ? openObservationsCount : null,
    },
    ...(isAdmin
      ? [
          {
            id: 'admin' as NavTab,
            label: 'الإدارة',
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Desktop Navigation Top Tabs */}
      <nav className="no-print hidden sm:block bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 flex gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-colors relative ${
                  isActive
                    ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-rose-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="no-print sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg safe-area-bottom">
        <div className="grid grid-cols-3 max-w-md mx-auto" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-2 relative transition-colors ${
                  isActive ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-1 bg-sky-600 rounded-t-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
