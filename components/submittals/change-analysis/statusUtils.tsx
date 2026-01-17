'use client';

import React from 'react';
import type { ItemChangeStatus } from '../../../lib/types/submittals';

export function getStatusColor(status: ItemChangeStatus): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'approved_as_noted':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'revise':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getStatusLabel(status: ItemChangeStatus): string {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'approved_as_noted':
      return 'Approved as Noted';
    case 'revise':
      return 'Revise';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

export function ItemChangeStatusIcon({ status }: { status: ItemChangeStatus }) {
  switch (status) {
    case 'approved':
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-green-600">
            <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case 'approved_as_noted':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-blue-600">
            <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case 'revise':
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-amber-600">
            <path d="M10 6v5M10 13v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'rejected':
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-red-600">
            <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );
    default:
      return null;
  }
}
