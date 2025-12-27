'use client';

import React from 'react';

interface LineApprovalIconProps {
  status: 'approved' | 'conditional' | 'not_approved' | 'unknown';
}

export function LineApprovalIcon({ status }: LineApprovalIconProps) {
  if (status === 'approved') {
    return (
      <span className="text-green-500" title="Approved">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  if (status === 'conditional') {
    return (
      <span className="text-yellow-500" title="Conditional Approval">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
          <circle cx="10" cy="10" r="7"/>
        </svg>
      </span>
    );
  }
  if (status === 'not_approved') {
    return (
      <span className="text-red-500" title="Not Approved - Action Required">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="7"/>
          <path d="M8 8l4 4M12 8l-4 4" strokeLinecap="round"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="text-gray-400" title="Unknown Status">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="7"/>
        <path d="M10 14h.01M8 8a2 2 0 113 1.7c0 .8-.7 1.3-1 1.3" strokeLinecap="round"/>
      </svg>
    </span>
  );
}
