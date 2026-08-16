import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Input = React.forwardRef(({ label, suffix, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: inputId, className: "block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider", children: label })), _jsxs("div", { className: "relative flex items-center", children: [_jsx("input", { ref: ref, id: inputId, className: twMerge(clsx('w-full bg-white border border-neutral-200 rounded-2xl px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400', 'focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]', 'transition duration-150', suffix && 'pr-12', error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20', className)), ...props }), suffix && (_jsx("span", { className: "absolute right-3.5 text-xs font-medium text-neutral-400 pointer-events-none select-none", children: suffix }))] }), error ? (_jsx("p", { className: "mt-1 text-xs text-red-500", children: error })) : helperText ? (_jsx("p", { className: "mt-1 text-xs text-neutral-400", children: helperText })) : null] }));
});
Input.displayName = 'Input';
