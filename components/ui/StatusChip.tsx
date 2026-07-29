import React from 'react';
import { cn } from '@/lib/utils';

type ChipVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusChipProps {
  variant?: ChipVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<ChipVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-600',
  info:    'bg-blue-50 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
};

const dotColors: Record<ChipVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-gray-400',
};

export default function StatusChip({ variant = 'neutral', children, dot = true, className }: StatusChipProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
      variantStyles[variant],
      className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
}
