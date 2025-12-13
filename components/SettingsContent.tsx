'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import TagSearchSelect from './TagSearchSelect';
import SidebarSettings from './SidebarSettings';
import {
  mockCompanySettings,
  mockTeamMembers,
  mockPermissions,
  mockFlowBotSettings,
  mockLostReasons,
  mockExpenseCategories,
  mockCreditReasons,
  mockManufacturerTypes,
  mockCustomerTypes,
  mockSalesRepSelections,
  mockFactories,
  mockCustomers,
  mockEndUsers,
  mockCustomerRepAssignments,
  mockEndUserRepAssignments,
  permissionEntities,
  permissionRoles,
  getPermissionStatus,
  getTeamCounts,
  type TeamMember,
  type Permission,
  type CompanySettings,
  type FlowBotSettings,
  type SalesRepSelection,
  type RepAssignment,
  type RepSplit,
} from './admin/data/admin-mock-data';

type RepType = {
  id: string;
  name: string;
  division: string;
  description: string;
  selected: boolean;
};

type ActivityRule = {
  id: string;
  activityType: 'task' | 'note' | 'quote';
  basePoints: number;
  tagModifiers: { tag: string; multiplier: number }[];
};

type TabType = 'takeoffs' | 'credit-for-sale' | 'sidebar' | 'default-views' | 'manufacturer-integrations' | 'general' | 'team' | 'permissions' | 'flowbot' | 'categories' | 'sales-reps';

const allTabIds: TabType[] = ['takeoffs', 'credit-for-sale', 'sidebar', 'default-views', 'manufacturer-integrations', 'general', 'team', 'permissions', 'flowbot', 'categories', 'sales-reps'];

