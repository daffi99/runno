import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'outline' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const baseStyles = 'bg-white rounded-3xl transition-all duration-200';

  const variants = {
    default: 'border border-neutral-100/80 shadow-soft',
    flat: 'bg-[#F8F9FA] border border-neutral-200/60',
    outline: 'border border-neutral-200 bg-transparent',
    interactive:
      'border border-neutral-100/80 shadow-soft hover:shadow-soft-lg active:scale-[0.99] cursor-pointer',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variants[variant], paddings[padding], className))}
      {...props}
    >
      {children}
    </div>
  );
};
