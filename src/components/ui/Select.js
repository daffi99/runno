import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';
export const Select = React.forwardRef(({ label, options, error, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: selectId, className: "block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider", children: label })), _jsxs("div", { className: "relative flex items-center", children: [_jsx("select", { ref: ref, id: selectId, className: twMerge(clsx('w-full bg-white border border-neutral-200 rounded-2xl px-3.5 py-2.5 text-sm text-neutral-900 appearance-none pr-10', 'focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]', 'transition duration-150 cursor-pointer', error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20', className)), ...props, children: options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) }), _jsx(ChevronDown, { className: "absolute right-3.5 w-4 h-4 text-neutral-400 pointer-events-none" })] }), error && _jsx("p", { className: "mt-1 text-xs text-red-500", children: error })] }));
});
Select.displayName = 'Select';
