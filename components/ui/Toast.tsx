'use client';

import React, { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      icon: <Check className="w-4 h-4" />,
      accent: 'bg-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    error: {
      icon: <X className="w-4 h-4" />,
      accent: 'bg-red-500',
      iconBg: 'bg-red-50 text-red-500',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4" />,
      accent: 'bg-amber-500',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    info: {
      icon: <Info className="w-4 h-4" />,
      accent: 'bg-blue-500',
      iconBg: 'bg-blue-50 text-blue-600',
    },
  };

  const { icon, accent, iconBg } = config[type];

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[60] flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-elevated overflow-hidden transition-all duration-300',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
      )}
    >
      {/* Left accent bar */}
      <div className={cn('w-1 self-stretch shrink-0', accent)} />

      <div className="flex items-center gap-3 pr-3 py-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
          {icon}
        </div>
        <p className="text-sm font-medium text-gray-900 pr-2">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
