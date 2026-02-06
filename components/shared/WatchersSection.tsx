/**
 * WatchersSection Component
 * A sleek, eye-catching component for managing entity watchers
 * Allows users to track and receive updates on entity changes
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWatchers, useAddWatcher, useRemoveWatcher } from './hooks/useWatchers';
import type { WatchableEntityType, Watcher } from '@/components/lib/graphql/watchers';
import { fetchUsers, type User } from '@/components/lib/graphql/users';

interface WatchersSectionProps {
  entityType: WatchableEntityType;
  entityId: string | null;
  className?: string;
  compact?: boolean;
}

// Avatar color palette - consistent colors per user
const AVATAR_COLORS = [
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-blue-500 to-cyan-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-orange-500 to-amber-600',
  'bg-gradient-to-br from-pink-500 to-rose-600',
  'bg-gradient-to-br from-indigo-500 to-blue-600',
  'bg-gradient-to-br from-green-500 to-emerald-600',
  'bg-gradient-to-br from-red-500 to-pink-600',
];

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function WatchersSection({
  entityType,
  entityId,
  className = '',
  compact = false,
}: WatchersSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch watchers for this entity
  const { data: watchers = [], isLoading } = useWatchers({
    entityType,
    entityId,
    enabled: !!entityId,
  });

  // Mutation hooks
  const addWatcherMutation = useAddWatcher({
    entityType,
    entityId: entityId || '',
  });

  const removeWatcherMutation = useRemoveWatcher({
    entityType,
    entityId: entityId || '',
  });

  // Load users when dropdown opens
  useEffect(() => {
    if (isOpen && users.length === 0) {
      setIsLoadingUsers(true);
      fetchUsers()
        .then((fetchedUsers) => {
          // Filter to only visible/enabled users
          setUsers(fetchedUsers.filter((u) => u.visible && u.enabled));
        })
        .catch(console.error)
        .finally(() => setIsLoadingUsers(false));
    }
  }, [isOpen, users.length]);

  // Update dropdown position when opening
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 280),
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      // Focus search input after a brief delay
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, updateDropdownPosition]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter users by search term and exclude already added watchers
  const watcherIds = new Set(watchers.map((w) => w.id));
  const filteredUsers = users.filter((user) => {
    if (watcherIds.has(user.id)) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  });

  const handleAddWatcher = async (userId: string) => {
    await addWatcherMutation.mutateAsync(userId);
    setSearchTerm('');
  };

  const handleRemoveWatcher = async (userId: string) => {
    await removeWatcherMutation.mutateAsync(userId);
  };

  if (!entityId) return null;

  const isAddingOrRemoving = addWatcherMutation.isPending || removeWatcherMutation.isPending;

  return (
    <div className={`${className}`}>
      {/* Main Button/Display */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group relative flex items-center gap-2 px-3 py-2 rounded-lg
          bg-gradient-to-r from-slate-50 to-gray-50
          border border-gray-200 hover:border-blue-300
          hover:shadow-md hover:shadow-blue-100/50
          transition-all duration-200 ease-out
          ${isOpen ? 'border-blue-400 shadow-md shadow-blue-100/50' : ''}
          ${compact ? 'py-1.5 px-2' : ''}
        `}
        title="Manage watchers - Get notified of updates"
      >
        {/* Eye icon with pulse effect */}
        <div className="relative">
          <svg
            className={`w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors ${
              watchers.length > 0 ? 'text-blue-600' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          {watchers.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Watcher avatars or count */}
        {watchers.length > 0 ? (
          <div className="flex items-center">
            <div className="flex -space-x-1.5">
              {watchers.slice(0, 3).map((watcher) => (
                <div
                  key={watcher.id}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    text-[10px] font-semibold text-white
                    ring-2 ring-white shadow-sm
                    ${getAvatarColor(watcher.id)}
                  `}
                  title={watcher.fullName}
                >
                  {getInitials(watcher.fullName)}
                </div>
              ))}
              {watchers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600 ring-2 ring-white">
                  +{watchers.length - 3}
                </div>
              )}
            </div>
            {!compact && (
              <span className="ml-2 text-xs font-medium text-gray-600">
                {watchers.length} watching
              </span>
            )}
          </div>
        ) : (
          <span className={`text-xs font-medium text-gray-500 ${compact ? 'hidden' : ''}`}>
            Add watchers
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${compact ? 'hidden' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Portal */}
      {isOpen &&
        dropdownPosition &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: '400px',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3">
              <div className="flex items-center gap-2 text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="font-semibold text-sm">Watchers</span>
              </div>
              <p className="text-blue-100 text-xs mt-1">
                Get notified when this {entityType.toLowerCase().replace('_', ' ')} changes
              </p>
            </div>

            {/* Current Watchers */}
            {watchers.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
                  Currently Watching
                </div>
                <div className="space-y-1">
                  {watchers.map((watcher) => (
                    <div
                      key={watcher.id}
                      className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            text-xs font-semibold text-white shadow-sm
                            ${getAvatarColor(watcher.id)}
                          `}
                        >
                          {getInitials(watcher.fullName)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {watcher.fullName}
                          </div>
                          <div className="text-xs text-gray-500">{watcher.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveWatcher(watcher.id)}
                        disabled={isAddingOrRemoving}
                        className="
                          opacity-0 group-hover:opacity-100
                          p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50
                          transition-all duration-150
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                        title="Remove watcher"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search team members..."
                  className="
                    w-full pl-9 pr-3 py-2 text-sm
                    bg-gray-50 border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                    placeholder:text-gray-400
                    transition-all duration-150
                  "
                />
              </div>
            </div>

            {/* User List */}
            <div className="max-h-48 overflow-y-auto">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="p-2 space-y-0.5">
                  {filteredUsers.slice(0, 10).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddWatcher(user.id)}
                      disabled={isAddingOrRemoving}
                      className="
                        w-full flex items-center gap-2.5 p-2 rounded-lg
                        text-left hover:bg-blue-50 transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          text-xs font-semibold text-white shadow-sm
                          ${getAvatarColor(user.id)}
                        `}
                      >
                        {getInitials(user.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.fullName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                      <svg
                        className="w-4 h-4 text-blue-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  ))}
                  {filteredUsers.length > 10 && (
                    <div className="text-xs text-center text-gray-400 py-2">
                      +{filteredUsers.length - 10} more - refine your search
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <svg
                    className="w-10 h-10 mx-auto text-gray-300 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    {searchTerm ? 'No matching team members' : 'All team members are watching'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Tip */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-100">
              <div className="flex items-start gap-2">
                <svg
                  className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Watchers receive notifications for status changes, updates, and comments on this{' '}
                  {entityType.toLowerCase().replace('_', ' ')}.
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
