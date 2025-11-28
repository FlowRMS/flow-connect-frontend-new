/**
 * PreOpp Card Component
 */

import React from 'react';
import { getOwnerInitials, getOwnerColor } from './utils';
import type { PreOpp } from './types';

interface PreOppCardProps {
  preOpp: PreOpp;
  isDragging?: boolean;
  onClick?: () => void;
}

export function PreOppCard({ preOpp, isDragging, onClick }: PreOppCardProps) {
  const ownerInitials = getOwnerInitials(preOpp.owner);
  const ownerColor = getOwnerColor(preOpp.id);

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-md p-3 mb-2 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <input type="checkbox" className="mt-1 accent-gray-400" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{preOpp.name}</h4>
        </div>
        <div className={`w-5 h-5 rounded-full ${ownerColor} flex items-center justify-center text-white text-[10px] font-semibold`}>
          {ownerInitials}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <span className="font-mono text-gray-500">{preOpp.id}</span>
      </div>

      {preOpp.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {preOpp.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
