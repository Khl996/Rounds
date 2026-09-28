import React from 'react';
import { Home, ListChecks, Settings } from 'lucide-react';

export type NavTab = 'home' | 'observations' | 'admin';

export interface NavItem {
  id: NavTab;
  label: string;
  icon: typeof Home;
  badge?: number;
}

export function getNavItems(isAdmin: boolean, openCount: number): NavItem[] {
  return [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'observations', label: 'الملاحظات', icon: ListChecks, badge: openCount },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'الإدارة', icon: Settings }] : []),
  ];
}

interface BottomNavProps {
  items: NavItem[];
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

/** Phone tab bar. On wider screens the tabs live in the header. */
export const BottomNav: React.FC<BottomNavProps> = ({ items, currentTab, onTabChange }) => (
  <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
    <div className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            aria-current={active ? 'page' : undefined}
            className={`flex h-16 cursor-pointer flex-col items-center justify-center gap-1 text-xs transition-colors ${
              active ? 'font-medium text-sky-700' : 'text-slate-500'
            }`}
          >
            <span className="relative">
              <Icon className="size-6" strokeWidth={active ? 2.2 : 1.8} />
              {!!item.badge && (
                <span className="absolute -top-1.5 -end-3 min-w-5 rounded-full bg-amber-500 px-1.5 text-[11px] leading-5 font-semibold text-white tabular-nums">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  </nav>
);
