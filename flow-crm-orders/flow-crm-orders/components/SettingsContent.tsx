'use client';

import React, { useState } from 'react';
import TagSearchSelect from './TagSearchSelect';
import SidebarSettings from './SidebarSettings';

type RepType = {
  id: string;
  name: string;
  division: string;
  description: string;
  selected: boolean;
};

type EmailConnection = {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  connected: boolean;
  connectedDate?: string;
};

type ActivityRule = {
  id: string;
  activityType: 'task' | 'note' | 'quote';
  basePoints: number;
  tagModifiers: { tag: string; multiplier: number }[];
};

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState<'rep-types' | 'takeoffs' | 'email-connections' | 'credit-for-sale' | 'sidebar'>('rep-types');
  const [autoAbridgment, setAutoAbridgment] = useState(false);
  const [saved, setSaved] = useState(false);
  const [emailConnections, setEmailConnections] = useState<EmailConnection[]>([]);
  const [isConnecting, setIsConnecting] = useState<'gmail' | 'outlook' | null>(null);

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

  // Mock function to simulate connecting an email account
  const handleConnectEmail = (provider: 'gmail' | 'outlook') => {
    setIsConnecting(provider);
    // Simulate OAuth flow delay
    setTimeout(() => {
      const newConnection: EmailConnection = {
        id: `${provider}-${Date.now()}`,
        provider,
        email: provider === 'gmail' ? 'user@gmail.com' : 'user@outlook.com',
        connected: true,
        connectedDate: new Date().toISOString().split('T')[0],
      };
      setEmailConnections(prev => [...prev, newConnection]);
      setIsConnecting(null);
    }, 1500);
  };

  const handleDisconnectEmail = (id: string) => {
    setEmailConnections(prev => prev.filter(c => c.id !== id));
  };

  const gmailConnected = emailConnections.some(c => c.provider === 'gmail');
  const outlookConnected = emailConnections.some(c => c.provider === 'outlook');

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Settings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Configure your CRM preferences and settings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('rep-types')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'rep-types'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Rep Types
        </button>
        <button
          onClick={() => setActiveTab('takeoffs')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'takeoffs'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Take-Off Settings
        </button>
        <button
          onClick={() => setActiveTab('email-connections')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'email-connections'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Email Connections
        </button>
        <button
          onClick={() => setActiveTab('credit-for-sale')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'credit-for-sale'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Credit for Sale
        </button>
        <button
          onClick={() => setActiveTab('sidebar')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'sidebar'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Sidebar
        </button>
      </div>

      {/* Rep Types Tab */}
      {activeTab === 'rep-types' && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 max-w-3xl">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Rep Types Configuration
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Select which rep types to include in your takeoff analysis. Choose 1-3 types.
          </p>

          <div className="space-y-3 mb-6">
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
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {repType.name} ({repType.division})
                      </h3>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {repType.description}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted-foreground)]">
              Selected: {selectedRepTypes.map(rt => `${rt.name} (${rt.division})`).join(', ')} ({selectedCount}/3)
            </p>
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

      {/* Take-Off Settings Tab */}
      {activeTab === 'takeoffs' && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 max-w-3xl">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Take-Off Settings
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Configure how take-offs are processed in your CRM.
          </p>

          <div className="space-y-6">
            {/* Document Abridgment Setting */}
            <div>
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
          </div>

          <div className="flex justify-end pt-6">
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

      {/* Email Connections Tab */}
      {activeTab === 'email-connections' && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 max-w-3xl">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Email Connections
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Connect your email accounts to use FlowMail. Your emails will be synced and displayed in the FlowMail inbox.
          </p>

          <div className="space-y-4">
            {/* Gmail Connection */}
            <div className="p-4 border border-[var(--border)] rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Gmail Icon */}
                  <div className="w-10 h-10 rounded-lg bg-white border border-[var(--border)] flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6Z" fill="#EA4335"/>
                      <path d="M22 6L12 13L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 6L12 13" stroke="#FBBC05" strokeWidth="1.5"/>
                      <path d="M22 6L12 13" stroke="#34A853" strokeWidth="1.5"/>
                      <path d="M2 18V6" stroke="#4285F4" strokeWidth="1.5"/>
                      <path d="M22 18V6" stroke="#4285F4" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--foreground)]">Gmail</h3>
                    {gmailConnected ? (
                      <p className="text-sm text-green-600">
                        Connected: {emailConnections.find(c => c.provider === 'gmail')?.email}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Connect your Google account to sync Gmail
                      </p>
                    )}
                  </div>
                </div>
                {gmailConnected ? (
                  <button
                    onClick={() => {
                      const conn = emailConnections.find(c => c.provider === 'gmail');
                      if (conn) handleDisconnectEmail(conn.id);
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnectEmail('gmail')}
                    disabled={isConnecting === 'gmail'}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                  >
                    {isConnecting === 'gmail' ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Connecting...
                      </>
                    ) : (
                      'Connect Gmail'
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Outlook Connection */}
            <div className="p-4 border border-[var(--border)] rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Outlook Icon */}
                  <div className="w-10 h-10 rounded-lg bg-white border border-[var(--border)] flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4"/>
                      <path d="M22 7L12 14L2 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <ellipse cx="8" cy="12" rx="4" ry="5" fill="#0A4A8C"/>
                      <text x="8" y="14" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">O</text>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--foreground)]">Outlook</h3>
                    {outlookConnected ? (
                      <p className="text-sm text-green-600">
                        Connected: {emailConnections.find(c => c.provider === 'outlook')?.email}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Connect your Microsoft account to sync Outlook
                      </p>
                    )}
                  </div>
                </div>
                {outlookConnected ? (
                  <button
                    onClick={() => {
                      const conn = emailConnections.find(c => c.provider === 'outlook');
                      if (conn) handleDisconnectEmail(conn.id);
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnectEmail('outlook')}
                    disabled={isConnecting === 'outlook'}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
                  >
                    {isConnecting === 'outlook' ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Connecting...
                      </>
                    ) : (
                      'Connect Outlook'
                    )}
                  </button>
                )}
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
                <h4 className="text-sm font-medium text-blue-900">About Email Connections</h4>
                <p className="text-sm text-blue-700 mt-1">
                  When you connect an email account, FlowMail will sync your recent emails and keep them updated.
                  You can connect multiple accounts and switch between them in FlowMail. Your email credentials
                  are securely stored and never shared.
                </p>
              </div>
            </div>
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
    </main>
  );
}
