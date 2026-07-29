import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  backHref,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {/* Breadcrumb row */}
      {(breadcrumbs || backHref) && (
        <div className="flex items-center gap-2 mb-3">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
          {breadcrumbs && (
            <nav className="flex items-center gap-1 text-[13px]">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-gray-300 mx-1">/</span>}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-600 font-medium">{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
