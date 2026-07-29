"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface TabPillsProps {
  tabs: { label: string; value: string; count?: number }[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export default function TabPills({ tabs, activeTab, onChange, className, size = 'md' }: TabPillsProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 p-1 bg-gray-100 rounded-full",
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-150 whitespace-nowrap",
            size === 'sm' ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-[13px]",
            activeTab === tab.value
              ? "bg-gray-900 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/60"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "inline-flex items-center justify-center rounded-full text-[10px] font-semibold min-w-[18px] h-[18px] px-1",
              activeTab === tab.value
                ? "bg-white/20 text-white"
                : "bg-gray-200 text-gray-500"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
