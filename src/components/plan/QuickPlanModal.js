import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../ui/Button';
import { X, Sparkles, Check } from 'lucide-react';
import { clsx } from 'clsx';
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PRESET_GOALS = [
    { id: '10k', label: '10K Progression / PR', desc: 'Build threshold & stamina for 10K' },
    { id: '5k', label: '5K Speed & Finish', desc: 'Improve 5K time and aerobic speed' },
    { id: 'half', label: 'Half Marathon (21.1K)', desc: 'Progressive weekly long run buildup' },
    { id: 'base', label: 'Aerobic Base & Fitness', desc: 'Heart health & fat burning in Zone 2' },
];
export const QuickPlanModal = ({ isOpen, onClose, onGenerate, isLoading = false, }) => {
    // Default days: Tuesday, Thursday, Saturday
    const [selectedDays, setSelectedDays] = useState(['Tuesday', 'Thursday', 'Saturday']);
    const [selectedGoal, setSelectedGoal] = useState('10k');
    const [level, setLevel] = useState('intermediate');
    const [customGoalText, setCustomGoalText] = useState('');
    if (!isOpen)
        return null;
    const toggleDay = (day) => {
        setSelectedDays((prev) => {
            if (prev.includes(day)) {
                if (prev.length <= 1)
                    return prev; // At least 1 day
                return prev.filter((d) => d !== day);
            }
            else {
                // Keep in natural weekday order
                const next = [...prev, day];
                return ALL_DAYS.filter((d) => next.includes(d));
            }
        });
    };
    const handleGenerate = () => {
        const goalObj = PRESET_GOALS.find((g) => g.id === selectedGoal);
        const goalText = customGoalText.trim() || goalObj?.label || '10K Progression';
        onGenerate({
            selectedDays,
            goal: goalText,
            level,
            customNotes: `Target days: ${selectedDays.join(', ')}. Level: ${level}. Goal: ${goalText}`,
        });
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in", children: _jsxs("div", { className: "bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-neutral-100", children: [_jsxs("div", { className: "flex items-center justify-between pb-2 border-b border-neutral-100", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 rounded-xl bg-orange-50 text-[#FF5500] flex items-center justify-center", children: _jsx(Sparkles, { className: "w-4 h-4" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-base font-black text-neutral-900", children: "Plan Setup Assistant" }), _jsx("p", { className: "text-[11px] text-neutral-400 font-medium", children: "Pick your available days & target goal" })] })] }), _jsx("button", { onClick: onClose, className: "p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-500", children: ["1. Select Running Days (", selectedDays.length, " days)"] }), _jsx("span", { className: "text-[11px] text-[#FF5500] font-bold", children: selectedDays.map((d) => d.substring(0, 3)).join(' · ') })] }), _jsx("div", { className: "grid grid-cols-7 gap-1.5", children: ALL_DAYS.map((day) => {
                                const isSelected = selectedDays.includes(day);
                                return (_jsxs("button", { type: "button", onClick: () => toggleDay(day), className: clsx('py-2.5 px-1 rounded-xl text-xs font-bold transition-all duration-150 flex flex-col items-center justify-center border', isSelected
                                        ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-soft-sm scale-[1.02]'
                                        : 'bg-neutral-50 text-neutral-600 border-neutral-200/80 hover:bg-neutral-100'), children: [_jsx("span", { className: "text-[10px] uppercase font-semibold", children: day.substring(0, 3) }), isSelected && _jsx(Check, { className: "w-3 h-3 mt-0.5 stroke-[3]" })] }, day));
                            }) }), _jsx("p", { className: "text-[11px] text-neutral-400", children: "Coach will schedule rest and recovery sessions on the remaining days." })] }), _jsxs("div", { className: "space-y-2 pt-1", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-500", children: "2. Running Target & Focus" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: PRESET_GOALS.map((g) => {
                                const isSelected = selectedGoal === g.id;
                                return (_jsxs("button", { type: "button", onClick: () => {
                                        setSelectedGoal(g.id);
                                        setCustomGoalText('');
                                    }, className: clsx('p-3 rounded-2xl text-left border transition-all duration-150', isSelected
                                        ? 'bg-orange-50/70 border-[#FF5500] ring-1 ring-[#FF5500] text-neutral-900'
                                        : 'bg-neutral-50 border-neutral-200/80 text-neutral-600 hover:bg-neutral-100'), children: [_jsxs("div", { className: "text-xs font-bold flex items-center justify-between", children: [_jsx("span", { children: g.label }), isSelected && _jsx(Check, { className: "w-3.5 h-3.5 text-[#FF5500] shrink-0" })] }), _jsx("div", { className: "text-[10px] text-neutral-500 mt-1 line-clamp-2 leading-tight", children: g.desc })] }, g.id));
                            }) }), _jsx("div", { className: "pt-1", children: _jsx("input", { type: "text", placeholder: "Or write custom goal (e.g. Sub-45 min 10K, Marathon pacing)...", value: customGoalText, onChange: (e) => {
                                    setCustomGoalText(e.target.value);
                                    if (e.target.value)
                                        setSelectedGoal('custom');
                                }, className: "w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20" }) })] }), _jsxs("div", { className: "space-y-2 pt-1", children: [_jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-neutral-500", children: "3. Experience Level" }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: ['beginner', 'intermediate', 'advanced'].map((lvl) => {
                                const isSelected = level === lvl;
                                return (_jsx("button", { type: "button", onClick: () => setLevel(lvl), className: clsx('py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all border text-center', isSelected
                                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'), children: lvl }, lvl));
                            }) })] }), _jsx("div", { className: "pt-3", children: _jsx(Button, { variant: "primary", size: "lg", fullWidth: true, isLoading: isLoading, onClick: handleGenerate, leftIcon: _jsx(Sparkles, { className: "w-4 h-4" }), className: "font-bold text-sm shadow-glow-orange rounded-2xl", children: "Generate AI Training Plan" }) })] }) }));
};
