import { jsx as _jsx } from "react/jsx-runtime";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Card = ({ children, className, variant = 'default', padding = 'md', ...props }) => {
    const baseStyles = 'bg-white rounded-3xl transition-all duration-200';
    const variants = {
        default: 'border border-neutral-100/80 shadow-soft',
        flat: 'bg-[#F8F9FA] border border-neutral-200/60',
        outline: 'border border-neutral-200 bg-transparent',
        interactive: 'border border-neutral-100/80 shadow-soft hover:shadow-soft-lg active:scale-[0.99] cursor-pointer',
    };
    const paddings = {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4 sm:p-5',
        lg: 'p-6',
    };
    return (_jsx("div", { className: twMerge(clsx(baseStyles, variants[variant], paddings[padding], className)), ...props, children: children }));
};
