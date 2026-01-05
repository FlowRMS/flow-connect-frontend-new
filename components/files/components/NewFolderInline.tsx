'use client';

import React, { useState, useRef, useEffect } from 'react';

interface NewFolderInlineProps {
  isActive: boolean;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function NewFolderInline({ isActive, onSubmit, onCancel }: NewFolderInlineProps) {
  const [name, setName] = useState('New Folder');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select input when activated
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isActive]);

  // Reset state when deactivated
  useEffect(() => {
    if (!isActive) {
      setName('New Folder');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isActive]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Folder name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmedName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow click events to register first
    setTimeout(() => {
      if (!isSubmitting && name.trim()) {
        handleSubmit();
      } else if (!name.trim()) {
        onCancel();
      }
    }, 100);
  };

  if (!isActive) return null;

  return (
    <div
      className="group relative flex flex-col items-center p-4 rounded-xl transition-all duration-150 bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Folder icon */}
      <div className="w-16 h-16 flex items-center justify-center mb-2">
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          className="text-blue-500"
        >
          <path
            d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M2 8h20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Editable name input */}
      <div className="w-full px-1">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSubmitting}
          className={`
            w-full text-sm font-medium text-center py-1 px-2 rounded
            bg-white border-2 border-[var(--primary)] focus:outline-none
            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            ${error ? 'border-red-500' : ''}
          `}
          style={{ minWidth: '100px' }}
        />
        {error && (
          <p className="text-xs text-red-500 text-center mt-1 truncate" title={error}>
            {error}
          </p>
        )}
        {isSubmitting && (
          <div className="flex justify-center mt-1">
            <div className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
