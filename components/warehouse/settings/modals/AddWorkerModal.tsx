'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UserSearchDropdown, type UserResult } from '@/components/flow-ai/flowrms/entity-matching/UserSearchDropdown';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/flow-ai/cn';
import { searchUsers } from '../api/usersApi';

interface AddWorkerModalProps {
  warehouseId: string;
  existingWorkerIds: string[];
  onAdd: (warehouseId: string, workerId: string, role: 'worker' | 'manager') => void;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  { value: 'worker' as const, label: 'Worker' },
  { value: 'manager' as const, label: 'Manager' },
];

export default function AddWorkerModal({
  warehouseId,
  existingWorkerIds,
  onAdd,
  onClose,
}: AddWorkerModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'worker' | 'manager'>('worker');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Close role dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search handler that filters out existing workers
  const handleSearch = useCallback(async (query: string): Promise<UserResult[]> => {
    try {
      const results = await searchUsers(query, { enabled: true, limit: 50 });
      // Filter out already assigned workers and map to UserResult format
      return results
        .filter((user) => !existingWorkerIds.includes(user.id))
        .map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
        }));
    } catch (error) {
      console.error('User search failed:', error);
      return [];
    }
  }, [existingWorkerIds]);

  // Handle user selection
  const handleSelect = (userId: string | null, user: UserResult | null) => {
    setSelectedUserId(userId);
    setSelectedUserName(user ? `${user.fullName} (${user.email})` : null);
  };

  const handleAdd = () => {
    if (selectedUserId) {
      onAdd(warehouseId, selectedUserId, selectedRole);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Add Team Member</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--muted)]/30 rounded transition-colors">
            <svg
              className="w-5 h-5 text-[var(--muted-foreground)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* User Search Dropdown - Reusing shared component */}
          <UserSearchDropdown
            label="Select Person"
            selectedUserId={selectedUserId}
            selectedUserName={selectedUserName}
            placeholder="Search for a person..."
            onSelect={handleSelect}
            onSearch={handleSearch}
          />

          {/* Role Selection - Styled dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Role</label>
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={cn(
                  'flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                )}
              >
                <span className="truncate text-left">
                  {ROLE_OPTIONS.find(r => r.value === selectedRole)?.label}
                </span>
                <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', isRoleDropdownOpen && 'rotate-180')} />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                  <div className="p-1">
                    {ROLE_OPTIONS.map((option) => {
                      const isSelected = option.value === selectedRole;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedRole(option.value);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={cn(
                            'group relative flex w-full items-center rounded-sm px-2 py-1.5 text-xs outline-none',
                            'hover:bg-accent hover:text-accent-foreground',
                            'focus:bg-accent focus:text-accent-foreground',
                            isSelected && 'bg-accent/50'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <Check className="h-3 w-3 flex-shrink-0 text-primary group-hover:text-inherit" />}
                            <span className={cn(isSelected && 'font-medium')}>
                              {option.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/30 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedUserId}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedUserId
                ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
            }`}
          >
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}
