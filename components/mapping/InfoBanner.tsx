'use client';

import { Info } from 'lucide-react';
import { ReactNode } from 'react';

interface InfoBannerProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function InfoBanner({ title, description, children, className = '' }: InfoBannerProps) {
  return (
    <div className={`p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          {title && <p className="text-sm font-medium text-blue-900">{title}</p>}
          {description && (
            <p className={`text-sm text-blue-700 ${title ? 'mt-1' : ''}`}>
              {description}
            </p>
          )}
          {children && (
            <div className={`text-sm text-blue-700 ${(title || description) ? 'mt-1' : ''}`}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
