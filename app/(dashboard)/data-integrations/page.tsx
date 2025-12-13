'use client';

import React, { useState } from 'react';

// Data Integration Types
interface DataIntegration {
  id: string;
  name: string;
  logo?: string;
  description: string;
  status: 'available' | 'activated' | 'requested';
  requestCount?: number;
  connectedDate?: string;
  dataTypes: string[];
}

const initialIntegrations: DataIntegration[] = [
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

// Integration Card Component
interface IntegrationCardProps {
  integration: DataIntegration;
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

export default function DataIntegrationsPage() {
  const [integrations, setIntegrations] = useState<DataIntegration[]>(initialIntegrations);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [showActivateModal, setShowActivateModal] = useState<string | null>(null);

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

    const newIntegration: DataIntegration = {
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
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      <div className="max-w-4xl">
        {/* Header with Request button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Data Integrations</h1>
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
    </main>
  );
}
