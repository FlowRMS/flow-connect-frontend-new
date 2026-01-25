import React from 'react';

interface DeliveryMetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  onClick?: () => void;
}

const colorStyles = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
};

/**
 * Reusable metric card for dashboard/summary views
 * Optimized with React.memo
 */
export const DeliveryMetricCard = React.memo<DeliveryMetricCardProps>(
  ({ title, value, subtitle, icon, trend, color = 'gray', onClick }) => {
    const colorClass = colorStyles[color];
    const isClickable = !!onClick;

    return (
      <div
        onClick={onClick}
        className={`border rounded-lg p-4 transition-all ${colorClass} ${
          isClickable ? 'cursor-pointer hover:shadow-md' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-sm font-medium opacity-75">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
          </div>
          {icon && <div className="ml-2 opacity-75">{icon}</div>}
        </div>

        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium mt-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={trend.isPositive ? 'text-green-600' : 'text-red-600'}
            >
              {trend.isPositive ? (
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              ) : (
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              )}
            </svg>
            <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="opacity-60">vs last period</span>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for better memoization
    return (
      prevProps.title === nextProps.title &&
      prevProps.value === nextProps.value &&
      prevProps.subtitle === nextProps.subtitle &&
      prevProps.color === nextProps.color &&
      prevProps.trend?.value === nextProps.trend?.value &&
      prevProps.trend?.isPositive === nextProps.trend?.isPositive
    );
  }
);

DeliveryMetricCard.displayName = 'DeliveryMetricCard';

export default DeliveryMetricCard;
