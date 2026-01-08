'use client';

import React, { useState, useMemo } from 'react';
import {
  mockCompanySettings,
  mockTeamMembers,
  mockPermissions,
  mockFlowBotSettings,
  mockLostReasons,
  mockExpenseCategories,
  mockCreditReasons,
  mockSalesRepSelections,
  mockFactories,
  mockCustomers,
  permissionEntities,
  permissionRoles,
  commissionVisibilityRoles,
  getPermissionStatus,
  type TeamMember,
  type Permission,
  type CompanySettings,
  type FlowBotSettings,
  type SalesRepSelection,
} from './data/admin-mock-data';
import {
  useTeamMembers,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  User,
  UserInput,
  UserRole,
} from './api/useTeamApi';
import { USER_ROLES, getRoleDisplayLabel, getRoleKey } from '@/components/lib/graphql/users';

type AdminTab =
  | 'general'
  | 'team'
  | 'permissions'
  | 'flowbot'
  | 'workflow'
  | 'lost-reasons'
  | 'expenses'
  | 'credit'
  | 'sales-reps'
  | 'integrations';

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'general', label: 'General Settings' },
  { id: 'team', label: 'Your Team' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'flowbot', label: 'flowBot Settings' },
  { id: 'workflow', label: 'Workflow Settings' },
  { id: 'lost-reasons', label: 'Lost Reasons Settings' },
  { id: 'expenses', label: 'Expenses Settings' },
  { id: 'credit', label: 'Credit Settings' },
  { id: 'sales-reps', label: 'Sales Reps Default Selections' },
  { id: 'integrations', label: 'Integrations' },
];

export default function AdminSettingsContent() {
  const [activeTab, setActiveTab] = useState<AdminTab>('general');

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Settings</h1>
          </div>
        </div>

        {/* Scrollable Tabs */}
        <div className="border-b border-[var(--border)] mb-6">
          <div className="flex gap-1 overflow-x-auto pb-0 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && <GeneralSettingsTab />}
        {activeTab === 'team' && <TeamMembersTab />}
        {activeTab === 'permissions' && <PermissionsTab />}
        {activeTab === 'flowbot' && <FlowBotSettingsTab />}
        {activeTab === 'workflow' && <WorkflowSettingsTab />}
        {activeTab === 'lost-reasons' && <LostReasonsTab />}
        {activeTab === 'expenses' && <ExpensesSettingsTab />}
        {activeTab === 'credit' && <CreditSettingsTab />}
        {activeTab === 'sales-reps' && <SalesRepSelectionsTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
      </div>
    </main>
  );
}

