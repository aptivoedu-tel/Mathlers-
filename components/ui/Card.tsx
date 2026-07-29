import React from 'react';
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'elevated';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-gray-200/80 shadow-card',
      flat: 'bg-gray-50 border border-transparent',
      elevated: 'bg-white border border-gray-200/60 shadow-elevated',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl p-6',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({ className = '', children, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-gray-900 tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-100', className)} {...props}>
    {children}
  </div>
);

export default Card;
