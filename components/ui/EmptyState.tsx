'use client';

import React from 'react';
import { FileX, Search, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: 'search' | 'file' | 'alert' | 'custom';
  customIcon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file',
  customIcon,
  title,
  description,
  action,
  className,
}) => {
  const icons: Record<string, React.ReactNode> = {
    search: <Search className="w-12 h-12 text-gray-300" />,
    file: <FileX className="w-12 h-12 text-gray-300" />,
    alert: <AlertCircle className="w-12 h-12 text-gray-300" />,
  };

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5">
        {customIcon || (icon !== 'custom' && icons[icon])}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-primary rounded-xl shadow-sm hover:bg-brand-dark hover:shadow-md transition-all duration-150"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
