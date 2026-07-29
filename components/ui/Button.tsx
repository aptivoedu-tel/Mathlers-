import React from 'react';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {

    const variants = {
      primary: 'bg-brand-primary text-white hover:bg-brand-dark shadow-sm hover:shadow-md',
      secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-xs',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      outline: 'bg-transparent text-brand-primary border border-brand-primary/30 hover:bg-brand-lighter/30 hover:border-brand-primary/50',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    };

    const sizes = {
      sm: 'px-3.5 py-1.5 text-[13px] rounded-lg gap-1.5',
      md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
      lg: 'px-7 py-3 text-base rounded-xl gap-2',
      icon: 'p-2.5 rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-1',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
