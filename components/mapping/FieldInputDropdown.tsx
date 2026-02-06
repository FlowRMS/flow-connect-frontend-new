'use client';

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface FieldInputDropdownProps {
  value: string;
  searchTerm: string;
  isOpen: boolean;
  columns: string[];
  placeholder?: string;
  isRequired?: boolean;
  isMapped: boolean;
  isLocked?: boolean;
  isGroupUnsatisfied?: boolean;
  onInputChange: (value: string) => void;
  onFocus: () => void;
  onSelect: (column: string) => void;
  onClose?: () => void;
}

export function FieldInputDropdown({
  value,
  searchTerm,
  isOpen,
  columns,
  placeholder = 'Not mapped',
  isRequired = false,
  isMapped,
  isLocked = false,
  isGroupUnsatisfied = false,
  onInputChange,
  onFocus,
  onSelect,
  onClose,
}: FieldInputDropdownProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const filteredColumns = searchTerm
    ? columns.filter(col => col.toLowerCase().includes(searchTerm.toLowerCase()))
    : columns;

  // Update dropdown position when open state changes or on scroll/resize
  useEffect(() => {
    if (!isOpen || !inputRef.current) return;

    const updatePosition = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideInput = inputRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);

      if (!isInsideInput && !isInsideDropdown) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
      className="z-50 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto"
    >
      {filteredColumns.length === 0 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No matching columns found
        </div>
      ) : (
        filteredColumns.map((col) => (
          <button
            key={col}
            onClick={() => onSelect(col)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
          >
            {col}
          </button>
        ))
      )}
      {searchTerm && !columns.includes(searchTerm) && (
        <button
          onClick={() => onSelect(searchTerm)}
          className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-primary border-t"
        >
          Use &quot;{searchTerm}&quot;
        </button>
      )}
    </div>
  );

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? searchTerm : value}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={onFocus}
        disabled={isLocked}
        placeholder={isRequired ? 'Select or type...' : placeholder}
        className={cn(
          "w-full border rounded px-2 py-1 text-sm",
          isRequired && !isMapped && 'border-amber-300 bg-amber-50',
          isGroupUnsatisfied && !isMapped && 'border-amber-200 bg-amber-50/50',
          isLocked && 'bg-muted cursor-not-allowed'
        )}
      />
      {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
}
