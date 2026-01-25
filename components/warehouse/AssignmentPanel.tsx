'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { AssignedUser, AssignedUserRole } from '@/lib/types/warehouse';
import { useUsersByIds, useWarehouseMembers } from '@/components/warehouse/api/useWarehouseDeliveriesApi';

type WarehouseUser = {
  id: string;
  name: string;
  email: string;
  role: AssignedUserRole;
  warehouseIds: string[];
  isActive: boolean;
};

interface AssignmentPanelProps {
  assignedManagers: AssignedUser[];
  assignedWorkers: AssignedUser[];
  warehouseId?: string;
  availableManagers?: WarehouseUser[];
  availableWorkers?: WarehouseUser[];
  onAddAssignment: (userId: string, role: AssignedUserRole) => void;
  onRemoveAssignment: (assignmentId: string, role: AssignedUserRole) => void;
  isEditable?: boolean;
  showRequiredWarnings?: boolean;
}

export default function AssignmentPanel({
  assignedManagers,
  assignedWorkers,
  warehouseId,
  availableManagers,
  availableWorkers,
  onAddAssignment,
  onRemoveAssignment,
  isEditable = true,
  showRequiredWarnings = true,
}: AssignmentPanelProps) {
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const managerButtonRef = useRef<HTMLButtonElement | null>(null);
  const workerButtonRef = useRef<HTMLButtonElement | null>(null);
  const [workerDropdownStyle, setWorkerDropdownStyle] = useState<React.CSSProperties>({});
  const [managerDropdownStyle, setManagerDropdownStyle] = useState<React.CSSProperties>({});

  const membersQuery = useWarehouseMembers(warehouseId || null, !availableManagers && !availableWorkers);
  const memberIds = useMemo(() => {
    if (!membersQuery.data) return [];
    const ids = new Set<string>();
    membersQuery.data.forEach((member) => ids.add(member.userId));
    return Array.from(ids);
  }, [membersQuery.data]);
  const usersQuery = useUsersByIds(memberIds);

  // Track loading state from both queries
  const isLoading = membersQuery.isLoading || usersQuery.isLoading;

  useEffect(() => {
    if (!isEditable) {
      setShowManagerDropdown(false);
      setShowWorkerDropdown(false);
    }
  }, [isEditable]);

  const calculateDropdownPosition = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    if (!buttonRef.current) return {};

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 224;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    return {
      position: 'fixed' as const,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(dropdownHeight, showAbove ? spaceAbove - 8 : spaceBelow - 8),
      ...(showAbove
        ? { bottom: viewportHeight - rect.top + 8 }
        : { top: rect.bottom + 8 }
      ),
    };
  };

  useEffect(() => {
    if (showWorkerDropdown) {
      setWorkerDropdownStyle(calculateDropdownPosition(workerButtonRef));
    }
  }, [showWorkerDropdown]);

  useEffect(() => {
    if (showManagerDropdown) {
      setManagerDropdownStyle(calculateDropdownPosition(managerButtonRef));
    }
  }, [showManagerDropdown]);

  const resolvedManagers = useMemo(() => {
    if (availableManagers) return availableManagers;
    const members = membersQuery.data || [];
    const userLookup = new Map(
      (usersQuery.data || [])
        .filter((user) => user.enabled)
        .map((user) => {
          const name =
            user.fullName ||
            [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
            user.email ||
            user.id;
          return [user.id, { name, email: user.email || '' }];
        })
    );
    const normalizeRole = (role: string | number) => {
      if (typeof role === 'number') {
        if (role === 2) return 'MANAGER';
        if (role === 3) return 'WORKER';
        return 'UNKNOWN';
      }
      return role.toUpperCase();
    };
    return members
      .filter((member) => normalizeRole(member.role) === 'MANAGER')
      .map((member) => {
        const userInfo = userLookup.get(member.userId);
        if (!userInfo) {
          return null;
        }
        return {
          id: member.userId,
          name: userInfo?.name || member.userId,
          email: userInfo?.email || '',
          role: 'manager' as AssignedUserRole,
          warehouseIds: warehouseId ? [warehouseId] : [],
          isActive: true,
        };
      })
      .filter((member): member is WarehouseUser => Boolean(member));
  }, [availableManagers, membersQuery.data, usersQuery.data, warehouseId]);

  const resolvedWorkers = useMemo(() => {
    if (availableWorkers) return availableWorkers;
    const members = membersQuery.data || [];
    const userLookup = new Map(
      (usersQuery.data || [])
        .filter((user) => user.enabled)
        .map((user) => {
          const name =
            user.fullName ||
            [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
            user.email ||
            user.id;
          return [user.id, { name, email: user.email || '' }];
        })
    );
    const normalizeRole = (role: string | number) => {
      if (typeof role === 'number') {
        if (role === 2) return 'MANAGER';
        if (role === 3) return 'WORKER';
        return 'UNKNOWN';
      }
      return role.toUpperCase();
    };
    return members
      .filter((member) => normalizeRole(member.role) === 'WORKER')
      .map((member) => {
        const userInfo = userLookup.get(member.userId);
        if (!userInfo) {
          return null;
        }
        return {
          id: member.userId,
          name: userInfo?.name || member.userId,
          email: userInfo?.email || '',
          role: 'worker' as AssignedUserRole,
          warehouseIds: warehouseId ? [warehouseId] : [],
          isActive: true,
        };
      })
      .filter((member): member is WarehouseUser => Boolean(member));
  }, [availableWorkers, membersQuery.data, usersQuery.data, warehouseId]);

  const filteredManagers = resolvedManagers.filter(
    m => !assignedManagers.some(am => am.user?.id === m.id)
  );
  const filteredWorkers = resolvedWorkers.filter(
    w => !assignedWorkers.some(aw => aw.user?.id === w.id)
  );

  // Check if required roles are missing
  const missingWorker = showRequiredWarnings && assignedWorkers.length === 0;

  const renderAssignedUser = (assignment: AssignedUser, role: AssignedUserRole) => {
    const userName = assignment.user?.fullName || 'Unknown';
    return (
      <div
        key={assignment.id}
        className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-white">
            {userName.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">{userName}</p>
          <p className="text-xs text-[var(--muted-foreground)] capitalize">{role === 'worker' ? 'Picker' : role}</p>
        </div>
        {isEditable && (
          <button
            onClick={() => onRemoveAssignment(assignment.id, role)}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Remove"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  const renderAddButton = (
    role: AssignedUserRole,
    availableUsers: WarehouseUser[],
    showDropdown: boolean,
    setShowDropdown: (show: boolean) => void,
    label: string,
    buttonRef: React.RefObject<HTMLButtonElement | null>,
    dropdownStyle: React.CSSProperties
  ) => (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={availableUsers.length === 0 && !isLoading}
        className="w-full px-4 py-3 text-sm text-[var(--muted-foreground)] border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] disabled:hover:text-[var(--muted-foreground)] disabled:hover:bg-transparent"
      >
        {isLoading ? (
          <span className="text-xs">Loading...</span>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {availableUsers.length === 0 ? `No ${role}s available` : label}
          </>
        )}
      </button>
      {showDropdown && availableUsers.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setShowDropdown(false)}
          />
          <div
            className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl z-[101] overflow-y-auto"
            style={dropdownStyle}
          >
            <div className="p-2">
              {availableUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    onAddAssignment(user.id, role);
                    setShowDropdown(false);
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-[var(--muted)] rounded-md transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)]/80 to-[var(--primary)]/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-white">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{user.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Assignment</h3>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Required Warning */}
        {missingWorker && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Worker assignment required</p>
              <p className="text-xs text-amber-700 mt-0.5">Assign a warehouse worker to process this order</p>
            </div>
          </div>
        )}

        {/* Worker Section - Required */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-[var(--foreground)]">Worker</h4>
            </div>
            <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded">Required</span>
          </div>
          <div className="space-y-2">
            {assignedWorkers.map(user => renderAssignedUser(user, 'worker'))}
            {isEditable && renderAddButton(
              'worker',
              filteredWorkers,
              showWorkerDropdown,
              setShowWorkerDropdown,
              assignedWorkers.length > 0 ? 'Add another worker' : 'Assign worker',
              workerButtonRef,
              workerDropdownStyle
            )}
          </div>
        </div>

        {/* Manager Section - Signing Authority */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                  <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-[var(--foreground)]">Manager</h4>
            </div>
            <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">Signing Authority</span>
          </div>
          <div className="space-y-2">
            {assignedManagers.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] italic py-2">No manager assigned</p>
            ) : (
              assignedManagers.map(user => renderAssignedUser(user, 'manager'))
            )}
            {isEditable && renderAddButton(
              'manager',
              filteredManagers,
              showManagerDropdown,
              setShowManagerDropdown,
              assignedManagers.length > 0 ? 'Change manager' : 'Assign manager',
              managerButtonRef,
              managerDropdownStyle
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
