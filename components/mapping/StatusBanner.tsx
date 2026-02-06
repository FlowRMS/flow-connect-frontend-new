'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';

type BannerVariant = 'error' | 'warning' | 'success';

interface StatusBannerProps {
  message: string;
  variant?: BannerVariant;
  title?: string;
}

const variantStyles: Record<BannerVariant, { 
  container: string; 
  icon: string; 
  title: string; 
  message: string;
  Icon: typeof AlertCircle;
}> = {
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    message: 'text-red-700',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    message: 'text-amber-800',
    Icon: AlertCircle,
  },
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    title: 'text-green-900',
    message: 'text-green-700',
    Icon: CheckCircle,
  },
};

export function StatusBanner({ message, variant = 'warning', title }: StatusBannerProps) {
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <div className={`p-4 border rounded-lg flex items-start gap-3 ${styles.container}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      <div>
        {title && <p className={`text-sm font-medium ${styles.title}`}>{title}</p>}
        <p className={`text-sm ${title ? 'mt-1' : ''} ${styles.message}`}>{message}</p>
      </div>
    </div>
  );
}
