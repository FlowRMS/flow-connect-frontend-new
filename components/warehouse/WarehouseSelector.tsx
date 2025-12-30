'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWarehouse } from './WarehouseContext';
import ViewModeToggle from './ViewModeToggle';

export default function WarehouseSelector() {
  const { warehouses, selectedWarehouse, setSelectedWarehouse } = useWarehouse();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <ViewModeToggle />
      <div ref={dropdownRef} className="relative">
        <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors min-w-[240px]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--muted-foreground)] flex-shrink-0"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-[var(--foreground)] truncate">
            {selectedWarehouse?.name || 'Select Warehouse'}
          </div>
          {selectedWarehouse && (
            <div className="text-xs text-[var(--muted-foreground)] truncate">
              {selectedWarehouse.city}, {selectedWarehouse.state}
            </div>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-[var(--muted-foreground)] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
          {warehouses.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[var(--muted-foreground)] text-center">
              No warehouses available
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto">
              {warehouses.map((warehouse) => (
                <button
                  key={warehouse.id}
                  type="button"
                  onClick={() => {
                    setSelectedWarehouse(warehouse);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 transition-colors border-b border-[var(--border)] last:border-b-0 ${
                    selectedWarehouse?.id === warehouse.id
                      ? 'bg-[var(--primary)]/10'
                      : 'hover:bg-[var(--muted)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        warehouse.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--foreground)] truncate">
                        {warehouse.name}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] truncate">
                        {warehouse.addressLine1} - {warehouse.city}, {warehouse.state}
                      </div>
                    </div>
                    {selectedWarehouse?.id === warehouse.id && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-[var(--primary)] flex-shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