export default function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && allTabIds.includes(tabParam) ? tabParam : 'general');
  const [autoAbridgment, setAutoAbridgment] = useState(false);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam && allTabIds.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [saved, setSaved] = useState(false);

  // Default view settings
  const [defaultViews, setDefaultViews] = useState({
    quotes: 'simple' as 'overage' | 'simple',
    orders: 'simple' as 'simple',
    invoices: 'simple' as 'simple',
    commissions: 'simple' as 'simple',
  });

  // Common system tags
  const systemTags = [
    'urgent',
    'large',
    'small',
    'priority',
    'follow-up',
    'Healthcare',
    'Education',
    'Office',
    'Retail',
    'Government',
    'Hospitality',
    'Infrastructure',
    'Lighting',
    'Controls',
    'Electrical',
    'HVAC',
    'Plumbing',
    'high-value',
    'complex',
    'simple',
  ];

  // Credit for Sale state
  const [activityRules, setActivityRules] = useState<ActivityRule[]>([
    { id: '1', activityType: 'task', basePoints: 10, tagModifiers: [{ tag: 'urgent', multiplier: 1.5 }] },
    { id: '2', activityType: 'note', basePoints: 5, tagModifiers: [] },
    { id: '3', activityType: 'quote', basePoints: 50, tagModifiers: [{ tag: 'large', multiplier: 2.0 }] },
  ]);

  const [repTypes, setRepTypes] = useState<RepType[]>([
    {
      id: 'plumbing',
      name: 'Plumbing',
      division: 'Div. 22',
      description: 'Plumbing fixtures, faucets, water systems, piping',
      selected: true,
    },
    {
      id: 'hvac',
      name: 'HVAC / Mechanical',
      division: 'Div. 23',
      description: 'HVAC equipment, ductwork, mechanical systems, ventilation',
      selected: false,
    },
    {
      id: 'electrical',
      name: 'Electrical / Lighting',
      division: 'Div. 26',
      description: 'Electrical equipment, panels, outlets, lighting fixtures',
      selected: false,
    },
  ]);

  const handleToggleRepType = (id: string) => {
    const selectedCount = repTypes.filter(rt => rt.selected).length;
    const repType = repTypes.find(rt => rt.id === id);

    // Prevent deselecting if it would go below 1, or selecting if it would go above 3
    if (repType?.selected && selectedCount <= 1) {
      return;
    }
    if (!repType?.selected && selectedCount >= 3) {
      return;
    }

    setRepTypes(repTypes.map(rt =>
      rt.id === id ? { ...rt, selected: !rt.selected } : rt
    ));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const selectedRepTypes = repTypes.filter(rt => rt.selected);
  const selectedCount = selectedRepTypes.length;

  const tabGroups = [
    {
      label: 'Company',
      tabs: [
        { id: 'general' as TabType, label: 'General Settings' },
        { id: 'team' as TabType, label: 'Your Team' },
        { id: 'permissions' as TabType, label: 'Permissions' },
      ],
    },
    {
      label: 'Sales',
      tabs: [
        { id: 'sales-reps' as TabType, label: 'Rep Assignments' },
        { id: 'credit-for-sale' as TabType, label: 'Credit for Sale' },
        { id: 'categories' as TabType, label: 'Categories' },
      ],
    },
    {
      label: 'Automation',
      tabs: [
        { id: 'flowbot' as TabType, label: 'flowBot Settings' },
        { id: 'takeoffs' as TabType, label: 'Take-Off Settings' },
      ],
    },
    {
      label: 'Preferences',
      tabs: [
        { id: 'default-views' as TabType, label: 'Default Views' },
        { id: 'sidebar' as TabType, label: 'Sidebar' },
      ],
    },
  ];

  return (
    <main className="flex-1 flex overflow-hidden bg-[var(--background)]">
      {/* Vertical Sidebar Menu */}
      <aside className="w-56 flex-shrink-0 bg-[var(--card)] border-r border-[var(--border)] overflow-y-auto">
        <nav className="py-4">
          {tabGroups.map((group, index) => (
            <div key={group.label} className={index > 0 ? 'mt-4' : ''}>
              <p className="px-5 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                {group.label}
              </p>
              {group.tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-5 py-2 text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium border-r-2 border-[var(--primary)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
      {/* Take-Off Settings Tab */}
      {activeTab === 'takeoffs' && (
        <div className="max-w-3xl space-y-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Take-Off Settings</h2>

          {/* Document Abridgment Setting */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-[var(--foreground)] mb-1">
                  Automatic Document Abridgment
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Automatically abridge documents over 20 pages during the classification step.
                  When enabled, large documents will be processed to include only relevant pages,
                  reducing processing time and focusing on key information.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={autoAbridgment}
                  onChange={(e) => {
                    setAutoAbridgment(e.target.checked);
                    setSaved(false);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>
            {autoAbridgment && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Auto-abridgment enabled</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Documents over 20 pages will be automatically processed when uploaded. You can still manually abridge documents or view the full originals at any time.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rep Types Configuration */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h3 className="font-medium text-[var(--foreground)] mb-1">Rep Types for Takeoffs</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Select which rep types to include in your takeoff analysis. Choose 1-3 types.
            </p>

            <div className="space-y-3">
              {repTypes.map((repType) => (
                <label
                  key={repType.id}
                  className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                    repType.selected
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={repType.selected}
                      onChange={() => handleToggleRepType(repType.id)}
                      className="mt-1 w-5 h-5 accent-[var(--primary)] cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[var(--foreground)]">
                          {repType.name} ({repType.division})
                        </h4>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {repType.description}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <p className="text-sm text-[var(--muted-foreground)] mt-4">
              Selected: {selectedRepTypes.map(rt => `${rt.name} (${rt.division})`).join(', ') || 'None'} ({selectedCount}/3)
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
              }`}
            >
              {saved ? (
                <>
                  Saved
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Credit for Sale Tab */}
      {activeTab === 'credit-for-sale' && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 max-w-4xl">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Credit for Sale Configuration
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Define point values for different activities. Points can be modified based on entity tags.
          </p>

          <div className="space-y-4">
            {activityRules.map((rule) => (
              <div key={rule.id} className="p-4 border border-[var(--border)] rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-md text-sm font-medium ${
                      rule.activityType === 'task' ? 'bg-blue-100 text-blue-700' :
                      rule.activityType === 'note' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {rule.activityType.charAt(0).toUpperCase() + rule.activityType.slice(1)}
                    </div>
                    <div>
                      <label className="text-sm text-[var(--muted-foreground)]">Base Points</label>
                      <input
                        type="number"
                        value={rule.basePoints}
                        onChange={(e) => {
                          const updated = activityRules.map(r =>
                            r.id === rule.id ? { ...r, basePoints: parseInt(e.target.value) || 0 } : r
                          );
                          setActivityRules(updated);
                          setSaved(false);
                        }}
                        className="ml-2 w-20 px-2 py-1 border border-[var(--border)] rounded text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = activityRules.map(r =>
                        r.id === rule.id
                          ? { ...r, tagModifiers: [...r.tagModifiers, { tag: '', multiplier: 1.0 }] }
                          : r
                      );
                      setActivityRules(updated);
                      setSaved(false);
                    }}
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    + Add Tag Modifier
                  </button>
                </div>

                {rule.tagModifiers.length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-[var(--border)]">
                    <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Tag Modifiers</p>
                    {rule.tagModifiers.map((modifier, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <TagSearchSelect
                          value={modifier.tag}
                          onChange={(newTag) => {
                            const updated = activityRules.map(r =>
                              r.id === rule.id
                                ? {
                                    ...r,
                                    tagModifiers: r.tagModifiers.map((m, i) =>
                                      i === idx ? { ...m, tag: newTag } : m
                                    ),
                                  }
                                : r
                            );
                            setActivityRules(updated);
                            setSaved(false);
                          }}
                          availableTags={systemTags}
                          placeholder="Search tags..."
                        />
                        <span className="text-sm text-[var(--muted-foreground)]">×</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Multiplier"
                          value={modifier.multiplier}
                          onChange={(e) => {
                            const updated = activityRules.map(r =>
                              r.id === rule.id
                                ? {
                                    ...r,
                                    tagModifiers: r.tagModifiers.map((m, i) =>
                                      i === idx ? { ...m, multiplier: parseFloat(e.target.value) || 1.0 } : m
                                    ),
                                  }
                                : r
                            );
                            setActivityRules(updated);
                            setSaved(false);
                          }}
                          className="w-24 px-3 py-1.5 border border-[var(--border)] rounded text-sm"
                        />
                        <button
                          onClick={() => {
                            const updated = activityRules.map(r =>
                              r.id === rule.id
                                ? {
                                    ...r,
                                    tagModifiers: r.tagModifiers.filter((_, i) => i !== idx),
                                  }
                                : r
                            );
                            setActivityRules(updated);
                            setSaved(false);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-[var(--border)]">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
              }`}
            >
              {saved ? (
                <>
                  Saved
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Settings Tab */}
      {activeTab === 'sidebar' && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 max-w-4xl">
          <SidebarSettings />
        </div>
      )}

      {/* Default Views Tab */}
      {activeTab === 'default-views' && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 max-w-3xl">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Default View Settings
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Choose which view mode to display by default when opening each module.
          </p>

          <div className="space-y-4">
            {/* Quotes Default View */}
            <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
              <div>
                <h3 className="font-medium text-[var(--foreground)]">Quotes</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Default view when viewing quote line items</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDefaultViews(prev => ({ ...prev, quotes: 'overage' }));
                    setSaved(false);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    defaultViews.quotes === 'overage'
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                  }`}
                >
                  Overage View
                </button>
                <button
                  onClick={() => {
                    setDefaultViews(prev => ({ ...prev, quotes: 'simple' }));
                    setSaved(false);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    defaultViews.quotes === 'simple'
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                  }`}
                >
                  Simple View
                </button>
              </div>
            </div>

            {/* Orders Default View */}
            <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
              <div>
                <h3 className="font-medium text-[var(--foreground)]">Orders</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Default view when viewing order line items</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-white">
                  Simple View
                </span>
              </div>
            </div>

            {/* Invoices Default View */}
            <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
              <div>
                <h3 className="font-medium text-[var(--foreground)]">Invoices</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Default view when viewing invoice line items</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-white">
                  Simple View
                </span>
              </div>
            </div>

            {/* Commissions Default View */}
            <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
              <div>
                <h3 className="font-medium text-[var(--foreground)]">Commissions</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Default view when viewing commission line items</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-white">
                  Simple View
                </span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900">About View Modes</h4>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Overage View</strong> (Quotes only) shows all pricing columns including overage, commission splits, and price levels.
                  <strong> Simple View</strong> shows a streamlined view with basic pricing columns only, ideal for quick editing.
                  Users can switch between views using the View dropdown in Quotes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-[var(--border)]">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
              }`}
            >
              {saved ? (
                <>
                  Saved
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Manufacturer Integrations Tab */}
      {activeTab === 'manufacturer-integrations' && (
        <ManufacturerIntegrationsTab />
      )}

      {/* Admin Settings Tabs */}
      {activeTab === 'general' && <GeneralSettingsTab />}
      {activeTab === 'team' && <TeamMembersTab />}
      {activeTab === 'permissions' && <PermissionsTab />}
      {activeTab === 'flowbot' && <FlowBotSettingsTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'sales-reps' && <SalesRepSelectionsTab />}
      </div>
    </main>
  );
}

// Manufacturer Integrations Tab Component
interface ManufacturerIntegration {
  id: string;
  name: string;
  logo?: string;
  description: string;
  status: 'available' | 'activated' | 'requested';
  requestCount?: number;
  connectedDate?: string;
  dataTypes: string[];
}

const initialIntegrations: ManufacturerIntegration[] = [
  {
    id: 'signify',
    name: 'Signify',
    description: 'Stream quotes, orders, invoices, and commission data from Signify (formerly Philips Lighting)',
    status: 'available',
    dataTypes: ['Quotes', 'Orders', 'Invoices', 'Commissions'],
  },
  {
    id: 'rab',
    name: 'RAB Lighting',
    description: 'Stream quotes, orders, and commission data from RAB Lighting',
    status: 'requested',
    requestCount: 6,
    dataTypes: ['Quotes', 'Orders', 'Commissions'],
  },
];

function ManufacturerIntegrationsTab() {
  const [integrations, setIntegrations] = React.useState<ManufacturerIntegration[]>(initialIntegrations);
  const [showRequestModal, setShowRequestModal] = React.useState(false);
  const [newIntegrationName, setNewIntegrationName] = React.useState('');
  const [isActivating, setIsActivating] = React.useState<string | null>(null);
  const [showActivateModal, setShowActivateModal] = React.useState<string | null>(null);

  const handleActivate = async (integrationId: string) => {
    setIsActivating(integrationId);
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, status: 'activated', connectedDate: new Date().toISOString().split('T')[0] }
          : integration
      )
    );
    setIsActivating(null);
    setShowActivateModal(null);
  };

  const handleDeactivate = (integrationId: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, status: 'available', connectedDate: undefined }
          : integration
      )
    );
  };

  const handleRequestIntegration = () => {
    if (!newIntegrationName.trim()) return;

    const newIntegration: ManufacturerIntegration = {
      id: newIntegrationName.toLowerCase().replace(/\s+/g, '-'),
      name: newIntegrationName.trim(),
      description: `Requested integration for ${newIntegrationName.trim()}`,
      status: 'requested',
      requestCount: 1,
      dataTypes: [],
    };

    setIntegrations(prev => [...prev, newIntegration]);
    setNewIntegrationName('');
    setShowRequestModal(false);
  };

  const handleUpvote = (integrationId: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId && integration.status === 'requested'
          ? { ...integration, requestCount: (integration.requestCount || 0) + 1 }
          : integration
      )
    );
  };

  const availableIntegrations = integrations.filter(i => i.status === 'available');
  const activatedIntegrations = integrations.filter(i => i.status === 'activated');
  const requestedIntegrations = integrations.filter(i => i.status === 'requested');

  return (
    <div className="max-w-4xl">
      {/* Header with Request button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Manufacturer Integrations</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Connect to manufacturers to automatically stream quotes, orders, invoices, and commission data
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
          </svg>
          Request Integration
        </button>
      </div>

      <div className="space-y-8">
        {/* Activated Integrations */}
        {activatedIntegrations.length > 0 && (
          <section>
            <h3 className="text-base font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Activated ({activatedIntegrations.length})
            </h3>
            <div className="space-y-3">
              {activatedIntegrations.map(integration => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onDeactivate={() => handleDeactivate(integration.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Available Integrations */}
        {availableIntegrations.length > 0 && (
          <section>
            <h3 className="text-base font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Available ({availableIntegrations.length})
            </h3>
            <div className="space-y-3">
              {availableIntegrations.map(integration => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onActivate={() => setShowActivateModal(integration.id)}
                  isActivating={isActivating === integration.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* Requested Integrations */}
        {requestedIntegrations.length > 0 && (
          <section>
            <h3 className="text-base font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Requested ({requestedIntegrations.length})
            </h3>
            <div className="space-y-3">
              {requestedIntegrations.map(integration => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onUpvote={() => handleUpvote(integration.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Request Integration Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Request Integration</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Manufacturer Name
                </label>
                <input
                  type="text"
                  value={newIntegrationName}
                  onChange={(e) => setNewIntegrationName(e.target.value)}
                  placeholder="Enter manufacturer name..."
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                We&apos;ll add this manufacturer to our integration roadmap. The more requests an integration receives, the higher priority it becomes.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestIntegration}
                disabled={!newIntegrationName.trim()}
                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Integration Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Activate Integration</h3>
              <button
                onClick={() => setShowActivateModal(null)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const integration = integrations.find(i => i.id === showActivateModal);
                return integration ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                          <circle cx="12" cy="12" r="4"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-[var(--foreground)]">{integration.name}</h4>
                        <p className="text-sm text-[var(--muted-foreground)]">{integration.description}</p>
                      </div>
                    </div>
                    <div className="bg-[var(--muted)]/50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-[var(--foreground)] mb-2">Data types available:</h5>
                      <div className="flex flex-wrap gap-2">
                        {integration.dataTypes.map(type => (
                          <span key={type} className="px-2 py-1 text-xs bg-[var(--background)] text-[var(--foreground)] rounded-md">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Once activated, data from {integration.name} will automatically sync to your account. You can deactivate at any time.
                    </p>
                  </>
                ) : null;
              })()}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <button
                onClick={() => setShowActivateModal(null)}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleActivate(showActivateModal)}
                disabled={isActivating === showActivateModal}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActivating === showActivateModal ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Activating...
                  </>
                ) : (
                  'Activate Integration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Integration Card Component
interface IntegrationCardProps {
  integration: ManufacturerIntegration;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onUpvote?: () => void;
  isActivating?: boolean;
}

function IntegrationCard({ integration, onActivate, onDeactivate, onUpvote, isActivating }: IntegrationCardProps) {
  const isRequested = integration.status === 'requested';
  const isActivated = integration.status === 'activated';
  const isAvailable = integration.status === 'available';

  return (
    <div
      className={`border rounded-xl p-5 transition-all ${
        isRequested
          ? 'border-[var(--border)] bg-[var(--muted)]/30 opacity-70'
          : isActivated
          ? 'border-green-200 bg-green-50/50'
          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isActivated ? 'bg-green-100' : isRequested ? 'bg-gray-100' : 'bg-[var(--primary)]/10'
          }`}>
            {integration.logo ? (
              <img src={integration.logo} alt={integration.name} className="w-8 h-8" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={
                isActivated ? 'text-green-600' : isRequested ? 'text-gray-400' : 'text-[var(--primary)]'
              }>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${isRequested ? 'text-gray-500' : 'text-[var(--foreground)]'}`}>
                {integration.name}
              </h3>
              {isActivated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Active
                </span>
              )}
              {isRequested && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Requested
                </span>
              )}
            </div>
            <p className={`text-sm mb-3 ${isRequested ? 'text-gray-400' : 'text-[var(--muted-foreground)]'}`}>
              {integration.description}
            </p>
            {integration.dataTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {integration.dataTypes.map(type => (
                  <span
                    key={type}
                    className={`px-2 py-0.5 text-xs rounded-md ${
                      isRequested
                        ? 'bg-gray-100 text-gray-400'
                        : isActivated
                        ? 'bg-green-100 text-green-700'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}
            {isActivated && integration.connectedDate && (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Connected since {integration.connectedDate}
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {isAvailable && onActivate && (
            <button
              onClick={onActivate}
              disabled={isActivating}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Activating...
                </>
              ) : (
                'Activate'
              )}
            </button>
          )}
          {isActivated && onDeactivate && (
            <button
              onClick={onDeactivate}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Deactivate
            </button>
          )}
          {isRequested && onUpvote && (
            <button
              onClick={onUpvote}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{integration.requestCount || 0}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Admin Settings Tabs
// ============================================

// General Settings Tab
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

// Team Members Tab
function TeamMembersTab() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['outside_reps', 'inside_reps', 'administrators', 'owners', 'warehouse_managers', 'warehouse_employees', 'drivers']);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = member.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teamMembers, searchQuery, statusFilter]);

  const counts = useMemo(() => getTeamCounts(filteredMembers), [filteredMembers]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const groups = [
    { id: 'outside_reps', label: 'Outside reps', count: counts.outsideReps, roles: ['outside_rep'] },
    { id: 'inside_reps', label: 'Inside reps', count: counts.insideReps, roles: ['inside_rep'] },
    { id: 'administrators', label: 'Administrators', count: counts.administrators, roles: ['administrator'] },
    { id: 'owners', label: 'Owners', count: counts.owners, roles: ['owner'] },
    { id: 'warehouse_managers', label: 'Warehouse managers', count: counts.warehouseManagers, roles: ['warehouse_manager'] },
    { id: 'warehouse_employees', label: 'Warehouse employees', count: counts.warehouseEmployees, roles: ['warehouse_employee'] },
    { id: 'drivers', label: 'Drivers', count: counts.drivers, roles: ['driver'] },
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Your Team</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
        >
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
          const groupMembers = filteredMembers.filter(m => group.roles.includes(m.role));
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
                    {group.count}
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
                  {groupMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)]/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center text-sm font-medium text-[var(--muted-foreground)]">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--foreground)]">{member.name}</span>
                            <span className="text-[var(--muted-foreground)]">|</span>
                            <span className="text-sm text-[var(--muted-foreground)]">{member.roleDisplay}</span>
                          </div>
                          <span className="text-sm text-[var(--muted-foreground)]">{member.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {member.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <button
                          onClick={() => setEditingMember(member)}
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
              )}
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onSave={(member) => {
          setTeamMembers(prev => [...prev, member]);
          setShowAddModal(false);
        }} />
      )}

      {/* Edit User Modal */}
      {editingMember && (
        <EditUserModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={(updated) => {
            setTeamMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
}

// Permissions Tab
function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions);
  const [commissionsVisible, setCommissionsVisible] = useState(true);
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
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Permissions</h2>

      {/* Commissions Visibility */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Commissions Visibility</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Allow team members to view commission data</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!commissionsVisible ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>No</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={commissionsVisible}
                onChange={(e) => setCommissionsVisible(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
            <span className={`text-sm font-medium ${commissionsVisible ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>Yes</span>
          </div>
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

// flowBot Settings Tab
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
      <h2 className="text-xl font-semibold text-[var(--foreground)]">flowBot Settings</h2>

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
            <p className="text-xs text-[var(--muted-foreground)] mb-2">Baseline threshold for extraction quality/tuning</p>
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

// Categories Tab (consolidated)
function CategoriesTab() {
  const [lostReasons, setLostReasons] = useState<string[]>(mockLostReasons);
  const [creditReasons, setCreditReasons] = useState<string[]>(mockCreditReasons);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(mockExpenseCategories);
  const [manufacturerTypes, setManufacturerTypes] = useState<string[]>(mockManufacturerTypes);
  const [customerTypes, setCustomerTypes] = useState<string[]>(mockCustomerTypes);

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">Categories</h2>

      <CategorySection
        title="Lost Reasons"
        description="Reasons for marking a quote as lost"
        items={lostReasons}
        onAdd={(item) => setLostReasons(prev => [...prev, item])}
        onRemove={(item) => setLostReasons(prev => prev.filter(i => i !== item))}
        placeholder="Add lost reason..."
      />

      <CategorySection
        title="Credit Reasons"
        description="Reasons for issuing credits"
        items={creditReasons}
        onAdd={(item) => setCreditReasons(prev => [...prev, item])}
        onRemove={(item) => setCreditReasons(prev => prev.filter(i => i !== item))}
        placeholder="Add credit reason..."
      />

      <CategorySection
        title="Expense Categories"
        description="Categories for tracking expenses"
        items={expenseCategories}
        onAdd={(item) => setExpenseCategories(prev => [...prev, item])}
        onRemove={(item) => setExpenseCategories(prev => prev.filter(i => i !== item))}
        placeholder="Add expense category..."
      />

      <CategorySection
        title="Manufacturer Types"
        description="Types of manufacturers"
        items={manufacturerTypes}
        onAdd={(item) => setManufacturerTypes(prev => [...prev, item])}
        onRemove={(item) => setManufacturerTypes(prev => prev.filter(i => i !== item))}
        placeholder="Add manufacturer type..."
        systemItems={['Manufacturer', 'Customer']}
      />

      <CategorySection
        title="Customer Types"
        description="Types of customers"
        items={customerTypes}
        onAdd={(item) => setCustomerTypes(prev => [...prev, item])}
        onRemove={(item) => setCustomerTypes(prev => prev.filter(i => i !== item))}
        placeholder="Add customer type..."
      />
    </div>
  );
}

// Reusable Category Section Component
function CategorySection({
  title,
  description,
  items,
  onAdd,
  onRemove,
  placeholder,
  systemItems = [],
}: {
  title: string;
  description: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  placeholder: string;
  systemItems?: string[];
}) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim()) && !systemItems.includes(newItem.trim())) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {/* System items that cannot be deleted */}
        {systemItems.map((item) => (
          <span
            key={`system-${item}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--muted)] rounded-full text-sm text-[var(--foreground)]"
          >
            {item}
          </span>
        ))}
        {/* Regular items that can be deleted */}
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--muted)] rounded-full text-sm text-[var(--foreground)]"
          >
            {item}
            <button
              onClick={() => onRemove(item)}
              className="ml-1 hover:text-red-500 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// Sales Reps Default Selections Tab
function SalesRepSelectionsTab() {
  type AssignmentType = 'customer' | 'end-user' | 'geography';
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('customer');
  const [customerAssignments, setCustomerAssignments] = useState<RepAssignment[]>(mockCustomerRepAssignments);
  const [endUserAssignments, setEndUserAssignments] = useState<RepAssignment[]>(mockEndUserRepAssignments);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [splitModalAssignment, setSplitModalAssignment] = useState<RepAssignment | null>(null);
  const [bulkUpdateRepId, setBulkUpdateRepId] = useState<string>('');
  const [showBulkSplitModal, setShowBulkSplitModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const outsideReps = mockTeamMembers.filter(m => m.role === 'outside_rep' && m.status === 'active');

  const baseAssignments = assignmentType === 'customer' ? customerAssignments : endUserAssignments;
  const setCurrentAssignments = assignmentType === 'customer' ? setCustomerAssignments : setEndUserAssignments;
  const entityLabel = assignmentType === 'customer' ? 'Customer' : 'End User';

  // Filter and sort assignments
  const currentAssignments = useMemo(() => {
    let filtered = baseAssignments;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => a.entityName.toLowerCase().includes(term));
    }

    // Apply sort
    return [...filtered].sort((a, b) => {
      const nameA = a.entityName.toLowerCase();
      const nameB = b.entityName.toLowerCase();
      if (sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }, [baseAssignments, searchTerm, sortDirection]);

  const handleUpdateRep = (assignmentId: string, repId: string) => {
    const rep = outsideReps.find(r => r.id === repId);
    if (!rep) return;

    setCurrentAssignments(prev => prev.map(a =>
      a.id === assignmentId
        ? { ...a, reps: [{ repId: rep.id, repName: rep.name, percentage: 100 }] }
        : a
    ));
  };

  const handleUpdateSplit = (assignmentId: string, reps: RepSplit[]) => {
    setCurrentAssignments(prev => prev.map(a =>
      a.id === assignmentId ? { ...a, reps } : a
    ));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === currentAssignments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentAssignments.map(a => a.id)));
    }
  };

  const handleBulkUpdate = () => {
    if (!bulkUpdateRepId || selectedIds.size === 0) return;
    const rep = outsideReps.find(r => r.id === bulkUpdateRepId);
    if (!rep) return;

    setCurrentAssignments(prev => prev.map(a =>
      selectedIds.has(a.id)
        ? { ...a, reps: [{ repId: rep.id, repName: rep.name, percentage: 100 }] }
        : a
    ));
    setSelectedIds(new Set());
    setBulkUpdateRepId('');
  };

  const handleBulkSplit = (reps: RepSplit[]) => {
    if (selectedIds.size === 0) return;

    setCurrentAssignments(prev => prev.map(a =>
      selectedIds.has(a.id) ? { ...a, reps } : a
    ));
    setSelectedIds(new Set());
    setShowBulkSplitModal(false);
  };

  const handleDownload = () => {
    const headers = [entityLabel, 'Outside Rep', 'Split %'];
    const rows = currentAssignments.flatMap(a =>
      a.reps.map(r => [a.entityName, r.repName, r.percentage.toString()])
    );
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assignmentType}-rep-assignments.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadComplete = (data: { manufacturer: string; manufacturerId?: string; customer: string; customerId?: string; salesRep: string }[]) => {
    const newAssignments: RepAssignment[] = data.map((row, index) => {
      const rep = outsideReps.find(r => r.name.toLowerCase() === row.salesRep.toLowerCase());
      return {
        id: `upload-${Date.now()}-${index}`,
        entityId: row.customerId || `entity-${index}`,
        entityName: row.customer || row.manufacturer,
        reps: rep ? [{ repId: rep.id, repName: rep.name, percentage: 100 }] : [],
      };
    });
    setCurrentAssignments(newAssignments);
    setShowUploadModal(false);
  };

  const getRepDisplay = (assignment: RepAssignment) => {
    if (assignment.reps.length === 0) return 'Unassigned';
    if (assignment.reps.length === 1) return assignment.reps[0].repName;
    return `${assignment.reps[0].repName} +${assignment.reps.length - 1}`;
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Rep Assignments</h2>
      </div>

      {/* Assignment Type Toggle */}
      <div className="flex gap-1 p-1 bg-[var(--muted)]/50 rounded-lg w-fit mb-6">
        {[
          { id: 'customer' as AssignmentType, label: 'by Customer' },
          { id: 'end-user' as AssignmentType, label: 'by End User' },
          { id: 'geography' as AssignmentType, label: 'by Geography' },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => { setAssignmentType(option.id); setSelectedIds(new Set()); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              assignmentType === option.id
                ? 'bg-white text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {assignmentType === 'geography' ? (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-8 text-center">
          <p className="text-[var(--muted-foreground)]">Geography-based rep assignments coming soon</p>
        </div>
      ) : (
        <>
          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download List
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              Upload List
            </button>
          </div>

          {/* Bulk Update Bar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg flex items-center gap-4">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-[var(--muted-foreground)]">Assign to:</span>
                <select
                  value={bulkUpdateRepId}
                  onChange={(e) => setBulkUpdateRepId(e.target.value)}
                  className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] min-w-[200px]"
                >
                  <option value="">Select rep...</option>
                  {outsideReps.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkUpdate}
                  disabled={!bulkUpdateRepId}
                  className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Apply
                </button>
                <span className="text-[var(--muted-foreground)]">|</span>
                <button
                  onClick={() => setShowBulkSplitModal(true)}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  Split
                </button>
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Clear
              </button>
            </div>
          )}

          {/* Note about historical data */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Uploading a new list will replace current assignments. This does not update the history of your data - it only changes assignments going forward.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${entityLabel.toLowerCase()}s...`}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Assignments Table */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 items-center">
              <input
                type="checkbox"
                checked={selectedIds.size === currentAssignments.length && currentAssignments.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-[var(--border)]"
              />
              <button
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors text-left"
              >
                {entityLabel}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
                >
                  <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="text-sm font-medium text-[var(--foreground)]">Outside Rep</div>
              <div className="w-12"></div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[var(--border)] max-h-[500px] overflow-y-auto">
              {currentAssignments.map((assignment) => (
                <div key={assignment.id} className={`grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 items-center ${selectedIds.has(assignment.id) ? 'bg-[var(--primary)]/5' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(assignment.id)}
                    onChange={() => handleToggleSelect(assignment.id)}
                    className="w-4 h-4 rounded border-[var(--border)]"
                  />
                  <div className="text-sm text-[var(--foreground)]">{assignment.entityName}</div>
                  <div className="flex items-center gap-2">
                    {assignment.reps.length <= 1 ? (
                      <SearchableDropdown
                        options={outsideReps.map(r => ({ id: r.id, label: r.name }))}
                        value={assignment.reps[0]?.repId || ''}
                        onChange={(value) => handleUpdateRep(assignment.id, value)}
                        placeholder="Select rep..."
                      />
                    ) : (
                      <div className="flex-1 px-3 py-2 bg-[var(--muted)]/30 rounded-lg text-sm">
                        {assignment.reps.map((r, i) => (
                          <span key={r.repId}>
                            {r.repName} ({r.percentage}%)
                            {i < assignment.reps.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSplitModalAssignment(assignment)}
                    className="text-sm text-[var(--primary)] hover:underline whitespace-nowrap"
                  >
                    Split
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            Showing {currentAssignments.length} {assignmentType === 'customer' ? 'customers' : 'end users'}
          </p>
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <RepAssignmentUploadModal
          entityLabel={entityLabel}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadComplete}
        />
      )}

      {/* Split Modal */}
      {splitModalAssignment && (
        <RepSplitModal
          assignment={splitModalAssignment}
          outsideReps={outsideReps}
          onClose={() => setSplitModalAssignment(null)}
          onSave={(reps) => {
            handleUpdateSplit(splitModalAssignment.id, reps);
            setSplitModalAssignment(null);
          }}
        />
      )}

      {/* Bulk Split Modal */}
      {showBulkSplitModal && (
        <BulkRepSplitModal
          selectedCount={selectedIds.size}
          outsideReps={outsideReps}
          onClose={() => setShowBulkSplitModal(false)}
          onSave={handleBulkSplit}
        />
      )}
    </div>
  );
}

// Rep Split Modal
function RepSplitModal({
  assignment,
  outsideReps,
  onClose,
  onSave,
}: {
  assignment: RepAssignment;
  outsideReps: { id: string; name: string }[];
  onClose: () => void;
  onSave: (reps: RepSplit[]) => void;
}) {
  const [splits, setSplits] = useState<RepSplit[]>(
    assignment.reps.length > 0 ? [...assignment.reps] : [{ repId: '', repName: '', percentage: 100 }]
  );

  const totalPercentage = splits.reduce((sum, s) => sum + s.percentage, 0);
  const isValid = totalPercentage === 100 && splits.every(s => s.repId && s.percentage > 0);

  const handleAddSplit = () => {
    // Auto-calculate: split remaining percentage or divide evenly
    const newSplits = [...splits, { repId: '', repName: '', percentage: 0 }];
    const count = newSplits.length;
    const evenPct = Math.floor(100 / count);
    const remainder = 100 - (evenPct * count);
    setSplits(newSplits.map((s, i) => ({
      ...s,
      percentage: evenPct + (i === 0 ? remainder : 0)
    })));
  };

  const handleRemoveSplit = (index: number) => {
    const newSplits = splits.filter((_, i) => i !== index);
    if (newSplits.length === 1) {
      // If only one left, set to 100%
      setSplits([{ ...newSplits[0], percentage: 100 }]);
    } else {
      // Redistribute percentages evenly
      const count = newSplits.length;
      const evenPct = Math.floor(100 / count);
      const remainder = 100 - (evenPct * count);
      setSplits(newSplits.map((s, i) => ({
        ...s,
        percentage: evenPct + (i === 0 ? remainder : 0)
      })));
    }
  };

  const handleUpdateRep = (index: number, repId: string) => {
    const rep = outsideReps.find(r => r.id === repId);
    setSplits(prev => prev.map((s, i) =>
      i === index ? { ...s, repId, repName: rep?.name || '' } : s
    ));
  };

  const handleUpdatePercentage = (index: number, value: string) => {
    const newPct = parseInt(value) || 0;
    const clampedPct = Math.min(100, Math.max(0, newPct));

    // Auto-adjust other percentages to maintain 100% total
    setSplits(prev => {
      const newSplits = [...prev];
      const oldPct = newSplits[index].percentage;
      const diff = clampedPct - oldPct;

      newSplits[index] = { ...newSplits[index], percentage: clampedPct };

      // Distribute the difference among other splits proportionally
      const otherIndices = newSplits.map((_, i) => i).filter(i => i !== index);
      if (otherIndices.length > 0 && diff !== 0) {
        const totalOther = otherIndices.reduce((sum, i) => sum + newSplits[i].percentage, 0);
        let remaining = -diff;

        otherIndices.forEach((i, idx) => {
          if (idx === otherIndices.length - 1) {
            // Last one gets the remainder to ensure total is 100
            newSplits[i] = { ...newSplits[i], percentage: Math.max(0, newSplits[i].percentage + remaining) };
          } else if (totalOther > 0) {
            const proportion = newSplits[i].percentage / totalOther;
            const adjustment = Math.round(-diff * proportion);
            const newVal = Math.max(0, newSplits[i].percentage + adjustment);
            remaining -= (newVal - newSplits[i].percentage);
            newSplits[i] = { ...newSplits[i], percentage: newVal };
          }
        });
      }

      return newSplits;
    });
  };

  const handleEvenSplit = () => {
    const count = splits.length;
    if (count === 0) return;
    const evenPct = Math.floor(100 / count);
    const remainder = 100 - (evenPct * count);
    setSplits(prev => prev.map((s, i) => ({
      ...s,
      percentage: evenPct + (i === 0 ? remainder : 0)
    })));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Split Commission</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{assignment.entityName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {splits.map((split, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={split.repId}
                  onChange={(e) => handleUpdateRep(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                >
                  <option value="">Select rep...</option>
                  {outsideReps.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={split.percentage}
                    onChange={(e) => handleUpdatePercentage(index, e.target.value.replace(/[^0-9]/g, ''))}
                    onFocus={(e) => e.target.select()}
                    className="w-14 px-2 py-2 border border-[var(--border)] rounded-lg text-sm text-center bg-[var(--background)] [appearance:textfield]"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">%</span>
                </div>
                {splits.length > 1 && (
                  <button
                    onClick={() => handleRemoveSplit(index)}
                    className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSplit}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                + Add rep
              </button>
              <span className="text-[var(--muted-foreground)]">|</span>
              <button
                onClick={handleEvenSplit}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Split evenly
              </button>
            </div>
            <div className={`text-sm font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {totalPercentage}%
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(splits)}
            disabled={!isValid}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
          >
            Save Split
          </button>
        </div>
      </div>
    </div>
  );
}

// Bulk Rep Split Modal
function BulkRepSplitModal({
  selectedCount,
  outsideReps,
  onClose,
  onSave,
}: {
  selectedCount: number;
  outsideReps: { id: string; name: string }[];
  onClose: () => void;
  onSave: (reps: RepSplit[]) => void;
}) {
  const [splits, setSplits] = useState<RepSplit[]>([{ repId: '', repName: '', percentage: 100 }]);

  const totalPercentage = splits.reduce((sum, s) => sum + s.percentage, 0);
  const isValid = totalPercentage === 100 && splits.every(s => s.repId && s.percentage > 0);

  const handleAddSplit = () => {
    const newSplits = [...splits, { repId: '', repName: '', percentage: 0 }];
    const count = newSplits.length;
    const evenPct = Math.floor(100 / count);
    const remainder = 100 - (evenPct * count);
    setSplits(newSplits.map((s, i) => ({
      ...s,
      percentage: evenPct + (i === 0 ? remainder : 0)
    })));
  };

  const handleRemoveSplit = (index: number) => {
    const newSplits = splits.filter((_, i) => i !== index);
    if (newSplits.length === 1) {
      setSplits([{ ...newSplits[0], percentage: 100 }]);
    } else {
      const count = newSplits.length;
      const evenPct = Math.floor(100 / count);
      const remainder = 100 - (evenPct * count);
      setSplits(newSplits.map((s, i) => ({
        ...s,
        percentage: evenPct + (i === 0 ? remainder : 0)
      })));
    }
  };

  const handleUpdateRep = (index: number, repId: string) => {
    const rep = outsideReps.find(r => r.id === repId);
    setSplits(prev => prev.map((s, i) =>
      i === index ? { ...s, repId, repName: rep?.name || '' } : s
    ));
  };

  const handleUpdatePercentage = (index: number, value: string) => {
    const newPct = parseInt(value) || 0;
    const clampedPct = Math.min(100, Math.max(0, newPct));

    setSplits(prev => {
      const newSplits = [...prev];
      const oldPct = newSplits[index].percentage;
      const diff = clampedPct - oldPct;

      newSplits[index] = { ...newSplits[index], percentage: clampedPct };

      const otherIndices = newSplits.map((_, i) => i).filter(i => i !== index);
      if (otherIndices.length > 0 && diff !== 0) {
        const totalOther = otherIndices.reduce((sum, i) => sum + newSplits[i].percentage, 0);
        let remaining = -diff;

        otherIndices.forEach((i, idx) => {
          if (idx === otherIndices.length - 1) {
            newSplits[i] = { ...newSplits[i], percentage: Math.max(0, newSplits[i].percentage + remaining) };
          } else if (totalOther > 0) {
            const proportion = newSplits[i].percentage / totalOther;
            const adjustment = Math.round(-diff * proportion);
            const newVal = Math.max(0, newSplits[i].percentage + adjustment);
            remaining -= (newVal - newSplits[i].percentage);
            newSplits[i] = { ...newSplits[i], percentage: newVal };
          }
        });
      }

      return newSplits;
    });
  };

  const handleEvenSplit = () => {
    const count = splits.length;
    if (count === 0) return;
    const evenPct = Math.floor(100 / count);
    const remainder = 100 - (evenPct * count);
    setSplits(prev => prev.map((s, i) => ({
      ...s,
      percentage: evenPct + (i === 0 ? remainder : 0)
    })));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Bulk Split Commission</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Apply to {selectedCount} selected item{selectedCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {splits.map((split, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={split.repId}
                  onChange={(e) => handleUpdateRep(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
                >
                  <option value="">Select rep...</option>
                  {outsideReps.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={split.percentage}
                    onChange={(e) => handleUpdatePercentage(index, e.target.value.replace(/[^0-9]/g, ''))}
                    onFocus={(e) => e.target.select()}
                    className="w-14 px-2 py-2 border border-[var(--border)] rounded-lg text-sm text-center bg-[var(--background)] [appearance:textfield]"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">%</span>
                </div>
                {splits.length > 1 && (
                  <button
                    onClick={() => handleRemoveSplit(index)}
                    className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSplit}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                + Add rep
              </button>
              <span className="text-[var(--muted-foreground)]">|</span>
              <button
                onClick={handleEvenSplit}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Split evenly
              </button>
            </div>
            <div className={`text-sm font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {totalPercentage}%
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(splits)}
            disabled={!isValid}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
          >
            Apply Split
          </button>
        </div>
      </div>
    </div>
  );
}

// Rep Assignment Upload Modal
function RepAssignmentUploadModal({
  entityLabel,
  onClose,
  onUpload,
}: {
  entityLabel: string;
  onClose: () => void;
  onUpload: (data: { manufacturer: string; manufacturerId?: string; customer: string; customerId?: string; salesRep: string }[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<{ entity: string; salesRep: string }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    // Simulate processing - in real implementation, this would parse the file
    setTimeout(() => {
      // Mock preview data
      setPreviewData([
        { entity: 'ANDALUISA UTILITIES', salesRep: 'John Smith' },
        { entity: 'Metro Electric', salesRep: 'Sarah Johnson' },
        { entity: 'City Power Co', salesRep: 'Mike Davis' },
      ]);
      setIsProcessing(false);
    }, 1500);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = () => {
    const data = previewData.map(row => ({
      manufacturer: '',
      customer: row.entity,
      salesRep: row.salesRep,
    }));
    onUpload(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Upload Rep Assignments</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Import {entityLabel.toLowerCase()} rep assignments from a spreadsheet</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!file ? (
            <>
              {/* Required Format Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Required Spreadsheet Format</h4>
                <p className="text-sm text-blue-700 mb-3">Your spreadsheet must have these two columns:</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{entityLabel}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Outside Rep</span>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <svg className="mx-auto mb-4 text-[var(--muted-foreground)]" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="text-[var(--foreground)] font-medium mb-1">Drop your spreadsheet here</p>
                <p className="text-sm text-[var(--muted-foreground)]">or click to browse</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">Supports CSV, XLSX, XLS</p>
              </div>
            </>
          ) : isProcessing ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--foreground)] font-medium">Processing {file.name}...</p>
              <p className="text-sm text-[var(--muted-foreground)]">Analyzing your spreadsheet</p>
            </div>
          ) : (
            <>
              {/* File Info */}
              <div className="flex items-center gap-3 p-3 bg-[var(--muted)]/30 rounded-lg mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">{file.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{previewData.length} rows found</p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                  }}
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Change file
                </button>
              </div>

              {/* Warning about replacement */}
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  This will replace all current {entityLabel.toLowerCase()} assignments. Historical data will not be affected.
                </p>
              </div>

              {/* Preview Table */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 gap-4 px-4 py-2 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase">{entityLabel}</div>
                  <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Outside Rep</div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {previewData.map((row, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 px-4 py-2 border-b border-[var(--border)] last:border-b-0">
                      <div className="text-sm text-[var(--foreground)]">{row.entity}</div>
                      <div className="text-sm text-[var(--foreground)]">{row.salesRep}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isProcessing || previewData.length === 0}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
          >
            Import {previewData.length > 0 ? `${previewData.length} assignments` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// FlowScan Upload Modal
function FlowScanUploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (data: { manufacturer: string; manufacturerId?: string; customer: string; customerId?: string; salesRep: string }[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<{ manufacturer: string; customer: string; salesRep: string }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    // Simulate processing - in real implementation, this would parse the file
    setTimeout(() => {
      // Mock preview data
      setPreviewData([
        { manufacturer: 'Acme Manufacturing', customer: 'Metro Electric', salesRep: 'John Smith' },
        { manufacturer: 'Global Industries', customer: 'City Power Co', salesRep: 'Sarah Johnson' },
      ]);
      setIsProcessing(false);
    }, 1500);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">FlowScan Upload</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Import sales rep assignments from a spreadsheet</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!file ? (
            <>
              {/* Required Format Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Required Spreadsheet Format</h4>
                <p className="text-sm text-blue-700 mb-3">Your spreadsheet must have exactly these three columns:</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Manufacturer</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Customer</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Sales Rep</span>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <svg className="mx-auto mb-4 text-[var(--muted-foreground)]" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="text-[var(--foreground)] font-medium mb-1">Drop your spreadsheet here</p>
                <p className="text-sm text-[var(--muted-foreground)]">or click to browse</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">Supports CSV, XLSX, XLS</p>
              </div>
            </>
          ) : isProcessing ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--foreground)] font-medium">Processing {file.name}...</p>
              <p className="text-sm text-[var(--muted-foreground)]">FlowScan is analyzing your spreadsheet</p>
            </div>
          ) : (
            <>
              {/* File Info */}
              <div className="flex items-center gap-3 p-3 bg-[var(--muted)]/30 rounded-lg mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">{file.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{previewData.length} rows found</p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                  }}
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Change file
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Manufacturer</div>
                  <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</div>
                  <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Sales Rep</div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {previewData.map((row, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-[var(--border)] last:border-b-0">
                      <div className="text-sm text-[var(--foreground)]">{row.manufacturer}</div>
                      <div className="text-sm text-[var(--foreground)]">{row.customer}</div>
                      <div className="text-sm text-[var(--foreground)]">{row.salesRep}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpload(previewData)}
            disabled={!file || isProcessing || previewData.length === 0}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
          >
            Import {previewData.length > 0 ? `${previewData.length} rows` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// Searchable Dropdown Component
function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
  clearOnSelect = false,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearOnSelect?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);
  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] hover:border-[var(--primary)]/50 transition-colors ${
          !selectedOption && !clearOnSelect ? 'text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'
        }`}
      >
        {clearOnSelect ? placeholder : (selectedOption?.label || placeholder)}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[var(--border)]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors ${
                    option.id === value ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--foreground)]'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================
// Admin Modals
// ============================================

// Add User Modal
function AddUserModal({ onClose, onSave }: { onClose: () => void; onSave: (member: TeamMember) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'outside_rep' as TeamMember['role'],
  });

  const roleOptions = [
    { value: 'outside_rep', label: 'Outside Rep' },
    { value: 'inside_rep', label: 'Inside Rep' },
    { value: 'administrator', label: 'Administrator' },
    { value: 'owner', label: 'Owner' },
    { value: 'warehouse_manager', label: 'Warehouse Manager' },
    { value: 'warehouse_employee', label: 'Warehouse Employee' },
    { value: 'driver', label: 'Driver' },
  ];

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    const roleLabel = roleOptions.find(r => r.value === formData.role)?.label || formData.role;

    onSave({
      id: `user-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      roleDisplay: roleLabel,
      status: 'active',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Add New User</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamMember['role'] })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || !formData.email.trim()}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Add User
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit User Modal
function EditUserModal({ member, onClose, onSave }: { member: TeamMember; onClose: () => void; onSave: (member: TeamMember) => void }) {
  const [formData, setFormData] = useState({
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
  });

  const roleOptions = [
    { value: 'outside_rep', label: 'Outside Rep' },
    { value: 'inside_rep', label: 'Inside Rep' },
    { value: 'administrator', label: 'Administrator' },
    { value: 'owner', label: 'Owner' },
    { value: 'warehouse_manager', label: 'Warehouse Manager' },
    { value: 'warehouse_employee', label: 'Warehouse Employee' },
    { value: 'driver', label: 'Driver' },
  ];

  const handleSubmit = () => {
    const roleLabel = roleOptions.find(r => r.value === formData.role)?.label || formData.role;

    onSave({
      ...member,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      roleDisplay: roleLabel,
      status: formData.status,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit User</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamMember['role'] })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
            Save Changes
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

