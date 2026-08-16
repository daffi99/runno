import React from 'react';
import { Home, Clock, Plus, MoreHorizontal, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';


export type NavTab = 'dashboard' | 'coach' | 'add' | 'history' | 'stats' | 'more';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: Home },
    { id: 'coach' as NavTab, label: 'Coach', icon: Sparkles },
    { id: 'add' as NavTab, label: 'Add', icon: Plus, isAction: true },
    { id: 'history' as NavTab, label: 'History', icon: Clock },
    { id: 'more' as NavTab, label: 'More', icon: MoreHorizontal },
  ];


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 shadow-lg select-none bottom-nav-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="relative -top-4 flex items-center justify-center w-13 h-13 rounded-full bg-[#FF5500] text-white shadow-glow-orange hover:bg-[#E64D00] active:scale-95 transition-all duration-200 focus:outline-none p-3"
                aria-label="Add Run"
              >
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 active:scale-95 focus:outline-none',
                isActive ? 'text-[#FF5500]' : 'text-neutral-400 hover:text-neutral-600'
              )}
            >
              {item.id === 'dashboard' ? (
                <img
                  src="/apple-touch-icon.png"
                  alt="Dashboard"
                  className={clsx(
                    'w-5 h-5 rounded-[5px] object-contain mb-1 transition-all',
                    isActive ? 'scale-110 ring-1.5 ring-[#FF5500] shadow-xs' : 'opacity-55 grayscale hover:opacity-100 hover:grayscale-0'
                  )}
                />
              ) : (
                <Icon className={clsx('w-5 h-5 mb-1', isActive ? 'stroke-[2.4]' : 'stroke-[1.8]')} />
              )}
              <span className={clsx('text-[10px] font-medium tracking-tight', isActive && 'font-bold')}>
                {item.label}
              </span>
            </button>
          );

        })}
      </div>
    </nav>
  );
};
