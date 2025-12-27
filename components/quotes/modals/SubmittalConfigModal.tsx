'use client';

import React, { useState } from 'react';
import type { Submittal, SubmittalConfig } from '../../../lib/types/submittals';
import { defaultSubmittalConfig } from '../../../lib/types/submittals';

interface SubmittalConfigModalProps {
  submittal: Submittal;
  onClose: () => void;
  onSave: (updates: Partial<Submittal>) => void;
}

export function SubmittalConfigModal({ submittal, onClose, onSave }: SubmittalConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<SubmittalConfig>(
    submittal.config || { ...defaultSubmittalConfig }
  );
  const [localArchitect, setLocalArchitect] = useState(
    submittal.architects[0]?.contactName || ''
  );
  const [localArchitectCompany, setLocalArchitectCompany] = useState(
    submittal.architects[0]?.companyName || ''
  );
  const [localEngineer, setLocalEngineer] = useState(
    submittal.engineers[0]?.contactName || ''
  );
  const [localEngineerCompany, setLocalEngineerCompany] = useState(
    submittal.engineers[0]?.companyName || ''
  );
  const [localCustomer, setLocalCustomer] = useState(
    submittal.customers[0]?.contactName || ''
  );
  const [localCustomerCompany, setLocalCustomerCompany] = useState(
    submittal.customers[0]?.companyName || ''
  );

  const handleSave = () => {
    onSave({
      config: localConfig,
      architects: localArchitect ? [{
        contactId: submittal.architects[0]?.contactId || `arch-${Date.now()}`,
        contactName: localArchitect,
        companyName: localArchitectCompany || undefined,
        role: 'architect' as const,
      }] : [],
      engineers: localEngineer ? [{
        contactId: submittal.engineers[0]?.contactId || `eng-${Date.now()}`,
        contactName: localEngineer,
        companyName: localEngineerCompany || undefined,
        role: 'engineer' as const,
      }] : [],
      customers: localCustomer ? [{
        contactId: submittal.customers[0]?.contactId || `cust-${Date.now()}`,
        contactName: localCustomer,
        companyName: localCustomerCompany || undefined,
        role: 'customer' as const,
      }] : submittal.customers,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] sticky top-0 bg-[var(--card)]">
          <h3 className="font-semibold text-[var(--foreground)]">Submittal Configuration</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Contacts Section */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Contacts</h4>
            <div className="space-y-4">
              {/* Architect */}
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 mt-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                    <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">Architect</label>
                  <input
                    type="text"
                    value={localArchitect}
                    onChange={(e) => setLocalArchitect(e.target.value)}
                    placeholder="Contact name"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                  <input
                    type="text"
                    value={localArchitectCompany}
                    onChange={(e) => setLocalArchitectCompany(e.target.value)}
                    placeholder="Company name (optional)"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>

              {/* Engineer */}
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 flex-shrink-0 mt-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">Engineer</label>
                  <input
                    type="text"
                    value={localEngineer}
                    onChange={(e) => setLocalEngineer(e.target.value)}
                    placeholder="Contact name"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                  <input
                    type="text"
                    value={localEngineerCompany}
                    onChange={(e) => setLocalEngineerCompany(e.target.value)}
                    placeholder="Company name (optional)"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>

              {/* Customer */}
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 mt-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">Customer</label>
                  <input
                    type="text"
                    value={localCustomer}
                    onChange={(e) => setLocalCustomer(e.target.value)}
                    placeholder="Contact name"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                  <input
                    type="text"
                    value={localCustomerCompany}
                    onChange={(e) => setLocalCustomerCompany(e.target.value)}
                    placeholder="Company name (optional)"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)]" />

          {/* Configuration Options */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Configuration Options</h4>
            <div className="space-y-4">
              {/* Include Options */}
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Include</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.includeLamps}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, includeLamps: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">Lamps</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.includeAccessories}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, includeAccessories: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">Accessories</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.includeCQ}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, includeCQ: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">CQ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.includeFromOrders}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, includeFromOrders: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">From Orders</span>
                  </label>
                </div>
              </div>

              {/* Rollup Options */}
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Rollup</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.rollUpKits}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, rollUpKits: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">Roll up kits</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.rollUpAccessories}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, rollUpAccessories: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">Roll up Accessories</span>
                  </label>
                </div>
              </div>

              {/* Filter Options */}
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Filter</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localConfig.includeZeroQuantityItems}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, includeZeroQuantityItems: e.target.checked }))}
                    className="rounded border-[var(--border)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">Zero Quantity Items</span>
                </label>
              </div>

              {/* Display Options */}
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Display</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.dropDescriptions}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, dropDescriptions: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">Drop Descriptions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.dropLineNotes}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, dropLineNotes: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">Drop Line Notes</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border)] sticky bottom-0 bg-[var(--card)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
