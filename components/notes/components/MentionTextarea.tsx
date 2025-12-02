/**
 * Mention Textarea Component
 * A textarea that supports @mentions with contact autocomplete dropdown
 * Similar to Instagram/Facebook mention functionality
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useContactSearch, type ContactSearchResult } from '../api';

interface SelectedContact {
  id: string;
  name: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  selectedMentions: SelectedContact[];
  onMentionsChange: (mentions: SelectedContact[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function MentionTextarea({
  value,
  onChange,
  selectedMentions,
  onMentionsChange,
  placeholder = 'Write your content here... Use @ to mention contacts',
  rows = 6,
  className = '',
}: MentionTextareaProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: contacts = [] } = useContactSearch(searchQuery);

  // Filter contacts based on search query and exclude already mentioned
  const filteredContacts = contacts.filter((contact: ContactSearchResult) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const alreadyMentioned = selectedMentions.some(m => m.id === contact.id);
    return fullName.includes(searchQuery.toLowerCase()) && !alreadyMentioned;
  }).slice(0, 8); // Limit to 8 suggestions

  // Calculate dropdown position based on cursor
  const calculateDropdownPosition = useCallback(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const { selectionStart } = textarea;
    
    // Create a mirror div to calculate position
    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    
    mirror.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      line-height: ${style.lineHeight};
      padding: ${style.padding};
      width: ${textarea.clientWidth}px;
    `;
    
    mirror.textContent = value.substring(0, selectionStart);
    document.body.appendChild(mirror);
    
    const mirrorRect = mirror.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    
    document.body.removeChild(mirror);
    
    // Calculate relative position
    const lineHeight = parseInt(style.lineHeight) || 24;
    const lines = (mirror.textContent?.split('\n').length || 1);
    
    setDropdownPosition({
      top: Math.min(lines * lineHeight + 8, textarea.clientHeight),
      left: 0,
    });
  }, [value]);

  // Handle textarea input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursorPos);
    
    // Check if we're typing a mention
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's no space after @ (we're still typing the mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStartIndex(lastAtIndex);
        setSearchQuery(textAfterAt);
        setShowDropdown(true);
        setSelectedIndex(0);
        calculateDropdownPosition();
        return;
      }
    }
    
    setShowDropdown(false);
    setMentionStartIndex(-1);
  };

  // Handle selecting a contact from dropdown
  const selectContact = (contact: ContactSearchResult) => {
    if (mentionStartIndex === -1) return;
    
    const fullName = `${contact.firstName} ${contact.lastName}`;
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(cursorPosition);
    
    // Replace the @query with @FullName
    const newValue = `${beforeMention}@${fullName} ${afterMention}`;
    onChange(newValue);
    
    // Add to selected mentions
    const newMention: SelectedContact = {
      id: contact.id,
      name: fullName,
    };
    
    if (!selectedMentions.some(m => m.id === contact.id)) {
      onMentionsChange([...selectedMentions, newMention]);
    }
    
    // Close dropdown and reset
    setShowDropdown(false);
    setMentionStartIndex(-1);
    setSearchQuery('');
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartIndex + fullName.length + 2; // +2 for @ and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown || filteredContacts.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredContacts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredContacts[selectedIndex]) {
          selectContact(filteredContacts[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
      case 'Tab':
        if (filteredContacts[selectedIndex]) {
          e.preventDefault();
          selectContact(filteredContacts[selectedIndex]);
        }
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  // Get avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Render content with highlighted mentions
  const renderHighlightedContent = () => {
    if (!value) return null;
    
    // Find all @mentions in the text
    const mentionRegex = /@([A-Za-z]+ [A-Za-z]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(value)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {value.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Add the highlighted mention
      parts.push(
        <span key={`mention-${match.index}`} className="text-blue-600 font-medium">
          {match[0]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {value.substring(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };

  return (
    <div className="relative">
      {/* Highlighted overlay for mentions */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
        style={{
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          color: 'transparent',
        }}
        aria-hidden="true"
      >
        {renderHighlightedContent()}
      </div>
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`${className} bg-transparent relative z-10`}
        style={{ caretColor: 'black' }}
      />
      
      {/* Mention Dropdown */}
      {showDropdown && filteredContacts.length > 0 && (
        <div
          ref={dropdownRef}
          style={{ top: dropdownPosition.top }}
          className="absolute left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contacts
            </p>
          </div>
          {filteredContacts.map((contact: ContactSearchResult, index: number) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => selectContact(contact)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${getAvatarColor(contact.firstName)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                {getInitials(contact.firstName, contact.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {contact.firstName} {contact.lastName}
                </p>
                {contact.email && (
                  <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                )}
              </div>
              {contact.role && (
                <span className="text-xs text-gray-400 flex-shrink-0">{contact.role}</span>
              )}
            </button>
          ))}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-mono">↑↓</kbd> to navigate, 
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-mono ml-1">Enter</kbd> to select,
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] font-mono ml-1">Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
      
      {/* No results message */}
      {showDropdown && filteredContacts.length === 0 && searchQuery && (
        <div
          ref={dropdownRef}
          style={{ top: dropdownPosition.top }}
          className="absolute left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <div className="px-4 py-6 text-center">
            <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm text-gray-500">No contacts found for &quot;{searchQuery}&quot;</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Mention Input for the Mentions field (not the content)
 * Shows a dropdown of contacts to select from
 */
interface MentionInputProps {
  selectedMentions: SelectedContact[];
  onMentionsChange: (mentions: SelectedContact[]) => void;
  className?: string;
}

export function MentionInput({
  selectedMentions,
  onMentionsChange,
  className = '',
}: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: contacts = [] } = useContactSearch(searchQuery);

  // Mark as mounted for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update dropdown position
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showDropdown]);

  // Filter contacts based on search query and exclude already mentioned
  const filteredContacts = contacts.filter((contact: ContactSearchResult) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const alreadyMentioned = selectedMentions.some(m => m.id === contact.id);
    return fullName.includes(searchQuery.toLowerCase()) && !alreadyMentioned;
  }).slice(0, 8);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
    setSelectedIndex(0);
  };

  const selectContact = (contact: ContactSearchResult) => {
    const fullName = `${contact.firstName} ${contact.lastName}`;
    const newMention: SelectedContact = {
      id: contact.id,
      name: fullName,
    };
    
    if (!selectedMentions.some(m => m.id === contact.id)) {
      onMentionsChange([...selectedMentions, newMention]);
    }
    
    setSearchQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredContacts.length === 0) {
      if (e.key === 'ArrowDown' && searchQuery === '') {
        setShowDropdown(true);
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredContacts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredContacts[selectedIndex]) {
          selectContact(filteredContacts[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
    }
  };

  const removeMention = (contactId: string) => {
    onMentionsChange(selectedMentions.filter(m => m.id !== contactId));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Dropdown content - rendered via portal
  const dropdownContent = showDropdown && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
    >
      {filteredContacts.length > 0 ? (
        <>
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Select Contacts
            </p>
          </div>
          {filteredContacts.map((contact: ContactSearchResult, index: number) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => selectContact(contact)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${getAvatarColor(contact.firstName)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                {getInitials(contact.firstName, contact.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {contact.firstName} {contact.lastName}
                </p>
                {contact.email && (
                  <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                )}
              </div>
            </button>
          ))}
        </>
      ) : (
        <div className="px-4 py-6 text-center">
          <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm text-gray-500">
            {searchQuery ? `No contacts found for "${searchQuery}"` : 'No more contacts to add'}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      {/* Selected Mentions Tags */}
      {selectedMentions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedMentions.map((mention) => (
            <span
              key={mention.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              <span className="font-medium">@{mention.name}</span>
              <button
                type="button"
                onClick={() => removeMention(mention.id)}
                className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(true)}
        placeholder={selectedMentions.length > 0 ? 'Add more contacts...' : 'Search and select contacts...'}
        className={className}
      />
      
      {/* Dropdown Portal */}
      {isMounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}

export type { SelectedContact };
