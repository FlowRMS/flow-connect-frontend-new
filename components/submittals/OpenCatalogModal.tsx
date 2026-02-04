'use client';

import React from 'react';

interface OpenCatalogModalProps {
  onClose: () => void;
}

export function OpenCatalogModal({ onClose }: OpenCatalogModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="flex flex-col items-center text-center py-8">
          {/* Coming Soon Icon */}
          <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--primary)]">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Coming Soon
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Integration with Flow Connect Open Catalog is coming soon.
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            You&apos;ll be able to import spec sheets directly from the catalog.
          </p>
        </div>
      </div>
    </div>
  );
}
