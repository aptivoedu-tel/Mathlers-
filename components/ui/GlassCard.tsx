import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'medium' | 'dark';
  hover?: boolean;
}

export default function GlassCard({ 
  children, 
  className, 
  variant = 'light',
  hover = false 
}: GlassCardProps) {
  const variantStyles = {
    light: 'bg-white border-gray-200/80',
    medium: 'bg-gray-50 border-gray-200/60',
    dark: 'bg-gray-100/80 border-gray-200/40',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border shadow-card transition-all duration-200',
        variantStyles[variant],
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
