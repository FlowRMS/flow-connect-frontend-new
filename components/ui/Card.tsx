/**
 * Card Component
 * Premium card component with variants and interactive states
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const variantMap = {
  default: 'bg-white border border-[var(--border)] shadow-sm',
  elevated: 'bg-white border border-[var(--border)] shadow-md hover:shadow-lg',
  outlined: 'bg-transparent border-2 border-[var(--border)]',
  ghost: 'bg-[var(--muted)]/50',
  gradient: 'bg-gradient-to-br from-white to-[var(--muted)]/30 border border-[var(--border)]',
};

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'lg',
  hover = false,
  onClick,
}: CardProps) {
  const baseClasses = 'rounded-xl transition-all duration-200';
  const variantClasses = variantMap[variant];
  const paddingClasses = paddingMap[padding];
  const hoverClasses = hover ? 'cursor-pointer hover:border-[var(--primary)]/50 hover:shadow-md' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${paddingClasses} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function CardHeader({ children, className = '', action }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">{children}</div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export function CardTitle({ children, className = '', icon, subtitle }: CardTitleProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{children}</h3>
        {subtitle && <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>}
      </div>
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-[var(--border)] ${className}`}>
      {children}
    </div>
  );
}
