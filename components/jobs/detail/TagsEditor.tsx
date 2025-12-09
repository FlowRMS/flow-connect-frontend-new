/**
 * Tags Editor Component
 * Allows adding and removing tags in edit mode
 */

import React, { useState, KeyboardEvent } from 'react';

interface TagsEditorProps {
  tags: string[];
  isEditing: boolean;
  onChange?: (tags: string[]) => void;
}

export function TagsEditor({ tags, isEditing, onChange }: TagsEditorProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onChange?.([...tags, trimmedValue]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onChange?.(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex gap-2 flex-wrap items-center min-h-[44px] p-3 border border-gray-200 rounded-lg bg-gray-50">
      {tags.length > 0 ? (
        tags.map((tag: string, idx: number) => (
          <span 
            key={idx} 
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {tag}
            {isEditing && (
              <button 
                onClick={() => handleRemoveTag(idx)}
                className="hover:text-red-500 transition-colors ml-1"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </span>
        ))
      ) : (
        <span className="text-sm text-gray-400">No tags added</span>
      )}
      {isEditing && (
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type tag and press Enter..."
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onClick={handleAddTag}
            disabled={!inputValue.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 3v8M3 7h8" strokeLinecap="round"/>
            </svg>
            Add
          </button>
        </div>
      )}
    </div>
  );
}
