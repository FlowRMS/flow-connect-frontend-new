'use client';
import React from 'react';
import { ValueType } from '@/lib/analytics/graphql/types';

interface ModeToggleProps {
  value: ValueType;
  onChange: (value: ValueType) => void;
  className?: string;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ 
  value, 
  onChange, 
  className = '' 
}) => {
  return (
    <div className={`flex p-1 bg-gray-100 rounded-lg ${className}`}>
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          value === 'COMMISSION'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        onClick={() => onChange('COMMISSION')}
      >
        Commission
      </button>
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          value === 'SALES'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        onClick={() => onChange('SALES')}
      >
        Sales
      </button>
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          value === 'BOTH'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        onClick={() => onChange('BOTH')}
      >
        Both
      </button>
    </div>
  );
};
