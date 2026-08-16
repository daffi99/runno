import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Home, Clock, Plus, MoreHorizontal, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
export const BottomNav = ({ currentTab, onSelectTab }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'coach', label: 'Coach', icon: Sparkles },
        { id: 'add', label: 'Add', icon: Plus, isAction: true },
        { id: 'history', label: 'History', icon: Clock },
        { id: 'more', label: 'More', icon: MoreHorizontal },
    ];
    return (_jsx("nav", { className: "fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 shadow-lg select-none bottom-nav-safe", children: _jsx("div", { className: "max-w-md mx-auto px-4 h-16 flex items-center justify-between", children: navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                if (item.isAction) {
                    return (_jsx("button", { onClick: () => onSelectTab(item.id), className: "relative -top-4 flex items-center justify-center w-13 h-13 rounded-full bg-[#FF5500] text-white shadow-glow-orange hover:bg-[#E64D00] active:scale-95 transition-all duration-200 focus:outline-none p-3", "aria-label": "Add Run", children: _jsx(Plus, { className: "w-7 h-7 stroke-[2.5]" }) }, item.id));
                }
                return (_jsxs("button", { onClick: () => onSelectTab(item.id), className: clsx('flex flex-col items-center justify-center flex-1 py-1 transition-colors duration-150 active:scale-95 focus:outline-none', isActive ? 'text-[#FF5500]' : 'text-neutral-400 hover:text-neutral-600'), children: [_jsx(Icon, { className: clsx('w-5 h-5 mb-1', isActive ? 'stroke-[2.4]' : 'stroke-[1.8]') }), _jsx("span", { className: clsx('text-[10px] font-medium tracking-tight', isActive && 'font-bold'), children: item.label })] }, item.id));
            }) }) }));
};
