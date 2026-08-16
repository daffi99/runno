import { jsx as _jsx } from "react/jsx-runtime";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Badge = ({ children, className, variant = 'neutral', size = 'sm', ...props }) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full';
    const variants = {
        brand: 'bg-[#FFF0EB] text-[#FF5500]',
        success: 'bg-emerald-50 text-emerald-600',
        danger: 'bg-rose-50 text-rose-600',
        neutral: 'bg-neutral-100 text-neutral-600',
        outline: 'border border-neutral-200 text-neutral-600',
    };
    const sizes = {
        sm: 'text-[11px] px-2 py-0.5 gap-1',
        md: 'text-xs px-2.5 py-1 gap-1.5',
    };
    return (_jsx("span", { className: twMerge(clsx(baseStyles, variants[variant], sizes[size], className)), ...props, children: children }));
};
