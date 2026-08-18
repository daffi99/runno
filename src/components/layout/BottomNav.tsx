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
    { id: 'dashboard' as NavTab, label: 'Home', icon: Home },
    { id: 'coach' as NavTab, label: 'Coach', icon: Sparkles },
    { id: 'add' as NavTab, label: 'Add', icon: Plus, isAction: true },
    { id: 'history' as NavTab, label: 'History', icon: Clock },
    { id: 'more' as NavTab, label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-[#1E1E1E]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl select-none">
      <div className="px-3 h-16 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  window.scrollTo(0, 0);
                  document.documentElement.scrollTop = 0;
                  document.body.scrollTop = 0;
                  onSelectTab(item.id);
                }}
                className="relative -top-5 flex items-center justify-center w-13 h-13 rounded-full bg-[#FF5500] text-white shadow-glow-orange hover:bg-[#E64D00] active:scale-95 transition-all duration-200 focus:outline-none p-3 ring-4 ring-[#111111]/80"
                aria-label="Add Run"
              >
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                onSelectTab(item.id);
              }}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-95 focus:outline-none relative',
                isActive ? 'text-[#FF5500]' : 'text-neutral-400 hover:text-neutral-200'
              )}
            >
              <div className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200',
                isActive && 'bg-[#FF5500]/15'
              )}>
                {item.id === 'dashboard' ? (
                  <img
                    src="/apple-touch-icon.png"
                    alt="Home"
                    className={clsx(
                      'w-5 h-5 rounded-[5px] object-contain transition-all',
                      isActive ? 'scale-110 brightness-110' : 'opacity-45 grayscale'
                    )}
                  />
                ) : (
                  <Icon className={clsx('w-5 h-5', isActive ? 'stroke-[2.4]' : 'stroke-[1.8]')} />
                )}
              </div>
              <span className={clsx('text-[10px] font-medium tracking-tight -mt-0.5', isActive && 'font-bold text-[#FF5500]')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
