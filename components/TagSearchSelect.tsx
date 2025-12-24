'use client';

import React, { useState, useRef, useEffect } from 'react';

type TagSearchSelectProps = {
  value: string;
  onChange: (value: string) => void;
  availableTags: string[];
  placeholder?: string;
};

export default function TagSearchSelect({ value, onChange, availableTags, placeholder = 'Search tags...' }: TagSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectTag = (tag: string) => {
    onChange(tag);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={isOpen ? searchQuery : value}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleSelectTag(tag)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
              >
                {tag}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
              {searchQuery ? 'No tags found' : 'Start typing to search...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
