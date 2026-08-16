import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Button = ({ children, className, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, fullWidth = false, disabled, ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus:outline-none';
    const variants = {
        primary: 'bg-[#FF5500] hover:bg-[#E64D00] text-white shadow-soft hover:shadow-glow-orange border border-transparent',
        secondary: 'bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 shadow-soft-sm',
        outline: 'bg-transparent hover:bg-neutral-100 text-[#FF5500] border border-[#FF5500]',
        ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900',
        danger: 'bg-red-500 hover:bg-red-600 text-white shadow-soft',
    };
    const sizes = {
        sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5 h-8',
        md: 'text-sm px-4 py-2.5 rounded-2xl gap-2 h-11',
        lg: 'text-base px-6 py-3.5 rounded-2xl gap-2.5 h-13 font-semibold',
    };
    return (_jsxs("button", { className: twMerge(clsx(baseStyles, variants[variant], sizes[size], fullWidth && 'w-full', className)), disabled: disabled || isLoading, ...props, children: [isLoading ? (_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-current", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] })) : leftIcon ? (_jsx("span", { className: "shrink-0", children: leftIcon })) : null, children, !isLoading && rightIcon && _jsx("span", { className: "shrink-0", children: rightIcon })] }));
};
