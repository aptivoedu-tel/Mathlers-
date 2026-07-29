import React from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface IconCircleProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-8 h-8', icon: 'w-3.5 h-3.5' },
  md: { container: 'w-9 h-9', icon: 'w-4 h-4' },
  lg: { container: 'w-10 h-10', icon: 'w-[18px] h-[18px]' },
  xl: { container: 'w-12 h-12', icon: 'w-5 h-5' },
};

const variantMap = {
  default: 'bg-white border border-gray-200 text-gray-500',
  brand: 'bg-brand-lighter/60 border-none text-brand-primary',
  success: 'bg-emerald-50 border-none text-emerald-600',
  warning: 'bg-amber-50 border-none text-amber-600',
  danger: 'bg-red-50 border-none text-red-500',
  info: 'bg-blue-50 border-none text-blue-600',
};

export default function IconCircle({ icon: Icon, size = 'md', variant = 'default', className }: IconCircleProps) {
  const s = sizeMap[size];
  return (
    <div className={cn(
      "inline-flex items-center justify-center rounded-xl shrink-0",
      s.container,
      variantMap[variant],
      className
    )}>
      <Icon className={s.icon} />
    </div>
  );
}