// ============================================
// General Settings Tab
// ============================================
function GeneralSettingsTab() {
  const [settings, setSettings] = useState<CompanySettings>(mockCompanySettings);

  const handleChange = (field: keyof CompanySettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">General Settings</h2>

      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 space-y-6">
        {/* Company Logo */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Company Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 border-2 border-dashed border-[var(--border)] rounded-lg flex items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Logo Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Logo Width<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={settings.logoWidth}
                onChange={(e) => handleChange('logoWidth', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">px</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Logo Height<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={settings.logoHeight}
                onChange={(e) => handleChange('logoHeight', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">px</span>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Company Name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>

        {/* Street Address */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Street Address<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={settings.streetAddress}
            onChange={(e) => handleChange('streetAddress', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>

        {/* Address Line 2 */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Address Line 2</label>
          <input
            type="text"
            value={settings.addressLine2}
            onChange={(e) => handleChange('addressLine2', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>

        {/* City, State, Zip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              City<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              State<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Zip Code<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Email Address<span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Phone Number<span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={settings.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Team Members Tab
// ============================================
function TeamMembersTab() {
  const { data: users = [], isLoading, error } = useTeamMembers();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['outside_rep', 'administrator', 'inside_rep', 'owner', 'warehouse_manager', 'warehouse_employee', 'driver']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [deletingMember, setDeletingMember] = useState<User | null>(null);

  const filteredMembers = useMemo(() => {
    return users.filter(user => {
      const fullName = user.fullName || `${user.firstName} ${user.lastName}`;
      const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'active' ? user.enabled : !user.enabled;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    const active = users.filter(u => u.enabled);
    return {
      outsideReps: active.filter(u => u.role === 'OUTSIDE_REP').length,
      insideReps: active.filter(u => u.role === 'INSIDE_REP').length,
      administrators: active.filter(u => u.role === 'ADMINISTRATOR').length,
      owners: active.filter(u => u.role === 'OWNER').length,
      warehouseManagers: active.filter(u => u.role === 'WAREHOUSE_MANAGER').length,
      warehouseEmployees: active.filter(u => u.role === 'WAREHOUSE_EMPLOYEE').length,
      drivers: active.filter(u => u.role === 'DRIVER').length,
    };
  }, [users]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  const getInitials = (user: User) => {
    const name = user.fullName || `${user.firstName} ${user.lastName}`;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const groups = [
    { id: 'outside_rep', label: 'Outside Reps', count: statusFilter === 'active' ? counts.outsideReps : filteredMembers.filter(u => u.role === 'OUTSIDE_REP').length, role: 'OUTSIDE_REP' as UserRole },
    { id: 'inside_rep', label: 'Inside Reps', count: statusFilter === 'active' ? counts.insideReps : filteredMembers.filter(u => u.role === 'INSIDE_REP').length, role: 'INSIDE_REP' as UserRole },
    { id: 'administrator', label: 'Administrators', count: statusFilter === 'active' ? counts.administrators : filteredMembers.filter(u => u.role === 'ADMINISTRATOR').length, role: 'ADMINISTRATOR' as UserRole },
    { id: 'owner', label: 'Owners', count: statusFilter === 'active' ? counts.owners : filteredMembers.filter(u => u.role === 'OWNER').length, role: 'OWNER' as UserRole },
    { id: 'warehouse_manager', label: 'Warehouse Managers', count: statusFilter === 'active' ? counts.warehouseManagers : filteredMembers.filter(u => u.role === 'WAREHOUSE_MANAGER').length, role: 'WAREHOUSE_MANAGER' as UserRole },
    { id: 'warehouse_employee', label: 'Warehouse Employees', count: statusFilter === 'active' ? counts.warehouseEmployees : filteredMembers.filter(u => u.role === 'WAREHOUSE_EMPLOYEE').length, role: 'WAREHOUSE_EMPLOYEE' as UserRole },
    { id: 'driver', label: 'Drivers', count: statusFilter === 'active' ? counts.drivers : filteredMembers.filter(u => u.role === 'DRIVER').length, role: 'DRIVER' as UserRole },
  ];

  if (isLoading) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-[var(--muted-foreground)]">Loading team members...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
            <span>Failed to load team members: {error.message}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm font-medium text-[var(--primary)] border-b-2 border-[var(--primary)]">
            Team Members
          </button>
          <button className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Permissions
          </button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          Add New User
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === 'active'
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
          }`}
        >
          ACTIVE
        </button>
        <button
          onClick={() => setStatusFilter('inactive')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            statusFilter === 'inactive'
              ? 'bg-gray-500 text-white'
              : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
          }`}
        >
          INACTIVE
        </button>
      </div>

      {/* Team Groups */}
      <div className="space-y-2">
        {groups.map((group) => {
          const groupMembers = filteredMembers.filter(u => u.role === group.role);
          const isExpanded = expandedGroups.includes(group.id);

          return (
            <div key={group.id} className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)]/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[var(--foreground)]">{group.label}</span>
                  <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium rounded-full">
                    {groupMembers.length}
                  </span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-[var(--muted-foreground)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {isExpanded && groupMembers.length > 0 && (
                <div className="border-t border-[var(--border)]">
                  {groupMembers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)]/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center text-sm font-medium text-[var(--muted-foreground)]">
                          {getInitials(user)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--foreground)]">
                              {user.fullName || `${user.firstName} ${user.lastName}`}
                            </span>
                            <span className="text-[var(--muted-foreground)]">|</span>
                            <span className="text-sm text-[var(--muted-foreground)]">{getRoleDisplayLabel(user.role)}</span>
                          </div>
                          <span className="text-sm text-[var(--muted-foreground)]">{user.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          user.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.enabled ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <button
                          onClick={() => setEditingMember(user)}
                          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingMember(user)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && !isLoading && (
        <div className="text-center py-8 text-[var(--muted-foreground)]">
          {searchQuery ? 'No users match your search.' : `No ${statusFilter} users found.`}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModalNew onClose={() => setShowAddModal(false)} />
      )}

      {/* Edit User Modal */}
      {editingMember && (
        <EditUserModalNew
          user={editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingMember && (
        <DeleteUserModal
          user={deletingMember}
          onClose={() => setDeletingMember(null)}
        />
      )}
    </div>
  );
}

// ============================================
// Permissions Tab
// ============================================
function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions);
  const [visibilityRoles, setVisibilityRoles] = useState(commissionVisibilityRoles);
  const [editingPermission, setEditingPermission] = useState<{ entity: string; role: string } | null>(null);

  const getPermissionForCell = (entity: string, roleId: string) => {
    return permissions.find(p => p.entity === entity && p.role === roleId);
  };

  const handlePermissionClick = (entity: string, roleId: string) => {
    setEditingPermission({ entity, role: roleId });
  };

  const handlePermissionUpdate = (entity: string, roleId: string, view: Permission['view'], write: Permission['write'], del: Permission['delete']) => {
    setPermissions(prev => prev.map(p =>
      p.entity === entity && p.role === roleId
        ? { ...p, view, write, delete: del }
        : p
    ));
  };

  return (
    <div className="max-w-6xl">
      {/* Commissions Visibility */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-1">Commissions Visibility</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">Roles Management to View Commission Data</p>
        <div className="flex flex-wrap gap-4">
          {visibilityRoles.map((role) => (
            <label key={role.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={role.checked}
                onChange={(e) => {
                  setVisibilityRoles(prev =>
                    prev.map(r => r.id === role.id ? { ...r, checked: e.target.checked } : r)
                  );
                }}
                className="w-4 h-4 accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">{role.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]"></th>
                {permissionRoles.map((role) => (
                  <th key={role.id} className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionEntities.map((entity) => (
                <tr key={entity} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{entity}</td>
                  {permissionRoles.map((role) => {
                    const permission = getPermissionForCell(entity, role.id);
                    const status = permission ? getPermissionStatus(permission) : 'none';

                    return (
                      <td key={role.id} className="px-4 py-3 text-center">
                        <button
                          onClick={() => handlePermissionClick(entity, role.id)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                            status === 'all'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : status === 'customized'
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {status === 'all' ? 'All Permissions' : status === 'customized' ? 'Customized' : 'No Permissions'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Edit Modal */}
      {editingPermission && (
        <PermissionModal
          entity={editingPermission.entity}
          roleId={editingPermission.role}
          permission={getPermissionForCell(editingPermission.entity, editingPermission.role)!}
          onClose={() => setEditingPermission(null)}
          onSave={(view, write, del) => {
            handlePermissionUpdate(editingPermission.entity, editingPermission.role, view, write, del);
            setEditingPermission(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// flowBot Settings Tab
// ============================================
function FlowBotSettingsTab() {
  const [settings, setSettings] = useState<FlowBotSettings>(mockFlowBotSettings);

  const handleToggle = (field: keyof FlowBotSettings) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSliderChange = (field: 'trainingBaseline' | 'extractionBaseline', value: number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const Toggle = ({ checked, onChange, label, description }: { checked: boolean; onChange: () => void; label: string; description: string }) => (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <h4 className="font-medium text-[var(--foreground)]">{label}</h4>
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
      </label>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Subflow Creation */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-1">Subflow Creation</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">Determine how flowBot creates related entities during processing.</p>

        <div className="grid grid-cols-2 gap-x-8">
          <Toggle
            checked={settings.canCreateProducts}
            onChange={() => handleToggle('canCreateProducts')}
            label="Can create products"
            description="Allow flowBot to create products when they don't exist."
          />
          <Toggle
            checked={settings.canCreateFactories}
            onChange={() => handleToggle('canCreateFactories')}
            label="Can create factories"
            description="Allow flowBot to create factories when referenced but missing."
          />
          <Toggle
            checked={settings.canCreateCustomers}
            onChange={() => handleToggle('canCreateCustomers')}
            label="Can create customers"
            description="Allow flowBot to create customers when needed."
          />
          <Toggle
            checked={settings.canCreateQuotes}
            onChange={() => handleToggle('canCreateQuotes')}
            label="Can create quotes"
            description="Allow flowBot to create quotes during processing."
          />
          <Toggle
            checked={settings.canCreateOrders}
            onChange={() => handleToggle('canCreateOrders')}
            label="Can create orders"
            description="Allow flowBot to create orders during processing."
          />
          <Toggle
            checked={settings.canCreateInvoices}
            onChange={() => handleToggle('canCreateInvoices')}
            label="Can create invoices"
            description="Allow flowBot to create invoices during processing."
          />
        </div>
      </div>

      {/* Mapping and Value Matching */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-1">Mapping and Value Matching</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">Determine how flowBot looks at mapping and matching your uploaded items.</p>

        <div className="grid grid-cols-2 gap-x-8">
          <Toggle
            checked={settings.allowEntityAutoUpdates}
            onChange={() => handleToggle('allowEntityAutoUpdates')}
            label="Allow Entity Auto-Updates?"
            description="When a match is found, update the existing entity with extracted fields."
          />
          <Toggle
            checked={settings.autoMatchEndUser}
            onChange={() => handleToggle('autoMatchEndUser')}
            label="Auto-match End User?"
            description="Try to auto-match end users from context."
          />
          <Toggle
            checked={settings.includeFreightLines}
            onChange={() => handleToggle('includeFreightLines')}
            label="Include Freight Lines?"
            description="Include freight / shipping lines when parsing details."
          />
        </div>
      </div>

      {/* flowBot Training */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-1">flowBot Training</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">Determine how quickly or thoroughly flowBot trains on your uploads</p>

        <div className="grid grid-cols-2 gap-x-8 mb-6">
          <Toggle
            checked={settings.trainingBooster}
            onChange={() => handleToggle('trainingBooster')}
            label="Training Booster?"
            description="If on, flowBot will gain a boost in training time taken."
          />
          <Toggle
            checked={settings.extractionBooster}
            onChange={() => handleToggle('extractionBooster')}
            label="Extraction Booster?"
            description="If on, flowBot will gain a boost in training time taken."
          />
        </div>

        <div className="grid grid-cols-2 gap-x-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Training Baseline</span>
              <span className="text-sm text-[var(--muted-foreground)]">{settings.trainingBaseline}</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mb-2">Baseline threshold for training on a given document type</p>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.trainingBaseline}
              onChange={(e) => handleSliderChange('trainingBaseline', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Extraction Baseline</span>
              <span className="text-sm text-[var(--muted-foreground)]">{settings.extractionBaseline}</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mb-2">Baseline threshold for extraction quality/tuning. The higher the number, the faster flowBot will train on value matching</p>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.extractionBaseline}
              onChange={(e) => handleSliderChange('extractionBaseline', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Workflow Settings Tab (Placeholder)
// ============================================
function WorkflowSettingsTab() {
  return (
    <div className="max-w-3xl">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Workflow Settings</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Manage your instances specific workflows
        </p>
        <div className="mt-6 p-8 border-2 border-dashed border-[var(--border)] rounded-lg text-center">
          <svg className="mx-auto mb-4 text-[var(--muted-foreground)]" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 14l2 2 4-4"/>
          </svg>
          <p className="text-[var(--muted-foreground)]">Workflow configuration coming soon</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Lost Reasons Tab
// ============================================
function LostReasonsTab() {
  const [reasons, setReasons] = useState<string[]>(mockLostReasons);
  const [newReason, setNewReason] = useState('');

  const handleAddReason = () => {
    if (newReason.trim() && !reasons.includes(newReason.trim())) {
      setReasons(prev => [...prev, newReason.trim()]);
      setNewReason('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddReason();
    }
  };

  const handleRemoveReason = (reason: string) => {
    setReasons(prev => prev.filter(r => r !== reason));
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Lost Reasons Settings</h2>

      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-1">Lost Reasons</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Type a lost reason and press Enter to add.<br />
          Double-click on a lost reason to edit
        </p>

        <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--background)]">
          <div className="flex flex-wrap gap-2 mb-3">
            {reasons.map((reason) => (
              <span
                key={reason}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--muted)] rounded-full text-sm text-[var(--foreground)]"
              >
                {reason}
                <button
                  onClick={() => handleRemoveReason(reason)}
                  className="ml-1 hover:text-red-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6"/>
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New lost reason..."
            className="w-full px-0 py-1 bg-transparent text-sm text-[var(--muted-foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Expenses Settings Tab
// ============================================
function ExpensesSettingsTab() {
  const [categories, setCategories] = useState<string[]>(mockExpenseCategories);
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories(prev => [...prev, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(prev => prev.filter(c => c !== category));
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Expenses Settings</h2>

      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-1">Expenses Categories Settings</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Type a category and press Enter to add.<br />
          Double-click on a category to edit
        </p>

        <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--background)]">
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--muted)] rounded-full text-sm text-[var(--foreground)]"
              >
                {category}
                <button
                  onClick={() => handleRemoveCategory(category)}
                  className="ml-1 hover:text-red-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6"/>
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New category..."
            className="w-full px-0 py-1 bg-transparent text-sm text-[var(--muted-foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Credit Settings Tab
// ============================================
function CreditSettingsTab() {
  const [reasons, setReasons] = useState<string[]>(mockCreditReasons);
  const [newReason, setNewReason] = useState('');

  const handleAddReason = () => {
    if (newReason.trim() && !reasons.includes(newReason.trim())) {
      setReasons(prev => [...prev, newReason.trim()]);
      setNewReason('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddReason();
    }
  };

  const handleRemoveReason = (reason: string) => {
    setReasons(prev => prev.filter(r => r !== reason));
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Credit Settings</h2>

      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-1">Credit Reasons</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Type a credit reason and press Enter to add.<br />
          Double-click on a credit reason to edit
        </p>

        <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--background)]">
          <div className="flex flex-wrap gap-2 mb-3">
            {reasons.map((reason) => (
              <span
                key={reason}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--muted)] rounded-full text-sm text-[var(--foreground)]"
              >
                {reason}
                <button
                  onClick={() => handleRemoveReason(reason)}
                  className="ml-1 hover:text-red-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6"/>
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New credit reason..."
            className="w-full px-0 py-1 bg-transparent text-sm text-[var(--muted-foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Sales Reps Default Selections Tab
// ============================================
function SalesRepSelectionsTab() {
  const [selections, setSelections] = useState<SalesRepSelection[]>(mockSalesRepSelections);
  const [showModal, setShowModal] = useState(false);
  const [editingSelection, setEditingSelection] = useState<SalesRepSelection | null>(null);

  const handleEdit = (selection: SalesRepSelection) => {
    setEditingSelection(selection);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingSelection(null);
    setShowModal(true);
  };

  const handleSave = (selection: SalesRepSelection) => {
    if (editingSelection) {
      setSelections(prev => prev.map(s => s.id === selection.id ? selection : s));
    } else {
      setSelections(prev => [...prev, { ...selection, id: `srs-${Date.now()}` }]);
    }
    setShowModal(false);
    setEditingSelection(null);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Sales Reps Default Selections</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 p-2 bg-[var(--muted)] rounded-full hover:bg-[var(--muted)]/80 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="text-sm font-medium text-[var(--foreground)]">Factory</div>
          <div className="text-sm font-medium text-[var(--foreground)]">Customer</div>
          <div className="text-sm font-medium text-[var(--foreground)]">Reps</div>
          <div className="text-sm font-medium text-[var(--foreground)]">Actions</div>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {selections.map((selection) => (
            <div key={selection.id} className="grid grid-cols-4 gap-4 px-6 py-3 hover:bg-[var(--muted)]/20">
              <div className="text-sm text-[var(--foreground)]">{selection.factoryName}</div>
              <div className="text-sm text-[var(--foreground)]">{selection.customerName}</div>
              <div className="text-sm text-[var(--foreground)]">{selection.reps.length}</div>
              <div>
                <button
                  onClick={() => handleEdit(selection)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--muted-foreground)]">
          <span>Showing records 1 - {selections.length}</span>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-[var(--muted)] rounded disabled:opacity-50" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
              </svg>
            </button>
            <button className="p-1 hover:bg-[var(--muted)] rounded disabled:opacity-50" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <span className="px-2 text-[var(--primary)]">1</span>
            <button className="p-1 hover:bg-[var(--muted)] rounded disabled:opacity-50" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            <button className="p-1 hover:bg-[var(--muted)] rounded disabled:opacity-50" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
              </svg>
            </button>
            <select className="ml-2 px-2 py-1 border border-[var(--border)] rounded text-sm bg-[var(--background)]">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <SalesRepMatrixModal
          selection={editingSelection}
          factories={mockFactories}
          customers={mockCustomers}
          salesReps={mockTeamMembers.filter(m => m.role === 'outside_rep' || m.role === 'inside_rep')}
          onClose={() => {
            setShowModal(false);
            setEditingSelection(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ============================================
// Integrations Tab (Placeholder)
// ============================================
function IntegrationsTab() {
  return (
    <div className="max-w-3xl">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Integrations</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Manage third-party integrations and API connections
        </p>
        <div className="mt-6 p-8 border-2 border-dashed border-[var(--border)] rounded-lg text-center">
          <svg className="mx-auto mb-4 text-[var(--muted-foreground)]" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <p className="text-[var(--muted-foreground)]">Integration configuration coming soon</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Modals
// ============================================

// Add User Modal (New - with API integration)
function AddUserModalNew({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateTeamMember();
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'OUTSIDE_REP' as UserRole,
    enabled: true,
    inside: false,
    outside: false,
    visible: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Set inside/outside based on role
    const input: UserInput = {
      ...formData,
      inside: formData.role === 'INSIDE_REP',
      outside: formData.role === 'OUTSIDE_REP',
    };

    try {
      await createMutation.mutateAsync(input);
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Add New User</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.firstName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
                }`}
                placeholder="Enter first name"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.lastName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
                }`}
                placeholder="Enter last name"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.username
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
              }`}
              placeholder="Enter username"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
              }`}
              placeholder="Enter email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
            >
              {USER_ROLES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
            <span className="text-sm text-[var(--foreground)]">Active</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
            <span className="text-sm text-[var(--foreground)]">Visible</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            disabled={createMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {createMutation.isPending && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Add User
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit User Modal (New - with API integration)
function EditUserModalNew({ user, onClose }: { user: User; onClose: () => void }) {
  const updateMutation = useUpdateTeamMember();
  const [formData, setFormData] = useState({
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    enabled: user.enabled,
    inside: user.inside,
    outside: user.outside,
    visible: user.visible,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Set inside/outside based on role
    const input: Partial<UserInput> = {
      ...formData,
      inside: formData.role === 'INSIDE_REP',
      outside: formData.role === 'OUTSIDE_REP',
    };

    try {
      await updateMutation.mutateAsync({ id: user.id, input });
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit User</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.firstName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
                }`}
                placeholder="Enter first name"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.lastName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
                }`}
                placeholder="Enter last name"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.username
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
              }`}
              placeholder="Enter username"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
              }`}
              placeholder="Enter email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
            >
              {USER_ROLES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
            <span className="text-sm text-[var(--foreground)]">Active</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
            <span className="text-sm text-[var(--foreground)]">Visible</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            disabled={updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {updateMutation.isPending && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete User Confirmation Modal
function DeleteUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const deleteMutation = useDeleteTeamMember();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(user.id);
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  const userName = user.fullName || `${user.firstName} ${user.lastName}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Delete User</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-[var(--foreground)]">Are you sure?</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-[var(--foreground)]">
              You are about to delete <span className="font-medium">{userName}</span> ({user.email}).
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleteMutation.isPending && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

// Permission Modal
function PermissionModal({
  entity,
  roleId,
  permission,
  onClose,
  onSave,
}: {
  entity: string;
  roleId: string;
  permission: Permission;
  onClose: () => void;
  onSave: (view: Permission['view'], write: Permission['write'], del: Permission['delete']) => void;
}) {
  const [view, setView] = useState<Permission['view']>(permission.view);
  const [write, setWrite] = useState<Permission['write']>(permission.write);
  const [del, setDel] = useState<Permission['delete']>(permission.delete);

  const roleName = permissionRoles.find(r => r.id === roleId)?.label || roleId;

  const ToggleGroup = ({ label, value, onChange, description }: { label: string; value: 'all' | 'own' | 'none'; onChange: (v: 'all' | 'own' | 'none') => void; description: string }) => (
    <div className="mb-4">
      <h4 className="font-medium text-[var(--foreground)] mb-2">{label}</h4>
      <div className="flex gap-0 rounded-lg overflow-hidden border border-[var(--border)]">
        <button
          onClick={() => onChange('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            value === 'all' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--foreground)]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onChange('own')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-x border-[var(--border)] ${
            value === 'own' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--foreground)]'
          }`}
        >
          Only Their Own
        </button>
        <button
          onClick={() => onChange('none')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            value === 'none' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--foreground)]'
          }`}
        >
          None
        </button>
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mt-2">{description}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Modify Role Permissions</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Any changes made here will modify access to all users within the <span className="text-[var(--primary)] font-medium">{roleName}</span> role for <span className="text-[var(--primary)] font-medium">{entity}</span>
          </p>

          <ToggleGroup
            label="View"
            value={view}
            onChange={setView}
            description={`The User will be able to VIEW ${view === 'all' ? 'all' : view === 'own' ? 'only their own' : 'no'} ${entity.toUpperCase()}`}
          />
          <ToggleGroup
            label="Write"
            value={write}
            onChange={setWrite}
            description={`The User will be able to WRITE ${write === 'all' ? 'all' : write === 'own' ? 'only their own' : 'no'} ${entity.toUpperCase()}`}
          />
          <ToggleGroup
            label="Delete"
            value={del}
            onChange={setDel}
            description={`The User will be able to DELETE ${del === 'all' ? 'all' : del === 'own' ? 'only their own' : 'no'} ${entity.toUpperCase()}`}
          />
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Cancel
          </button>
          <button
            onClick={() => onSave(view, write, del)}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium"
          >
            Update Role
          </button>
        </div>
      </div>
    </div>
  );
}

// Sales Rep Matrix Modal
function SalesRepMatrixModal({
  selection,
  factories,
  customers,
  salesReps,
  onClose,
  onSave,
}: {
  selection: SalesRepSelection | null;
  factories: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  salesReps: TeamMember[];
  onClose: () => void;
  onSave: (selection: SalesRepSelection) => void;
}) {
  const [formData, setFormData] = useState({
    factoryId: selection?.factoryId || factories[0]?.id || '',
    customerId: selection?.customerId || customers[0]?.id || '',
    reps: selection?.reps || [],
  });

  const [selectedRepId, setSelectedRepId] = useState('');

  const handleAddRep = () => {
    if (!selectedRepId) return;
    const rep = salesReps.find(r => r.id === selectedRepId);
    if (rep && !formData.reps.find(r => r.id === rep.id)) {
      setFormData(prev => ({
        ...prev,
        reps: [...prev.reps, { id: rep.id, name: rep.name, type: rep.role === 'outside_rep' ? 'outside' : 'inside' }],
      }));
      setSelectedRepId('');
    }
  };

  const handleRemoveRep = (repId: string) => {
    setFormData(prev => ({
      ...prev,
      reps: prev.reps.filter(r => r.id !== repId),
    }));
  };

  const handleSubmit = () => {
    const factory = factories.find(f => f.id === formData.factoryId);
    const customer = customers.find(c => c.id === formData.customerId);

    onSave({
      id: selection?.id || '',
      factoryId: formData.factoryId,
      factoryName: factory?.name || '',
      customerId: formData.customerId,
      customerName: customer?.name || '',
      reps: formData.reps,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {selection ? 'Edit' : 'Add'} Sales Rep Matrix
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Factory*</label>
              <select
                value={formData.factoryId}
                onChange={(e) => setFormData({ ...formData, factoryId: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              >
                {factories.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Customer*</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-[var(--foreground)] mb-2">Sales Representatives</h4>

            {formData.reps.map((rep) => (
              <div key={rep.id} className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                <span className="text-sm text-[var(--foreground)]">{rep.name} ({rep.type === 'outside' ? 'Outside' : 'Inside'} Rep)</span>
                <button
                  onClick={() => handleRemoveRep(rep.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6l-12 12"/>
                  </svg>
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 mt-3">
              <label className="text-sm text-[var(--foreground)]">Outside Rep</label>
              <select
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              >
                <option value="">Select a rep...</option>
                {salesReps.filter(r => !formData.reps.find(fr => fr.id === r.id)).map(rep => (
                  <option key={rep.id} value={rep.id}>{rep.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddRep}
                disabled={!selectedRepId}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
