'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
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
  mockRepTerritories,
  usStates,
  stateCounties,
  territoryColors,
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
  type RepTerritory,
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

type TabType = 'takeoffs' | 'credit-for-sale' | 'sidebar' | 'default-views' | 'manufacturer-integrations' | 'general' | 'team' | 'permissions' | 'flowbot' | 'categories' | 'sales-reps' | 'product-categories';

const allTabIds: TabType[] = ['takeoffs', 'credit-for-sale', 'sidebar', 'default-views', 'manufacturer-integrations', 'general', 'team', 'permissions', 'flowbot', 'categories', 'sales-reps', 'product-categories'];

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
      label: 'Products',
      tabs: [
        { id: 'product-categories' as TabType, label: 'Product Categories' },
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
      {activeTab === 'product-categories' && <ProductCategoriesTab />}
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

// Product Categories Tab
function ProductCategoriesTab() {
  // Mock data for manufacturers
  const [manufacturers] = useState([
    { id: 'all', name: 'All Manufacturers (Tenant-Wide)' },
    { id: 'signify', name: 'Signify' },
    { id: 'rab', name: 'RAB Lighting' },
    { id: 'acuity', name: 'Acuity Brands' },
    { id: 'lutron', name: 'Lutron' },
  ]);

  const [selectedManufacturer, setSelectedManufacturer] = useState('all');

  // Categories per manufacturer (mock data)
  const [categoriesByManufacturer, setCategoriesByManufacturer] = useState<Record<string, string[]>>({
    all: ['Indoor Lighting', 'Outdoor Lighting', 'Controls', 'Emergency', 'Accessories', 'LED Retrofit'],
    signify: ['Philips Indoor', 'Philips Outdoor', 'Philips Controls'],
    rab: ['Area Lights', 'Flood Lights', 'Wall Packs', 'High Bays'],
    acuity: ['Lithonia', 'Juno', 'Holophane', 'Gotham'],
    lutron: ['Dimmers', 'Sensors', 'Shades', 'Keypads'],
  });

  const [newCategory, setNewCategory] = useState('');

  const currentCategories = categoriesByManufacturer[selectedManufacturer] || [];

  const handleAddCategory = () => {
    if (newCategory.trim() && !currentCategories.includes(newCategory.trim())) {
      setCategoriesByManufacturer(prev => ({
        ...prev,
        [selectedManufacturer]: [...(prev[selectedManufacturer] || []), newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategoriesByManufacturer(prev => ({
      ...prev,
      [selectedManufacturer]: (prev[selectedManufacturer] || []).filter(c => c !== category)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Product Categories</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Configure product categories tenant-wide or create manufacturer-specific categories
        </p>
      </div>

      {/* Manufacturer Selector */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-5">
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Select Scope
        </label>
        <select
          value={selectedManufacturer}
          onChange={(e) => setSelectedManufacturer(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        >
          {manufacturers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          {selectedManufacturer === 'all'
            ? 'These categories will apply to all products across all manufacturers.'
            : `These categories are specific to ${manufacturers.find(m => m.id === selectedManufacturer)?.name}.`
          }
        </p>
      </div>

      {/* Categories List */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">
              {selectedManufacturer === 'all' ? 'Tenant-Wide Categories' : `${manufacturers.find(m => m.id === selectedManufacturer)?.name} Categories`}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {selectedManufacturer === 'all'
                ? 'Categories available for all products'
                : 'Manufacturer-specific product categories'
              }
            </p>
          </div>
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
            {currentCategories.length} categories
          </span>
        </div>

        {/* Current Categories */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
          {currentCategories.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] italic">No categories defined yet</p>
          ) : (
            currentCategories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--muted)] rounded-full text-sm"
              >
                {category}
                <button
                  onClick={() => handleRemoveCategory(category)}
                  className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add New Category */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add new category..."
            className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategory.trim()}
            className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How categories work</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Tenant-wide categories apply to all products by default</li>
              <li>Manufacturer-specific categories override tenant-wide settings for that manufacturer</li>
              <li>Products can be assigned to one or more categories</li>
            </ul>
          </div>
        </div>
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
        <GeographyTab outsideReps={outsideReps} />
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

// Geography Tab Component - Rep-centric Territory Management with County Selection
function GeographyTab({ outsideReps }: { outsideReps: { id: string; name: string }[] }) {
  const [repTerritories, setRepTerritories] = useState<RepTerritory[]>(mockRepTerritories);
  const [editingRepId, setEditingRepId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Get territory for a rep
  const getRepTerritory = (repId: string): RepTerritory | undefined => {
    return repTerritories.find(t => t.repId === repId);
  };

  // Check if rep has territory configured
  const hasTerritory = (repId: string): boolean => {
    const territory = getRepTerritory(repId);
    return !!territory && Object.keys(territory.counties).length > 0;
  };

  // Get territory summary for display
  const getTerritoryStatus = (repId: string): { configured: boolean; summary: string } => {
    const territory = getRepTerritory(repId);
    if (!territory || Object.keys(territory.counties).length === 0) {
      return { configured: false, summary: 'Not configured' };
    }

    const stateCount = Object.keys(territory.counties).length;
    let totalCounties = 0;
    let wholeStates = 0;

    Object.entries(territory.counties).forEach(([stateCode, counties]) => {
      if (counties.length === 0) {
        wholeStates++;
      } else {
        totalCounties += counties.length;
      }
    });

    const parts: string[] = [];
    if (wholeStates > 0) {
      parts.push(`${wholeStates} full state${wholeStates !== 1 ? 's' : ''}`);
    }
    if (totalCounties > 0) {
      parts.push(`${totalCounties} count${totalCounties !== 1 ? 'ies' : 'y'}`);
    }
    return { configured: true, summary: parts.join(', ') };
  };

  const handleEditTerritory = (repId: string) => {
    setEditingRepId(repId);
  };

  const handleSaveTerritory = (territory: RepTerritory) => {
    setRepTerritories(prev => {
      const existing = prev.find(t => t.repId === territory.repId);
      if (existing) {
        return prev.map(t => t.repId === territory.repId ? territory : t);
      }
      return [...prev, territory];
    });
    setEditingRepId(null);
  };

  const handleClearTerritory = (repId: string) => {
    if (confirm('Are you sure you want to clear this rep\'s territory?')) {
      setRepTerritories(prev => prev.filter(t => t.repId !== repId));
    }
  };

  // Filter reps by search term
  const filteredReps = outsideReps.filter(rep =>
    rep.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const editingRep = editingRepId ? outsideReps.find(r => r.id === editingRepId) : null;
  const editingTerritory = editingRepId ? getRepTerritory(editingRepId) : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-[var(--muted-foreground)]">
              Configure geographic territories for each sales rep. Select a state to view its county map, then click or drag to select counties.
            </p>
            <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/50 p-3 rounded-lg border border-[var(--border)]">
              <span className="font-medium text-[var(--foreground)]">Note:</span> Rep assignments will be based on the customer&apos;s billing address when matching against territories.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors whitespace-nowrap"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            Upload CSV
          </button>
        </div>
      </div>

      {/* Search */}
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
          placeholder="Search reps..."
          className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
      </div>

      {/* Rep List */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="text-sm font-medium text-[var(--foreground)]">Rep</div>
          <div className="text-sm font-medium text-[var(--foreground)]">Territory Status</div>
          <div className="w-20"></div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[var(--border)]">
          {filteredReps.map((rep) => {
            const status = getTerritoryStatus(rep.id);
            return (
              <div key={rep.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-3 items-center hover:bg-[var(--muted)]/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-[var(--primary)]">
                      {rep.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{rep.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                    status.configured
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {status.configured ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4M12 16h.01"/>
                      </svg>
                    )}
                    {status.summary}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditTerritory(rep.id)}
                    className="px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
                  >
                    {status.configured ? 'Edit' : 'Configure'}
                  </button>
                  {status.configured && (
                    <button
                      onClick={() => handleClearTerritory(rep.id)}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Clear territory"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>{filteredReps.length} rep{filteredReps.length !== 1 ? 's' : ''}</span>
        <span>{repTerritories.filter(t => Object.keys(t.counties).length > 0).length} with territories configured</span>
      </div>

      {/* Rep Territory Modal */}
      {editingRepId && editingRep && (
        <RepTerritoryModal
          repId={editingRepId}
          repName={editingRep.name}
          territory={editingTerritory}
          allTerritories={repTerritories}
          allReps={outsideReps}
          onClose={() => setEditingRepId(null)}
          onSave={handleSaveTerritory}
        />
      )}

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <ZipCodeUploadModal
          outsideReps={outsideReps}
          onClose={() => setShowUploadModal(false)}
          onImport={(imports) => {
            // Process the imports and update territories
            setRepTerritories(prev => {
              const newTerritories = [...prev];
              imports.forEach(({ repId, stateCode, countyName }) => {
                let territory = newTerritories.find(t => t.repId === repId);
                if (!territory) {
                  territory = { repId, counties: {} };
                  newTerritories.push(territory);
                }
                if (!territory.counties[stateCode]) {
                  territory.counties[stateCode] = [];
                }
                // Only add if not already "all counties" and not already in list
                if (territory.counties[stateCode].length > 0 || territory.counties[stateCode] === undefined) {
                  if (!territory.counties[stateCode].includes(countyName)) {
                    territory.counties[stateCode].push(countyName);
                  }
                }
              });
              return newTerritories;
            });
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}

// Zip Code Upload Modal - Bulk import territories from CSV
function ZipCodeUploadModal({
  outsideReps,
  onClose,
  onImport,
}: {
  outsideReps: { id: string; name: string }[];
  onClose: () => void;
  onImport: (imports: { repId: string; stateCode: string; countyName: string }[]) => void;
}) {
  const [csvContent, setCsvContent] = useState('');
  const [parseResults, setParseResults] = useState<{
    valid: { repName: string; repId: string; zipCode: string; stateCode: string; countyName: string }[];
    errors: { line: number; error: string; content: string }[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Simple zip code to state/county mapping (in real app, would use a proper API or database)
  // This is a simplified demo mapping
  const zipToLocation: { [zip: string]: { state: string; county: string } } = {
    // NC zip codes
    '28201': { state: 'NC', county: 'Mecklenburg' },
    '28202': { state: 'NC', county: 'Mecklenburg' },
    '28203': { state: 'NC', county: 'Mecklenburg' },
    '27601': { state: 'NC', county: 'Wake' },
    '27602': { state: 'NC', county: 'Wake' },
    '27701': { state: 'NC', county: 'Durham' },
    // TX zip codes
    '77001': { state: 'TX', county: 'Harris' },
    '77002': { state: 'TX', county: 'Harris' },
    '75201': { state: 'TX', county: 'Dallas' },
    '75202': { state: 'TX', county: 'Dallas' },
    '78701': { state: 'TX', county: 'Travis' },
    // NY zip codes
    '10001': { state: 'NY', county: 'New York' },
    '10002': { state: 'NY', county: 'New York' },
    '11201': { state: 'NY', county: 'Kings' },
    '11101': { state: 'NY', county: 'Queens' },
    // GA zip codes
    '30301': { state: 'GA', county: 'Fulton' },
    '30302': { state: 'GA', county: 'Fulton' },
    '30033': { state: 'GA', county: 'DeKalb' },
    // FL zip codes
    '33101': { state: 'FL', county: 'Miami-Dade' },
    '33301': { state: 'FL', county: 'Broward' },
    // CA zip codes
    '90001': { state: 'CA', county: 'Los Angeles' },
    '90210': { state: 'CA', county: 'Los Angeles' },
    '92101': { state: 'CA', county: 'San Diego' },
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      parseCSV(content);
    };
    reader.readAsText(file);
  };

  const parseCSV = (content: string) => {
    setIsProcessing(true);
    const lines = content.trim().split('\n');
    const valid: { repName: string; repId: string; zipCode: string; stateCode: string; countyName: string }[] = [];
    const errors: { line: number; error: string; content: string }[] = [];

    // Skip header if present
    const startIdx = lines[0]?.toLowerCase().includes('zip') || lines[0]?.toLowerCase().includes('rep') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));

      if (parts.length < 2) {
        errors.push({ line: i + 1, error: 'Invalid format - expected zip_code,rep_name', content: line });
        continue;
      }

      const [zipCode, repName] = parts;

      // Validate zip code format
      if (!/^\d{5}$/.test(zipCode)) {
        errors.push({ line: i + 1, error: 'Invalid zip code format (must be 5 digits)', content: line });
        continue;
      }

      // Find rep by name (case-insensitive partial match)
      const rep = outsideReps.find(r =>
        r.name.toLowerCase().includes(repName.toLowerCase()) ||
        repName.toLowerCase().includes(r.name.toLowerCase())
      );

      if (!rep) {
        errors.push({ line: i + 1, error: `Rep not found: "${repName}"`, content: line });
        continue;
      }

      // Look up zip code location
      const location = zipToLocation[zipCode];
      if (!location) {
        errors.push({ line: i + 1, error: `Zip code not in database: ${zipCode}`, content: line });
        continue;
      }

      valid.push({
        repName: rep.name,
        repId: rep.id,
        zipCode,
        stateCode: location.state,
        countyName: location.county,
      });
    }

    setParseResults({ valid, errors });
    setIsProcessing(false);
  };

  const handleImport = () => {
    if (!parseResults?.valid.length) return;

    // Group by rep and deduplicate
    const imports = parseResults.valid.map(v => ({
      repId: v.repId,
      stateCode: v.stateCode,
      countyName: v.countyName,
    }));

    onImport(imports);
  };

  const downloadTemplate = () => {
    const template = 'zip_code,rep_name\n28201,John Smith\n77001,Sarah Johnson\n10001,Outside Rep';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'territory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Import Territory Assignments
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Upload a CSV file with zip codes and sales rep names
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-700 mb-2">
              Your CSV should have two columns: <code className="bg-blue-100 px-1 rounded">zip_code</code> and <code className="bg-blue-100 px-1 rounded">rep_name</code>
            </p>
            <button
              onClick={downloadTemplate}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Download template CSV
            </button>
          </div>

          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--primary)] transition-colors"
            >
              <svg className="mx-auto mb-3 text-[var(--muted-foreground)]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <p className="text-sm text-[var(--foreground)] mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                CSV files only
              </p>
            </div>
          </div>

          {/* Or paste CSV */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Or paste CSV content directly
            </label>
            <textarea
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                if (e.target.value.trim()) {
                  parseCSV(e.target.value);
                } else {
                  setParseResults(null);
                }
              }}
              placeholder="zip_code,rep_name&#10;28201,John Smith&#10;77001,Sarah Johnson"
              rows={4}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 font-mono"
            />
          </div>

          {/* Parse Results */}
          {parseResults && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  {parseResults.valid.length} valid row{parseResults.valid.length !== 1 ? 's' : ''}
                </div>
                {parseResults.errors.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v4M12 16h.01"/>
                    </svg>
                    {parseResults.errors.length} error{parseResults.errors.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Valid entries preview */}
              {parseResults.valid.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                    Preview ({Math.min(5, parseResults.valid.length)} of {parseResults.valid.length})
                  </h4>
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--muted)]/30">
                        <tr>
                          <th className="px-3 py-2 text-left text-[var(--foreground)]">Zip Code</th>
                          <th className="px-3 py-2 text-left text-[var(--foreground)]">Rep</th>
                          <th className="px-3 py-2 text-left text-[var(--foreground)]">State</th>
                          <th className="px-3 py-2 text-left text-[var(--foreground)]">County</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {parseResults.valid.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-[var(--muted-foreground)] font-mono">{row.zipCode}</td>
                            <td className="px-3 py-2 text-[var(--foreground)]">{row.repName}</td>
                            <td className="px-3 py-2 text-[var(--muted-foreground)]">{row.stateCode}</td>
                            <td className="px-3 py-2 text-[var(--muted-foreground)]">{row.countyName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {parseResults.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-2">Errors</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {parseResults.errors.map((err, idx) => (
                      <div key={idx} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <span className="font-medium text-red-700">Line {err.line}:</span>{' '}
                        <span className="text-red-600">{err.error}</span>
                        <div className="text-red-500 font-mono mt-1">{err.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-[var(--muted-foreground)]">
            Zip codes will be mapped to counties for territory assignment
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!parseResults?.valid.length}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
            >
              Import {parseResults?.valid.length || 0} Assignment{parseResults?.valid.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rep Territory Modal - Configure territory with county selection
function RepTerritoryModal({
  repId,
  repName,
  territory,
  allTerritories,
  allReps,
  onClose,
  onSave,
}: {
  repId: string;
  repName: string;
  territory: RepTerritory | undefined;
  allTerritories: RepTerritory[];
  allReps: { id: string; name: string }[];
  onClose: () => void;
  onSave: (territory: RepTerritory) => void;
}) {
  // counties: { stateCode: ['County1', ...] } - empty array means ALL counties
  const [counties, setCounties] = useState<{ [stateCode: string]: string[] }>(territory?.counties || {});
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [conflictingCounties, setConflictingCounties] = useState<{ county: string; state: string; repName: string }[]>([]);

  const configuredStates = Object.keys(counties);
  const isValid = configuredStates.length > 0;

  // Build a map of counties already taken by other reps
  const otherRepCounties = useMemo(() => {
    const map: { [key: string]: { repId: string; repName: string } } = {};
    allTerritories.forEach(t => {
      if (t.repId === repId) return; // Skip current rep
      const rep = allReps.find(r => r.id === t.repId);
      const repNameStr = rep?.name || 'Unknown Rep';
      Object.entries(t.counties).forEach(([stateCode, countyList]) => {
        if (countyList.length === 0) {
          // Whole state - mark all counties
          const stateCountyList = stateCounties[stateCode] || [];
          stateCountyList.forEach(c => {
            const key = `${stateCode}:${c.name}`;
            map[key] = { repId: t.repId, repName: repNameStr };
          });
        } else {
          // Specific counties
          countyList.forEach(countyName => {
            const key = `${stateCode}:${countyName}`;
            map[key] = { repId: t.repId, repName: repNameStr };
          });
        }
      });
    });
    return map;
  }, [allTerritories, allReps, repId]);

  // Check if a county is taken by another rep
  const getCountyOwner = (stateCode: string, countyName: string): { repId: string; repName: string } | null => {
    const key = `${stateCode}:${countyName}`;
    return otherRepCounties[key] || null;
  };

  // Get total count of selected items
  const getTotalCount = () => {
    let wholeStates = 0;
    let totalCounties = 0;
    Object.entries(counties).forEach(([, countyList]) => {
      if (countyList.length === 0) {
        wholeStates++;
      } else {
        totalCounties += countyList.length;
      }
    });
    return { wholeStates, totalCounties };
  };

  // Add entire state (all counties)
  const handleAddWholeState = (stateCode: string) => {
    setCounties(prev => ({
      ...prev,
      [stateCode]: [], // Empty array means all counties
    }));
  };

  // Remove a state entirely
  const handleRemoveState = (stateCode: string) => {
    setCounties(prev => {
      const newCounties = { ...prev };
      delete newCounties[stateCode];
      return newCounties;
    });
    if (selectedState === stateCode) {
      setSelectedState(null);
    }
  };

  // Toggle a county within a state
  const handleToggleCounty = (stateCode: string, countyName: string) => {
    setCounties(prev => {
      const current = prev[stateCode] || [];
      // If currently "all counties" (empty array), switch to specific selection
      if (current.length === 0 && prev[stateCode] !== undefined) {
        // Select all counties except this one
        const allCounties = stateCounties[stateCode]?.map(c => c.name) || [];
        return {
          ...prev,
          [stateCode]: allCounties.filter(c => c !== countyName),
        };
      }
      // Toggle county in the list
      if (current.includes(countyName)) {
        const newList = current.filter(c => c !== countyName);
        // If no counties left, remove the state entirely
        if (newList.length === 0) {
          const newCounties = { ...prev };
          delete newCounties[stateCode];
          return newCounties;
        }
        return { ...prev, [stateCode]: newList };
      }
      return { ...prev, [stateCode]: [...current, countyName] };
    });
  };

  // Select all counties in a state
  const handleSelectAllCounties = (stateCode: string) => {
    setCounties(prev => ({
      ...prev,
      [stateCode]: [], // Empty array means all counties
    }));
  };

  // Clear all counties in a state (but keep in selection mode)
  const handleClearStateCounties = (stateCode: string) => {
    setCounties(prev => {
      const newCounties = { ...prev };
      delete newCounties[stateCode];
      return newCounties;
    });
  };

  // Find all conflicts with current selection
  const findConflicts = (): { county: string; state: string; repName: string }[] => {
    const conflicts: { county: string; state: string; repName: string }[] = [];
    Object.entries(counties).forEach(([stateCode, countyList]) => {
      if (countyList.length === 0) {
        // Whole state selected - check all counties in state
        const stateCountyList = stateCounties[stateCode] || [];
        stateCountyList.forEach(c => {
          const owner = getCountyOwner(stateCode, c.name);
          if (owner) {
            conflicts.push({ county: c.name, state: stateCode, repName: owner.repName });
          }
        });
      } else {
        // Specific counties
        countyList.forEach(countyName => {
          const owner = getCountyOwner(stateCode, countyName);
          if (owner) {
            conflicts.push({ county: countyName, state: stateCode, repName: owner.repName });
          }
        });
      }
    });
    return conflicts;
  };

  const handleSave = () => {
    if (!isValid) return;

    // Check for conflicts
    const conflicts = findConflicts();
    if (conflicts.length > 0) {
      setConflictingCounties(conflicts);
      setShowOverwriteModal(true);
      return;
    }

    onSave({ repId, counties });
  };

  const handleConfirmOverwrite = () => {
    setShowOverwriteModal(false);
    onSave({ repId, counties });
  };

  const { wholeStates, totalCounties } = getTotalCount();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Configure Territory for {repName}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {selectedState
                ? `Selecting counties in ${usStates.find(s => s.code === selectedState)?.name || selectedState}`
                : 'Select a state to configure counties, or add entire states'
              }
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left sidebar - State list */}
          <div className="w-64 border-r border-[var(--border)] flex flex-col">
            <div className="p-3 border-b border-[var(--border)]">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedState(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]"
              >
                <option value="">Add a state...</option>
                {usStates.filter(s => !configuredStates.includes(s.code)).map(s => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="text-xs font-medium text-[var(--muted-foreground)] px-2 py-1">
                Configured States ({configuredStates.length})
              </div>
              {configuredStates.length === 0 ? (
                <div className="px-2 py-4 text-sm text-[var(--muted-foreground)] text-center">
                  No states configured yet
                </div>
              ) : (
                <div className="space-y-1">
                  {configuredStates.map((stateCode) => {
                    const state = usStates.find(s => s.code === stateCode);
                    const countyList = counties[stateCode];
                    const isWholeState = countyList.length === 0;
                    const isActive = selectedState === stateCode;
                    return (
                      <div
                        key={stateCode}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
                            : 'hover:bg-[var(--muted)]'
                        }`}
                        onClick={() => setSelectedState(stateCode)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--foreground)] truncate">
                            {state?.name || stateCode}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {isWholeState ? 'All counties' : `${countyList.length} counties`}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveState(stateCode);
                          }}
                          className="p-1 hover:bg-red-100 rounded text-[var(--muted-foreground)] hover:text-red-500"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l12 12M18 6l-12 12"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Main content - County map */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedState ? (
              <>
                {/* State header */}
                <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedState(null)}
                      className="p-1 hover:bg-[var(--muted)] rounded"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                    <span className="font-medium text-[var(--foreground)]">
                      {usStates.find(s => s.code === selectedState)?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Select All Counties Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm text-[var(--foreground)]">Select all counties</span>
                      <button
                        onClick={() => {
                          const isCurrentlyAll = counties[selectedState]?.length === 0 && counties[selectedState] !== undefined;
                          if (isCurrentlyAll) {
                            handleClearStateCounties(selectedState);
                          } else {
                            handleSelectAllCounties(selectedState);
                          }
                        }}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          counties[selectedState]?.length === 0 && counties[selectedState] !== undefined
                            ? 'bg-[var(--primary)]'
                            : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            counties[selectedState]?.length === 0 && counties[selectedState] !== undefined
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                </div>

                {/* County Map with interactive selection */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-3 text-sm text-[var(--muted-foreground)]">
                    Click counties to select them, or drag to select multiple.
                    {counties[selectedState]?.length === 0 && (
                      <span className="ml-1 text-green-600 font-medium">All counties selected</span>
                    )}
                  </div>
                  <StateCountyMap
                    stateCode={selectedState}
                    selectedCounties={counties[selectedState] || []}
                    isWholeState={counties[selectedState]?.length === 0 && counties[selectedState] !== undefined}
                    onToggleCounty={(countyName) => handleToggleCounty(selectedState, countyName)}
                    onSelectMultiple={(countyNames) => {
                      setCounties(prev => {
                        const current = prev[selectedState] || [];
                        // If currently whole state, convert to specific
                        if (current.length === 0 && prev[selectedState] !== undefined) {
                          return prev;
                        }
                        const newSet = new Set([...current, ...countyNames]);
                        return { ...prev, [selectedState]: Array.from(newSet) };
                      });
                    }}
                    otherRepCounties={
                      // Filter otherRepCounties to only include counties in this state
                      Object.fromEntries(
                        Object.entries(otherRepCounties)
                          .filter(([key]) => key.startsWith(`${selectedState}:`))
                          .map(([key, value]) => [key.split(':')[1], value])
                      )
                    }
                  />
                </div>
              </>
            ) : (
              /* State selection - no map, just instructions */
              <div className="flex-1 overflow-y-auto p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)]/50 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                    {configuredStates.length === 0 ? 'No states configured yet' : 'Select a state to configure'}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm mx-auto">
                    Use the dropdown on the left to add a state, then configure which counties to include in this rep&apos;s territory.
                  </p>
                </div>

                {/* Configured territories summary */}
                {configuredStates.length > 0 && (
                  <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                    <div className="text-sm font-medium text-[var(--foreground)] mb-3">
                      Configured Territories ({configuredStates.length} state{configuredStates.length !== 1 ? 's' : ''})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {configuredStates.map((stateCode) => {
                        const state = usStates.find(s => s.code === stateCode);
                        const countyList = counties[stateCode];
                        return (
                          <span
                            key={stateCode}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg text-sm cursor-pointer hover:bg-[var(--primary)]/20"
                            onClick={() => setSelectedState(stateCode)}
                          >
                            {state?.name}: {countyList.length === 0 ? 'All counties' : `${countyList.length} count${countyList.length !== 1 ? 'ies' : 'y'}`}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveState(stateCode);
                              }}
                              className="ml-1 hover:opacity-70"
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-[var(--muted-foreground)]">
            {configuredStates.length === 0
              ? 'No territories configured'
              : `${wholeStates > 0 ? `${wholeStates} full state${wholeStates !== 1 ? 's' : ''}` : ''}${wholeStates > 0 && totalCounties > 0 ? ', ' : ''}${totalCounties > 0 ? `${totalCounties} count${totalCounties !== 1 ? 'ies' : 'y'}` : ''}`
            }
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[var(--primary-hover)] transition-colors"
            >
              Save Territory
            </button>
          </div>
        </div>
      </div>

      {/* Overwrite Confirmation Modal */}
      {showOverwriteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Overwrite Existing Territory?
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-[var(--foreground)] mb-4">
                The following counties are already assigned to other reps. Saving will reassign them to <strong>{repName}</strong>:
              </p>
              <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                {/* Group conflicts by rep */}
                {Object.entries(
                  conflictingCounties.reduce((acc, c) => {
                    if (!acc[c.repName]) acc[c.repName] = [];
                    acc[c.repName].push(c);
                    return acc;
                  }, {} as { [repName: string]: typeof conflictingCounties })
                ).map(([otherRepName, conflicts]) => (
                  <div key={otherRepName} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm font-medium text-red-800 mb-1">
                      Currently assigned to {otherRepName}:
                    </div>
                    <div className="text-xs text-red-700">
                      {conflicts.map(c => `${c.county}, ${c.state}`).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                This action will remove these counties from the other rep&apos;s territory.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => setShowOverwriteModal(false)}
                className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOverwrite}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Overwrite Territory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// FIPS code mappings for state abbreviation to state FIPS code
const stateFipsMap: Record<string, string> = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06',
  CO: '08', CT: '09', DE: '10', DC: '11', FL: '12',
  GA: '13', HI: '15', ID: '16', IL: '17', IN: '18',
  IA: '19', KS: '20', KY: '21', LA: '22', ME: '23',
  MD: '24', MA: '25', MI: '26', MN: '27', MS: '28',
  MO: '29', MT: '30', NE: '31', NV: '32', NH: '33',
  NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38',
  OH: '39', OK: '40', OR: '41', PA: '42', RI: '44',
  SC: '45', SD: '46', TN: '47', TX: '48', UT: '49',
  VT: '50', VA: '51', WA: '53', WV: '54', WI: '55',
  WY: '56', PR: '72',
};

// County TopoJSON URL
const countyGeoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';

// State County Map - Interactive SVG map of counties for a state
function StateCountyMap({
  stateCode,
  selectedCounties,
  isWholeState,
  onToggleCounty,
  onSelectMultiple,
  otherRepCounties = {},
}: {
  stateCode: string;
  selectedCounties: string[];  // County names (not FIPS)
  isWholeState: boolean;
  onToggleCounty: (countyName: string) => void;
  onSelectMultiple: (countyNames: string[]) => void;
  otherRepCounties?: { [countyName: string]: { repId: string; repName: string } };
}) {
  const [hoveredCounty, setHoveredCounty] = useState<{ fips: string; name: string; owner?: string } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Mode: 'select' for drag selection, 'pan' for map navigation
  const [mode, setMode] = useState<'select' | 'pan'>('select');

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [countyElements, setCountyElements] = useState<Map<string, { name: string; element: Element }>>(new Map());

  const stateFips = stateFipsMap[stateCode];

  // State center coordinates for initial zoom
  const stateCoordinates: Record<string, { center: [number, number]; zoom: number }> = {
    AL: { center: [-86.9, 32.8], zoom: 6 },
    AK: { center: [-154, 64], zoom: 2.5 },
    AZ: { center: [-111.9, 34.2], zoom: 5 },
    AR: { center: [-92.4, 34.9], zoom: 6 },
    CA: { center: [-119.4, 37.2], zoom: 4.5 },
    CO: { center: [-105.5, 39], zoom: 5.5 },
    CT: { center: [-72.7, 41.6], zoom: 10 },
    DE: { center: [-75.5, 39], zoom: 10 },
    FL: { center: [-81.5, 28.5], zoom: 5 },
    GA: { center: [-83.5, 32.7], zoom: 5.5 },
    HI: { center: [-155.5, 20], zoom: 5 },
    ID: { center: [-114.7, 44.1], zoom: 4.5 },
    IL: { center: [-89.4, 40], zoom: 5 },
    IN: { center: [-86.3, 39.8], zoom: 6 },
    IA: { center: [-93.5, 42], zoom: 5.5 },
    KS: { center: [-98.4, 38.5], zoom: 5.5 },
    KY: { center: [-85.8, 37.8], zoom: 6 },
    LA: { center: [-91.9, 31], zoom: 6 },
    ME: { center: [-69, 45.3], zoom: 5.5 },
    MD: { center: [-76.6, 39.05], zoom: 7.5 },
    MA: { center: [-71.8, 42.2], zoom: 8 },
    MI: { center: [-85.6, 44.3], zoom: 4.5 },
    MN: { center: [-94.6, 46.4], zoom: 4.5 },
    MS: { center: [-89.7, 32.7], zoom: 5.5 },
    MO: { center: [-92.6, 38.5], zoom: 5 },
    MT: { center: [-110, 47], zoom: 4.5 },
    NE: { center: [-99.9, 41.5], zoom: 5 },
    NV: { center: [-116.6, 39], zoom: 4.5 },
    NH: { center: [-71.6, 43.7], zoom: 7 },
    NJ: { center: [-74.4, 40.1], zoom: 8 },
    NM: { center: [-106.2, 34.5], zoom: 5 },
    NY: { center: [-75.5, 43], zoom: 5 },
    NC: { center: [-79.4, 35.5], zoom: 5.5 },
    ND: { center: [-100.5, 47.4], zoom: 5.5 },
    OH: { center: [-82.8, 40.2], zoom: 6 },
    OK: { center: [-97.5, 35.5], zoom: 5.5 },
    OR: { center: [-120.5, 44], zoom: 5 },
    PA: { center: [-77.2, 41], zoom: 6 },
    RI: { center: [-71.5, 41.7], zoom: 12 },
    SC: { center: [-81, 33.8], zoom: 6 },
    SD: { center: [-100, 44.4], zoom: 5.5 },
    TN: { center: [-86, 35.8], zoom: 5.5 },
    TX: { center: [-99.9, 31.5], zoom: 3.8 },
    UT: { center: [-111.5, 39.3], zoom: 5 },
    VT: { center: [-72.7, 44], zoom: 7 },
    VA: { center: [-79.4, 37.5], zoom: 5.5 },
    WA: { center: [-120.7, 47.4], zoom: 5 },
    WV: { center: [-80.5, 38.9], zoom: 6.5 },
    WI: { center: [-89.8, 44.5], zoom: 5 },
    WY: { center: [-107.5, 43], zoom: 5 },
    DC: { center: [-77, 38.9], zoom: 50 },
    PR: { center: [-66.5, 18.2], zoom: 8 },
  };

  const stateConfig = stateCoordinates[stateCode] || { center: [-98, 39], zoom: 4 };

  useEffect(() => {
    setCenter(stateConfig.center);
    setZoom(stateConfig.zoom);
  }, [stateCode]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode !== 'select') return;
    if (e.button !== 0) return;
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDragging(true);
    const pos = { x: e.clientX, y: e.clientY };
    setDragStart(pos);
    setDragEnd(pos);
  }, [mode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mode !== 'select' || !isDragging) return;
    setDragEnd({ x: e.clientX, y: e.clientY });
  }, [mode, isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    const selRect = {
      left: Math.min(dragStart.x, dragEnd.x),
      right: Math.max(dragStart.x, dragEnd.x),
      top: Math.min(dragStart.y, dragEnd.y),
      bottom: Math.max(dragStart.y, dragEnd.y),
    };

    const dragDistance = Math.sqrt(
      Math.pow(dragEnd.x - dragStart.x, 2) + Math.pow(dragEnd.y - dragStart.y, 2)
    );

    if (dragDistance > 10) {
      const selectedNames: string[] = [];
      countyElements.forEach((county) => {
        const rect = county.element.getBoundingClientRect();
        if (
          rect.left < selRect.right &&
          rect.right > selRect.left &&
          rect.top < selRect.bottom &&
          rect.bottom > selRect.top
        ) {
          selectedNames.push(county.name);
        }
      });

      if (selectedNames.length > 0) {
        onSelectMultiple(selectedNames);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, countyElements, onSelectMultiple]);

  const selectionRect = isDragging && dragStart && dragEnd ? {
    left: Math.min(dragStart.x, dragEnd.x),
    top: Math.min(dragStart.y, dragEnd.y),
    width: Math.abs(dragEnd.x - dragStart.x),
    height: Math.abs(dragEnd.y - dragStart.y),
  } : null;

  if (!stateFips) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        <p>County data not available for this state.</p>
        <p className="text-sm mt-2">The entire state will be included in the territory.</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="relative select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Mode toggle and zoom controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        {/* Mode toggle */}
        <div className="flex bg-white border border-[var(--border)] rounded shadow-sm overflow-hidden mb-1">
          <button
            onClick={() => setMode('select')}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              mode === 'select' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--muted)]'
            }`}
            title="Select mode - drag to select multiple counties"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 3l14 9-8 4-2 7-4-20z"/>
            </svg>
          </button>
          <button
            onClick={() => setMode('pan')}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              mode === 'pan' ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--muted)]'
            }`}
            title="Pan mode - drag to move the map"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
            </svg>
          </button>
        </div>
        <button
          onClick={() => setZoom(z => Math.min(z * 1.5, 20))}
          className="w-8 h-8 bg-white border border-[var(--border)] rounded shadow-sm flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
          title="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z / 1.5, 1))}
          className="w-8 h-8 bg-white border border-[var(--border)] rounded shadow-sm flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
          title="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button
          onClick={() => {
            setZoom(stateConfig.zoom);
            setCenter(stateConfig.center);
          }}
          className="w-8 h-8 bg-white border border-[var(--border)] rounded shadow-sm flex items-center justify-center hover:bg-[var(--muted)] transition-colors text-xs font-medium"
          title="Reset view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      </div>

      {/* Map */}
      <div
        className={`border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--muted)]/20 ${mode === 'select' ? 'cursor-crosshair' : 'cursor-grab'}`}
        style={{ height: '400px' }}
      >
        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({ coordinates, zoom: newZoom }) => {
              if (mode === 'pan') {
                setCenter(coordinates);
                setZoom(newZoom);
              }
            }}
            filterZoomEvent={(evt) => mode === 'pan'}
          >
            <Geographies geography={countyGeoUrl}>
              {({ geographies }) => {
                // Filter to only show counties for this state
                const stateCounties = geographies.filter(geo => {
                  const fips = String(geo.id).padStart(5, '0');
                  return fips.startsWith(stateFips);
                });

                return stateCounties.map((geo) => {
                  const fips = String(geo.id).padStart(5, '0');
                  const countyName = geo.properties.name || 'Unknown';
                  // Check if selected by county name (matching existing data structure)
                  const isSelected = isWholeState || selectedCounties.includes(countyName);
                  const isHovered = hoveredCounty?.fips === fips;
                  // Check if owned by another rep
                  const otherOwner = otherRepCounties[countyName];
                  const isOwnedByOther = !!otherOwner;

                  // Determine fill color: selected (blue), owned by other (red), or default (gray)
                  let fillColor = '#e5e7eb'; // default gray
                  let hoverFillColor = '#d1d5db';
                  if (isSelected) {
                    fillColor = 'var(--primary)';
                    hoverFillColor = 'var(--primary)';
                  } else if (isOwnedByOther) {
                    fillColor = '#fecaca'; // red-200
                    hoverFillColor = '#fca5a5'; // red-300
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke={isHovered ? (isOwnedByOther && !isSelected ? '#ef4444' : '#1f2937') : (isOwnedByOther && !isSelected ? '#f87171' : '#9ca3af')}
                      strokeWidth={isHovered ? 1.5 : (isOwnedByOther && !isSelected ? 1 : 0.5)}
                      style={{
                        default: {
                          outline: 'none',
                          opacity: isSelected ? 0.8 : (isOwnedByOther ? 0.9 : 0.6),
                          transition: 'all 150ms',
                          cursor: 'pointer',
                        },
                        hover: {
                          outline: 'none',
                          opacity: 1,
                          fill: hoverFillColor,
                        },
                        pressed: {
                          outline: 'none',
                        },
                      }}
                      onClick={() => onToggleCounty(countyName)}
                      onMouseEnter={(e) => {
                        setHoveredCounty({
                          fips,
                          name: countyName,
                          owner: otherOwner?.repName
                        });
                        const rect = (e.target as Element).getBoundingClientRect();
                        const containerRect = mapContainerRef.current?.getBoundingClientRect();
                        if (containerRect) {
                          setTooltipPos({
                            x: rect.left - containerRect.left + rect.width / 2,
                            y: rect.top - containerRect.top - 10,
                          });
                        }
                        // Store element reference for drag selection
                        setCountyElements(prev => {
                          const newMap = new Map(prev);
                          newMap.set(fips, { name: countyName, element: e.target as Element });
                          return newMap;
                        });
                      }}
                      onMouseLeave={() => setHoveredCounty(null)}
                    />
                  );
                });
              }}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip */}
      {hoveredCounty && (
        <div
          className={`absolute ${hoveredCounty.owner ? 'bg-red-50 border-red-200' : 'bg-[var(--card)] border-[var(--border)]'} border rounded-lg shadow-lg px-3 py-2 pointer-events-none z-20 text-sm`}
          style={{
            left: Math.max(10, Math.min(tooltipPos.x - 50, 250)),
            top: Math.max(10, tooltipPos.y - (hoveredCounty.owner ? 50 : 35)),
            transform: 'translateX(-50%)',
          }}
        >
          <div>
            <span className="font-medium">{hoveredCounty.name}</span>
            <span className="text-[var(--muted-foreground)] ml-1">County</span>
          </div>
          {hoveredCounty.owner && (
            <div className="text-xs text-red-600 mt-1">
              Assigned to: {hoveredCounty.owner}
            </div>
          )}
        </div>
      )}

      {/* Selection rectangle overlay */}
      {selectionRect && selectionRect.width > 5 && selectionRect.height > 5 && (
        <div
          className="fixed border-2 border-[var(--primary)] bg-[var(--primary)]/10 pointer-events-none z-50"
          style={{
            left: selectionRect.left,
            top: selectionRect.top,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--primary)', opacity: 0.8 }}></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-200"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-200 border border-red-300"></div>
          <span>Other rep</span>
        </div>
        <span className="ml-auto">
          {mode === 'select' ? 'Click county to select, drag to select multiple' : 'Drag to pan, use +/- to zoom'}
        </span>
      </div>
    </div>
  );
}

// County Map Grid - Visual grid of counties with drag-to-select
function CountyMapGrid({
  stateCode,
  selectedCounties,
  isWholeState,
  onToggleCounty,
  onSelectMultiple,
}: {
  stateCode: string;
  selectedCounties: string[];
  isWholeState: boolean;
  onToggleCounty: (county: string) => void;
  onSelectMultiple: (counties: string[]) => void;
}) {
  const counties = stateCounties[stateCode] || [];
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [countyRects, setCountyRects] = useState<Map<string, DOMRect>>(new Map());

  // Update county positions on mount and resize
  React.useEffect(() => {
    const updateRects = () => {
      const newRects = new Map<string, DOMRect>();
      counties.forEach(county => {
        const el = document.getElementById(`county-${stateCode}-${county.name}`);
        if (el) {
          newRects.set(county.name, el.getBoundingClientRect());
        }
      });
      setCountyRects(newRects);
    };
    updateRects();
    window.addEventListener('resize', updateRects);
    return () => window.removeEventListener('resize', updateRects);
  }, [stateCode, counties]);

  // Handle mouse events for drag selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDragging(true);
    const pos = { x: e.clientX, y: e.clientY };
    setDragStart(pos);
    setDragEnd(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragEnd({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    // Calculate selection rectangle
    const selRect = {
      left: Math.min(dragStart.x, dragEnd.x),
      right: Math.max(dragStart.x, dragEnd.x),
      top: Math.min(dragStart.y, dragEnd.y),
      bottom: Math.max(dragStart.y, dragEnd.y),
    };

    // Only process if drag was significant (not just a click)
    const dragDistance = Math.sqrt(
      Math.pow(dragEnd.x - dragStart.x, 2) + Math.pow(dragEnd.y - dragStart.y, 2)
    );

    if (dragDistance > 10) {
      // Find counties that intersect with selection
      const selected: string[] = [];
      countyRects.forEach((rect, countyName) => {
        if (
          rect.left < selRect.right &&
          rect.right > selRect.left &&
          rect.top < selRect.bottom &&
          rect.bottom > selRect.top
        ) {
          selected.push(countyName);
        }
      });

      if (selected.length > 0) {
        onSelectMultiple(selected);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Calculate selection rectangle for display
  const selectionRect = isDragging && dragStart && dragEnd ? {
    left: Math.min(dragStart.x, dragEnd.x),
    top: Math.min(dragStart.y, dragEnd.y),
    width: Math.abs(dragEnd.x - dragStart.x),
    height: Math.abs(dragEnd.y - dragStart.y),
  } : null;

  if (counties.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        <p>County data not available for this state.</p>
        <p className="text-sm mt-2">The entire state will be included in the territory.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* County grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {counties.map((county) => {
          const isSelected = isWholeState || selectedCounties.includes(county.name);
          return (
            <div
              key={county.name}
              id={`county-${stateCode}-${county.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCounty(county.name);
              }}
              className={`
                px-3 py-2 rounded-lg text-sm cursor-pointer transition-all border-2
                ${isSelected
                  ? 'bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)] font-medium'
                  : 'bg-[var(--muted)]/30 border-transparent hover:border-[var(--border)] text-[var(--foreground)]'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm border ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--muted-foreground)]'}`}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" fill="none"/>
                    </svg>
                  )}
                </div>
                <span className="truncate">{county.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection rectangle overlay */}
      {selectionRect && selectionRect.width > 5 && selectionRect.height > 5 && (
        <div
          className="fixed border-2 border-[var(--primary)] bg-[var(--primary)]/10 pointer-events-none z-50"
          style={{
            left: selectionRect.left,
            top: selectionRect.top,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      )}
    </div>
  );
}

// US Map SVG Component for State Selection
function USMapSelector({
  selectedStates,
  color,
  onStateClick,
  disabled,
}: {
  selectedStates: string[];
  color: string;
  onStateClick: (stateCode: string) => void;
  disabled: boolean;
}) {
  const statePaths: { [key: string]: { path: string; cx: number; cy: number } } = {
    WA: { path: 'M125,35 L180,35 L185,80 L125,80 Z', cx: 155, cy: 57 },
    OR: { path: 'M125,80 L185,80 L185,130 L125,130 Z', cx: 155, cy: 105 },
    CA: { path: 'M125,130 L165,130 L165,230 L125,230 Z', cx: 145, cy: 180 },
    NV: { path: 'M165,100 L210,100 L210,180 L165,180 Z', cx: 187, cy: 140 },
    ID: { path: 'M185,35 L230,35 L230,130 L185,130 Z', cx: 207, cy: 82 },
    MT: { path: 'M230,35 L330,35 L330,85 L230,85 Z', cx: 280, cy: 60 },
    WY: { path: 'M230,85 L330,85 L330,140 L230,140 Z', cx: 280, cy: 112 },
    UT: { path: 'M210,100 L260,100 L260,180 L210,180 Z', cx: 235, cy: 140 },
    AZ: { path: 'M165,180 L230,180 L230,270 L165,270 Z', cx: 197, cy: 225 },
    CO: { path: 'M260,140 L355,140 L355,200 L260,200 Z', cx: 307, cy: 170 },
    NM: { path: 'M230,200 L310,200 L310,280 L230,280 Z', cx: 270, cy: 240 },
    ND: { path: 'M330,35 L420,35 L420,75 L330,75 Z', cx: 375, cy: 55 },
    SD: { path: 'M330,75 L420,75 L420,120 L330,120 Z', cx: 375, cy: 97 },
    NE: { path: 'M330,120 L430,120 L430,165 L330,165 Z', cx: 380, cy: 142 },
    KS: { path: 'M355,165 L455,165 L455,210 L355,210 Z', cx: 405, cy: 187 },
    OK: { path: 'M355,210 L480,210 L480,260 L355,260 Z', cx: 417, cy: 235 },
    TX: { path: 'M310,260 L440,260 L440,380 L310,380 Z', cx: 375, cy: 320 },
    MN: { path: 'M420,35 L485,35 L485,110 L420,110 Z', cx: 452, cy: 72 },
    IA: { path: 'M430,110 L505,110 L505,160 L430,160 Z', cx: 467, cy: 135 },
    MO: { path: 'M455,160 L535,160 L535,230 L455,230 Z', cx: 495, cy: 195 },
    AR: { path: 'M480,230 L545,230 L545,285 L480,285 Z', cx: 512, cy: 257 },
    LA: { path: 'M480,285 L545,285 L545,350 L480,350 Z', cx: 512, cy: 317 },
    WI: { path: 'M485,60 L555,60 L555,130 L485,130 Z', cx: 520, cy: 95 },
    IL: { path: 'M505,130 L555,130 L555,220 L505,220 Z', cx: 530, cy: 175 },
    MS: { path: 'M545,250 L585,250 L585,330 L545,330 Z', cx: 565, cy: 290 },
    MI: { path: 'M530,45 L600,45 L600,130 L530,130 Z', cx: 565, cy: 87 },
    IN: { path: 'M555,130 L600,130 L600,200 L555,200 Z', cx: 577, cy: 165 },
    KY: { path: 'M535,190 L630,190 L630,235 L535,235 Z', cx: 582, cy: 212 },
    TN: { path: 'M535,235 L660,235 L660,270 L535,270 Z', cx: 597, cy: 252 },
    AL: { path: 'M585,270 L630,270 L630,340 L585,340 Z', cx: 607, cy: 305 },
    OH: { path: 'M600,130 L660,130 L660,195 L600,195 Z', cx: 630, cy: 162 },
    WV: { path: 'M630,165 L680,165 L680,215 L630,215 Z', cx: 655, cy: 190 },
    VA: { path: 'M630,195 L720,195 L720,235 L630,235 Z', cx: 675, cy: 215 },
    NC: { path: 'M630,235 L750,235 L750,275 L630,275 Z', cx: 690, cy: 255 },
    SC: { path: 'M660,275 L720,275 L720,320 L660,320 Z', cx: 690, cy: 297 },
    GA: { path: 'M630,290 L690,290 L690,360 L630,360 Z', cx: 660, cy: 325 },
    FL: { path: 'M630,340 L720,340 L720,430 L630,430 Z', cx: 675, cy: 385 },
    PA: { path: 'M660,115 L740,115 L740,165 L660,165 Z', cx: 700, cy: 140 },
    NY: { path: 'M680,60 L760,60 L760,115 L680,115 Z', cx: 720, cy: 87 },
    VT: { path: 'M735,45 L755,45 L755,85 L735,85 Z', cx: 745, cy: 65 },
    NH: { path: 'M755,45 L775,45 L775,90 L755,90 Z', cx: 765, cy: 67 },
    ME: { path: 'M775,20 L810,20 L810,90 L775,90 Z', cx: 792, cy: 55 },
    MA: { path: 'M755,85 L800,85 L800,105 L755,105 Z', cx: 777, cy: 95 },
    RI: { path: 'M780,100 L795,100 L795,115 L780,115 Z', cx: 787, cy: 107 },
    CT: { path: 'M755,105 L785,105 L785,125 L755,125 Z', cx: 770, cy: 115 },
    NJ: { path: 'M740,125 L770,125 L770,175 L740,175 Z', cx: 755, cy: 150 },
    DE: { path: 'M735,165 L755,165 L755,195 L735,195 Z', cx: 745, cy: 180 },
    MD: { path: 'M680,175 L740,175 L740,205 L680,205 Z', cx: 710, cy: 190 },
    DC: { path: 'M715,190 L725,190 L725,200 L715,200 Z', cx: 720, cy: 195 },
    AK: { path: 'M80,320 L200,320 L200,420 L80,420 Z', cx: 140, cy: 370 },
    HI: { path: 'M250,380 L330,380 L330,420 L250,420 Z', cx: 290, cy: 400 },
  };

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <svg viewBox="0 0 850 450" className="w-full h-auto">
        <rect width="850" height="450" fill="var(--background)" rx="8" />
        {Object.entries(statePaths).map(([code, { path, cx, cy }]) => {
          const isSelected = selectedStates.includes(code);
          return (
            <g key={code}>
              <path
                d={path}
                fill={isSelected ? `${color}40` : 'var(--muted)'}
                stroke={isSelected ? color : 'var(--border)'}
                strokeWidth={isSelected ? 2 : 1}
                className={`transition-all cursor-pointer ${!disabled ? 'hover:opacity-80' : ''}`}
                onClick={() => !disabled && onStateClick(code)}
              />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight={isSelected ? 'bold' : 'normal'}
                fill={isSelected ? color : 'var(--muted-foreground)'}
                className="pointer-events-none select-none"
              >
                {code}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: `${color}40`, border: `2px solid ${color}` }} />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[var(--muted)] border border-[var(--border)]" />
          <span>Available</span>
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

