/**
 * CreatedByBadge Component
 * A sleek badge showing who created an entity and when
 */

'use client';

import { getAvatarColors, getInitials, formatCreatedDateTime } from '@/lib/utils/avatar';

interface CreatedByBadgeProps {
  createdBy: string | null | undefined;
  createdAt?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showDate?: boolean;
  className?: string;
}

export function CreatedByBadge({
  createdBy,
  createdAt,
  size = 'md',
  showDate = true,
  className = '',
}: CreatedByBadgeProps) {
  if (!createdBy) return null;

  const colors = getAvatarColors(createdBy);
  const initials = getInitials(createdBy);

  const sizeClasses = {
    sm: {
      container: 'gap-2 px-2.5 py-1.5',
      avatar: 'w-6 h-6 text-xs',
      name: 'text-xs',
      date: 'text-[10px]',
    },
    md: {
      container: 'gap-3 px-3 py-2',
      avatar: 'w-8 h-8 text-sm',
      name: 'text-sm',
      date: 'text-xs',
    },
    lg: {
      container: 'gap-3 px-4 py-2.5',
      avatar: 'w-10 h-10 text-base',
      name: 'text-base',
      date: 'text-sm',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center ${classes.container} bg-[var(--muted)]/50 rounded-full border border-[var(--border)] ${className}`}
    >
      <div
        className={`${classes.avatar} rounded-full ${colors.bg} ${colors.text} flex items-center justify-center font-semibold shadow-sm`}
      >
        {initials}
      </div>
      <div className="flex flex-col">
        <span className={`${classes.name} font-medium text-[var(--foreground)]`}>
          {createdBy}
        </span>
        {showDate && createdAt && (
          <span className={`${classes.date} text-[var(--muted-foreground)]`}>
            {formatCreatedDateTime(createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Inline avatar for table rows
 */
interface AvatarInlineProps {
  name: string | null | undefined;
  showName?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function AvatarInline({
  name,
  showName = true,
  size = 'sm',
  className = '',
}: AvatarInlineProps) {
  if (!name) {
    return <span className="text-xs text-[var(--muted-foreground)]">-</span>;
  }

  const colors = getAvatarColors(name);
  const initials = getInitials(name);

  const sizeClasses = {
    xs: { avatar: 'w-5 h-5 text-[10px]', name: 'text-[11px]' },
    sm: { avatar: 'w-6 h-6 text-xs', name: 'text-xs' },
    md: { avatar: 'w-7 h-7 text-xs', name: 'text-sm' },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${classes.avatar} rounded-full ${colors.bg} ${colors.text} flex items-center justify-center font-medium shadow-sm flex-shrink-0`}
      >
        {initials}
      </div>
      {showName && (
        <span className={`${classes.name} text-[var(--muted-foreground)] truncate`}>
          {name}
        </span>
      )}
    </div>
  );
}
