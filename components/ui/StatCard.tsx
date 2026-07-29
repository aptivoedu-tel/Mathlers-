import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  className?: string;
}

export default function StatCard({ icon, value, label, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border border-gray-200/80 shadow-card p-6 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 bg-brand-lighter/40 rounded-xl">{icon}</div>
        {trend && (
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
            trend.startsWith('+')
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-red-50 text-red-500'
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[28px] font-bold text-gray-900 mb-0.5 tracking-tight">{value}</p>
      <p className="text-[13px] text-gray-500">{label}</p>
    </div>
  );
}
