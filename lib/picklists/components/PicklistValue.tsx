'use client';

import { usePicklist } from '../usePicklist';
import { PicklistKey } from '../enums';
import type { PicklistValueVariant } from '../types';

interface PicklistValueProps {
  picklistKey: PicklistKey;
  value: string;
  variant?: PicklistValueVariant;
  showColor?: boolean;
  className?: string;
}

export function PicklistValue({
  picklistKey,
  value,
  variant = 'text',
  showColor = true,
  className = '',
}: PicklistValueProps) {
  const { getLabelByKey, getColorByKey } = usePicklist(picklistKey);

  const label = getLabelByKey(value);
  const color = showColor ? getColorByKey(value) : undefined;

  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
        style={color ? { backgroundColor: `${color}20`, color } : undefined}
      >
        {color && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {color && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
