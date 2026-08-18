import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={twMerge(clsx('flex items-center space-x-1 border-b border-white/10 px-4', className))}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'relative py-3 px-3 text-sm font-semibold transition-colors duration-150',
              isActive ? 'text-[#FF5500]' : 'text-neutral-400 hover:text-white'
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5500] rounded-full animate-in fade-in duration-200" />
            )}
          </button>
        );
      })}
    </div>
  );
};
