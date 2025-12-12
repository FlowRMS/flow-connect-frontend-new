'use client';

import React, { useState } from 'react';
import FlowSettings from './FlowSettings';

export default function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
        aria-label="Open settings"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.25 10c0 .344-.031.688-.094 1.031l1.719 1.344a.625.625 0 01.156.781l-1.562 2.688a.625.625 0 01-.75.281l-2.031-.813a6.188 6.188 0 01-1.782 1.032l-.406 2.156a.625.625 0 01-.625.5h-3.125a.625.625 0 01-.625-.5l-.406-2.156a6.188 6.188 0 01-1.782-1.032l-2.031.813a.625.625 0 01-.75-.281L.844 13.156a.625.625 0 01.156-.781l1.719-1.344A6.25 6.25 0 012.625 10c0-.344.031-.688.094-1.031L1 7.625a.625.625 0 01-.156-.781l1.562-2.688a.625.625 0 01.75-.281l2.031.813a6.188 6.188 0 011.782-1.032L7.375.5a.625.625 0 01.625-.5h3.125c.281 0 .531.188.625.5l.406 2.156a6.188 6.188 0 011.782 1.032l2.031-.813a.625.625 0 01.75.281l1.562 2.688a.625.625 0 01-.156.781l-1.719 1.344c.063.343.094.687.094 1.031z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Settings
      </button>
      {isOpen && <FlowSettings isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </>
  );
}
