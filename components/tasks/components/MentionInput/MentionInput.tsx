/**
 * MentionInput Component
 * Rich text input that supports @mentions for Customer, Contact, Company, Factory
 * When user types @ followed by text, shows a dropdown with search results
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMentionSearch } from './useMentionSearch';
import {
  type MentionInputProps,
  type Mention,
  type MentionSearchResult,
  MENTION_CATEGORIES,
  getMentionCategory,
} from './types';

export function MentionInput({
  value,
  onChange,
  mentions,
  onMentionsChange,
  placeholder = 'Type @ to mention...',
  rows = 4,
  disabled = false,
  className = '',
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Mention detection state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(mentionQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [mentionQuery]);

  // Search for mentions
  const { results, isLoading } = useMentionSearch(debouncedQuery, showDropdown);

  // Group results by type for display
  const groupedResults = useMemo(() => {
    const groups: Record<string, MentionSearchResult[]> = {};
    results.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [results]);

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    const flat: MentionSearchResult[] = [];
    MENTION_CATEGORIES.forEach(cat => {
      const items = groupedResults[cat.type] || [];
      flat.push(...items);
    });
    return flat;
  }, [groupedResults]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatResults.length]);

  // Calculate dropdown position based on textarea position (simpler, more reliable)
  const calculateDropdownPosition = useCallback((): { top: number; left: number } | null => {
    if (!textareaRef.current) return null;

    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();

    // Position dropdown below the textarea, aligned to left
    return {
      top: rect.bottom + 4,
      left: rect.left,
    };
  }, []);

  // Update position when showing dropdown - calculate immediately
  useEffect(() => {
    if (showDropdown) {
      const pos = calculateDropdownPosition();
      setDropdownPosition(pos);
    } else {
      setDropdownPosition(null);
    }
  }, [showDropdown, calculateDropdownPosition]);

  // Handle text input
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);

    // Detect @ mention
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if @ is at start or preceded by whitespace
      const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        // Only show dropdown if no space in query (single word)
        if (!query.includes(' ') && query.length <= 30) {
          setMentionQuery(query);
          setMentionStartPos(lastAtIndex);
          setShowDropdown(true);
          return;
        }
      }
    }

    // No valid @ mention found
    setShowDropdown(false);
    setMentionQuery('');
    setMentionStartPos(null);
  };

  // Handle selecting a mention
  const selectMention = useCallback((result: MentionSearchResult) => {
    if (mentionStartPos === null) return;

    const before = value.substring(0, mentionStartPos);
    const after = value.substring(mentionStartPos + mentionQuery.length + 1);

    // Insert the mention name with @ prefix
    const mentionText = `@${result.name}`;
    const newValue = before + mentionText + ' ' + after;

    // Create the mention object
    const newMention: Mention = {
      id: result.id,
      type: result.type,
      name: result.name,
      startIndex: mentionStartPos,
      endIndex: mentionStartPos + mentionText.length,
    };

    // Update mentions list (adjust existing mention positions)
    const lengthDiff = mentionText.length + 1 - (mentionQuery.length + 1);
    const updatedMentions = mentions.map(m => {
      if (m.startIndex > mentionStartPos) {
        return {
          ...m,
          startIndex: m.startIndex + lengthDiff,
          endIndex: m.endIndex + lengthDiff,
        };
      }
      return m;
    });

    onMentionsChange([...updatedMentions, newMention]);
    onChange(newValue);

    // Close dropdown
    setShowDropdown(false);
    setMentionQuery('');
    setMentionStartPos(null);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartPos + mentionText.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  }, [mentionStartPos, mentionQuery, value, mentions, onChange, onMentionsChange]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || flatResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % flatResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
        break;
      case 'Enter':
      case 'Tab':
        if (flatResults[selectedIndex]) {
          e.preventDefault();
          selectMention(flatResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setMentionQuery('');
        setMentionStartPos(null);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        textareaRef.current && !textareaRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render the mention icon
  const renderIcon = (iconPath: string, colorClass: string) => (
    <svg className={`w-4 h-4 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
    </svg>
  );

  // Dropdown content - only render when position is calculated
  const dropdownContent = showDropdown && dropdownPosition && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 9999,
      }}
      className="w-80 max-h-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-lg">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">Mention</p>
            <p className="text-[10px] text-gray-400">
              {mentionQuery ? `Searching "${mentionQuery}"...` : 'Type to search'}
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span className="text-xs text-gray-500">Searching...</span>
            </div>
          </div>
        ) : flatResults.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              {mentionQuery ? 'No results found' : 'Start typing to search'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Search customers, contacts, companies, or factories
            </p>
          </div>
        ) : (
          <>
            {MENTION_CATEGORIES.map(category => {
              const items = groupedResults[category.type];
              if (!items || items.length === 0) return null;

              return (
                <div key={category.type}>
                  {/* Category header */}
                  <div className={`px-3 py-1.5 ${category.bgColor} border-b border-t border-gray-100`}>
                    <div className="flex items-center gap-1.5">
                      {renderIcon(category.icon, category.textColor)}
                      <span className={`text-xs font-semibold ${category.textColor}`}>
                        {category.label}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {items.length} result{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Category items */}
                  {items.map((result) => {
                    const globalIndex = flatResults.findIndex(r => r.id === result.id && r.type === result.type);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onClick={() => selectMention(result)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-l-2 border-blue-500'
                            : 'hover:bg-gray-50 border-l-2 border-transparent'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${category.color}15` }}
                        >
                          {renderIcon(category.icon, category.textColor)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.name}
                          </p>
                          {result.subtitle && (
                            <p className="text-xs text-gray-500 truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <div
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                          style={{
                            backgroundColor: `${category.color}15`,
                            color: category.color,
                          }}
                        >
                          {category.singularLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer hint */}
      {flatResults.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px]">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px]">↵</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px]">esc</kbd>
              close
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-none ${className}`}
      />

      {/* Hint text */}
      {!disabled && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 pointer-events-none">
          <span className="text-[10px] text-gray-400">Type</span>
          <span className="px-1 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500 font-medium">@</span>
          <span className="text-[10px] text-gray-400">to mention</span>
        </div>
      )}

      {/* Dropdown Portal */}
      {isMounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}
