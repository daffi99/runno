import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Tabs = ({ tabs, activeTab, onChange, className }) => {
    return (_jsx("div", { className: twMerge(clsx('flex items-center space-x-1 border-b border-neutral-200/80 px-4', className)), children: tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (_jsxs("button", { onClick: () => onChange(tab.id), className: clsx('relative py-3 px-3 text-sm font-semibold transition-colors duration-150', isActive ? 'text-[#FF5500]' : 'text-neutral-500 hover:text-neutral-800'), children: [tab.label, isActive && (_jsx("span", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5500] rounded-full animate-in fade-in duration-200" }))] }, tab.id));
        }) }));
};
