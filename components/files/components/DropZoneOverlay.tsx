import React from 'react';

interface DropZoneOverlayProps {
  isVisible: boolean;
}

export function DropZoneOverlay({ isVisible }: DropZoneOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[var(--primary)]/10 border-4 border-dashed border-[var(--primary)] rounded-xl flex items-center justify-center pointer-events-none backdrop-blur-sm animate-pulse">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[var(--primary)]"
          >
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-xl font-semibold text-[var(--primary)]">Drop files to upload</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Release to upload files to this folder</p>
      </div>
    </div>
  );
}
