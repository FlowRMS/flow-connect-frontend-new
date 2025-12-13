'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdvancedFilters from './AdvancedFilters';
import {
  mockSubmittals,
  submittalStatusLabels,
  submittalStatusColors,
  matchStatusLabels,
  matchStatusColors,
} from '../lib/data/submittals-mock';
import type { Submittal, SubmittalItem, SubmittalConfig, SubmittalStakeholder } from '../lib/types/submittals';
import { defaultSubmittalConfig } from '../lib/types/submittals';
import CreateSubmittalModal, { QuoteRecipient, QuoteLineItem } from './submittals/CreateSubmittalModal';
import PrintSubmittalDialog, { PrintSettings } from './submittals/PrintSubmittalDialog';
import SubmittalDetailPanel from './submittals/SubmittalDetailPanel';
import CreditModal from './CreditModal';
import ConvertQuoteToOrderModal from './orders/ConvertQuoteToOrderModal';
import type { Order } from '../lib/types/rms';
import QuotePdfPreviewModal from './quotes/QuotePdfPreviewModal';
import type { QuoteData } from '../lib/utils/generatePdfFromTemplate';

// ============================================
// SUBMITTAL CONFIG MODAL COMPONENT
// ============================================

interface SubmittalConfigModalProps {
  submittal: Submittal;
  onClose: () => void;
  onSave: (updates: Partial<Submittal>) => void;
}

function SubmittalConfigModal({ submittal, onClose, onSave }: SubmittalConfigModalProps) {
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

// ============================================
// REP SPLIT MODAL COMPONENT
// ============================================

interface RepSplitModalProps {
  lineItemId: string;
  lineItemDescription: string;
  currentSplits: { repId: string; repName: string; percentage: number }[];
  availableReps: { id: string; name: string }[];
  onClose: () => void;
  onSave: (splits: { repId: string; repName: string; percentage: number }[]) => void;
  onApplyToSection: (splits: { repId: string; repName: string; percentage: number }[]) => void;
  onApplyToAll: (splits: { repId: string; repName: string; percentage: number }[]) => void;
}

function RepSplitModal({
  lineItemId,
  lineItemDescription,
  currentSplits,
  availableReps,
  onClose,
  onSave,
  onApplyToSection,
  onApplyToAll,
}: RepSplitModalProps) {
  const [splits, setSplits] = useState<{ repId: string; repName: string; percentage: number }[]>(
    currentSplits.length > 0 ? currentSplits : [{ repId: '', repName: '', percentage: 100 }]
  );
  const [showApplyMenu, setShowApplyMenu] = useState(false);

  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
  const isValid = totalPercentage === 100 && splits.every(s => s.repId !== '');

  const addRep = () => {
    setSplits([...splits, { repId: '', repName: '', percentage: 0 }]);
  };

  const removeRep = (index: number) => {
    if (splits.length > 1) {
      setSplits(splits.filter((_, i) => i !== index));
    }
  };

  const updateRep = (index: number, repId: string) => {
    const rep = availableReps.find(r => r.id === repId);
    setSplits(splits.map((s, i) =>
      i === index ? { ...s, repId, repName: rep?.name || '' } : s
    ));
  };

  const updatePercentage = (index: number, percentage: number) => {
    setSplits(splits.map((s, i) =>
      i === index ? { ...s, percentage: Math.max(0, Math.min(100, percentage)) } : s
    ));
  };

  const distributeEvenly = () => {
    const evenSplit = Math.floor(100 / splits.length);
    const remainder = 100 - (evenSplit * splits.length);
    setSplits(splits.map((s, i) => ({
      ...s,
      percentage: i === 0 ? evenSplit + remainder : evenSplit
    })));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Commission Split</h3>
            <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[300px]">{lineItemDescription}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Rep Splits */}
          <div className="space-y-3">
            {splits.map((split, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={split.repId}
                  onChange={(e) => updateRep(index, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select Rep...</option>
                  {availableReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={split.percentage}
                    onChange={(e) => updatePercentage(index, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-2 text-sm text-center border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">%</span>
                </div>
                {splits.length > 1 && (
                  <button
                    onClick={() => removeRep(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-3">
              <button
                onClick={addRep}
                className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                </svg>
                Add Rep
              </button>
              <button
                onClick={distributeEvenly}
                className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded transition-colors"
              >
                Split Evenly
              </button>
            </div>
            <div className={`text-sm font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {totalPercentage}%
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border)]">
          <div className="relative">
            <button
              onClick={() => setShowApplyMenu(!showApplyMenu)}
              disabled={!isValid}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply to...
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showApplyMenu && (
              <div className="absolute left-0 bottom-full mb-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[160px] z-10">
                <button
                  onClick={() => { onApplyToSection(splits); setShowApplyMenu(false); }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--muted)] transition-colors"
                >
                  Apply to Section
                </button>
                <button
                  onClick={() => { onApplyToAll(splits); setShowApplyMenu(false); }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--muted)] transition-colors"
                >
                  Apply to All Lines
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(splits)}
              disabled={!isValid}
              className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MOCK DATA TYPES & DATA
// ============================================

type Factory = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type Rep = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type EndUser = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type Quote = {
  id: string;
  name: string;
  billToCustomer: string;
  soldToCustomer: string;
  jobId: string;
  jobName: string;
  stage: 'Draft' | 'Review' | 'Sent' | 'Negotiating' | 'Won' | 'Lost';
  status: 'Open' | 'Closed' | 'Expired' | 'Pending';
  value: string;
  valueNumber: number;
  winProbability: number;
  entryDate: string;
  quoteDate: string;
  expirationDate: string;
  revisedDate: string;
  acceptDate: string;
  paymentTerms: string;
  freightTerms: string;
  owner: string;
  version: number;
  lastUpdated: string;
  tags: string[];
  approvalStatus: 'clear' | 'pending' | 'blocked';
  pendingApprovals: number;
  factories: Factory[];
  endUsers: EndUser[];
  insideReps: Rep[];
  outsideReps: Rep[];
  published: boolean;
};

type OutsideRepSplit = {
  repId: string;
  repName: string;
  percentage: number; // 0-100
};

type LineItem = {
  id: string;
  quoteId: string;
  sectionId: string;
  sectionName: string;
  productNumber: string;
  description: string;
  endUser: string;
  quantity: number;
  uom?: string; // Unit of measure (EA, FT, LF, etc.) - defaults to 'EA' if not specified
  manufacturers: {
    name: string;
    basePrice: number;
    commissionRate: number;
    overageShare: number;
    approvalStatus: 'approved' | 'conditional' | 'not_approved' | 'unknown';
    approvalDate: string | null;
    approvalNotes: string | null;
  }[];
  basePrice: number;
  sellPrice: number;
  level1Price: number;
  level2Price: number;
  level3Price: number;
  overagePercent: number;
  commissionable: boolean;
  locked: boolean;
  priceHistory: number[]; // Manufacturer price history
  quotedPriceHistory: number[]; // Quoted/sell price history
  hasSpecSheet: boolean;
  specSheetUrl?: string;
  // Outside rep splits for commission
  outsideRepSplits: OutsideRepSplit[];
  // Divisor for unit of measure (e.g., per 100, per 1000)
  useDivisor: boolean;
  divisor: number; // Default 1, can be 100, 1000, etc.
  // Additional line item details
  commissionDiscountPercent?: number;
  commissionDiscountAmount?: number;
  lineDiscountPercent?: number;
  lineDiscountAmount?: number;
  leadTime?: string;
};

type QuoteFile = {
  id: string;
  quoteId: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  includeInEmail: boolean;
};

type Section = {
  id: string;
  name: string;
  order: number;
};

type BuilderApproval = {
  id: string;
  builderId: string;
  builderName: string;
  manufacturerId: string;
  manufacturerName: string;
  status: 'approved' | 'conditional' | 'not_approved';
  category: string;
  conditions: string | null;
  approvedSkus: string[] | null;
  approvedDate: string;
  expirationDate: string | null;
  approvedBy: string;
  documentUrl: string;
  notes: string;
};

type ApprovalRequest = {
  id: string;
  quoteId: string;
  builderId: string;
  builderName: string;
  manufacturerId: string;
  manufacturerName: string;
  status: 'pending' | 'approved' | 'conditional' | 'rejected';
  requestedDate: string;
  requestedBy: string;
  skus: string[];
  justification: string;
  attachments: string[];
  respondedDate: string | null;
  respondedBy: string | null;
  responseNotes: string | null;
  conditions: string | null;
};

type Manufacturer = {
  manufacturer_name: string;
  domain: string;
  active: boolean;
};

type PriceCategory = {
  price_category_name: string;
  description: string;
  default_discount_percent: number;
};

type DistributorMatrixEntry = {
  distributor_domain: string;
  manufacturer_domain: string;
  price_category: string;
};

type DistributorQuote = {
  id: string;
  baseQuoteId: string;
  distributorDomain: string;
  distributorName: string;
  status: 'draft' | 'requires_cross' | 'ready_to_send' | 'sent';
  createdAt: string;
  originalTotal: number;
  discountedTotal: number;
  totalDiscount: number;
  discountPercent: number;
  totalLines: number;
  linesRequiringCross: number;
  linesCrossed: number;
  linesApproved: number;
};

type Recipient = {
  id: string;
  company: string;
  contact: string;
  email: string;
  level: 'Sell' | 'L1' | 'L2' | 'L3';
  price: number;
  sent: string | null;
  opened: boolean;
  distributorQuote: DistributorQuote | null;
  version: number;
};

// Mock Data - 15 quotes across all stages
const mockQuotes: Quote[] = [
  {
    id: 'Q-2024-001',
    name: 'Downtown Medical Center - Lighting Package',
    billToCustomer: 'Graybar Electric',
    soldToCustomer: 'Turner Construction',
    jobId: 'J-001',
    jobName: 'Downtown Medical Center',
    stage: 'Negotiating',
    status: 'Open',
    value: '$2,450,000',
    valueNumber: 2450000,
    winProbability: 72,
    entryDate: '2024-03-01',
    quoteDate: '2024-03-01',
    expirationDate: '2024-04-15',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 30',
    freightTerms: 'FOB Destination',
    owner: 'Sarah Chen',
    version: 3,
    lastUpdated: '2024-03-20',
    tags: ['Healthcare', 'Lighting'],
    approvalStatus: 'pending',
    pendingApprovals: 2,
    factories: [
      { id: 'f-1', name: 'Acuity Brands' },
      { id: 'f-2', name: 'Lutron' },
      { id: 'f-3', name: 'Signify' },
    ],
    endUsers: [
      { id: 'eu-1', name: 'Memorial Hospital' },
      { id: 'eu-2', name: 'Downtown Clinic' },
    ],
    insideReps: [{ id: 'ir-1', name: 'House Account' }],
    outsideReps: [
      { id: 'or-1', name: 'Richard Utley' },
      { id: 'or-2', name: 'Mike Thompson' },
    ],
    published: true,
  },
  {
    id: 'Q-2024-002',
    name: 'TechCorp HQ - Full Controls Package',
    billToCustomer: 'HD Supply',
    soldToCustomer: 'Hensel Phelps',
    jobId: 'J-002',
    jobName: 'TechCorp HQ Expansion',
    stage: 'Sent',
    status: 'Open',
    value: '$1,850,000',
    valueNumber: 1850000,
    winProbability: 58,
    entryDate: '2024-03-10',
    quoteDate: '2024-03-10',
    expirationDate: '2024-04-01',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 45',
    freightTerms: 'FOB Origin',
    owner: 'Marcus Chen',
    version: 2,
    lastUpdated: '2024-03-18',
    tags: ['Office', 'Controls'],
    approvalStatus: 'clear',
    pendingApprovals: 0,
    factories: [
      { id: 'f-4', name: 'Lutron' },
      { id: 'f-5', name: 'Crestron' },
    ],
    endUsers: [{ id: 'eu-3', name: 'TechCorp Inc' }],
    insideReps: [{ id: 'ir-2', name: 'House Account' }],
    outsideReps: [{ id: 'or-3', name: 'Sarah Williams' }],
    published: true,
  },
  {
    id: 'Q-2024-003',
    name: 'University Lab - Specialty Systems',
    billToCustomer: 'Ferguson Enterprises',
    soldToCustomer: 'Skanska USA',
    jobId: 'J-005',
    jobName: 'University Lab Building',
    stage: 'Draft',
    status: 'Pending',
    value: '$890,000',
    valueNumber: 890000,
    winProbability: 45,
    entryDate: '2024-03-15',
    quoteDate: '2024-03-15',
    expirationDate: '2024-05-01',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 30',
    freightTerms: 'Prepaid',
    owner: 'David Torres',
    version: 1,
    lastUpdated: '2024-03-22',
    tags: ['Education', 'Lab Systems'],
    approvalStatus: 'blocked',
    pendingApprovals: 4,
    factories: [{ id: 'f-6', name: 'ABB' }],
    endUsers: [{ id: 'eu-4', name: 'State University' }],
    insideReps: [{ id: 'ir-3', name: 'House Account' }],
    outsideReps: [],
    published: false,
  },
  {
    id: 'Q-2024-004',
    name: 'Harbor View Apartments - Fixtures',
    billToCustomer: 'Graybar Electric',
    soldToCustomer: 'Swinerton Builders',
    jobId: 'J-004',
    jobName: 'Harbor View Apartments',
    stage: 'Won',
    status: 'Closed',
    value: '$445,000',
    valueNumber: 445000,
    winProbability: 100,
    entryDate: '2024-02-01',
    quoteDate: '2024-02-01',
    expirationDate: '2024-03-01',
    revisedDate: '2024-02-20',
    acceptDate: '2024-02-28',
    paymentTerms: 'Net 30',
    freightTerms: 'FOB Destination',
    owner: 'Sarah Chen',
    version: 4,
    lastUpdated: '2024-02-28',
    tags: ['Residential', 'Multi-family'],
    approvalStatus: 'clear',
    pendingApprovals: 0,
    factories: [
      { id: 'f-7', name: 'Kichler' },
      { id: 'f-8', name: 'WAC Lighting' },
    ],
    endUsers: [{ id: 'eu-5', name: 'Harbor View LLC' }],
    insideReps: [{ id: 'ir-4', name: 'Jennifer Adams' }],
    outsideReps: [{ id: 'or-4', name: 'Tom Davis' }],
    published: true,
  },
  {
    id: 'Q-2024-005',
    name: 'Airport Terminal - Infrastructure',
    billToCustomer: 'HD Supply',
    soldToCustomer: 'Hensel Phelps',
    jobId: 'J-008',
    jobName: 'Airport Terminal Expansion',
    stage: 'Review',
    status: 'Open',
    value: '$5,200,000',
    valueNumber: 5200000,
    winProbability: 35,
    entryDate: '2024-03-20',
    quoteDate: '2024-03-20',
    expirationDate: '2024-06-15',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 60',
    freightTerms: 'Prepaid & Add',
    owner: 'David Torres',
    version: 1,
    lastUpdated: '2024-03-21',
    tags: ['Infrastructure', 'Critical'],
    approvalStatus: 'pending',
    pendingApprovals: 1,
    factories: [
      { id: 'f-9', name: 'Eaton' },
      { id: 'f-10', name: 'Schneider Electric' },
      { id: 'f-11', name: 'ABB' },
    ],
    endUsers: [{ id: 'eu-6', name: 'Metro Airport Authority' }],
    insideReps: [{ id: 'ir-5', name: 'House Account' }],
    outsideReps: [
      { id: 'or-5', name: 'Chris Martin' },
      { id: 'or-6', name: 'Lisa Brown' },
    ],
    published: false,
  },
  {
    id: 'Q-2024-006',
    name: 'Westside Mall - Retail Lighting',
    billToCustomer: 'Ferguson Enterprises',
    soldToCustomer: 'Layton Construction',
    jobId: 'J-006',
    jobName: 'Westside Mall Renovation',
    stage: 'Lost',
    status: 'Closed',
    value: '$720,000',
    valueNumber: 720000,
    winProbability: 0,
    entryDate: '2024-01-15',
    quoteDate: '2024-01-15',
    expirationDate: '2024-02-15',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 30',
    freightTerms: 'FOB Origin',
    owner: 'Marcus Chen',
    version: 2,
    lastUpdated: '2024-02-20',
    tags: ['Retail'],
    approvalStatus: 'clear',
    pendingApprovals: 0,
    factories: [{ id: 'f-12', name: 'Philips' }],
    endUsers: [{ id: 'eu-7', name: 'Westside Properties' }],
    insideReps: [{ id: 'ir-6', name: 'House Account' }],
    outsideReps: [{ id: 'or-7', name: 'Brian Clark' }],
    published: true,
  },
  {
    id: 'Q-2024-007',
    name: 'City Hall Renovation - Electrical',
    billToCustomer: 'Rexel USA',
    soldToCustomer: 'McCarthy Building',
    jobId: 'J-007',
    jobName: 'City Hall Renovation',
    stage: 'Draft',
    status: 'Open',
    value: '$1,125,000',
    valueNumber: 1125000,
    winProbability: 62,
    entryDate: '2024-03-22',
    quoteDate: '2024-03-22',
    expirationDate: '2024-05-20',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 45',
    freightTerms: 'Prepaid',
    owner: 'Sarah Chen',
    version: 1,
    lastUpdated: '2024-03-23',
    tags: ['Government', 'Electrical'],
    approvalStatus: 'pending',
    pendingApprovals: 3,
    factories: [
      { id: 'f-13', name: 'Eaton' },
      { id: 'f-14', name: 'Siemens' },
    ],
    endUsers: [{ id: 'eu-8', name: 'City of Metro' }],
    insideReps: [{ id: 'ir-7', name: 'Mark Wilson' }],
    outsideReps: [],
    published: false,
  },
  {
    id: 'Q-2024-008',
    name: 'Riverside Office Tower - Full MEP',
    billToCustomer: 'Graybar Electric',
    soldToCustomer: 'Clark Construction',
    jobId: 'J-009',
    jobName: 'Riverside Office Tower',
    stage: 'Negotiating',
    status: 'Open',
    value: '$3,750,000',
    valueNumber: 3750000,
    winProbability: 68,
    entryDate: '2024-03-05',
    quoteDate: '2024-03-05',
    expirationDate: '2024-04-30',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 30',
    freightTerms: 'FOB Destination',
    owner: 'Marcus Chen',
    version: 2,
    lastUpdated: '2024-03-19',
    tags: ['Office', 'High-rise'],
    approvalStatus: 'clear',
    pendingApprovals: 0,
    factories: [
      { id: 'f-15', name: 'Acuity Brands' },
      { id: 'f-16', name: 'Lutron' },
    ],
    endUsers: [
      { id: 'eu-9', name: 'Riverside Development' },
      { id: 'eu-10', name: 'Tower Management Co' },
    ],
    insideReps: [{ id: 'ir-8', name: 'House Account' }],
    outsideReps: [{ id: 'or-8', name: 'Richard Utley' }],
    published: true,
  },
  {
    id: 'Q-2024-009',
    name: 'Metro Transit Hub - Emergency Systems',
    billToCustomer: 'HD Supply',
    soldToCustomer: 'Kiewit Corporation',
    jobId: 'J-010',
    jobName: 'Metro Transit Hub',
    stage: 'Sent',
    status: 'Open',
    value: '$980,000',
    valueNumber: 980000,
    winProbability: 51,
    entryDate: '2024-03-12',
    quoteDate: '2024-03-12',
    expirationDate: '2024-04-10',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 60',
    freightTerms: 'Prepaid',
    owner: 'David Torres',
    version: 1,
    lastUpdated: '2024-03-17',
    tags: ['Transit', 'Emergency'],
    approvalStatus: 'pending',
    pendingApprovals: 1,
    factories: [{ id: 'f-17', name: 'Hubbell' }],
    endUsers: [{ id: 'eu-11', name: 'Metro Transit Authority' }],
    insideReps: [{ id: 'ir-9', name: 'House Account' }],
    outsideReps: [{ id: 'or-9', name: 'Amy Johnson' }],
    published: true,
  },
  {
    id: 'Q-2024-010',
    name: 'Luxury Hotel - Decorative Lighting',
    billToCustomer: 'Ferguson Enterprises',
    soldToCustomer: 'Mortenson Construction',
    jobId: 'J-011',
    jobName: 'Grand Luxury Hotel',
    stage: 'Won',
    status: 'Closed',
    value: '$1,680,000',
    valueNumber: 1680000,
    winProbability: 100,
    entryDate: '2024-02-15',
    quoteDate: '2024-02-15',
    expirationDate: '2024-03-15',
    revisedDate: '2024-03-01',
    acceptDate: '2024-03-10',
    paymentTerms: 'Net 30',
    freightTerms: 'FOB Destination',
    owner: 'Sarah Chen',
    version: 5,
    lastUpdated: '2024-03-10',
    tags: ['Hospitality', 'Decorative'],
    approvalStatus: 'clear',
    pendingApprovals: 0,
    factories: [
      { id: 'f-18', name: 'Visual Comfort' },
      { id: 'f-19', name: 'Hudson Valley' },
      { id: 'f-20', name: 'Tech Lighting' },
    ],
    endUsers: [{ id: 'eu-12', name: 'Grand Hotel Group' }],
    insideReps: [{ id: 'ir-10', name: 'House Account' }],
    outsideReps: [
      { id: 'or-10', name: 'Michelle Lee' },
      { id: 'or-11', name: 'Kevin White' },
    ],
    published: true,
  },
  {
    id: 'Q-2024-011',
    name: 'Data Center - Power Distribution',
    billToCustomer: 'Graybar Electric',
    soldToCustomer: 'DPR Construction',
    jobId: 'J-012',
    jobName: 'TechCore Data Center',
    stage: 'Review',
    status: 'Open',
    value: '$4,200,000',
    valueNumber: 4200000,
    winProbability: 42,
    entryDate: '2024-03-18',
    quoteDate: '2024-03-18',
    expirationDate: '2024-05-30',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 45',
    freightTerms: 'FOB Origin',
    owner: 'Marcus Chen',
    version: 1,
    lastUpdated: '2024-03-22',
    tags: ['Data Center', 'Power'],
    approvalStatus: 'blocked',
    pendingApprovals: 2,
    factories: [
      { id: 'f-21', name: 'Eaton' },
      { id: 'f-22', name: 'Schneider Electric' },
    ],
    endUsers: [{ id: 'eu-13', name: 'TechCore Systems' }],
    insideReps: [{ id: 'ir-11', name: 'House Account' }],
    outsideReps: [{ id: 'or-12', name: 'David Kim' }],
    published: false,
  },
  {
    id: 'Q-2024-012',
    name: 'Sports Arena - LED Upgrades',
    billToCustomer: 'HD Supply',
    soldToCustomer: 'Hunt Construction',
    jobId: 'J-013',
    jobName: 'Municipal Sports Arena',
    stage: 'Draft',
    status: 'Pending',
    value: '$2,100,000',
    valueNumber: 2100000,
    winProbability: 55,
    entryDate: '2024-03-23',
    quoteDate: '2024-03-23',
    expirationDate: '2024-06-01',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 30',
    freightTerms: 'Prepaid',
    owner: 'David Torres',
    version: 1,
    lastUpdated: '2024-03-24',
    tags: ['Sports', 'LED'],
    approvalStatus: 'pending',
    pendingApprovals: 2,
    factories: [
      { id: 'f-23', name: 'Musco' },
      { id: 'f-24', name: 'Ephesus' },
    ],
    endUsers: [{ id: 'eu-14', name: 'City Sports Authority' }],
    insideReps: [{ id: 'ir-12', name: 'House Account' }],
    outsideReps: [{ id: 'or-13', name: 'James Miller' }],
    published: false,
  },
  {
    id: 'Q-2024-013',
    name: 'Community College - Classroom Tech',
    billToCustomer: 'Rexel USA',
    soldToCustomer: 'Gilbane Building',
    jobId: 'J-014',
    jobName: 'Community College Expansion',
    stage: 'Lost',
    status: 'Closed',
    value: '$560,000',
    valueNumber: 560000,
    winProbability: 0,
    entryDate: '2024-01-20',
    quoteDate: '2024-01-20',
    expirationDate: '2024-02-28',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 30',
    freightTerms: 'FOB Destination',
    owner: 'Sarah Chen',
    version: 3,
    lastUpdated: '2024-02-25',
    tags: ['Education', 'Technology'],
    approvalStatus: 'clear',
    pendingApprovals: 0,
    factories: [{ id: 'f-25', name: 'Crestron' }],
    endUsers: [{ id: 'eu-15', name: 'Community College District' }],
    insideReps: [{ id: 'ir-13', name: 'House Account' }],
    outsideReps: [],
    published: true,
  },
  {
    id: 'Q-2024-014',
    name: 'Biotech Campus - Cleanroom Systems',
    billToCustomer: 'Ferguson Enterprises',
    soldToCustomer: 'Whiting-Turner',
    jobId: 'J-015',
    jobName: 'Biotech Research Campus',
    stage: 'Negotiating',
    status: 'Open',
    value: '$6,800,000',
    valueNumber: 6800000,
    winProbability: 78,
    entryDate: '2024-03-08',
    quoteDate: '2024-03-08',
    expirationDate: '2024-05-15',
    revisedDate: '2024-03-18',
    acceptDate: '',
    paymentTerms: 'Net 60',
    freightTerms: 'FOB Destination',
    owner: 'Marcus Chen',
    version: 4,
    lastUpdated: '2024-03-21',
    tags: ['Biotech', 'Cleanroom'],
    approvalStatus: 'clear',
    pendingApprovals: 0,
    factories: [
      { id: 'f-26', name: 'Kenall' },
      { id: 'f-27', name: 'Columbia' },
    ],
    endUsers: [
      { id: 'eu-16', name: 'BioTech Research Inc' },
      { id: 'eu-17', name: 'Campus Facilities' },
    ],
    insideReps: [{ id: 'ir-14', name: 'House Account' }],
    outsideReps: [
      { id: 'or-14', name: 'Richard Utley' },
      { id: 'or-15', name: 'Sandra Chen' },
      { id: 'or-16', name: 'Mike Ross' },
    ],
    published: true,
  },
  {
    id: 'Q-2024-015',
    name: 'Mercy Hospital - ICU Expansion',
    billToCustomer: 'Graybar Electric',
    soldToCustomer: 'Brasfield & Gorrie',
    jobId: 'J-016',
    jobName: 'Mercy Hospital ICU Wing',
    stage: 'Sent',
    status: 'Open',
    value: '$1,450,000',
    valueNumber: 1450000,
    winProbability: 64,
    entryDate: '2024-03-14',
    quoteDate: '2024-03-14',
    expirationDate: '2024-04-20',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: 'Net 30',
    freightTerms: 'Prepaid & Add',
    owner: 'David Torres',
    version: 2,
    lastUpdated: '2024-03-18',
    tags: ['Healthcare', 'Critical Care'],
    approvalStatus: 'blocked',
    pendingApprovals: 3,
    factories: [
      { id: 'f-28', name: 'Acuity Brands' },
      { id: 'f-29', name: 'Visa Lighting' },
    ],
    endUsers: [{ id: 'eu-18', name: 'Mercy Health System' }],
    insideReps: [{ id: 'ir-15', name: 'House Account' }],
    outsideReps: [{ id: 'or-17', name: 'Robert Taylor' }],
    published: true,
  },
];

const mockSections: Section[] = [
  // Q-2024-001 Sections (Memorial Hospital)
  { id: 'SEC-001', name: 'Interior Lighting', order: 1 },
  { id: 'SEC-002', name: 'Exterior Lighting', order: 2 },
  { id: 'SEC-003', name: 'Controls & Sensors', order: 3 },
  { id: 'SEC-004', name: 'Emergency Systems', order: 4 },
  // Q-2024-002 Sections (Airport Terminal)
  { id: 'SEC-005', name: 'Terminal Lighting', order: 1 },
  { id: 'SEC-006', name: 'Controls & Monitoring', order: 2 },
  // Q-2024-003 Sections (Tech Campus)
  { id: 'SEC-007', name: 'Office Lighting', order: 1 },
  { id: 'SEC-008', name: 'Smart Building', order: 2 },
  // Q-2024-004 Sections (Medical Center)
  { id: 'SEC-009', name: 'Patient Room Lighting', order: 1 },
  { id: 'SEC-010', name: 'Surgical Lighting', order: 2 },
  // Q-2024-005 Sections (University)
  { id: 'SEC-011', name: 'Laboratory Lighting', order: 1 },
  { id: 'SEC-012', name: 'Lecture Hall', order: 2 },
  // Q-2024-006 Sections (Retail Plaza)
  { id: 'SEC-013', name: 'Retail Display', order: 1 },
  { id: 'SEC-014', name: 'Common Areas', order: 2 },
  // Q-2024-007 Sections (Convention Center)
  { id: 'SEC-015', name: 'Exhibition Hall', order: 1 },
  { id: 'SEC-016', name: 'Meeting Rooms', order: 2 },
];

const mockLineItems: LineItem[] = [
  // Section 1: Interior Lighting (8 items)
  {
    id: 'LI-001',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-001',
    sectionName: 'Interior Lighting',
    productNumber: 'LX-4500-LED',
    description: 'Linear LED Fixture 4ft 5000K with Integrated Driver',
    endUser: 'Memorial Hospital',
    quantity: 150,
    uom: 'EA',
    manufacturers: [
      {
        name: 'Acuity Brands',
        basePrice: 245.00,
        commissionRate: 0.10,
        overageShare: 0.90,
        approvalStatus: 'approved',
        approvalDate: '2023-06-15',
        approvalNotes: 'Approved for all lighting products',
      },
    ],
    basePrice: 245.00,
    sellPrice: 275.00,
    level1Price: 302.50,
    level2Price: 315.00,
    level3Price: 330.00,
    overagePercent: 10.9,
    commissionable: true,
    locked: false,
    priceHistory: [220, 225, 230, 235, 240, 242, 245, 245, 248, 250, 248, 245],
    quotedPriceHistory: [250, 255, 260, 265, 270, 272, 275, 275, 278, 280, 278, 275],
    hasSpecSheet: true,
    specSheetUrl: '/specs/LX-4500-LED.pdf',
    outsideRepSplits: [
      { repId: 'or-1', repName: 'Richard Utley', percentage: 60 },
      { repId: 'or-2', repName: 'Mike Thompson', percentage: 40 },
    ],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-002',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-001',
    sectionName: 'Interior Lighting',
    productNumber: 'PLX-200-DIM',
    description: 'Programmable Dimmer Switch with Daylight Harvesting',
    endUser: 'Memorial Hospital',
    quantity: 75,
    manufacturers: [
      {
        name: 'Lutron',
        basePrice: 185.00,
        commissionRate: 0.08,
        overageShare: 0.85,
        approvalStatus: 'not_approved',
        approvalDate: null,
        approvalNotes: null,
      },
      {
        name: 'Leviton',
        basePrice: 178.00,
        commissionRate: 0.07,
        overageShare: 0.80,
        approvalStatus: 'approved',
        approvalDate: '2023-08-15',
        approvalNotes: 'All dimming controls approved',
      },
    ],
    basePrice: 185.00,
    sellPrice: 210.00,
    level1Price: 231.00,
    level2Price: 241.50,
    level3Price: 252.00,
    overagePercent: 13.5,
    commissionable: true,
    locked: false,
    priceHistory: [165, 170, 172, 175, 178, 180, 182, 183, 184, 185, 185, 185],
    quotedPriceHistory: [190, 195, 198, 200, 204, 206, 208, 209, 210, 210, 210, 210],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
    specSheetUrl: '/specs/PLX-200-DIM.pdf',
  },
  {
    id: 'LI-005',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-001',
    sectionName: 'Interior Lighting',
    productNumber: 'LX-2200-REC',
    description: 'Recessed LED Downlight 6" 3000K Dimmable',
    endUser: 'Memorial Hospital',
    quantity: 320,
    manufacturers: [
      {
        name: 'Acuity Brands',
        basePrice: 85.00,
        commissionRate: 0.10,
        overageShare: 0.90,
        approvalStatus: 'approved',
        approvalDate: '2023-06-15',
        approvalNotes: 'Approved for all lighting products',
      },
    ],
    basePrice: 85.00,
    sellPrice: 98.00,
    level1Price: 107.80,
    level2Price: 112.70,
    level3Price: 117.60,
    overagePercent: 15.3,
    commissionable: true,
    locked: false,
    priceHistory: [72, 74, 76, 78, 80, 81, 82, 83, 84, 85, 85, 85],
    quotedPriceHistory: [84, 86, 88, 90, 92, 94, 95, 96, 97, 98, 98, 98],
    hasSpecSheet: true,
    outsideRepSplits: [
      { repId: 'or-3', repName: 'Sarah Williams', percentage: 50 },
      { repId: 'or-4', repName: 'Tom Davis', percentage: 50 },
    ],
    useDivisor: true,
    divisor: 100,
  },
  {
    id: 'LI-006',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-001',
    sectionName: 'Interior Lighting',
    productNumber: 'TRK-LED-30W',
    description: 'Track Light Head LED 30W Adjustable Beam',
    endUser: 'Memorial Hospital',
    quantity: 48,
    manufacturers: [
      {
        name: 'Philips',
        basePrice: 165.00,
        commissionRate: 0.12,
        overageShare: 0.88,
        approvalStatus: 'conditional',
        approvalDate: '2024-01-10',
        approvalNotes: 'Approved only for exterior applications',
      },
    ],
    basePrice: 165.00,
    sellPrice: 189.00,
    level1Price: 207.90,
    level2Price: 217.35,
    level3Price: 226.80,
    overagePercent: 14.5,
    commissionable: true,
    locked: false,
    priceHistory: [145, 148, 150, 152, 155, 158, 160, 162, 163, 164, 165, 165],
    quotedPriceHistory: [168, 172, 175, 178, 181, 184, 186, 188, 189, 189, 189, 189],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-007',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-001',
    sectionName: 'Interior Lighting',
    productNumber: 'PNL-2X4-40W',
    description: 'LED Flat Panel 2x4 40W 4000K Edge-Lit',
    endUser: 'Memorial Hospital',
    quantity: 180,
    manufacturers: [
      {
        name: 'Eaton',
        basePrice: 125.00,
        commissionRate: 0.09,
        overageShare: 0.85,
        approvalStatus: 'approved',
        approvalDate: '2023-11-20',
        approvalNotes: 'All panel products approved',
      },
    ],
    basePrice: 125.00,
    sellPrice: 142.00,
    level1Price: 156.20,
    level2Price: 163.30,
    level3Price: 170.40,
    overagePercent: 13.6,
    commissionable: true,
    locked: false,
    priceHistory: [110, 112, 114, 116, 118, 120, 121, 122, 123, 124, 125, 125],
    quotedPriceHistory: [126, 128, 130, 133, 135, 137, 139, 140, 141, 142, 142, 142],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-008',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-001',
    sectionName: 'Interior Lighting',
    productNumber: 'PEND-MOD-18',
    description: 'Modern Pendant Light 18" Decorative LED',
    endUser: 'Memorial Hospital',
    quantity: 24,
    manufacturers: [
      {
        name: 'WAC Lighting',
        basePrice: 385.00,
        commissionRate: 0.11,
        overageShare: 0.88,
        approvalStatus: 'not_approved',
        approvalDate: null,
        approvalNotes: null,
      },
    ],
    basePrice: 385.00,
    sellPrice: 445.00,
    level1Price: 489.50,
    level2Price: 511.75,
    level3Price: 534.00,
    overagePercent: 15.6,
    commissionable: true,
    locked: false,
    priceHistory: [340, 345, 350, 355, 360, 365, 370, 375, 380, 382, 384, 385],
    quotedPriceHistory: [395, 400, 405, 412, 418, 425, 430, 436, 442, 444, 445, 445],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-009',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-001',
    sectionName: 'Interior Lighting',
    productNumber: 'STRIP-24V-10',
    description: 'LED Strip Light 24V 10ft Roll with Driver',
    endUser: 'Memorial Hospital',
    quantity: 65,
    uom: 'RL',
    manufacturers: [
      {
        name: 'Acuity Brands',
        basePrice: 78.00,
        commissionRate: 0.10,
        overageShare: 0.90,
        approvalStatus: 'approved',
        approvalDate: '2023-06-15',
        approvalNotes: 'Approved for all lighting products',
      },
    ],
    basePrice: 78.00,
    sellPrice: 89.00,
    level1Price: 97.90,
    level2Price: 102.35,
    level3Price: 106.80,
    overagePercent: 14.1,
    commissionable: true,
    locked: false,
    priceHistory: [68, 70, 71, 72, 73, 74, 75, 76, 77, 77, 78, 78],
    quotedPriceHistory: [78, 80, 82, 83, 84, 85, 86, 87, 88, 88, 89, 89],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-010',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-001',
    sectionName: 'Interior Lighting',
    productNumber: 'CAN-6-IC',
    description: 'IC-Rated Can Housing 6" New Construction',
    endUser: 'Memorial Hospital',
    quantity: 320,
    manufacturers: [
      {
        name: 'Eaton',
        basePrice: 28.00,
        commissionRate: 0.09,
        overageShare: 0.85,
        approvalStatus: 'approved',
        approvalDate: '2023-11-20',
        approvalNotes: 'All panel products approved',
      },
    ],
    basePrice: 28.00,
    sellPrice: 32.00,
    level1Price: 35.20,
    level2Price: 36.80,
    level3Price: 38.40,
    overagePercent: 14.3,
    commissionable: true,
    locked: false,
    priceHistory: [24, 25, 25, 26, 26, 27, 27, 27, 28, 28, 28, 28],
    quotedPriceHistory: [28, 29, 29, 30, 30, 31, 31, 31, 32, 32, 32, 32],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },

  // Section 2: Exterior Lighting (6 items)
  {
    id: 'LI-003',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-002',
    sectionName: 'Exterior Lighting',
    productNumber: 'EXT-POLE-150W',
    description: 'LED Pole Mount 150W Area Light with Photocell',
    endUser: 'Memorial Hospital',
    quantity: 45,
    uom: 'EA',
    manufacturers: [
      {
        name: 'Philips',
        basePrice: 520.00,
        commissionRate: 0.12,
        overageShare: 0.88,
        approvalStatus: 'conditional',
        approvalDate: '2024-01-10',
        approvalNotes: 'Approved only for exterior applications',
      },
    ],
    basePrice: 520.00,
    sellPrice: 598.00,
    level1Price: 657.80,
    level2Price: 687.70,
    level3Price: 717.60,
    overagePercent: 15.0,
    commissionable: true,
    locked: true,
    priceHistory: [480, 485, 490, 495, 500, 505, 510, 512, 515, 518, 520, 520],
    quotedPriceHistory: [552, 558, 564, 570, 576, 581, 587, 590, 593, 596, 598, 598],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-011',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-002',
    sectionName: 'Exterior Lighting',
    productNumber: 'WALL-PK-80W',
    description: 'LED Wall Pack 80W Full Cutoff Bronze',
    endUser: 'Memorial Hospital',
    quantity: 32,
    manufacturers: [
      {
        name: 'Philips',
        basePrice: 285.00,
        commissionRate: 0.12,
        overageShare: 0.88,
        approvalStatus: 'conditional',
        approvalDate: '2024-01-10',
        approvalNotes: 'Approved only for exterior applications',
      },
    ],
    basePrice: 285.00,
    sellPrice: 328.00,
    level1Price: 360.80,
    level2Price: 377.20,
    level3Price: 393.60,
    overagePercent: 15.1,
    commissionable: true,
    locked: false,
    priceHistory: [255, 260, 265, 268, 272, 275, 278, 280, 282, 284, 285, 285],
    quotedPriceHistory: [293, 299, 305, 308, 313, 316, 320, 322, 325, 327, 328, 328],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-012',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-002',
    sectionName: 'Exterior Lighting',
    productNumber: 'BOLL-36-LED',
    description: 'Bollard Light 36" LED Pathway 3000K',
    endUser: 'Memorial Hospital',
    quantity: 28,
    manufacturers: [
      {
        name: 'Landscape Forms',
        basePrice: 890.00,
        commissionRate: 0.14,
        overageShare: 0.92,
        approvalStatus: 'unknown',
        approvalDate: null,
        approvalNotes: null,
      },
    ],
    basePrice: 890.00,
    sellPrice: 1045.00,
    level1Price: 1149.50,
    level2Price: 1201.75,
    level3Price: 1254.00,
    overagePercent: 17.4,
    commissionable: true,
    locked: false,
    priceHistory: [820, 830, 840, 850, 860, 870, 875, 880, 885, 888, 890, 890],
    quotedPriceHistory: [960, 975, 985, 998, 1010, 1020, 1028, 1035, 1040, 1043, 1045, 1045],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-013',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-002',
    sectionName: 'Exterior Lighting',
    productNumber: 'FLOOD-200W',
    description: 'LED Flood Light 200W with Yoke Mount',
    endUser: 'Memorial Hospital',
    quantity: 16,
    manufacturers: [
      {
        name: 'Philips',
        basePrice: 445.00,
        commissionRate: 0.12,
        overageShare: 0.88,
        approvalStatus: 'conditional',
        approvalDate: '2024-01-10',
        approvalNotes: 'Approved only for exterior applications',
      },
    ],
    basePrice: 445.00,
    sellPrice: 512.00,
    level1Price: 563.20,
    level2Price: 588.80,
    level3Price: 614.40,
    overagePercent: 15.1,
    commissionable: true,
    locked: false,
    priceHistory: [400, 408, 415, 420, 425, 430, 435, 438, 440, 443, 445, 445],
    quotedPriceHistory: [460, 469, 478, 483, 489, 495, 501, 504, 506, 510, 512, 512],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-014',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-002',
    sectionName: 'Exterior Lighting',
    productNumber: 'CANOPY-100W',
    description: 'LED Canopy Light 100W Surface Mount',
    endUser: 'Memorial Hospital',
    quantity: 12,
    manufacturers: [
      {
        name: 'Eaton',
        basePrice: 365.00,
        commissionRate: 0.09,
        overageShare: 0.85,
        approvalStatus: 'approved',
        approvalDate: '2023-11-20',
        approvalNotes: 'All panel products approved',
      },
    ],
    basePrice: 365.00,
    sellPrice: 420.00,
    level1Price: 462.00,
    level2Price: 483.00,
    level3Price: 504.00,
    overagePercent: 15.1,
    commissionable: true,
    locked: false,
    priceHistory: [325, 330, 335, 340, 345, 350, 355, 358, 360, 363, 365, 365],
    quotedPriceHistory: [374, 380, 386, 391, 397, 403, 409, 412, 414, 418, 420, 420],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-015',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-002',
    sectionName: 'Exterior Lighting',
    productNumber: 'SOFFIT-40W',
    description: 'LED Soffit Light 40W Recessed Mount',
    endUser: 'Memorial Hospital',
    quantity: 24,
    manufacturers: [
      {
        name: 'RAB Lighting',
        basePrice: 145.00,
        commissionRate: 0.08,
        overageShare: 0.82,
        approvalStatus: 'approved',
        approvalDate: '2024-02-01',
        approvalNotes: 'Approved for commercial projects',
      },
    ],
    basePrice: 145.00,
    sellPrice: 167.00,
    level1Price: 183.70,
    level2Price: 192.05,
    level3Price: 200.40,
    overagePercent: 15.2,
    commissionable: true,
    locked: false,
    priceHistory: [128, 130, 132, 134, 136, 138, 140, 142, 143, 144, 145, 145],
    quotedPriceHistory: [147, 150, 152, 154, 157, 159, 161, 164, 165, 166, 167, 167],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },

  // Section 3: Controls & Sensors (6 items)
  {
    id: 'LI-004',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-003',
    sectionName: 'Controls & Sensors',
    productNumber: 'OCC-SENS-360',
    description: '360-Degree Occupancy Sensor with Daylight Override',
    endUser: 'Memorial Hospital',
    quantity: 200,
    manufacturers: [
      {
        name: 'Leviton',
        basePrice: 65.00,
        commissionRate: 0.06,
        overageShare: 0.80,
        approvalStatus: 'approved',
        approvalDate: '2023-09-20',
        approvalNotes: 'Full product line approved',
      },
    ],
    basePrice: 65.00,
    sellPrice: 72.00,
    level1Price: 79.20,
    level2Price: 82.80,
    level3Price: 86.40,
    overagePercent: 10.8,
    commissionable: true,
    locked: false,
    priceHistory: [58, 59, 60, 61, 62, 63, 63, 64, 64, 65, 65, 65],
    quotedPriceHistory: [64, 65, 67, 68, 69, 70, 70, 71, 71, 72, 72, 72],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-016',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-003',
    sectionName: 'Controls & Sensors',
    productNumber: 'DAYLIGHT-CTRL',
    description: 'Daylight Harvesting Controller with BACnet',
    endUser: 'Memorial Hospital',
    quantity: 15,
    manufacturers: [
      {
        name: 'Lutron',
        basePrice: 425.00,
        commissionRate: 0.08,
        overageShare: 0.85,
        approvalStatus: 'not_approved',
        approvalDate: null,
        approvalNotes: null,
      },
    ],
    basePrice: 425.00,
    sellPrice: 489.00,
    level1Price: 537.90,
    level2Price: 562.35,
    level3Price: 586.80,
    overagePercent: 15.1,
    commissionable: true,
    locked: false,
    priceHistory: [380, 385, 390, 395, 400, 405, 410, 415, 418, 422, 425, 425],
    quotedPriceHistory: [437, 443, 449, 454, 460, 466, 472, 478, 481, 486, 489, 489],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-017',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-003',
    sectionName: 'Controls & Sensors',
    productNumber: 'RELAY-8CH',
    description: '8-Channel Lighting Relay Panel 20A',
    endUser: 'Memorial Hospital',
    quantity: 8,
    manufacturers: [
      {
        name: 'Leviton',
        basePrice: 1250.00,
        commissionRate: 0.06,
        overageShare: 0.80,
        approvalStatus: 'approved',
        approvalDate: '2023-09-20',
        approvalNotes: 'Full product line approved',
      },
    ],
    basePrice: 1250.00,
    sellPrice: 1438.00,
    level1Price: 1581.80,
    level2Price: 1653.70,
    level3Price: 1725.60,
    overagePercent: 15.0,
    commissionable: true,
    locked: false,
    priceHistory: [1120, 1140, 1160, 1180, 1200, 1210, 1220, 1230, 1240, 1245, 1250, 1250],
    quotedPriceHistory: [1288, 1311, 1334, 1357, 1380, 1392, 1403, 1415, 1426, 1432, 1438, 1438],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-018',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-003',
    sectionName: 'Controls & Sensors',
    productNumber: 'WALL-DIM-SL',
    description: 'Wall Dimmer Slide Switch 600W LED/CFL',
    endUser: 'Memorial Hospital',
    quantity: 85,
    manufacturers: [
      {
        name: 'Lutron',
        basePrice: 45.00,
        commissionRate: 0.08,
        overageShare: 0.85,
        approvalStatus: 'not_approved',
        approvalDate: null,
        approvalNotes: null,
      },
    ],
    basePrice: 45.00,
    sellPrice: 52.00,
    level1Price: 57.20,
    level2Price: 59.80,
    level3Price: 62.40,
    overagePercent: 15.6,
    commissionable: true,
    locked: false,
    priceHistory: [38, 39, 40, 41, 42, 42, 43, 44, 44, 45, 45, 45],
    quotedPriceHistory: [44, 45, 46, 47, 48, 48, 50, 51, 51, 52, 52, 52],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-019',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-003',
    sectionName: 'Controls & Sensors',
    productNumber: 'PHOTO-EXT',
    description: 'Exterior Photocell Sensor NEMA Twist-Lock',
    endUser: 'Memorial Hospital',
    quantity: 45,
    manufacturers: [
      {
        name: 'Leviton',
        basePrice: 28.00,
        commissionRate: 0.06,
        overageShare: 0.80,
        approvalStatus: 'approved',
        approvalDate: '2023-09-20',
        approvalNotes: 'Full product line approved',
      },
    ],
    basePrice: 28.00,
    sellPrice: 32.00,
    level1Price: 35.20,
    level2Price: 36.80,
    level3Price: 38.40,
    overagePercent: 14.3,
    commissionable: true,
    locked: false,
    priceHistory: [24, 25, 25, 26, 26, 27, 27, 27, 28, 28, 28, 28],
    quotedPriceHistory: [28, 29, 29, 30, 30, 31, 31, 31, 32, 32, 32, 32],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-020',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-003',
    sectionName: 'Controls & Sensors',
    productNumber: 'TIMER-ASTRO',
    description: 'Astronomic Time Clock 7-Day Programmable',
    endUser: 'Memorial Hospital',
    quantity: 6,
    manufacturers: [
      {
        name: 'Intermatic',
        basePrice: 185.00,
        commissionRate: 0.07,
        overageShare: 0.82,
        approvalStatus: 'approved',
        approvalDate: '2024-01-15',
        approvalNotes: 'Timers and controls approved',
      },
    ],
    basePrice: 185.00,
    sellPrice: 213.00,
    level1Price: 234.30,
    level2Price: 244.95,
    level3Price: 255.60,
    overagePercent: 15.1,
    commissionable: true,
    locked: false,
    priceHistory: [165, 168, 170, 173, 175, 178, 180, 182, 183, 184, 185, 185],
    quotedPriceHistory: [190, 193, 196, 199, 201, 205, 207, 209, 211, 212, 213, 213],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },

  // Section 4: Emergency Systems (4 items)
  {
    id: 'LI-021',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-004',
    sectionName: 'Emergency Systems',
    productNumber: 'EXIT-LED-RG',
    description: 'LED Exit Sign Red/Green Dual-Face Universal',
    endUser: 'Memorial Hospital',
    quantity: 65,
    manufacturers: [
      {
        name: 'Lithonia',
        basePrice: 85.00,
        commissionRate: 0.08,
        overageShare: 0.85,
        approvalStatus: 'approved',
        approvalDate: '2023-08-10',
        approvalNotes: 'All emergency products approved',
      },
    ],
    basePrice: 85.00,
    sellPrice: 98.00,
    level1Price: 107.80,
    level2Price: 112.70,
    level3Price: 117.60,
    overagePercent: 15.3,
    commissionable: true,
    locked: false,
    priceHistory: [75, 77, 78, 79, 80, 81, 82, 83, 84, 84, 85, 85],
    quotedPriceHistory: [86, 89, 90, 91, 92, 93, 94, 96, 97, 97, 98, 98],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-022',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-004',
    sectionName: 'Emergency Systems',
    productNumber: 'EMERG-BATT',
    description: 'Emergency Battery Pack 90-Min LED Compatible',
    endUser: 'Memorial Hospital',
    quantity: 120,
    manufacturers: [
      {
        name: 'Lithonia',
        basePrice: 125.00,
        commissionRate: 0.08,
        overageShare: 0.85,
        approvalStatus: 'approved',
        approvalDate: '2023-08-10',
        approvalNotes: 'All emergency products approved',
      },
    ],
    basePrice: 125.00,
    sellPrice: 144.00,
    level1Price: 158.40,
    level2Price: 165.60,
    level3Price: 172.80,
    overagePercent: 15.2,
    commissionable: true,
    locked: false,
    priceHistory: [110, 112, 114, 116, 118, 120, 121, 122, 123, 124, 125, 125],
    quotedPriceHistory: [127, 129, 131, 134, 136, 138, 139, 141, 142, 143, 144, 144],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-023',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-004',
    sectionName: 'Emergency Systems',
    productNumber: 'BUGHEAD-2',
    description: 'Emergency Bug-Eye Light Head Double Face',
    endUser: 'Memorial Hospital',
    quantity: 45,
    manufacturers: [
      {
        name: 'Lithonia',
        basePrice: 165.00,
        commissionRate: 0.08,
        overageShare: 0.85,
        approvalStatus: 'approved',
        approvalDate: '2023-08-10',
        approvalNotes: 'All emergency products approved',
      },
    ],
    basePrice: 165.00,
    sellPrice: 190.00,
    level1Price: 209.00,
    level2Price: 218.50,
    level3Price: 228.00,
    overagePercent: 15.2,
    commissionable: true,
    locked: false,
    priceHistory: [145, 148, 150, 153, 155, 158, 160, 162, 163, 164, 165, 165],
    quotedPriceHistory: [167, 170, 173, 176, 179, 182, 184, 187, 188, 189, 190, 190],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  {
    id: 'LI-024',
    quoteId: 'Q-2024-001',
    sectionId: 'SEC-004',
    sectionName: 'Emergency Systems',
    productNumber: 'INVERT-10KW',
    description: 'Central Inverter System 10kW with Monitoring',
    endUser: 'Memorial Hospital',
    quantity: 2,
    manufacturers: [
      {
        name: 'Myers Emergency Power',
        basePrice: 12500.00,
        commissionRate: 0.05,
        overageShare: 0.75,
        approvalStatus: 'unknown',
        approvalDate: null,
        approvalNotes: null,
      },
    ],
    basePrice: 12500.00,
    sellPrice: 14375.00,
    level1Price: 15812.50,
    level2Price: 16531.25,
    level3Price: 17250.00,
    overagePercent: 15.0,
    commissionable: true,
    locked: true,
    priceHistory: [11200, 11400, 11600, 11800, 12000, 12100, 12200, 12300, 12400, 12450, 12500, 12500],
    quotedPriceHistory: [12880, 13110, 13340, 13570, 13800, 13915, 14030, 14145, 14260, 14318, 14375, 14375],
    hasSpecSheet: true,
    outsideRepSplits: [{ repId: "or-1", repName: "Richard Utley", percentage: 100 }],
    useDivisor: false,
    divisor: 1,
  },
  // Quote Q-2024-002 Line Items (Airport Terminal Expansion)
  {
    id: 'LI-025',
    quoteId: 'Q-2024-002',
    sectionId: 'SEC-005',
    sectionName: 'Terminal Lighting',
    productNumber: 'AIR-LED-4800',
    description: 'High-Bay LED Airport Terminal Light 4800K',
    endUser: 'Metro Airport Authority',
    quantity: 200,
    manufacturers: [{ name: 'Acuity Brands', basePrice: 485.00, commissionRate: 0.10, overageShare: 0.90, approvalStatus: 'approved', approvalDate: '2023-08-01', approvalNotes: 'Approved for all airport projects' }],
    basePrice: 485.00, sellPrice: 545.00, level1Price: 599.50, level2Price: 626.75, level3Price: 654.00, overagePercent: 12.4, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [450, 455, 460, 468, 475, 480, 482, 483, 484, 485, 485, 485], quotedPriceHistory: [506, 512, 518, 526, 534, 540, 542, 543, 544, 545, 545, 545],
  },
  {
    id: 'LI-026',
    quoteId: 'Q-2024-002',
    sectionId: 'SEC-005',
    sectionName: 'Terminal Lighting',
    productNumber: 'RWY-EDGE-LED',
    description: 'Runway Edge Lighting LED Retrofit Kit',
    endUser: 'Metro Airport Authority',
    quantity: 500,
    manufacturers: [{ name: 'ADB Safegate', basePrice: 125.00, commissionRate: 0.08, overageShare: 0.85, approvalStatus: 'approved', approvalDate: '2023-07-15', approvalNotes: null }],
    basePrice: 125.00, sellPrice: 142.50, level1Price: 156.75, level2Price: 163.88, level3Price: 171.00, overagePercent: 14.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [115, 117, 118, 120, 121, 122, 123, 124, 124, 125, 125, 125], quotedPriceHistory: [131, 133, 135, 137, 138, 139, 140, 141, 141, 143, 143, 143],
  },
  {
    id: 'LI-027',
    quoteId: 'Q-2024-002',
    sectionId: 'SEC-006',
    sectionName: 'Controls & Monitoring',
    productNumber: 'CTRL-AIR-500',
    description: 'Airport Lighting Control System 500-Point',
    endUser: 'Metro Airport Authority',
    quantity: 4,
    manufacturers: [{ name: 'Honeywell', basePrice: 18500.00, commissionRate: 0.06, overageShare: 0.80, approvalStatus: 'conditional', approvalDate: '2024-01-20', approvalNotes: 'FAA certification required' }],
    basePrice: 18500.00, sellPrice: 21275.00, level1Price: 23402.50, level2Price: 24466.38, level3Price: 25530.00, overagePercent: 15.0, commissionable: true, locked: true, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [17000, 17200, 17500, 17800, 18000, 18100, 18200, 18300, 18400, 18450, 18500, 18500], quotedPriceHistory: [19550, 19780, 20125, 20470, 20700, 20815, 20930, 21045, 21160, 21218, 21275, 21275],
  },
  {
    id: 'LI-028',
    quoteId: 'Q-2024-002',
    sectionId: 'SEC-006',
    sectionName: 'Controls & Monitoring',
    productNumber: 'SENS-OCC-360',
    description: '360° Occupancy Sensor for High Ceilings',
    endUser: 'Metro Airport Authority',
    quantity: 150,
    manufacturers: [{ name: 'Lutron', basePrice: 95.00, commissionRate: 0.08, overageShare: 0.85, approvalStatus: 'approved', approvalDate: '2023-09-10', approvalNotes: null }],
    basePrice: 95.00, sellPrice: 108.00, level1Price: 118.80, level2Price: 124.20, level3Price: 129.60, overagePercent: 13.7, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [88, 89, 90, 91, 92, 93, 93, 94, 94, 95, 95, 95], quotedPriceHistory: [100, 101, 102, 103, 105, 106, 106, 107, 107, 108, 108, 108],
  },
  // Quote Q-2024-003 Line Items (Tech Campus Phase 2)
  {
    id: 'LI-029',
    quoteId: 'Q-2024-003',
    sectionId: 'SEC-007',
    sectionName: 'Office Lighting',
    productNumber: 'OFF-LED-2X4',
    description: 'LED Troffer 2x4 Direct/Indirect 4000K',
    endUser: 'TechCorp Inc',
    quantity: 400,
    manufacturers: [{ name: 'Philips', basePrice: 195.00, commissionRate: 0.09, overageShare: 0.88, approvalStatus: 'approved', approvalDate: '2023-05-20', approvalNotes: null }],
    basePrice: 195.00, sellPrice: 220.00, level1Price: 242.00, level2Price: 253.00, level3Price: 264.00, overagePercent: 12.8, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [180, 182, 185, 187, 190, 191, 192, 193, 194, 195, 195, 195], quotedPriceHistory: [203, 205, 209, 211, 214, 216, 217, 218, 219, 220, 220, 220],
  },
  {
    id: 'LI-030',
    quoteId: 'Q-2024-003',
    sectionId: 'SEC-007',
    sectionName: 'Office Lighting',
    productNumber: 'DESK-TASK-LED',
    description: 'Under-Cabinet LED Task Light 24"',
    endUser: 'TechCorp Inc',
    quantity: 600,
    manufacturers: [{ name: 'Finelite', basePrice: 85.00, commissionRate: 0.07, overageShare: 0.82, approvalStatus: 'approved', approvalDate: '2023-06-01', approvalNotes: null }],
    basePrice: 85.00, sellPrice: 96.00, level1Price: 105.60, level2Price: 110.40, level3Price: 115.20, overagePercent: 12.9, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [78, 79, 80, 81, 82, 83, 84, 84, 85, 85, 85, 85], quotedPriceHistory: [88, 89, 90, 91, 93, 94, 95, 95, 96, 96, 96, 96],
  },
  {
    id: 'LI-031',
    quoteId: 'Q-2024-003',
    sectionId: 'SEC-008',
    sectionName: 'Smart Building',
    productNumber: 'SMART-DIM-8',
    description: '8-Zone Smart Dimming Panel with BACnet',
    endUser: 'TechCorp Inc',
    quantity: 50,
    manufacturers: [{ name: 'Lutron', basePrice: 1250.00, commissionRate: 0.08, overageShare: 0.85, approvalStatus: 'approved', approvalDate: '2023-07-15', approvalNotes: null }],
    basePrice: 1250.00, sellPrice: 1437.50, level1Price: 1581.25, level2Price: 1653.13, level3Price: 1725.00, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [1150, 1170, 1190, 1200, 1210, 1220, 1230, 1240, 1245, 1250, 1250, 1250], quotedPriceHistory: [1323, 1346, 1369, 1380, 1392, 1403, 1415, 1426, 1432, 1438, 1438, 1438],
  },
  // Quote Q-2024-004 Line Items (Downtown Medical Center)
  {
    id: 'LI-032',
    quoteId: 'Q-2024-004',
    sectionId: 'SEC-009',
    sectionName: 'Patient Room Lighting',
    productNumber: 'MED-BED-LED',
    description: 'Patient Bed Head LED with Night Light Mode',
    endUser: 'St. Mary Medical Center',
    quantity: 250,
    manufacturers: [{ name: 'Visa Lighting', basePrice: 425.00, commissionRate: 0.09, overageShare: 0.87, approvalStatus: 'approved', approvalDate: '2024-01-05', approvalNotes: 'Healthcare certified' }],
    basePrice: 425.00, sellPrice: 488.75, level1Price: 537.63, level2Price: 562.06, level3Price: 586.50, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [395, 400, 405, 410, 415, 418, 420, 422, 424, 425, 425, 425], quotedPriceHistory: [454, 460, 466, 472, 477, 481, 483, 486, 488, 489, 489, 489],
  },
  {
    id: 'LI-033',
    quoteId: 'Q-2024-004',
    sectionId: 'SEC-009',
    sectionName: 'Patient Room Lighting',
    productNumber: 'EXAM-LED-ADJ',
    description: 'Adjustable LED Examination Light',
    endUser: 'St. Mary Medical Center',
    quantity: 120,
    manufacturers: [{ name: 'Steris', basePrice: 1850.00, commissionRate: 0.06, overageShare: 0.80, approvalStatus: 'approved', approvalDate: '2024-01-10', approvalNotes: null }],
    basePrice: 1850.00, sellPrice: 2127.50, level1Price: 2340.25, level2Price: 2446.63, level3Price: 2553.00, overagePercent: 15.0, commissionable: true, locked: true, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [1720, 1750, 1780, 1800, 1820, 1830, 1840, 1845, 1848, 1850, 1850, 1850], quotedPriceHistory: [1978, 2013, 2047, 2070, 2093, 2105, 2116, 2122, 2125, 2128, 2128, 2128],
  },
  {
    id: 'LI-034',
    quoteId: 'Q-2024-004',
    sectionId: 'SEC-010',
    sectionName: 'Surgical Lighting',
    productNumber: 'SURG-LED-MAJ',
    description: 'Major Surgical LED Light System',
    endUser: 'St. Mary Medical Center',
    quantity: 8,
    manufacturers: [{ name: 'Stryker', basePrice: 45000.00, commissionRate: 0.04, overageShare: 0.70, approvalStatus: 'approved', approvalDate: '2023-12-15', approvalNotes: 'Medical device approved' }],
    basePrice: 45000.00, sellPrice: 51750.00, level1Price: 56925.00, level2Price: 59512.50, level3Price: 62100.00, overagePercent: 15.0, commissionable: true, locked: true, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [42000, 42500, 43000, 43500, 44000, 44200, 44500, 44700, 44850, 45000, 45000, 45000], quotedPriceHistory: [48300, 48875, 49450, 50025, 50600, 50830, 51175, 51405, 51578, 51750, 51750, 51750],
  },
  // Quote Q-2024-005 Line Items (University Science Building)
  {
    id: 'LI-035',
    quoteId: 'Q-2024-005',
    sectionId: 'SEC-011',
    sectionName: 'Laboratory Lighting',
    productNumber: 'LAB-CLEAN-LED',
    description: 'Cleanroom LED Fixture IP65 Rated',
    endUser: 'State University',
    quantity: 180,
    manufacturers: [{ name: 'Kenall', basePrice: 685.00, commissionRate: 0.08, overageShare: 0.85, approvalStatus: 'approved', approvalDate: '2023-11-01', approvalNotes: null }],
    basePrice: 685.00, sellPrice: 787.75, level1Price: 866.53, level2Price: 905.91, level3Price: 945.30, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [640, 650, 660, 668, 675, 680, 682, 683, 684, 685, 685, 685], quotedPriceHistory: [736, 748, 759, 768, 776, 782, 784, 786, 787, 788, 788, 788],
  },
  {
    id: 'LI-036',
    quoteId: 'Q-2024-005',
    sectionId: 'SEC-011',
    sectionName: 'Laboratory Lighting',
    productNumber: 'FUME-HOOD-LED',
    description: 'Fume Hood Interior LED Light',
    endUser: 'State University',
    quantity: 45,
    manufacturers: [{ name: 'Waldmann', basePrice: 345.00, commissionRate: 0.07, overageShare: 0.82, approvalStatus: 'not_approved', approvalDate: null, approvalNotes: null }],
    basePrice: 345.00, sellPrice: 396.75, level1Price: 436.43, level2Price: 456.26, level3Price: 476.10, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [320, 325, 330, 335, 338, 340, 342, 343, 344, 345, 345, 345], quotedPriceHistory: [368, 374, 380, 385, 389, 391, 393, 395, 396, 397, 397, 397],
  },
  {
    id: 'LI-037',
    quoteId: 'Q-2024-005',
    sectionId: 'SEC-012',
    sectionName: 'Lecture Hall',
    productNumber: 'LECT-DOWN-LED',
    description: 'Lecture Hall Downlight LED Dimmable',
    endUser: 'State University',
    quantity: 300,
    manufacturers: [{ name: 'Cooper Lighting', basePrice: 145.00, commissionRate: 0.09, overageShare: 0.88, approvalStatus: 'approved', approvalDate: '2023-10-15', approvalNotes: null }],
    basePrice: 145.00, sellPrice: 166.75, level1Price: 183.43, level2Price: 191.76, level3Price: 200.10, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [135, 137, 139, 140, 141, 142, 143, 144, 144, 145, 145, 145], quotedPriceHistory: [155, 158, 160, 161, 162, 164, 165, 166, 166, 167, 167, 167],
  },
  // Quote Q-2024-006 Line Items (Retail Plaza Renovation)
  {
    id: 'LI-038',
    quoteId: 'Q-2024-006',
    sectionId: 'SEC-013',
    sectionName: 'Retail Display',
    productNumber: 'TRACK-LED-ADJ',
    description: 'Adjustable Track Light LED 3000K',
    endUser: 'Plaza Retail Group',
    quantity: 350,
    manufacturers: [{ name: 'WAC Lighting', basePrice: 165.00, commissionRate: 0.10, overageShare: 0.90, approvalStatus: 'approved', approvalDate: '2024-02-01', approvalNotes: null }],
    basePrice: 165.00, sellPrice: 189.75, level1Price: 208.73, level2Price: 218.21, level3Price: 227.70, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [155, 157, 159, 160, 162, 163, 164, 164, 165, 165, 165, 165], quotedPriceHistory: [178, 181, 183, 184, 186, 188, 189, 189, 190, 190, 190, 190],
  },
  {
    id: 'LI-039',
    quoteId: 'Q-2024-006',
    sectionId: 'SEC-013',
    sectionName: 'Retail Display',
    productNumber: 'ACCENT-SPOT',
    description: 'LED Accent Spotlight for Displays',
    endUser: 'Plaza Retail Group',
    quantity: 200,
    manufacturers: [{ name: 'Bruck Lighting', basePrice: 225.00, commissionRate: 0.09, overageShare: 0.87, approvalStatus: 'approved', approvalDate: '2024-02-05', approvalNotes: null }],
    basePrice: 225.00, sellPrice: 258.75, level1Price: 284.63, level2Price: 297.56, level3Price: 310.50, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [210, 213, 216, 218, 220, 221, 222, 223, 224, 225, 225, 225], quotedPriceHistory: [242, 245, 248, 251, 253, 254, 256, 257, 258, 259, 259, 259],
  },
  {
    id: 'LI-040',
    quoteId: 'Q-2024-006',
    sectionId: 'SEC-014',
    sectionName: 'Common Areas',
    productNumber: 'PEND-DEC-LED',
    description: 'Decorative Pendant LED for Mall Corridors',
    endUser: 'Plaza Retail Group',
    quantity: 80,
    manufacturers: [{ name: 'Tech Lighting', basePrice: 485.00, commissionRate: 0.08, overageShare: 0.85, approvalStatus: 'approved', approvalDate: '2024-01-28', approvalNotes: null }],
    basePrice: 485.00, sellPrice: 557.75, level1Price: 613.53, level2Price: 641.41, level3Price: 669.30, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [455, 460, 465, 470, 475, 478, 480, 482, 484, 485, 485, 485], quotedPriceHistory: [523, 529, 535, 541, 546, 550, 552, 554, 557, 558, 558, 558],
  },
  // Quote Q-2024-007 Line Items (Convention Center)
  {
    id: 'LI-041',
    quoteId: 'Q-2024-007',
    sectionId: 'SEC-015',
    sectionName: 'Exhibition Hall',
    productNumber: 'EXPO-HIGH-LED',
    description: 'Exhibition High Bay LED 400W Dimmable',
    endUser: 'Metro Convention Center',
    quantity: 150,
    manufacturers: [{ name: 'Cree Lighting', basePrice: 895.00, commissionRate: 0.08, overageShare: 0.85, approvalStatus: 'approved', approvalDate: '2024-02-10', approvalNotes: null }],
    basePrice: 895.00, sellPrice: 1029.25, level1Price: 1132.18, level2Price: 1183.64, level3Price: 1235.10, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [840, 850, 860, 870, 878, 885, 890, 892, 894, 895, 895, 895], quotedPriceHistory: [966, 978, 989, 1001, 1010, 1018, 1024, 1026, 1028, 1029, 1029, 1029],
  },
  {
    id: 'LI-042',
    quoteId: 'Q-2024-007',
    sectionId: 'SEC-015',
    sectionName: 'Exhibition Hall',
    productNumber: 'FLEX-TRACK-SYS',
    description: 'Flexible Track Lighting System 20ft',
    endUser: 'Metro Convention Center',
    quantity: 60,
    manufacturers: [{ name: 'Lightolier', basePrice: 1250.00, commissionRate: 0.07, overageShare: 0.82, approvalStatus: 'conditional', approvalDate: '2024-02-12', approvalNotes: 'Only for convention use' }],
    basePrice: 1250.00, sellPrice: 1437.50, level1Price: 1581.25, level2Price: 1653.13, level3Price: 1725.00, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [1180, 1195, 1210, 1220, 1230, 1238, 1245, 1248, 1250, 1250, 1250, 1250], quotedPriceHistory: [1357, 1374, 1392, 1403, 1415, 1424, 1432, 1435, 1438, 1438, 1438, 1438],
  },
  {
    id: 'LI-043',
    quoteId: 'Q-2024-007',
    sectionId: 'SEC-016',
    sectionName: 'Meeting Rooms',
    productNumber: 'CONF-CEIL-LED',
    description: 'Conference Room Ceiling LED Panel',
    endUser: 'Metro Convention Center',
    quantity: 200,
    manufacturers: [{ name: 'Armstrong', basePrice: 285.00, commissionRate: 0.09, overageShare: 0.88, approvalStatus: 'approved', approvalDate: '2024-02-08', approvalNotes: null }],
    basePrice: 285.00, sellPrice: 327.75, level1Price: 360.53, level2Price: 376.91, level3Price: 393.30, overagePercent: 15.0, commissionable: true, locked: false, outsideRepSplits: [{ repId: 'or-1', repName: 'Richard Utley', percentage: 100 }], useDivisor: false, divisor: 1, hasSpecSheet: true, priceHistory: [265, 270, 275, 278, 280, 282, 283, 284, 285, 285, 285, 285], quotedPriceHistory: [305, 311, 316, 320, 322, 325, 326, 327, 328, 328, 328, 328],
  },
];

const mockBuilderApprovals: BuilderApproval[] = [
  {
    id: 'BA-001',
    builderId: 'CO-005',
    builderName: 'Turner Construction',
    manufacturerId: 'MFR-001',
    manufacturerName: 'Acuity Brands',
    status: 'approved',
    category: 'Lighting',
    conditions: null,
    approvedSkus: null,
    approvedDate: '2023-06-15',
    expirationDate: null,
    approvedBy: 'John Smith (Procurement)',
    documentUrl: '/docs/acuity-approval.pdf',
    notes: 'Approved for all lighting products across all projects',
  },
  {
    id: 'BA-002',
    builderId: 'CO-005',
    builderName: 'Turner Construction',
    manufacturerId: 'MFR-003',
    manufacturerName: 'Lutron',
    status: 'conditional',
    category: 'Controls',
    conditions: 'Approved only for RadioRA 3 and Homeworks QSX systems',
    approvedSkus: ['RR-3-XXX', 'HQP-XXX'],
    approvedDate: '2024-01-10',
    expirationDate: '2024-12-31',
    approvedBy: 'Mike Johnson (Engineering)',
    documentUrl: '/docs/lutron-conditional.pdf',
    notes: 'Exception granted for smart lighting controls only',
  },
];

const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: 'AR-001',
    quoteId: 'Q-2024-001',
    builderId: 'CO-005',
    builderName: 'Turner Construction',
    manufacturerId: 'MFR-003',
    manufacturerName: 'Lutron',
    status: 'pending',
    requestedDate: '2024-03-18',
    requestedBy: 'Sarah Chen',
    skus: ['PLX-200-DIM', 'PLX-300-DIM'],
    justification: 'Lutron dimmers provide superior daylight harvesting integration with the Acuity fixtures already approved. Lead time is 2 weeks vs 6 weeks for alternatives.',
    attachments: ['lutron-spec-sheet.pdf', 'comparison-chart.pdf'],
    respondedDate: null,
    respondedBy: null,
    responseNotes: null,
    conditions: null,
  },
];

const mockManufacturers: Manufacturer[] = [
  { manufacturer_name: 'A.O. Smith', domain: 'aosmith.com', active: true },
  { manufacturer_name: 'Rheem', domain: 'rheem.com', active: true },
  { manufacturer_name: 'Bradford White', domain: 'bradfordwhite.com', active: true },
  { manufacturer_name: 'Watts Water', domain: 'watts.com', active: true },
  { manufacturer_name: 'Moen', domain: 'moen.com', active: true },
  { manufacturer_name: 'Acuity Brands', domain: 'acuitybrands.com', active: true },
  { manufacturer_name: 'Lutron', domain: 'lutron.com', active: true },
  { manufacturer_name: 'Philips', domain: 'signify.com', active: true },
  { manufacturer_name: 'Leviton', domain: 'leviton.com', active: true },
];

const mockPriceCategories: PriceCategory[] = [
  { price_category_name: 'Stocking', description: 'Products stocked in distributor warehouse', default_discount_percent: 0.25 },
  { price_category_name: 'Buy-Sell', description: 'Direct ship from manufacturer', default_discount_percent: 0.18 },
  { price_category_name: 'Non-Stocking', description: 'Special order products', default_discount_percent: 0.10 },
];

const mockDistributorMatrix: DistributorMatrixEntry[] = [
  { distributor_domain: 'graybar.com', manufacturer_domain: 'acuitybrands.com', price_category: 'Stocking' },
  { distributor_domain: 'graybar.com', manufacturer_domain: 'lutron.com', price_category: 'Buy-Sell' },
  { distributor_domain: 'graybar.com', manufacturer_domain: 'signify.com', price_category: 'Stocking' },
  { distributor_domain: 'hdsupply.com', manufacturer_domain: 'acuitybrands.com', price_category: 'Buy-Sell' },
  { distributor_domain: 'hdsupply.com', manufacturer_domain: 'leviton.com', price_category: 'Stocking' },
  { distributor_domain: 'fergusons.com', manufacturer_domain: 'lutron.com', price_category: 'Non-Stocking' },
];

const mockQuoteFiles: QuoteFile[] = [
  {
    id: 'QF-001',
    quoteId: 'Q-2024-001',
    name: 'Project_Specifications.pdf',
    type: 'application/pdf',
    size: 2458624,
    uploadedAt: '2024-03-15T10:30:00Z',
    uploadedBy: 'Sarah Chen',
    includeInEmail: true,
  },
  {
    id: 'QF-002',
    quoteId: 'Q-2024-001',
    name: 'Lighting_Layout_Rev2.dwg',
    type: 'application/acad',
    size: 5120000,
    uploadedAt: '2024-03-16T14:22:00Z',
    uploadedBy: 'Marcus Chen',
    includeInEmail: false,
  },
  {
    id: 'QF-003',
    quoteId: 'Q-2024-001',
    name: 'Energy_Calculation_Report.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 156000,
    uploadedAt: '2024-03-17T09:15:00Z',
    uploadedBy: 'Sarah Chen',
    includeInEmail: true,
  },
  {
    id: 'QF-004',
    quoteId: 'Q-2024-001',
    name: 'Site_Photos.zip',
    type: 'application/zip',
    size: 15360000,
    uploadedAt: '2024-03-18T11:45:00Z',
    uploadedBy: 'James Wilson',
    includeInEmail: false,
  },
  {
    id: 'QF-005',
    quoteId: 'Q-2024-001',
    name: 'Warranty_Terms.pdf',
    type: 'application/pdf',
    size: 89000,
    uploadedAt: '2024-03-19T08:00:00Z',
    uploadedBy: 'Sarah Chen',
    includeInEmail: true,
  },
];

const mockDistributorQuotes: DistributorQuote[] = [
  {
    id: 'DQ-001',
    baseQuoteId: 'Q-2024-001',
    distributorDomain: 'graybar.com',
    distributorName: 'Graybar Electric',
    status: 'ready_to_send',
    createdAt: '2024-03-20',
    originalTotal: 245000,
    discountedTotal: 195000,
    totalDiscount: 50000,
    discountPercent: 0.204,
    totalLines: 4,
    linesRequiringCross: 0,
    linesCrossed: 0,
    linesApproved: 4,
  },
  {
    id: 'DQ-002',
    baseQuoteId: 'Q-2024-001',
    distributorDomain: 'hdsupply.com',
    distributorName: 'HD Supply',
    status: 'requires_cross',
    createdAt: '2024-03-20',
    originalTotal: 245000,
    discountedTotal: 208250,
    totalDiscount: 36750,
    discountPercent: 0.15,
    totalLines: 4,
    linesRequiringCross: 2,
    linesCrossed: 0,
    linesApproved: 2,
  },
];

// Mock Distributor Quote Line Items
type DistributorQuoteLine = {
  id: string;
  distributorQuoteId: string;
  originalSku: string;
  originalManufacturer: string;
  finalSku: string | null;
  finalManufacturer: string | null;
  priceCategory: string | null;
  originalPrice: number;
  finalPrice: number | null;
  quantity: number;
  status: 'approved' | 'requires_cross' | 'crossed' | 'pending';
  description: string;
};

const mockDistributorQuoteLines: DistributorQuoteLine[] = [
  // Graybar Electric Lines (DQ-001) - All approved
  {
    id: 'DQL-001',
    distributorQuoteId: 'DQ-001',
    originalSku: 'LX-4500-LED',
    originalManufacturer: 'acuitybrands.com',
    finalSku: 'LX-4500-LED',
    finalManufacturer: 'acuitybrands.com',
    priceCategory: 'Stocking',
    originalPrice: 275.00,
    finalPrice: 220.00,
    quantity: 150,
    status: 'approved',
    description: 'Linear LED Fixture 4ft 5000K',
  },
  {
    id: 'DQL-002',
    distributorQuoteId: 'DQ-001',
    originalSku: 'PLX-200-DIM',
    originalManufacturer: 'lutron.com',
    finalSku: 'PLX-200-DIM',
    finalManufacturer: 'lutron.com',
    priceCategory: 'Stocking',
    originalPrice: 210.00,
    finalPrice: 168.00,
    quantity: 75,
    status: 'approved',
    description: 'Programmable Dimmer Switch',
  },
  {
    id: 'DQL-003',
    distributorQuoteId: 'DQ-001',
    originalSku: 'LX-2200-REC',
    originalManufacturer: 'cooperlighting.com',
    finalSku: 'LX-2200-REC',
    finalManufacturer: 'cooperlighting.com',
    priceCategory: 'Buy-Sell',
    originalPrice: 89.00,
    finalPrice: 75.65,
    quantity: 320,
    status: 'approved',
    description: 'Recessed LED Downlight 6"',
  },
  {
    id: 'DQL-004',
    distributorQuoteId: 'DQ-001',
    originalSku: 'EXT-3500-WP',
    originalManufacturer: 'rab.com',
    finalSku: 'EXT-3500-WP',
    finalManufacturer: 'rab.com',
    priceCategory: 'Stocking',
    originalPrice: 425.00,
    finalPrice: 340.00,
    quantity: 45,
    status: 'approved',
    description: 'Exterior Wall Pack LED',
  },
  // HD Supply Lines (DQ-002) - Some require cross
  {
    id: 'DQL-005',
    distributorQuoteId: 'DQ-002',
    originalSku: 'LX-4500-LED',
    originalManufacturer: 'acuitybrands.com',
    finalSku: 'LX-4500-LED',
    finalManufacturer: 'acuitybrands.com',
    priceCategory: 'Buy-Sell',
    originalPrice: 275.00,
    finalPrice: 247.50,
    quantity: 150,
    status: 'approved',
    description: 'Linear LED Fixture 4ft 5000K',
  },
  {
    id: 'DQL-006',
    distributorQuoteId: 'DQ-002',
    originalSku: 'PLX-200-DIM',
    originalManufacturer: 'lutron.com',
    finalSku: null,
    finalManufacturer: null,
    priceCategory: null,
    originalPrice: 210.00,
    finalPrice: null,
    quantity: 75,
    status: 'requires_cross',
    description: 'Programmable Dimmer Switch',
  },
  {
    id: 'DQL-007',
    distributorQuoteId: 'DQ-002',
    originalSku: 'LX-2200-REC',
    originalManufacturer: 'cooperlighting.com',
    finalSku: 'EL-2200-REC',
    finalManufacturer: 'eaton.com',
    priceCategory: 'Stocking',
    originalPrice: 89.00,
    finalPrice: 71.20,
    quantity: 320,
    status: 'crossed',
    description: 'Recessed LED Downlight 6"',
  },
  {
    id: 'DQL-008',
    distributorQuoteId: 'DQ-002',
    originalSku: 'EXT-3500-WP',
    originalManufacturer: 'rab.com',
    finalSku: null,
    finalManufacturer: null,
    priceCategory: null,
    originalPrice: 425.00,
    finalPrice: null,
    quantity: 45,
    status: 'requires_cross',
    description: 'Exterior Wall Pack LED',
  },
];

// Mock Cross Audit Log
type CrossAuditLog = {
  id: string;
  distributorDomain: string;
  timestamp: string;
  skuBefore: string;
  skuAfter: string;
  manufacturerBefore: string;
  manufacturerAfter: string;
  priceCategoryApplied: string;
  discountPercent: number;
  crossSource: string | null;
  aiConfidence: number | null;
};

const mockCrossAuditLog: CrossAuditLog[] = [
  {
    id: 'CAL-001',
    distributorDomain: 'graybar.com',
    timestamp: '2024-03-20T14:30:00',
    skuBefore: 'LX-4500-LED',
    skuAfter: 'LX-4500-LED',
    manufacturerBefore: 'acuitybrands.com',
    manufacturerAfter: 'acuitybrands.com',
    priceCategoryApplied: 'Stocking',
    discountPercent: 0.20,
    crossSource: null,
    aiConfidence: null,
  },
  {
    id: 'CAL-002',
    distributorDomain: 'graybar.com',
    timestamp: '2024-03-20T14:31:00',
    skuBefore: 'PLX-200-DIM',
    skuAfter: 'PLX-200-DIM',
    manufacturerBefore: 'lutron.com',
    manufacturerAfter: 'lutron.com',
    priceCategoryApplied: 'Stocking',
    discountPercent: 0.20,
    crossSource: null,
    aiConfidence: null,
  },
  {
    id: 'CAL-003',
    distributorDomain: 'graybar.com',
    timestamp: '2024-03-20T14:32:00',
    skuBefore: 'LX-2200-REC',
    skuAfter: 'LX-2200-REC',
    manufacturerBefore: 'cooperlighting.com',
    manufacturerAfter: 'cooperlighting.com',
    priceCategoryApplied: 'Buy-Sell',
    discountPercent: 0.15,
    crossSource: null,
    aiConfidence: null,
  },
  {
    id: 'CAL-004',
    distributorDomain: 'hdsupply.com',
    timestamp: '2024-03-20T15:00:00',
    skuBefore: 'LX-4500-LED',
    skuAfter: 'LX-4500-LED',
    manufacturerBefore: 'acuitybrands.com',
    manufacturerAfter: 'acuitybrands.com',
    priceCategoryApplied: 'Buy-Sell',
    discountPercent: 0.10,
    crossSource: null,
    aiConfidence: null,
  },
  {
    id: 'CAL-005',
    distributorDomain: 'hdsupply.com',
    timestamp: '2024-03-20T15:05:00',
    skuBefore: 'LX-2200-REC',
    skuAfter: 'EL-2200-REC',
    manufacturerBefore: 'cooperlighting.com',
    manufacturerAfter: 'eaton.com',
    priceCategoryApplied: 'Stocking',
    discountPercent: 0.20,
    crossSource: 'AI',
    aiConfidence: 0.94,
  },
];

// ============================================
// COMPONENTS
// ============================================

// Mini Sparkline Component with dual data series
function Sparkline({
  manufacturerPriceHistory,
  quotedPriceHistory,
  productNumber,
  width = 60,
  height = 20
}: {
  manufacturerPriceHistory: number[];
  quotedPriceHistory: number[];
  productNumber?: string;
  width?: number;
  height?: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!manufacturerPriceHistory || manufacturerPriceHistory.length === 0) return null;

  // Calculate combined min/max for proper scaling of both lines
  const allData = [...manufacturerPriceHistory, ...(quotedPriceHistory || [])];
  const globalMin = Math.min(...allData);
  const globalMax = Math.max(...allData);
  const globalRange = globalMax - globalMin || 1;

  // Manufacturer price stats
  const mfrMin = Math.min(...manufacturerPriceHistory);
  const mfrMax = Math.max(...manufacturerPriceHistory);
  const mfrAvg = manufacturerPriceHistory.reduce((a, b) => a + b, 0) / manufacturerPriceHistory.length;
  const mfrLastValue = manufacturerPriceHistory[manufacturerPriceHistory.length - 1];
  const mfrFirstValue = manufacturerPriceHistory[0];
  const mfrChange = mfrLastValue - mfrFirstValue;
  const mfrChangePercent = ((mfrChange / mfrFirstValue) * 100).toFixed(1);

  // Quoted price stats
  const hasQuotedData = quotedPriceHistory && quotedPriceHistory.length > 0;
  const quotedMin = hasQuotedData ? Math.min(...quotedPriceHistory) : 0;
  const quotedMax = hasQuotedData ? Math.max(...quotedPriceHistory) : 0;
  const quotedAvg = hasQuotedData ? quotedPriceHistory.reduce((a, b) => a + b, 0) / quotedPriceHistory.length : 0;
  const quotedLastValue = hasQuotedData ? quotedPriceHistory[quotedPriceHistory.length - 1] : 0;
  const quotedFirstValue = hasQuotedData ? quotedPriceHistory[0] : 0;
  const quotedChange = quotedLastValue - quotedFirstValue;
  const quotedChangePercent = hasQuotedData ? ((quotedChange / quotedFirstValue) * 100).toFixed(1) : '0';

  // Calculate points for mini sparkline (manufacturer only for mini view)
  const mfrPoints = manufacturerPriceHistory.map((value, index) => {
    const x = (index / (manufacturerPriceHistory.length - 1)) * width;
    const y = height - ((value - globalMin) / globalRange) * height;
    return `${x},${y}`;
  }).join(' ');

  const quotedPoints = hasQuotedData ? quotedPriceHistory.map((value, index) => {
    const x = (index / (quotedPriceHistory.length - 1)) * width;
    const y = height - ((value - globalMin) / globalRange) * height;
    return `${x},${y}`;
  }).join(' ') : '';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
    setShowTooltip(true);
  };

  const tooltip = showTooltip && typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed z-[9999] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl p-3 w-80"
      style={{
        left: tooltipPos.x,
        top: tooltipPos.y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      }}
    >
      <div className="text-sm font-semibold text-[var(--foreground)] mb-2">
        {productNumber ? `Price History: ${productNumber}` : 'Price History'}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
          <span className="text-[var(--muted-foreground)]">Mfr Price</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500 rounded"></div>
          <span className="text-[var(--muted-foreground)]">Quoted Price</span>
        </div>
      </div>

      {/* Mini Chart with both lines */}
      <div className="bg-[var(--muted)]/20 rounded p-2 mb-3">
        <svg width="100%" height="60" viewBox="0 0 200 60" preserveAspectRatio="none">
          {/* Manufacturer price line (blue) */}
          <polyline
            points={manufacturerPriceHistory.map((value, index) => {
              const x = (index / (manufacturerPriceHistory.length - 1)) * 200;
              const y = 55 - ((value - globalMin) / globalRange) * 50;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Manufacturer current value dot */}
          <circle
            cx="200"
            cy={55 - ((mfrLastValue - globalMin) / globalRange) * 50}
            r="3"
            fill="#3b82f6"
          />

          {/* Quoted price line (green) */}
          {hasQuotedData && (
            <>
              <polyline
                points={quotedPriceHistory.map((value, index) => {
                  const x = (index / (quotedPriceHistory.length - 1)) * 200;
                  const y = 55 - ((value - globalMin) / globalRange) * 50;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Quoted current value dot */}
              <circle
                cx="200"
                cy={55 - ((quotedLastValue - globalMin) / globalRange) * 50}
                r="3"
                fill="#22c55e"
              />
            </>
          )}
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-1">
          {months.slice(0, Math.min(6, manufacturerPriceHistory.length)).map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>

      {/* Stats - Two columns */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Manufacturer Price Stats */}
        <div className="space-y-1">
          <div className="font-medium text-blue-600 mb-1 flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Manufacturer Price
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">12-mo:</span>
            <span className={mfrChange >= 0 ? 'text-red-600' : 'text-green-600'}>
              {mfrChange >= 0 ? '+' : ''}${mfrChange.toFixed(2)} ({mfrChange >= 0 ? '+' : ''}{mfrChangePercent}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Min:</span>
            <span className="text-[var(--foreground)]">${mfrMin.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Max:</span>
            <span className="text-[var(--foreground)]">${mfrMax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Avg:</span>
            <span className="text-[var(--foreground)]">${mfrAvg.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-[var(--border)]">
            <span className="text-[var(--muted-foreground)]">Current:</span>
            <span className="font-medium text-[var(--foreground)]">${mfrLastValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Quoted Price Stats */}
        <div className="space-y-1">
          <div className="font-medium text-green-600 mb-1 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Quoted Price
          </div>
          {hasQuotedData ? (
            <>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">12-mo:</span>
                <span className={quotedChange >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {quotedChange >= 0 ? '+' : ''}${quotedChange.toFixed(2)} ({quotedChange >= 0 ? '+' : ''}{quotedChangePercent}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Min:</span>
                <span className="text-[var(--foreground)]">${quotedMin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Max:</span>
                <span className="text-[var(--foreground)]">${quotedMax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Avg:</span>
                <span className="text-[var(--foreground)]">${quotedAvg.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Current:</span>
                <span className="font-medium text-[var(--foreground)]">${quotedLastValue.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="text-[var(--muted-foreground)] italic">No data</div>
          )}
        </div>
      </div>

      {/* Margin indicator */}
      {hasQuotedData && (
        <div className="mt-2 pt-2 border-t border-[var(--border)] flex justify-between text-xs">
          <span className="text-[var(--muted-foreground)]">Current Margin:</span>
          <span className="font-medium text-[var(--foreground)]">
            ${(quotedLastValue - mfrLastValue).toFixed(2)} ({((quotedLastValue - mfrLastValue) / mfrLastValue * 100).toFixed(1)}%)
          </span>
        </div>
      )}

      {/* Arrow pointer */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
        <div className="w-2 h-2 bg-[var(--card)] border-r border-b border-[var(--border)] rotate-45"></div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <svg width={width} height={height}>
        {/* Manufacturer price line (blue) */}
        <polyline
          points={mfrPoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Quoted price line (green) */}
        {hasQuotedData && (
          <polyline
            points={quotedPoints}
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {tooltip}
    </div>
  );
}

// Win Probability Badge with hover tooltip
function WinProbabilityBadge({ probability, approvalStatus = 'clear' }: { probability: number; approvalStatus?: 'clear' | 'pending' | 'blocked' }) {
  const [showTooltip, setShowTooltip] = useState(false);

  let bgColor = 'bg-green-100 text-green-700';
  let trendIcon = '▲';
  if (probability < 40) {
    bgColor = 'bg-red-100 text-red-700';
    trendIcon = '▼';
  } else if (probability < 70) {
    bgColor = 'bg-yellow-100 text-yellow-700';
    trendIcon = '─';
  }

  // Generate mock factors based on probability
  const factors = [
    { positive: probability >= 50, text: probability >= 50 ? 'Price 5% below avg won quotes' : 'Price higher than avg won quotes' },
    { positive: probability >= 45, text: probability >= 45 ? 'Strong history with customer' : 'Limited history with customer' },
    { positive: probability >= 60, text: probability >= 60 ? 'Preferred manufacturer' : 'Non-preferred manufacturer' },
    { positive: approvalStatus === 'clear', text: approvalStatus === 'clear' ? 'All manufacturers approved' : 'Pending manufacturer approvals' },
    { positive: false, text: '2 competitors on this job' },
  ];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${bgColor} cursor-help flex items-center gap-1`}>
        {probability}% {trendIcon}
      </span>

      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-3 w-72">
          <div className="text-sm font-semibold text-[var(--foreground)] mb-2">
            Win Probability: {probability}%
          </div>

          <div className="space-y-1.5 text-xs mb-3">
            <div className="text-[var(--muted-foreground)] font-medium">Key Factors:</div>
            {factors.map((factor, idx) => (
              <div key={idx} className="flex items-start gap-2">
                {factor.positive ? (
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 flex-shrink-0 mt-0.5">
                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500 flex-shrink-0 mt-0.5">
                    <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                  </svg>
                )}
                <span className="text-[var(--foreground)]">{factor.text}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
            Similar quotes won: 8 of 11 (73%)
          </div>

          {/* Arrow pointer */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px]">
            <div className="w-2 h-2 bg-[var(--card)] border-l border-t border-[var(--border)] rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Approval Status Badge with tooltip
function ApprovalStatusBadge({ status, count, manufacturers = [] }: { status: 'clear' | 'pending' | 'blocked'; count: number; manufacturers?: { name: string; status: string }[] }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Mock manufacturers if not provided
  const pendingMfrs = manufacturers.length > 0 ? manufacturers : [
    { name: 'Lutron', status: 'Awaiting response' },
    { name: 'Signify', status: 'Request not sent' },
  ];

  if (status === 'clear') {
    return (
      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Approved
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1 cursor-help">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="7"/>
            <path d="M10 6v4l2 2" strokeLinecap="round"/>
          </svg>
          {count} Pending
        </span>

        {showTooltip && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-3 w-64">
            <div className="text-sm font-semibold text-[var(--foreground)] mb-2">
              Pending Approvals ({count})
            </div>

            <div className="space-y-2 text-xs">
              {pendingMfrs.slice(0, count).map((mfr, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="font-medium text-[var(--foreground)]">{mfr.name}</span>
                  <span className="text-yellow-600">{mfr.status}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 pt-2 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)]">
                Resolve approvals before sending quote
              </p>
            </div>

            {/* Arrow pointer */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px]">
              <div className="w-2 h-2 bg-[var(--card)] border-l border-t border-[var(--border)] rotate-45"></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1 cursor-help">
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="7"/>
          <path d="M8 8l4 4M12 8l-4 4" strokeLinecap="round"/>
        </svg>
        {count} Blocked
      </span>

      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-3 w-64">
          <div className="text-sm font-semibold text-red-700 mb-2">
            Blocked Approvals ({count})
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-red-50 rounded">
              <span className="font-medium text-[var(--foreground)]">Signify</span>
              <span className="text-red-600">Rejected</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-[var(--border)]">
            <p className="text-xs text-red-600 font-medium">
              Cannot send quote until resolved
            </p>
          </div>

          {/* Arrow pointer */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px]">
            <div className="w-2 h-2 bg-[var(--card)] border-l border-t border-[var(--border)] rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Quote Card Component - memoized to prevent re-renders
const QuoteCard = React.memo(function QuoteCard({ quote, isDragging, onClick }: { quote: Quote; isDragging?: boolean; onClick?: () => void }) {
  const ownerInitials = quote.owner.split(' ').map(n => n[0]).join('');
  const ownerColors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500', 'bg-blue-500'];
  const colorIndex = quote.id.charCodeAt(quote.id.length - 1) % ownerColors.length;

  const isExpiringSoon = new Date(quote.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-md p-3 mb-2 hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <input type="checkbox" className="mt-1 accent-gray-400" onClick={e => e.stopPropagation()} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{quote.name}</h4>
          <p className="text-xs text-gray-500 truncate">{quote.billToCustomer}</p>
        </div>
        <div className={`w-5 h-5 rounded-full ${ownerColors[colorIndex]} flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0`}>
          {ownerInitials}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <span className="font-mono text-gray-500">{quote.id}</span>
        <span className="text-gray-400">v{quote.version}</span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">{quote.value}</span>
        <WinProbabilityBadge probability={quote.winProbability} approvalStatus={quote.approvalStatus} />
      </div>


      {quote.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {quote.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

const SortableQuoteCard = React.memo(function SortableQuoteCard({ quote, onClick }: { quote: Quote; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: quote.id });

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
  }), [transform, transition]);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <QuoteCard quote={quote} isDragging={isDragging} onClick={onClick} />
    </div>
  );
});

// Line Item Approval Status Icon
function LineApprovalIcon({ status }: { status: 'approved' | 'conditional' | 'not_approved' | 'unknown' }) {
  if (status === 'approved') {
    return (
      <span className="text-green-500" title="Approved">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  if (status === 'conditional') {
    return (
      <span className="text-yellow-500" title="Conditional Approval">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
          <circle cx="10" cy="10" r="7"/>
        </svg>
      </span>
    );
  }
  if (status === 'not_approved') {
    return (
      <span className="text-red-500" title="Not Approved - Action Required">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="7"/>
          <path d="M8 8l4 4M12 8l-4 4" strokeLinecap="round"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="text-gray-400" title="Unknown Status">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="7"/>
        <path d="M10 14h.01M8 8a2 2 0 113 1.7c0 .8-.7 1.3-1 1.3" strokeLinecap="round"/>
      </svg>
    </span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function QuotesContent() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [detailTab, setDetailTab] = useState<'lines' | 'approvals' | 'recipients' | 'distributors' | 'files' | 'versions' | 'notes' | 'tasks' | 'activity' | 'settings' | 'submittals'>('lines');
  const [showApprovalRequestModal, setShowApprovalRequestModal] = useState(false);
  const [showCreateSubmittalModal, setShowCreateSubmittalModal] = useState(false);
  const [submittals, setSubmittals] = useState<Submittal[]>(mockSubmittals);
  const [editingSubmittalId, setEditingSubmittalId] = useState<string | null>(null);
  const [showSubmittalConfigModal, setShowSubmittalConfigModal] = useState(false);
  const [selectedSubmittalForDetail, setSelectedSubmittalForDetail] = useState<Submittal | null>(null);

  // PDF and email states for approval requests
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [selectedManufacturerForApproval, setSelectedManufacturerForApproval] = useState<string | null>(null);
  const [pdfTemplate, setPdfTemplate] = useState({
    companyLogo: true,
    companyName: 'FlowConnect Lighting',
    companyAddress: '123 Main Street, Suite 400\nAnytown, ST 12345',
    includeProjectDetails: true,
    includeProductList: true,
    includeSpecSheets: true,
    includeJustification: true,
    headerText: 'Manufacturer Approval Request',
    footerText: 'Thank you for your consideration. Please respond within 5 business days.',
    customMessage: '',
  });
  const [generatedPdfData, setGeneratedPdfData] = useState<{
    manufacturer: string;
    builder: string;
    project: string;
    products: { sku: string; description: string; qty: number; value: number }[];
    justification: string;
    totalValue: number;
  } | null>(null);

  // Quote files state
  const [quoteFiles, setQuoteFiles] = useState<QuoteFile[]>(mockQuoteFiles);

  // Spec sheet selections (line item ID -> include in email)
  const [specSheetSelections, setSpecSheetSelections] = useState<Set<string>>(new Set());
  const [showMarkApprovalModal, setShowMarkApprovalModal] = useState(false);
  const [showDistributorModal, setShowDistributorModal] = useState(false);
  const [selectedDistributorQuote, setSelectedDistributorQuote] = useState<DistributorQuote | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showCreatePdfModal, setShowCreatePdfModal] = useState(false);
  const [printSubmittal, setPrintSubmittal] = useState<Submittal | null>(null);
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showViewsMenu, setShowViewsMenu] = useState(false);

  // Quote settings - price level percentages (dynamic array)
  const [quotePriceLevels, setQuotePriceLevels] = useState([
    { id: 1, percent: 10, description: 'Standard contractor' },
    { id: 2, percent: 15, description: 'Preferred contractor' },
    { id: 3, percent: 20, description: 'List price / MSRP' },
  ]);

  // Colors for price levels
  const priceLevelColors = ['text-blue-600', 'text-purple-600', 'text-orange-600', 'text-green-600', 'text-pink-600', 'text-cyan-600', 'text-red-600', 'text-indigo-600'];

  // Quote settings - show end user per line
  const [showEndUserPerLine, setShowEndUserPerLine] = useState(false);
  const [showSetEndUserModal, setShowSetEndUserModal] = useState(false);
  const [selectedEndUser, setSelectedEndUser] = useState('');

  // Header-level end user (used when not per-line)
  const [headerEndUser, setHeaderEndUser] = useState('');
  const [endUserSameAsCustomer, setEndUserSameAsCustomer] = useState(true);

  // Quote view mode - 'overage' (full) or 'simple' (basic pricing only)
  const [quoteViewMode, setQuoteViewMode] = useState<'overage' | 'simple'>('simple');
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  // Sections visibility - off by default in simple view
  const [showSections, setShowSections] = useState(false);

  // Commission splits settings
  const [showCommissionSplits, setShowCommissionSplits] = useState(false);
  const [showCommissionSplitsModal, setShowCommissionSplitsModal] = useState(false);
  const [commissionSplitsModalItem, setCommissionSplitsModalItem] = useState<LineItem | null>(null);
  const [applyToAllLines, setApplyToAllLines] = useState(false);

  // Line item details modal (for hidden columns in simple view)
  const [showLineDetailsModal, setShowLineDetailsModal] = useState(false);
  const [lineDetailsModalItem, setLineDetailsModalItem] = useState<LineItem | null>(null);

  // Available end users (would come from contacts/companies in real app)
  const availableEndUsers = [
    'Turner Construction',
    'Hensel Phelps',
    'McCarthy Building',
    'Skanska USA',
    'Clark Construction',
    'Webcor Builders',
    'DPR Construction',
    'Swinerton',
    'Holder Construction',
    'Brasfield & Gorrie',
  ];

  // Column visibility state
  type ColumnKey = 'partNumber' | 'description' | 'quantity' | 'uom' | 'endUser' | 'manufacturer' | 'base' | 'sell' | 'sellTotal' | 'overage' | 'overageAmt' | 'commRate' | 'baseComm' | 'overageShare' | 'overageComm' | 'totalEarn' | 'effRate' | 'l1' | 'l2' | 'l3' | 'trend' | 'specSheet' | 'outsideReps' | 'divisor' | 'commissionDiscountPercent' | 'commissionDiscountAmount' | 'lineDiscountPercent' | 'lineDiscountAmount' | 'leadTime';
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(['partNumber', 'description', 'quantity', 'uom', 'manufacturer', 'base', 'sell', 'sellTotal', 'overage', 'overageAmt', 'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'outsideReps', 'divisor']));

  // Column order state for drag-and-drop reordering
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>([
    'partNumber', 'description', 'quantity', 'uom', 'endUser', 'manufacturer',
    'base', 'sell', 'sellTotal', 'divisor',
    'overage', 'overageAmt',
    'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'outsideReps',
    'l1', 'l2', 'l3',
    'commissionDiscountPercent', 'commissionDiscountAmount', 'lineDiscountPercent', 'lineDiscountAmount',
    'leadTime', 'trend', 'specSheet'
  ]);
  const [draggingColumn, setDraggingColumn] = useState<ColumnKey | null>(null);

  // Rep split modal state
  const [repSplitModalItem, setRepSplitModalItem] = useState<LineItem | null>(null);

  // Available outside reps for selection
  const availableOutsideReps = [
    { id: 'or-1', name: 'Richard Utley' },
    { id: 'or-2', name: 'Mike Thompson' },
    { id: 'or-3', name: 'Sarah Williams' },
    { id: 'or-4', name: 'Tom Davis' },
    { id: 'or-5', name: 'Chris Martin' },
    { id: 'or-6', name: 'Lisa Brown' },
    { id: 'or-7', name: 'Brian Clark' },
    { id: 'or-8', name: 'Amy Johnson' },
    { id: 'or-9', name: 'Michelle Lee' },
    { id: 'or-10', name: 'Kevin White' },
  ];

  // Saved views
  type SavedView = { id: string; name: string; columns: ColumnKey[] };
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    { id: 'default', name: 'Default', columns: ['partNumber', 'description', 'quantity', 'manufacturer', 'base', 'sell', 'sellTotal', 'overage', 'l1', 'l2', 'trend'] },
    { id: 'compact', name: 'Compact', columns: ['partNumber', 'description', 'quantity', 'sell', 'sellTotal'] },
    { id: 'earnings', name: 'Earnings View', columns: ['partNumber', 'description', 'quantity', 'manufacturer', 'base', 'sell', 'sellTotal', 'overage', 'overageAmt', 'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate'] },
    { id: 'pricing', name: 'Full Pricing', columns: ['partNumber', 'description', 'quantity', 'manufacturer', 'base', 'sell', 'sellTotal', 'overage', 'overageAmt', 'l1', 'l2', 'l3', 'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'trend'] },
    { id: 'approval', name: 'Approval Focus', columns: ['partNumber', 'description', 'manufacturer', 'base', 'sell', 'sellTotal', 'commRate', 'totalEarn'] },
  ]);
  const [activeView, setActiveView] = useState('earnings');
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const columnDefinitions: { key: ColumnKey; label: string; group: string }[] = [
    { key: 'partNumber', label: 'Part #', group: 'Basic' },
    { key: 'description', label: 'Description', group: 'Basic' },
    { key: 'quantity', label: 'Qty', group: 'Basic' },
    { key: 'uom', label: 'UOM', group: 'Basic' },
    { key: 'endUser', label: 'End User', group: 'Basic' },
    { key: 'manufacturer', label: 'Manufacturer', group: 'Basic' },
    { key: 'base', label: 'Base', group: 'Pricing' },
    { key: 'sell', label: 'Sell', group: 'Pricing' },
    { key: 'sellTotal', label: 'Sell Total', group: 'Pricing' },
    { key: 'divisor', label: 'Multiplier', group: 'Pricing' },
    { key: 'overage', label: 'Over %', group: 'Overage' },
    { key: 'overageAmt', label: 'Over $', group: 'Overage' },
    { key: 'commRate', label: 'Comm %', group: 'Commission' },
    { key: 'baseComm', label: 'Base Comm $', group: 'Commission' },
    { key: 'overageShare', label: 'Ovg Share %', group: 'Commission' },
    { key: 'overageComm', label: 'Ovg Comm $', group: 'Commission' },
    { key: 'totalEarn', label: 'Total Earn', group: 'Commission' },
    { key: 'effRate', label: 'Eff %', group: 'Commission' },
    { key: 'outsideReps', label: 'Outside Reps', group: 'Commission' },
    { key: 'l1', label: 'L1', group: 'Levels' },
    { key: 'l2', label: 'L2', group: 'Levels' },
    { key: 'l3', label: 'L3', group: 'Levels' },
    { key: 'commissionDiscountPercent', label: 'Comm Disc %', group: 'Discounts' },
    { key: 'commissionDiscountAmount', label: 'Comm Disc $', group: 'Discounts' },
    { key: 'lineDiscountPercent', label: 'Line Disc %', group: 'Discounts' },
    { key: 'lineDiscountAmount', label: 'Line Disc $', group: 'Discounts' },
    { key: 'leadTime', label: 'Lead Time', group: 'Details' },
    { key: 'trend', label: 'Trend', group: 'Details' },
    { key: 'specSheet', label: 'Spec', group: 'Details' },
  ];

  const toggleColumn = (col: ColumnKey) => {
    if (quoteViewMode === 'simple') {
      // In simple view, toggle simpleViewColumns
      setSimpleViewColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(col)) {
          newSet.delete(col);
        } else {
          newSet.add(col);
        }
        return newSet;
      });
    } else {
      // In overage view, toggle visibleColumns
      setVisibleColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(col)) {
          newSet.delete(col);
        } else {
          newSet.add(col);
        }
        return newSet;
      });
    }
    setActiveView('custom');
  };

  // Drag and drop handlers for column reordering
  const handleColumnDragStart = (e: React.DragEvent, col: ColumnKey) => {
    setDraggingColumn(col);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e: React.DragEvent, targetCol: ColumnKey) => {
    e.preventDefault();
    if (!draggingColumn || draggingColumn === targetCol) return;

    const newOrder = [...columnOrder];
    const dragIndex = newOrder.indexOf(draggingColumn);
    const targetIndex = newOrder.indexOf(targetCol);

    if (dragIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(dragIndex, 1);
      newOrder.splice(targetIndex, 0, draggingColumn);
      setColumnOrder(newOrder);
    }
  };

  const handleColumnDragEnd = () => {
    setDraggingColumn(null);
    setActiveView('custom');
  };

  // Get ordered columns that are visible
  const getOrderedVisibleColumns = (): ColumnKey[] => {
    return columnOrder.filter(col => effectiveVisibleColumns.has(col));
  };

  // Get CSS order value for a column based on columnOrder
  const getColumnOrder = (colKey: ColumnKey): number => {
    const index = columnOrder.indexOf(colKey);
    return index === -1 ? 999 : index;
  };

  // Render a table header cell for a given column key
  const renderHeaderCell = (colKey: ColumnKey): React.ReactNode => {
    const col = columnDefinitions.find(c => c.key === colKey);
    if (!col) return null;

    // Map column keys to their sortable names
    const sortableColumns = ['partNumber', 'description', 'quantity', 'manufacturer', 'base', 'sell', 'endUser'];
    const filterableColumns = ['partNumber', 'description', 'manufacturer', 'endUser'];
    const isSortable = sortableColumns.includes(colKey);
    const isFilterable = filterableColumns.includes(colKey);

    // Special case for endUser - only show if showEndUserPerLine is true
    if (colKey === 'endUser' && !showEndUserPerLine) return null;

    return (
      <th key={colKey} className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase relative whitespace-nowrap">
        <div className="flex items-center gap-1">
          <span
            className={isSortable ? "cursor-pointer hover:text-[var(--foreground)]" : ""}
            onClick={isSortable ? () => handleSort(colKey as 'partNumber' | 'description' | 'quantity' | 'manufacturer' | 'base' | 'sell') : undefined}
          >
            {col.label}
          </span>
          {isSortable && sortColumn === colKey && (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
              <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {isFilterable && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveFilterColumn(activeFilterColumn === colKey ? null : colKey); }}
              className={`p-0.5 rounded hover:bg-[var(--muted)] ${columnFilters[colKey] ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        {isFilterable && activeFilterColumn === colKey && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
            <input
              type="text"
              placeholder={`Filter ${col.label}...`}
              value={columnFilters[colKey] || ''}
              onChange={(e) => handleFilterChange(colKey, e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            {columnFilters[colKey] && (
              <button
                onClick={(e) => { e.stopPropagation(); handleFilterChange(colKey, ''); }}
                className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </th>
    );
  };

  // Render a table body cell for a given column key and line item (for Simple View)
  const renderBodyCell = (colKey: ColumnKey, item: LineItem): React.ReactNode => {
    // Special case for endUser - only show if showEndUserPerLine is true
    if (colKey === 'endUser' && !showEndUserPerLine) return null;

    switch (colKey) {
      case 'partNumber':
        return <td key={colKey} className="px-3 py-2 font-mono text-sm">{item.productNumber}</td>;
      case 'description':
        return <td key={colKey} className="px-3 py-2 text-sm max-w-[200px] truncate">{item.description}</td>;
      case 'quantity':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => {
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? { ...li, quantity: parseInt(e.target.value) || 1 } : li
                ));
              }}
              className="w-16 px-2 py-1 text-center border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none"
            />
          </td>
        );
      case 'uom':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.uom || 'EA'}</td>;
      case 'endUser':
        return (
          <td key={colKey} className="px-3 py-2 text-sm">
            <input
              type="text"
              value={item.endUser || ''}
              onChange={(e) => {
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? { ...li, endUser: e.target.value } : li
                ));
              }}
              placeholder="—"
              className="w-24 px-2 py-1 border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none text-sm"
            />
          </td>
        );
      case 'manufacturer':
        return <td key={colKey} className="px-3 py-2 text-sm">{item.manufacturers[0]?.name || '—'}</td>;
      case 'base':
        return <td key={colKey} className="px-3 py-2 text-sm text-right text-[var(--muted-foreground)]">${item.basePrice.toLocaleString()}</td>;
      case 'sell':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-right">
            <input
              type="text"
              value={`$${item.sellPrice.toLocaleString()}`}
              onChange={(e) => {
                const val = parseFloat(e.target.value.replace(/[$,]/g, '')) || 0;
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? { ...li, sellPrice: val } : li
                ));
              }}
              className="w-24 px-2 py-1 text-right border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none"
            />
          </td>
        );
      case 'sellTotal':
        return <td key={colKey} className="px-3 py-2 text-sm text-right font-medium">${(item.sellPrice * item.quantity).toLocaleString()}</td>;
      case 'commissionDiscountPercent':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.commissionDiscountPercent ? `${item.commissionDiscountPercent}%` : '—'}</td>;
      case 'commissionDiscountAmount':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.commissionDiscountAmount ? `$${item.commissionDiscountAmount}` : '—'}</td>;
      case 'lineDiscountPercent':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.lineDiscountPercent ? `${item.lineDiscountPercent}%` : '—'}</td>;
      case 'lineDiscountAmount':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.lineDiscountAmount ? `$${item.lineDiscountAmount}` : '—'}</td>;
      case 'leadTime':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.leadTime || '—'}</td>;
      case 'divisor':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.useDivisor ? item.divisor : '—'}</td>;
      case 'trend':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">—</td>;
      case 'specSheet':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            {item.hasSpecSheet ? (
              <a href={item.specSheetUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">View</a>
            ) : '—'}
          </td>
        );
      // Overage view columns (not typically shown in simple view but included for completeness)
      case 'overage':
        return <td key={colKey} className="px-3 py-2 text-sm text-center">{item.overagePercent}%</td>;
      case 'overageAmt':
        return <td key={colKey} className="px-3 py-2 text-sm text-right">${((item.sellPrice - item.basePrice) * item.quantity).toLocaleString()}</td>;
      case 'commRate':
        return <td key={colKey} className="px-3 py-2 text-sm text-center">{item.manufacturers[0]?.commissionRate || 0}%</td>;
      case 'baseComm':
        return <td key={colKey} className="px-3 py-2 text-sm text-right">${(item.basePrice * item.quantity * (item.manufacturers[0]?.commissionRate || 0) / 100).toLocaleString()}</td>;
      case 'overageShare':
        return <td key={colKey} className="px-3 py-2 text-sm text-center">{item.manufacturers[0]?.overageShare || 0}%</td>;
      case 'overageComm':
        return <td key={colKey} className="px-3 py-2 text-sm text-right">${(((item.sellPrice - item.basePrice) * item.quantity) * (item.manufacturers[0]?.overageShare || 0) / 100).toLocaleString()}</td>;
      case 'totalEarn':
        const baseCommVal = item.basePrice * item.quantity * (item.manufacturers[0]?.commissionRate || 0) / 100;
        const overageCommVal = ((item.sellPrice - item.basePrice) * item.quantity) * (item.manufacturers[0]?.overageShare || 0) / 100;
        return <td key={colKey} className="px-3 py-2 text-sm text-right font-medium">${(baseCommVal + overageCommVal).toLocaleString()}</td>;
      case 'effRate':
        const totalEarnVal = (item.basePrice * item.quantity * (item.manufacturers[0]?.commissionRate || 0) / 100) + (((item.sellPrice - item.basePrice) * item.quantity) * (item.manufacturers[0]?.overageShare || 0) / 100);
        const sellTotalVal = item.sellPrice * item.quantity;
        return <td key={colKey} className="px-3 py-2 text-sm text-center">{sellTotalVal > 0 ? ((totalEarnVal / sellTotalVal) * 100).toFixed(1) : 0}%</td>;
      case 'l1':
        return <td key={colKey} className="px-3 py-2 text-sm text-right text-[var(--muted-foreground)]">${item.level1Price.toLocaleString()}</td>;
      case 'l2':
        return <td key={colKey} className="px-3 py-2 text-sm text-right text-[var(--muted-foreground)]">${item.level2Price.toLocaleString()}</td>;
      case 'l3':
        return <td key={colKey} className="px-3 py-2 text-sm text-right text-[var(--muted-foreground)]">${item.level3Price.toLocaleString()}</td>;
      case 'outsideReps':
        return <td key={colKey} className="px-3 py-2 text-sm text-center">{item.outsideRepSplits.length > 0 ? item.outsideRepSplits.length : '—'}</td>;
      default:
        return <td key={colKey} className="px-3 py-2 text-sm">—</td>;
    }
  };

  const applyView = (viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      setVisibleColumns(new Set(view.columns));
      setActiveView(viewId);
    }
    setShowViewsMenu(false);
  };

  const saveCurrentView = () => {
    if (newViewName.trim()) {
      const newView: SavedView = {
        id: `custom-${Date.now()}`,
        name: newViewName.trim(),
        columns: Array.from(visibleColumns) as ColumnKey[],
      };
      setSavedViews(prev => [...prev, newView]);
      setActiveView(newView.id);
      setNewViewName('');
      setShowSaveViewModal(false);
    }
  };

  // Columns for Simple View (basic pricing only - no overage/commission columns)
  const [simpleViewColumns, setSimpleViewColumns] = useState<Set<ColumnKey>>(new Set(['partNumber', 'description', 'quantity', 'uom', 'manufacturer', 'base', 'sell', 'sellTotal']));

  // For backward compatibility
  const simpleQuoteColumns = simpleViewColumns;

  // Effective visible columns based on view mode
  const effectiveVisibleColumns = quoteViewMode === 'simple' ? simpleViewColumns : visibleColumns;

  const deleteView = (viewId: string) => {
    if (['default', 'compact', 'pricing', 'approval'].includes(viewId)) return; // Can't delete built-in views
    setSavedViews(prev => prev.filter(v => v.id !== viewId));
    if (activeView === viewId) {
      applyView('default');
    }
  };
  const [showSetOverageModal, setShowSetOverageModal] = useState(false);
  const [overageModalTab, setOverageModalTab] = useState<'percentage' | 'targetPrice' | 'targetMargin'>('percentage');
  const [overageInputPercent, setOverageInputPercent] = useState('10');
  const [overageInputTargetPrice, setOverageInputTargetPrice] = useState('');
  const [overageInputTargetMargin, setOverageInputTargetMargin] = useState('');
  const [showCopyPriceModal, setShowCopyPriceModal] = useState<'l1' | 'l2' | 'l3' | null>(null);
  const [showPriceLookupModal, setShowPriceLookupModal] = useState<string | null>(null);
  const [priceLookupTargetPrice, setPriceLookupTargetPrice] = useState('');
  const [expandedLineItems, setExpandedLineItems] = useState<Set<string>>(new Set());
  const [showOverageCalculator, setShowOverageCalculator] = useState(false);
  const [sidebarTargetSell, setSidebarTargetSell] = useState('');
  const [sidebarTargetOveragePercent, setSidebarTargetOveragePercent] = useState('');
  const [sidebarTargetOverageAmount, setSidebarTargetOverageAmount] = useState('');
  const [showMinOverageModal, setShowMinOverageModal] = useState(false);
  const [minOverageInput, setMinOverageInput] = useState('');
  const [showAutoCalcModal, setShowAutoCalcModal] = useState(false);
  const [autoCalcMode, setAutoCalcMode] = useState<'overage' | 'commission'>('overage');
  const [autoCalcTargetOverage, setAutoCalcTargetOverage] = useState('');
  const [autoCalcTargetCommission, setAutoCalcTargetCommission] = useState('');
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showConvertToOrderModal, setShowConvertToOrderModal] = useState(false);
  const [showQuotePdfPreview, setShowQuotePdfPreview] = useState(false);
  const [editingField, setEditingField] = useState<'billTo' | 'soldTo' | 'job' | null>(null);
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [recipientQuoteVersion, setRecipientQuoteVersion] = useState(1);
  const [showCompareView, setShowCompareView] = useState(false);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  // Recipients list for dropdown - always populate with mock data for demo
  const recipients: Recipient[] = [
    { id: 'rec-1', company: 'Graybar Electric', contact: 'John Smith', email: 'john@graybar.com', level: 'Sell' as const, price: 0, sent: 'Mar 15', opened: true, distributorQuote: null, version: 3 },
    { id: 'rec-2', company: 'HD Supply', contact: 'Sarah Lee', email: 'sarah@hdsupply.com', level: 'L1' as const, price: 0, sent: null, opened: false, distributorQuote: null, version: 2 },
    { id: 'rec-3', company: selectedQuote?.soldToCustomer || 'Turner Construction', contact: 'Mike Johnson', email: 'mike@turner.com', level: 'Sell' as const, price: 0, sent: 'Mar 15', opened: true, distributorQuote: null, version: 3 },
    { id: 'rec-4', company: 'Echo Electric', contact: 'Amy Wong', email: 'amy@echo.com', level: 'L1' as const, price: 0, sent: null, opened: false, distributorQuote: null, version: 1 },
  ];
  const [showSummaryBar, setShowSummaryBar] = useState(true);
  const [showHeaderFields, setShowHeaderFields] = useState(true);

  // Line items table state
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Quotes list sorting state
  type QuoteSortKey = 'id' | 'status' | 'valueNumber' | 'entryDate' | 'quoteDate' | 'expirationDate' | 'factories' | 'soldToCustomer' | 'jobName' | 'endUsers' | 'insideReps' | 'outsideReps' | 'published' | 'stage' | 'billToCustomer' | 'winProbability' | 'approvalStatus' | 'tags';
  const [quotesSortColumn, setQuotesSortColumn] = useState<QuoteSortKey | null>('entryDate');
  const [quotesSortDirection, setQuotesSortDirection] = useState<'asc' | 'desc'>('desc');

  // Quotes list filter state
  type QuoteFilterValue = {
    type: 'text' | 'select' | 'multiselect' | 'daterange';
    value: string;
    values?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
  const [quoteColumnFilters, setQuoteColumnFilters] = useState<Record<QuoteSortKey, QuoteFilterValue | null>>({} as Record<QuoteSortKey, QuoteFilterValue | null>);
  const [activeQuoteFilterColumn, setActiveQuoteFilterColumn] = useState<QuoteSortKey | null>(null);
  const [filterSearchText, setFilterSearchText] = useState('');

  const handleQuotesSort = (column: QuoteSortKey) => {
    if (quotesSortColumn === column) {
      setQuotesSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setQuotesSortColumn(column);
      setQuotesSortDirection('asc');
    }
  };

  const handleQuoteFilterChange = (column: QuoteSortKey, filter: QuoteFilterValue | null) => {
    setQuoteColumnFilters(prev => ({
      ...prev,
      [column]: filter
    }));
  };

  const clearQuoteFilter = (column: QuoteSortKey) => {
    setQuoteColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
    setActiveQuoteFilterColumn(null);
  };

  // Get unique values for picklist filters
  const getUniqueValuesForColumn = (column: QuoteSortKey): string[] => {
    const values = new Set<string>();
    quotes.forEach(quote => {
      switch (column) {
        case 'status':
          values.add(quote.status);
          break;
        case 'stage':
          values.add(quote.stage);
          break;
        case 'factories':
          quote.factories.forEach(f => values.add(f.name));
          break;
        case 'soldToCustomer':
          values.add(quote.soldToCustomer);
          break;
        case 'billToCustomer':
          values.add(quote.billToCustomer);
          break;
        case 'jobName':
          values.add(quote.jobName);
          break;
        case 'endUsers':
          quote.endUsers.forEach(e => values.add(e.name));
          break;
        case 'insideReps':
          quote.insideReps.forEach(r => values.add(r.name));
          break;
        case 'outsideReps':
          quote.outsideReps.forEach(r => values.add(r.name));
          break;
        case 'tags':
          quote.tags.forEach(t => values.add(t));
          break;
        case 'approvalStatus':
          values.add(quote.approvalStatus);
          break;
      }
    });
    return Array.from(values).sort();
  };

  // Determine filter type for each column
  const getFilterType = (column: QuoteSortKey): 'text' | 'select' | 'multiselect' | 'daterange' => {
    switch (column) {
      case 'status':
      case 'stage':
      case 'approvalStatus':
      case 'published':
        return 'select';
      case 'factories':
      case 'endUsers':
      case 'insideReps':
      case 'outsideReps':
      case 'tags':
        return 'multiselect';
      case 'entryDate':
      case 'quoteDate':
      case 'expirationDate':
        return 'daterange';
      default:
        return 'text';
    }
  };

  // Render filter dropdown content based on filter type
  const renderFilterDropdown = (column: QuoteSortKey, label: string) => {
    const filterType = getFilterType(column);
    const currentFilter = quoteColumnFilters[column];
    const uniqueValues = ['select', 'multiselect'].includes(filterType) ? getUniqueValuesForColumn(column) : [];
    const filteredValues = uniqueValues.filter(v =>
      v.toLowerCase().includes(filterSearchText.toLowerCase())
    );

    // For published column, provide Yes/No options
    const publishedOptions = column === 'published' ? ['Yes', 'No'] : filteredValues;
    const displayValues = column === 'published' ? publishedOptions : filteredValues;

    return (
      <div
        className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-30 min-w-[200px]"
        onClick={(e) => e.stopPropagation()}
      >
        {filterType === 'text' && (
          <>
            <input
              type="text"
              placeholder={`Filter ${label}...`}
              value={currentFilter?.value || ''}
              onChange={(e) => handleQuoteFilterChange(column, { type: 'text', value: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              autoFocus
            />
            {currentFilter?.value && (
              <button
                onClick={() => clearQuoteFilter(column)}
                className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Clear filter
              </button>
            )}
          </>
        )}

        {filterType === 'select' && (
          <>
            <div className="max-h-[200px] overflow-y-auto">
              {displayValues.map(value => (
                <label key={value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                  <input
                    type="radio"
                    name={`filter-${column}`}
                    checked={currentFilter?.value === value}
                    onChange={() => handleQuoteFilterChange(column, { type: 'select', value })}
                    className="rounded-full"
                  />
                  <span className="text-sm">{value}</span>
                </label>
              ))}
            </div>
            {currentFilter?.value && (
              <button
                onClick={() => clearQuoteFilter(column)}
                className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] block w-full text-left px-2"
              >
                Clear filter
              </button>
            )}
          </>
        )}

        {filterType === 'multiselect' && (
          <>
            <input
              type="text"
              placeholder="Search..."
              value={filterSearchText}
              onChange={(e) => setFilterSearchText(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-2"
              autoFocus
            />
            <div className="max-h-[200px] overflow-y-auto">
              {displayValues.map(value => (
                <label key={value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentFilter?.values?.includes(value) || false}
                    onChange={(e) => {
                      const currentValues = currentFilter?.values || [];
                      const newValues = e.target.checked
                        ? [...currentValues, value]
                        : currentValues.filter(v => v !== value);
                      if (newValues.length === 0) {
                        clearQuoteFilter(column);
                      } else {
                        handleQuoteFilterChange(column, { type: 'multiselect', value: '', values: newValues });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{value}</span>
                </label>
              ))}
            </div>
            {currentFilter?.values && currentFilter.values.length > 0 && (
              <button
                onClick={() => clearQuoteFilter(column)}
                className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] block w-full text-left px-2"
              >
                Clear all ({currentFilter.values.length} selected)
              </button>
            )}
          </>
        )}

        {filterType === 'daterange' && (
          <>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-[var(--muted-foreground)]">From</label>
                <input
                  type="date"
                  value={currentFilter?.dateFrom || ''}
                  onChange={(e) => handleQuoteFilterChange(column, {
                    type: 'daterange',
                    value: '',
                    dateFrom: e.target.value,
                    dateTo: currentFilter?.dateTo
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted-foreground)]">To</label>
                <input
                  type="date"
                  value={currentFilter?.dateTo || ''}
                  onChange={(e) => handleQuoteFilterChange(column, {
                    type: 'daterange',
                    value: '',
                    dateFrom: currentFilter?.dateFrom,
                    dateTo: e.target.value
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
            {(currentFilter?.dateFrom || currentFilter?.dateTo) && (
              <button
                onClick={() => clearQuoteFilter(column)}
                className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Clear filter
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  // Check if a column has an active filter
  const hasActiveFilter = (column: QuoteSortKey): boolean => {
    const filter = quoteColumnFilters[column];
    if (!filter) return false;
    switch (filter.type) {
      case 'text': return !!filter.value;
      case 'select': return !!filter.value;
      case 'multiselect': return !!filter.values && filter.values.length > 0;
      case 'daterange': return !!filter.dateFrom || !!filter.dateTo;
      default: return false;
    }
  };

  // Sorted and filtered quotes for list view
  const sortedQuotes = useMemo(() => {
    // First apply filters
    let result = quotes.filter(quote => {
      for (const [column, filter] of Object.entries(quoteColumnFilters)) {
        if (!filter) continue;

        const col = column as QuoteSortKey;

        switch (filter.type) {
          case 'text': {
            const searchVal = filter.value.toLowerCase();
            if (!searchVal) continue;

            let fieldValue = '';
            switch (col) {
              case 'id': fieldValue = quote.id; break;
              case 'soldToCustomer': fieldValue = quote.soldToCustomer; break;
              case 'billToCustomer': fieldValue = quote.billToCustomer; break;
              case 'jobName': fieldValue = quote.jobName; break;
              case 'valueNumber': fieldValue = quote.value; break;
            }
            if (!fieldValue.toLowerCase().includes(searchVal)) return false;
            break;
          }
          case 'select': {
            if (!filter.value) continue;
            let fieldValue = '';
            switch (col) {
              case 'status': fieldValue = quote.status; break;
              case 'stage': fieldValue = quote.stage; break;
              case 'approvalStatus': fieldValue = quote.approvalStatus; break;
              case 'published': fieldValue = quote.published ? 'Yes' : 'No'; break;
            }
            if (fieldValue !== filter.value) return false;
            break;
          }
          case 'multiselect': {
            if (!filter.values || filter.values.length === 0) continue;
            let fieldValues: string[] = [];
            switch (col) {
              case 'factories': fieldValues = quote.factories.map(f => f.name); break;
              case 'endUsers': fieldValues = quote.endUsers.map(e => e.name); break;
              case 'insideReps': fieldValues = quote.insideReps.map(r => r.name); break;
              case 'outsideReps': fieldValues = quote.outsideReps.map(r => r.name); break;
              case 'tags': fieldValues = quote.tags; break;
            }
            // Check if any of the filter values match any field values
            if (!filter.values.some(v => fieldValues.includes(v))) return false;
            break;
          }
          case 'daterange': {
            let dateVal = '';
            switch (col) {
              case 'entryDate': dateVal = quote.entryDate; break;
              case 'quoteDate': dateVal = quote.quoteDate; break;
              case 'expirationDate': dateVal = quote.expirationDate; break;
            }
            if (filter.dateFrom && dateVal < filter.dateFrom) return false;
            if (filter.dateTo && dateVal > filter.dateTo) return false;
            break;
          }
        }
      }
      return true;
    });

    // Then sort
    if (quotesSortColumn) {
      result.sort((a, b) => {
        let aVal: string | number | boolean;
        let bVal: string | number | boolean;

        switch (quotesSortColumn) {
          case 'id':
            aVal = a.id;
            bVal = b.id;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          case 'stage':
            aVal = a.stage;
            bVal = b.stage;
            break;
          case 'valueNumber':
            aVal = a.valueNumber;
            bVal = b.valueNumber;
            break;
          case 'billToCustomer':
            aVal = a.billToCustomer;
            bVal = b.billToCustomer;
            break;
          case 'entryDate':
            aVal = a.entryDate;
            bVal = b.entryDate;
            break;
          case 'quoteDate':
            aVal = a.quoteDate;
            bVal = b.quoteDate;
            break;
          case 'expirationDate':
            aVal = a.expirationDate;
            bVal = b.expirationDate;
            break;
          case 'factories':
            aVal = a.factories.length > 0 ? a.factories[0].name : '';
            bVal = b.factories.length > 0 ? b.factories[0].name : '';
            break;
          case 'soldToCustomer':
            aVal = a.soldToCustomer;
            bVal = b.soldToCustomer;
            break;
          case 'jobName':
            aVal = a.jobName;
            bVal = b.jobName;
            break;
          case 'winProbability':
            aVal = a.winProbability;
            bVal = b.winProbability;
            break;
          case 'approvalStatus':
            aVal = a.approvalStatus;
            bVal = b.approvalStatus;
            break;
          case 'endUsers':
            aVal = a.endUsers.length > 0 ? a.endUsers[0].name : '';
            bVal = b.endUsers.length > 0 ? b.endUsers[0].name : '';
            break;
          case 'insideReps':
            aVal = a.insideReps.length > 0 ? a.insideReps[0].name : '';
            bVal = b.insideReps.length > 0 ? b.insideReps[0].name : '';
            break;
          case 'outsideReps':
            aVal = a.outsideReps.length > 0 ? a.outsideReps[0].name : '';
            bVal = b.outsideReps.length > 0 ? b.outsideReps[0].name : '';
            break;
          case 'published':
            aVal = a.published ? 1 : 0;
            bVal = b.published ? 1 : 0;
            break;
          case 'tags':
            aVal = a.tags.join(',');
            bVal = b.tags.join(',');
            break;
          default:
            return 0;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return quotesSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return quotesSortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
    }

    return result;
  }, [quotes, quotesSortColumn, quotesSortDirection, quoteColumnFilters]);
  const [activeFilterColumn, setActiveFilterColumn] = useState<ColumnKey | null>(null);
  const [editingCell, setEditingCell] = useState<{ itemId: string; column: ColumnKey } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Editable columns in order for navigation
  const editableColumns: ColumnKey[] = ['sell', 'overage', 'l1', 'l2'];

  const handleSort = (column: ColumnKey) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const startEditing = (itemId: string, column: ColumnKey, currentValue: string) => {
    setEditingCell({ itemId, column });
    setEditValue(currentValue);
    // Auto-select will happen via onFocus on the input
  };

  const getItemValue = (item: LineItem, column: ColumnKey): string => {
    switch (column) {
      case 'sell': return item.sellPrice.toFixed(2);
      case 'overage': return item.overagePercent.toFixed(1);
      case 'l1': return item.level1Price.toFixed(2);
      case 'l2': return item.level2Price.toFixed(2);
      case 'base': return item.basePrice.toFixed(2);
      case 'quantity': return String(item.quantity);
      case 'partNumber': return item.productNumber;
      case 'description': return item.description;
      default: return '';
    }
  };

  const saveEdit = (navigateTo?: { itemId: string; column: ColumnKey } | null) => {
    // TODO: Implement line item editing with proper state management
    // Currently quoteLineItems is derived from mockLineItems, so editing is not persisted
    // When backend is ready, this should update through a proper API call
    if (editingCell && editValue !== '') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const numValue = parseFloat(editValue);
      // Line item updates would go here when state management is implemented
    }

    if (navigateTo) {
      const item = quoteLineItems.find(li => li.id === navigateTo.itemId);
      if (item) {
        setEditingCell(navigateTo);
        setEditValue(getItemValue(item, navigateTo.column));
      }
    } else {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const navigateCell = (direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'shift-tab') => {
    if (!editingCell) return;

    // Get visible line items in current order
    const visibleItems = quoteLineItems.filter(item => {
      const section = mockSections.find(s => s.id === item.sectionId);
      return section && !collapsedSections.has(section.id);
    });

    const currentItemIndex = visibleItems.findIndex(item => item.id === editingCell.itemId);
    const visibleEditableColumns = editableColumns.filter(col => effectiveVisibleColumns.has(col));
    const currentColIndex = visibleEditableColumns.indexOf(editingCell.column);

    if (currentItemIndex === -1 || currentColIndex === -1) return;

    let newItemIndex = currentItemIndex;
    let newColIndex = currentColIndex;

    switch (direction) {
      case 'up':
        newItemIndex = Math.max(0, currentItemIndex - 1);
        break;
      case 'down':
        newItemIndex = Math.min(visibleItems.length - 1, currentItemIndex + 1);
        break;
      case 'left':
        newColIndex = Math.max(0, currentColIndex - 1);
        break;
      case 'right':
      case 'tab':
        if (currentColIndex < visibleEditableColumns.length - 1) {
          newColIndex = currentColIndex + 1;
        } else if (currentItemIndex < visibleItems.length - 1) {
          newItemIndex = currentItemIndex + 1;
          newColIndex = 0;
        }
        break;
      case 'shift-tab':
        if (currentColIndex > 0) {
          newColIndex = currentColIndex - 1;
        } else if (currentItemIndex > 0) {
          newItemIndex = currentItemIndex - 1;
          newColIndex = visibleEditableColumns.length - 1;
        }
        break;
    }

    const newItem = visibleItems[newItemIndex];
    const newColumn = visibleEditableColumns[newColIndex];

    if (newItem && newColumn && (newItem.id !== editingCell.itemId || newColumn !== editingCell.column)) {
      saveEdit({ itemId: newItem.id, column: newColumn });
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        saveEdit();
        break;
      case 'Escape':
        e.preventDefault();
        cancelEdit();
        break;
      case 'Tab':
        e.preventDefault();
        navigateCell(e.shiftKey ? 'shift-tab' : 'tab');
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateCell('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateCell('down');
        break;
      case 'ArrowLeft':
        // Only navigate if cursor is at start
        if (e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0) {
          e.preventDefault();
          navigateCell('left');
        }
        break;
      case 'ArrowRight':
        // Only navigate if cursor is at end
        if (e.currentTarget.selectionStart === e.currentTarget.value.length) {
          e.preventDefault();
          navigateCell('right');
        }
        break;
    }
  };

  // Mock data for dropdowns
  const distributorOptions = [
    'Ferguson Enterprises', 'Graybar Electric', 'HD Supply', 'Rexel', 'WESCO International',
    'Consolidated Electrical', 'Border States Electric', 'Sonepar', 'CED Greentech'
  ];
  const builderOptions = [
    'Skanska USA', 'Turner Construction', 'McCarthy Building', 'Hensel Phelps', 'DPR Construction',
    'Whiting-Turner', 'Clark Construction', 'Holder Construction', 'Brasfield & Gorrie'
  ];
  const jobOptions = [
    'University Lab Building', 'Downtown Medical Center', 'Tech Campus Phase 2', 'Airport Terminal B',
    'Convention Center Expansion', 'Corporate Headquarters', 'Research Facility', 'Hospital Wing Addition'
  ];

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const toggleLineItemSelection = (lineId: string) => {
    setSelectedLineItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineId)) {
        newSet.delete(lineId);
      } else {
        newSet.add(lineId);
      }
      return newSet;
    });
  };

  const selectAllLineItems = (items: LineItem[]) => {
    setSelectedLineItems(new Set(items.map(item => item.id)));
  };

  const clearLineItemSelection = () => {
    setSelectedLineItems(new Set());
  };


  // Memoize filter options to prevent re-renders
  const quoteFilterOptions = useMemo(() => [
    { id: 'quote-id', label: 'Quote Number', type: 'text' as const },
    { id: 'quote-name', label: 'Quote Name', type: 'text' as const },
    { id: 'status', label: 'Status', type: 'dropdown' as const },
    { id: 'stage', label: 'Stage', type: 'dropdown' as const },
    { id: 'value-min', label: 'Min Amount', type: 'number' as const },
    { id: 'value-max', label: 'Max Amount', type: 'number' as const },
    { id: 'entry-date-from', label: 'Entry Date From', type: 'date' as const },
    { id: 'entry-date-to', label: 'Entry Date To', type: 'date' as const },
    { id: 'quote-date-from', label: 'Quote Date From', type: 'date' as const },
    { id: 'quote-date-to', label: 'Quote Date To', type: 'date' as const },
    { id: 'exp-date-from', label: 'Exp. Date From', type: 'date' as const },
    { id: 'exp-date-to', label: 'Exp. Date To', type: 'date' as const },
    { id: 'factory', label: 'Factory', type: 'dropdown' as const },
    { id: 'customer', label: 'Customer', type: 'dropdown' as const },
    { id: 'job-name', label: 'Job Name', type: 'text' as const },
    { id: 'end-user', label: 'End User', type: 'dropdown' as const },
    { id: 'inside-rep', label: 'Inside Rep', type: 'dropdown' as const },
    { id: 'outside-rep', label: 'Outside Rep', type: 'dropdown' as const },
    { id: 'published', label: 'Published', type: 'dropdown' as const },
    { id: 'bill-to', label: 'Bill-To Customer', type: 'dropdown' as const },
    { id: 'sold-to', label: 'Sold-To Customer', type: 'dropdown' as const },
    { id: 'owner', label: 'Owner', type: 'dropdown' as const },
    { id: 'approval-status', label: 'Approval Status', type: 'dropdown' as const },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const },
  ], []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Memoize stages array to prevent re-renders
  const stages = useMemo<{ name: Quote['stage'] }[]>(() => [
    { name: 'Draft' },
    { name: 'Review' },
    { name: 'Sent' },
    { name: 'Negotiating' },
    { name: 'Won' },
    { name: 'Lost' },
  ], []);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Draft': return 'bg-gray-500 text-white';
      case 'Review': return 'bg-blue-500 text-white';
      case 'Sent': return 'bg-purple-500 text-white';
      case 'Negotiating': return 'bg-yellow-500 text-white';
      case 'Won': return 'bg-green-500 text-white';
      case 'Lost': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getQuotesByStage = useCallback((stage: string) => {
    return quotes.filter(quote => quote.stage === stage);
  }, [quotes]);

  // Memoize quote selection handler to prevent re-renders
  const handleQuoteSelect = useCallback((quote: Quote) => {
    setSelectedQuote(quote);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const targetStage = stages.find(s => `stage-${s.name}` === overId);

    if (targetStage) {
      setQuotes(prevQuotes =>
        prevQuotes.map(quote =>
          quote.id === activeId
            ? { ...quote, stage: targetStage.name }
            : quote
        )
      );
    }

    setActiveId(null);
  }, [stages]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeQuote = useMemo(() =>
    activeId ? quotes.find(quote => quote.id === activeId) : null,
    [activeId, quotes]
  );

  // Memoize quotes grouped by stage for kanban view
  const quotesByStage = useMemo(() => {
    const grouped: Record<string, Quote[]> = {};
    stages.forEach(stage => {
      grouped[stage.name] = quotes.filter(quote => quote.stage === stage.name);
    });
    return grouped;
  }, [quotes, stages]);

  // Get line items for selected quote - memoized
  const quoteLineItems = useMemo(() =>
    selectedQuote
      ? mockLineItems.filter(li => li.quoteId === selectedQuote.id)
      : [],
    [selectedQuote]
  );

  // Get distributor quotes for selected quote - memoized
  const quoteDistributorQuotes = useMemo(() =>
    selectedQuote
      ? mockDistributorQuotes.filter(dq => dq.baseQuoteId === selectedQuote.id)
      : [],
    [selectedQuote]
  );

  // Calculate quote totals - memoized
  const totals = useMemo(() => {
    const items = quoteLineItems;
    const baseTotal = items.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    const sellTotal = items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const l1Total = items.reduce((sum, item) => sum + (item.level1Price * item.quantity), 0);
    const l2Total = items.reduce((sum, item) => sum + (item.level2Price * item.quantity), 0);
    const l3Total = items.reduce((sum, item) => sum + (item.level3Price * item.quantity), 0);
    const overage = sellTotal - baseTotal;
    const commission = items.reduce((sum, item) => {
      if (!item.commissionable) return sum;
      const mfr = item.manufacturers[0];
      return sum + ((item.sellPrice - item.basePrice) * item.quantity * mfr.commissionRate);
    }, 0);

    return { baseTotal, sellTotal, l1Total, l2Total, l3Total, overage, commission };
  }, [quoteLineItems]);

  // Placeholder for line item editing - TODO: implement proper state management
  // Currently quoteLineItems is derived from mockLineItems, so we need to either:
  // 1. Convert to useState with initial value from mockLineItems, or
  // 2. Implement proper API calls when backend is ready
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setQuoteLineItems = (_updater: (prev: LineItem[]) => LineItem[]) => {
    // No-op until state management is implemented
    console.warn('Line item editing not yet implemented');
  };

  // Quote Detail View
  if (selectedQuote) {
    return (
      <main className="flex-1 overflow-auto bg-[var(--background)]">
        {/* Header */}
        <div className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">{selectedQuote.name}</h1>
                {/* Editable Stage Dropdown */}
                <div className="relative">
                  <select
                    value={selectedQuote.stage}
                    onChange={(e) => {
                      const newStage = e.target.value as Quote['stage'];
                      setSelectedQuote({ ...selectedQuote, stage: newStage });
                      // Also update in the quotes list
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, stage: newStage } : q));
                    }}
                    className={`appearance-none px-3 py-1 pr-8 rounded-full text-sm font-medium cursor-pointer border-0 focus:ring-2 focus:ring-offset-1 ${getStageColor(selectedQuote.stage)}`}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Review">Review</option>
                    <option value="Sent">Sent</option>
                    <option value="Negotiating">Negotiating</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {/* Version Dropdown */}
                <div className="relative">
                  <select
                    value={selectedQuote.version}
                    onChange={(e) => {
                      const newVersion = parseInt(e.target.value);
                      setSelectedQuote({ ...selectedQuote, version: newVersion });
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, version: newVersion } : q));
                    }}
                    className="appearance-none px-2 py-1 pr-6 bg-gray-100 text-gray-600 rounded text-sm cursor-pointer border-0 focus:ring-2 focus:ring-gray-300"
                  >
                    {[...Array(selectedQuote.version)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>v{i + 1}</option>
                    ))}
                  </select>
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {/* Sale Credit Button */}
                <button
                  onClick={() => setShowCreditModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded text-sm hover:bg-purple-100 transition-colors border border-purple-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sale Credit
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowViewModeDropdown(!showViewModeDropdown)}
                  className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 10s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="10" cy="10" r="3"/>
                  </svg>
                  {quoteViewMode === 'overage' ? 'Overage View' : 'Simple View'}
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showViewModeDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setQuoteViewMode('overage');
                        setShowViewModeDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg flex items-center justify-between ${
                        quoteViewMode === 'overage' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                      }`}
                    >
                      Overage View
                      {quoteViewMode === 'overage' && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setQuoteViewMode('simple');
                        setShowViewModeDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg flex items-center justify-between ${
                        quoteViewMode === 'simple' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                      }`}
                    >
                      Simple View
                      {quoteViewMode === 'simple' && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Generate PDF Button */}
              <button
                onClick={() => setShowQuotePdfPreview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12h4M8 16h4M8 8h1" strokeLinecap="round"/>
                </svg>
                PDF
              </button>

              {/* Convert to Order Button */}
              {selectedQuote.stage === 'Won' && (
                <button
                  onClick={() => setShowConvertToOrderModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 4v10" strokeLinecap="round"/>
                  </svg>
                  Convert to Order
                </button>
              )}

              {/* Save Button with Dropdown */}
              <div className="relative">
                <div className="flex">
                  <button
                    onClick={() => alert('Quote saved!')}
                    className="px-4 py-2 bg-green-600 text-white rounded-l-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                    className="px-2 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors border-l border-green-500"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                {showSaveDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => { alert('Quote saved!'); setShowSaveDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-t-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        const newVersion = selectedQuote.version + 1;
                        setSelectedQuote({ ...selectedQuote, version: newVersion });
                        setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, version: newVersion } : q));
                        alert(`Saved as v${newVersion}`);
                        setShowSaveDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors rounded-b-lg flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                      </svg>
                      Save as New Version
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Pricing Summary Bar */}
        <div className="border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0 px-6 py-2 flex items-center justify-end">
          <div className="relative group">
            <div className="flex items-center gap-3 text-xs cursor-pointer">
              <span className="text-[var(--muted-foreground)]">
                Base Price: <span className="font-medium text-[var(--foreground)]">${totals.baseTotal.toLocaleString()}</span>
              </span>
              <span className="text-[var(--muted-foreground)]">|</span>
              <span className="text-[var(--muted-foreground)]">
                Sell Price: <span className="font-semibold text-[var(--foreground)]">${totals.sellTotal.toLocaleString()}</span>
              </span>
              {quoteViewMode === 'overage' && (
                <>
                  <span className="text-[var(--muted-foreground)]">|</span>
                  <span className="text-[var(--muted-foreground)]">
                    Commission: <span className="font-medium text-purple-600">${totals.commission.toLocaleString()} ({totals.sellTotal > 0 ? ((totals.commission / totals.sellTotal) * 100).toFixed(1) : 0}%)</span>
                  </span>
                  <span className="text-[var(--muted-foreground)]">|</span>
                  <span className="text-[var(--muted-foreground)]">
                    Overage: <span className="font-medium text-orange-600">${totals.overage.toLocaleString()} ({totals.baseTotal > 0 ? ((totals.overage / totals.baseTotal) * 100).toFixed(1) : 0}%)</span>
                  </span>
                  <span className="text-[var(--muted-foreground)]">|</span>
                  <span className="text-[var(--muted-foreground)]">
                    Earnings: <span className="font-semibold text-green-600">${(totals.overage + totals.commission).toLocaleString()} ({totals.sellTotal > 0 ? (((totals.overage + totals.commission) / totals.sellTotal) * 100).toFixed(1) : 0}%)</span>
                  </span>
                </>
              )}
            </div>

            {/* Hover Tooltip with Price Levels */}
            <div className="absolute top-full right-0 mt-2 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[500px]">
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Level</th>
                      <th className="text-right py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Base Price</th>
                      <th className="text-right py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Sell Price</th>
                      <th className="text-right py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Commission</th>
                      <th className="text-right py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Overage</th>
                      <th className="text-right py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sell Row */}
                    <tr className="border-b border-[var(--border)]/50 bg-[var(--muted)]/20">
                      <td className="py-2 px-2 font-medium text-[var(--foreground)]">Sell</td>
                      <td className="py-2 px-2 text-right text-[var(--foreground)]">${totals.baseTotal.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-[var(--foreground)]">${totals.sellTotal.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-purple-600">${totals.commission.toLocaleString()} ({totals.sellTotal > 0 ? ((totals.commission / totals.sellTotal) * 100).toFixed(1) : 0}%)</td>
                      <td className="py-2 px-2 text-right text-orange-600">${totals.overage.toLocaleString()} ({totals.baseTotal > 0 ? ((totals.overage / totals.baseTotal) * 100).toFixed(1) : 0}%)</td>
                      <td className="py-2 px-2 text-right font-semibold text-green-600">${(totals.overage + totals.commission).toLocaleString()} ({totals.sellTotal > 0 ? (((totals.overage + totals.commission) / totals.sellTotal) * 100).toFixed(1) : 0}%)</td>
                    </tr>
                    {/* Dynamic Price Level Rows */}
                    {quotePriceLevels.map((level, index) => {
                      const levelSellPrice = totals.sellTotal * (1 + level.percent / 100);
                      const levelOverage = levelSellPrice - totals.baseTotal;
                      const levelCommission = totals.commission * (1 + level.percent / 100);
                      const levelEarnings = levelOverage + levelCommission;
                      return (
                        <tr key={level.id} className="border-b border-[var(--border)]/50 last:border-b-0">
                          <td className={`py-2 px-2 font-medium ${priceLevelColors[index % priceLevelColors.length]}`}>L{index + 1}</td>
                          <td className="py-2 px-2 text-right text-[var(--foreground)]">${totals.baseTotal.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-[var(--foreground)]">${levelSellPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className="py-2 px-2 text-right text-purple-600">${levelCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({levelSellPrice > 0 ? ((levelCommission / levelSellPrice) * 100).toFixed(1) : 0}%)</td>
                          <td className="py-2 px-2 text-right text-orange-600">${levelOverage.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({totals.baseTotal > 0 ? ((levelOverage / totals.baseTotal) * 100).toFixed(1) : 0}%)</td>
                          <td className="py-2 px-2 text-right font-semibold text-green-600">${levelEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({levelSellPrice > 0 ? ((levelEarnings / levelSellPrice) * 100).toFixed(1) : 0}%)</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Header Fields Section */}
        <div className="border-b border-[var(--border)] bg-blue-50/30 flex-shrink-0">
          <button
            onClick={() => setShowHeaderFields(!showHeaderFields)}
            className="w-full flex items-center justify-between px-6 py-2 hover:bg-blue-100/30 transition-colors"
          >
            <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
              {showHeaderFields ? 'Quote Details' : 'Show Quote Details'}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-[var(--muted-foreground)] transition-transform ${showHeaderFields ? '' : 'rotate-180'}`}
            >
              <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showHeaderFields && (
            <div className="px-6 pb-4">
              {/* Row 1: Quote Number, Sold To, Bill To, End User (conditional), Job, Payment Terms, Freight Terms */}
              <div className={`grid gap-4 mb-4 ${!showEndUserPerLine ? 'grid-cols-7' : 'grid-cols-6'}`}>
                {/* Quote Number */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Quote Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedQuote.id}
                    onChange={(e) => {
                      setSelectedQuote({ ...selectedQuote, id: e.target.value });
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, id: e.target.value } : q));
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>

                {/* Sold To Customer */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Sold To Customer<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedQuote.soldToCustomer}
                      onChange={(e) => {
                        setSelectedQuote({ ...selectedQuote, soldToCustomer: e.target.value });
                        setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, soldToCustomer: e.target.value } : q));
                      }}
                      className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                    >
                      <option value={selectedQuote.soldToCustomer}>{selectedQuote.soldToCustomer}</option>
                      <option value="Turner Construction">Turner Construction</option>
                      <option value="Hensel Phelps">Hensel Phelps</option>
                      <option value="Skanska USA">Skanska USA</option>
                      <option value="DPR Construction">DPR Construction</option>
                      <option value="Clark Construction">Clark Construction</option>
                      <option value="ACME Demo Cus">ACME Demo Cus</option>
                    </select>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Bill To Customer */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Bill To Customer<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedQuote.billToCustomer}
                      onChange={(e) => {
                        setSelectedQuote({ ...selectedQuote, billToCustomer: e.target.value });
                        setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, billToCustomer: e.target.value } : q));
                      }}
                      className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8"
                    >
                      <option value={selectedQuote.billToCustomer}>{selectedQuote.billToCustomer}</option>
                      <option value="Graybar Electric">Graybar Electric</option>
                      <option value="HD Supply">HD Supply</option>
                      <option value="Ferguson Enterprises">Ferguson Enterprises</option>
                      <option value="Rexel USA">Rexel USA</option>
                      <option value="ABE ENTERPRISES">ABE ENTERPRISES</option>
                    </select>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* End User - Only show if not per-line */}
                {!showEndUserPerLine && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      End User
                    </label>
                    <div className="relative">
                      <select
                        value={endUserSameAsCustomer ? selectedQuote.soldToCustomer : headerEndUser}
                        onChange={(e) => {
                          setHeaderEndUser(e.target.value);
                          if (e.target.value !== selectedQuote.soldToCustomer) {
                            setEndUserSameAsCustomer(false);
                          }
                        }}
                        disabled={endUserSameAsCustomer}
                        className={`w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer pr-8 ${
                          endUserSameAsCustomer ? 'bg-[var(--muted)]/30 text-[var(--muted-foreground)]' : ''
                        }`}
                      >
                        <option value="">Select End User...</option>
                        <option value={selectedQuote.soldToCustomer}>{selectedQuote.soldToCustomer}</option>
                        <option value="Turner Construction">Turner Construction</option>
                        <option value="Hensel Phelps">Hensel Phelps</option>
                        <option value="McCarthy Building">McCarthy Building</option>
                        <option value="Skanska USA">Skanska USA</option>
                        <option value="Clark Construction">Clark Construction</option>
                        <option value="DPR Construction">DPR Construction</option>
                      </select>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={endUserSameAsCustomer}
                        onChange={(e) => {
                          setEndUserSameAsCustomer(e.target.checked);
                          if (e.target.checked) {
                            setHeaderEndUser(selectedQuote.soldToCustomer);
                          }
                        }}
                        className="w-3.5 h-3.5 accent-[var(--primary)]"
                      />
                      <span className="text-xs text-[var(--muted-foreground)]">Same as Sold To</span>
                    </label>
                  </div>
                )}

                {/* Job */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Job
                  </label>
                  <input
                    type="text"
                    value={selectedQuote.jobName}
                    onChange={(e) => {
                      setSelectedQuote({ ...selectedQuote, jobName: e.target.value });
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, jobName: e.target.value } : q));
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={selectedQuote.paymentTerms}
                    onChange={(e) => {
                      setSelectedQuote({ ...selectedQuote, paymentTerms: e.target.value });
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, paymentTerms: e.target.value } : q));
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder="Net 30"
                  />
                </div>

                {/* Freight Terms */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Freight Terms
                  </label>
                  <input
                    type="text"
                    value={selectedQuote.freightTerms}
                    onChange={(e) => {
                      setSelectedQuote({ ...selectedQuote, freightTerms: e.target.value });
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, freightTerms: e.target.value } : q));
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    placeholder="FOB Destination"
                  />
                </div>
              </div>

              {/* Row 2: Quote Date, Expiration Date, Revised Date, Accept Date */}
              <div className="grid grid-cols-4 gap-4">
                {/* Quote Date */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Quote Date<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedQuote.quoteDate}
                    onChange={(e) => {
                      setSelectedQuote({ ...selectedQuote, quoteDate: e.target.value });
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, quoteDate: e.target.value } : q));
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>

                {/* Expiration Date */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Expiration Date<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedQuote.expirationDate}
                    onChange={(e) => {
                      setSelectedQuote({ ...selectedQuote, expirationDate: e.target.value });
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, expirationDate: e.target.value } : q));
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>

                {/* Revised Date */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Revised Date
                  </label>
                  <input
                    type="date"
                    value={selectedQuote.revisedDate}
                    onChange={(e) => {
                      setSelectedQuote({ ...selectedQuote, revisedDate: e.target.value });
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, revisedDate: e.target.value } : q));
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>

                {/* Accept Date */}
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Accept Date
                  </label>
                  <input
                    type="date"
                    value={selectedQuote.acceptDate}
                    onChange={(e) => {
                      setSelectedQuote({ ...selectedQuote, acceptDate: e.target.value });
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, acceptDate: e.target.value } : q));
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Main Content */}
          <div className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-[var(--border)] flex-shrink-0 bg-white -mx-6 px-6 pt-4 -mt-6">
              {[
                { id: 'lines', label: 'Line Items', count: quoteLineItems.length },
                { id: 'approvals', label: 'Approvals', count: selectedQuote.pendingApprovals, hideInSimple: true },
                { id: 'recipients', label: 'Recipients', count: 4 },
                { id: 'submittals', label: 'Submittals', hideInSimple: true },
                { id: 'notes', label: 'Notes' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'activity', label: 'Activity' },
                { id: 'files', label: 'Files', count: quoteFiles.filter(f => f.quoteId === selectedQuote.id).length },
                { id: 'versions', label: 'Versions' },
                { id: 'settings', label: 'Settings' },
              ].filter(tab => !(quoteViewMode === 'simple' && tab.hideInSimple)).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id as typeof detailTab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === tab.id
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                      tab.id === 'approvals' && selectedQuote.approvalStatus !== 'clear'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Line Items Tab */}
            {detailTab === 'lines' && (
              <div className="space-y-4">
                {/* Line Items Toolbar */}
                <div className="flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                      </svg>
                      Add Line
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="14" height="4" rx="1"/>
                        <rect x="3" y="10" width="14" height="4" rx="1"/>
                      </svg>
                      Add Section
                    </button>

                    {/* Auto-Calculate Overage Button */}
                    {quoteViewMode === 'overage' && (
                      <button
                        onClick={() => setShowAutoCalcModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors ml-2"
                        title="Auto-calculate overage for all lines"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="14" height="14" rx="2"/>
                          <path d="M7 7h2v6H7M11 7h2v3h-2M11 12h2v1h-2" strokeLinecap="round"/>
                        </svg>
                        Auto-Calc
                      </button>
                    )}

                    {/* Recipient Dropdown */}
                    {quoteViewMode === 'overage' && <div className="relative ml-4">
                      <button
                        onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                          selectedRecipient
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                            : 'border-[var(--border)] hover:bg-[var(--muted)]'
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 7a4 4 0 01-8 0 4 4 0 018 0zM12 14H8a6 6 0 00-6 6h16a6 6 0 00-6-6z"/>
                        </svg>
                        {selectedRecipient ? (
                          <>
                            <span>{selectedRecipient.company}</span>
                            <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                              selectedRecipient.level === 'Sell' ? 'bg-green-100 text-green-700' :
                              selectedRecipient.level === 'L1' ? 'bg-blue-100 text-blue-700' :
                              selectedRecipient.level === 'L2' ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>{selectedRecipient.level}</span>
                          </>
                        ) : 'Original Quote (All Levels)'}
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {showRecipientDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-80 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                          <div className="p-2 border-b border-[var(--border)]">
                            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">View Quote As</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedRecipient(null);
                              setShowRecipientDropdown(false);
                              setShowCompareView(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition-colors flex items-center justify-between ${
                              !selectedRecipient ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Original Quote</span>
                              <span className="text-xs text-[var(--muted-foreground)]">(All price levels)</span>
                            </div>
                            {!selectedRecipient && (
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 5l-9 9-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                          <div className="border-t border-[var(--border)] my-1"></div>
                          <div className="p-2">
                            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Recipients</span>
                          </div>
                          {recipients.map(recipient => (
                            <div
                              key={recipient.id}
                              className={`flex items-center justify-between px-4 py-2.5 hover:bg-[var(--muted)] transition-colors ${
                                selectedRecipient?.id === recipient.id ? 'bg-[var(--primary)]/10' : ''
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setSelectedRecipient(recipient);
                                  setRecipientQuoteVersion(recipient.version);
                                  setShowRecipientDropdown(false);
                                }}
                                className="flex-1 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${selectedRecipient?.id === recipient.id ? 'text-[var(--primary)]' : ''}`}>{recipient.company}</span>
                                  {selectedRecipient?.id === recipient.id && (
                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                                      <path d="M16 5l-9 9-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                                <div className="text-xs text-[var(--muted-foreground)]">{recipient.contact}</div>
                              </button>
                              <div className="relative">
                                <select
                                  value={recipient.level}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    // Update recipient level - in real app this would update state
                                    const newLevel = e.target.value as 'Sell' | 'L1' | 'L2' | 'L3';
                                    // If this is the selected recipient, update that too
                                    if (selectedRecipient?.id === recipient.id) {
                                      setSelectedRecipient({ ...selectedRecipient, level: newLevel });
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`px-2 py-1 text-xs font-semibold rounded border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                                    recipient.level === 'Sell' ? 'bg-green-100 text-green-700' :
                                    recipient.level === 'L1' ? 'bg-blue-100 text-blue-700' :
                                    recipient.level === 'L2' ? 'bg-purple-100 text-purple-700' :
                                    'bg-orange-100 text-orange-700'
                                  }`}
                                >
                                  <option value="Sell">Sell</option>
                                  <option value="L1">L1</option>
                                  <option value="L2">L2</option>
                                  <option value="L3">L3</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>}

                    {/* Compare to Original Button */}
                    {quoteViewMode === 'overage' && selectedRecipient && (
                      <button
                        onClick={() => setShowCompareView(!showCompareView)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                          showCompareView
                            ? 'border-orange-300 bg-orange-100 text-orange-700'
                            : 'border-[var(--border)] hover:bg-[var(--muted)]'
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 5H5a2 2 0 00-2 2v8a2 2 0 002 2h4M11 5h4a2 2 0 012 2v8a2 2 0 01-2 2h-4M10 3v14" strokeLinecap="round"/>
                        </svg>
                        {showCompareView ? 'Hide Comparison' : 'Compare to Original'}
                      </button>
                    )}

                    {selectedLineItems.size > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setShowBulkActionsMenu(!showBulkActionsMenu)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                        >
                          Bulk Actions ({selectedLineItems.size})
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {showBulkActionsMenu && (
                          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 py-1">
                            <button
                              onClick={() => { setShowSetOverageModal(true); setShowBulkActionsMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Set Overage %
                            </button>
                            <button
                              onClick={() => {
                                setQuoteLineItems(prev => prev.map(item =>
                                  selectedLineItems.has(item.id) ? { ...item, locked: true } : item
                                ));
                                setShowBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Lock Overage
                            </button>
                            <button
                              onClick={() => {
                                setQuoteLineItems(prev => prev.map(item =>
                                  selectedLineItems.has(item.id) ? { ...item, locked: false } : item
                                ));
                                setShowBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Unlock Overage
                            </button>
                            <button
                              onClick={() => { setShowSetEndUserModal(true); setShowBulkActionsMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Set End User
                            </button>
                            <button
                              onClick={() => { setShowBulkActionsMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Set Outside Rep Splits
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Views Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowViewsMenu(!showViewsMenu); setShowColumnsMenu(false); }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="14" height="14" rx="2"/>
                          <path d="M3 8h14M8 8v9"/>
                        </svg>
                        {savedViews.find(v => v.id === activeView)?.name || 'Custom'}
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {showViewsMenu && (
                        <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                          <div className="p-2 border-b border-[var(--border)]">
                            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase px-2">Saved Views</p>
                          </div>
                          {savedViews.map(view => (
                            <div key={view.id} className="flex items-center justify-between hover:bg-[var(--muted)] transition-colors">
                              <button
                                onClick={() => applyView(view.id)}
                                className={`flex-1 text-left px-4 py-2 text-sm ${activeView === view.id ? 'text-[var(--primary)] font-medium' : ''}`}
                              >
                                {view.name}
                                {activeView === view.id && (
                                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="inline ml-2">
                                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </button>
                              {!['default', 'compact', 'pricing', 'approval'].includes(view.id) && (
                                <button
                                  onClick={() => deleteView(view.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded mr-1"
                                  title="Delete view"
                                >
                                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                          <div className="border-t border-[var(--border)] p-2">
                            <button
                              onClick={() => { setShowSaveViewModal(true); setShowViewsMenu(false); }}
                              className="w-full text-left px-2 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-colors flex items-center gap-2"
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                              </svg>
                              Save Current View...
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sections Toggle - only in simple view */}
                    {quoteViewMode === 'simple' && (
                      <button
                        onClick={() => setShowSections(!showSections)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                          showSections
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                            : 'border-[var(--border)] hover:bg-[var(--muted)]'
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="14" height="4" rx="1"/>
                          <rect x="3" y="10" width="14" height="7" rx="1"/>
                        </svg>
                        Sections
                      </button>
                    )}

                    {/* Columns Button - Opens Modal */}
                    <button
                      onClick={() => { setShowColumnsMenu(true); setShowViewsMenu(false); }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round"/>
                      </svg>
                      Columns
                      <span className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">{effectiveVisibleColumns.size}</span>
                    </button>

                    <span className="text-sm text-[var(--muted-foreground)]">
                      {quoteLineItems.length} items
                    </span>
                  </div>
                </div>

                {/* Sections with Line Items - Single Scrollable Table */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
                  <div>
                    {/* Simple View Table */}
                    {quoteViewMode === 'simple' && (
                    <table className="w-full min-w-[1400px]">
                      {/* Table Header - Dynamically rendered in columnOrder */}
                      <thead className="bg-[var(--card)] sticky top-0 z-20 shadow-sm">
                        <tr>
                          {/* Checkbox column - always first */}
                          <th className="w-10 px-3 py-2 text-left">
                            <input
                              type="checkbox"
                              checked={quoteLineItems.length > 0 && quoteLineItems.every(item => selectedLineItems.has(item.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLineItems(new Set(quoteLineItems.map(i => i.id)));
                                } else {
                                  setSelectedLineItems(new Set());
                                }
                              }}
                              className="accent-[var(--primary)]"
                            />
                          </th>
                          {/* Section column - only in simple view with sections enabled */}
                          {quoteViewMode === 'simple' && showSections && (
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                              Section
                            </th>
                          )}
                          {/* Dynamic columns based on columnOrder */}
                          {getOrderedVisibleColumns().map(colKey => renderHeaderCell(colKey))}
                          {/* Empty header for expand/more button column - always last */}
                          <th className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Simple View - Flat list with Section column */}
                        {quoteViewMode === 'simple' && quoteLineItems
                          .filter(item => {
                            const partFilter = columnFilters['partNumber']?.toLowerCase() || '';
                            const descFilter = columnFilters['description']?.toLowerCase() || '';
                            const mfrFilter = columnFilters['manufacturer']?.toLowerCase() || '';
                            return (
                              (!partFilter || item.productNumber.toLowerCase().includes(partFilter)) &&
                              (!descFilter || item.description.toLowerCase().includes(descFilter)) &&
                              (!mfrFilter || item.manufacturers[0].name.toLowerCase().includes(mfrFilter))
                            );
                          })
                          .sort((a, b) => {
                            if (!sortColumn) return 0;
                            let aVal: string | number = '';
                            let bVal: string | number = '';
                            switch (sortColumn) {
                              case 'partNumber': aVal = a.productNumber; bVal = b.productNumber; break;
                              case 'description': aVal = a.description; bVal = b.description; break;
                              case 'quantity': aVal = a.quantity; bVal = b.quantity; break;
                              case 'manufacturer': aVal = a.manufacturers[0].name; bVal = b.manufacturers[0].name; break;
                              case 'base': aVal = a.basePrice; bVal = b.basePrice; break;
                              case 'sell': aVal = a.sellPrice; bVal = b.sellPrice; break;
                            }
                            if (typeof aVal === 'string') {
                              return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
                            }
                            return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
                          })
                          .map(item => {
                            const section = mockSections.find(s => s.id === item.sectionId);
                            return (
                              <tr
                                key={item.id}
                                className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
                                  selectedLineItems.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedLineItems.has(item.id)}
                                    onChange={() => toggleLineItemSelection(item.id)}
                                    className="accent-[var(--primary)]"
                                  />
                                </td>
                                {/* Section selector */}
                                {showSections && (
                                  <td className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                                    <select
                                      value={item.sectionId}
                                      onChange={(e) => {
                                        setQuoteLineItems(prev => prev.map(li =>
                                          li.id === item.id ? { ...li, sectionId: e.target.value } : li
                                        ));
                                      }}
                                      className="bg-transparent border-none text-sm text-[var(--foreground)] cursor-pointer hover:bg-[var(--muted)] rounded px-1 py-0.5 -ml-1"
                                    >
                                      {mockSections.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                )}
                                {/* Dynamic cells based on columnOrder */}
                                {getOrderedVisibleColumns().map(colKey => renderBodyCell(colKey, item))}
                                {/* Actions column - always last */}
                                <td className="px-2 py-2 text-center">
                                  <button
                                    onClick={() => {
                                      setLineDetailsModalItem(item);
                                      setShowLineDetailsModal(true);
                                    }}
                                    className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                    title="More details"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                      <circle cx="10" cy="4" r="2"/>
                                      <circle cx="10" cy="10" r="2"/>
                                      <circle cx="10" cy="16" r="2"/>
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        }
                      </tbody>
                    </table>
                    )}
                    {/* Overage View Table */}
                    {quoteViewMode === 'overage' && (
                    <table className="w-full min-w-[1400px]">
                      {/* Table Header for Overage View */}
                      <thead className="bg-[var(--card)] sticky top-0 z-20 shadow-sm">
                        <tr>
                          <th className="w-10 px-3 py-2 text-left">
                            <input
                              type="checkbox"
                              checked={quoteLineItems.length > 0 && quoteLineItems.every(item => selectedLineItems.has(item.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLineItems(new Set(quoteLineItems.map(i => i.id)));
                                } else {
                                  setSelectedLineItems(new Set());
                                }
                              }}
                              className="accent-[var(--primary)]"
                            />
                          </th>
                          {effectiveVisibleColumns.has('partNumber') && (
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase relative">
                                      <div className="flex items-center gap-1">
                                        <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('partNumber')}>Part #</span>
                                        {sortColumn === 'partNumber' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setActiveFilterColumn(activeFilterColumn === 'partNumber' ? null : 'partNumber'); }}
                                          className={`p-0.5 rounded hover:bg-[var(--muted)] ${columnFilters['partNumber'] ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      </div>
                                      {activeFilterColumn === 'partNumber' && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
                                          <input
                                            type="text"
                                            placeholder="Filter Part #..."
                                            value={columnFilters['partNumber'] || ''}
                                            onChange={(e) => handleFilterChange('partNumber', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {columnFilters['partNumber'] && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleFilterChange('partNumber', ''); }}
                                              className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                            >
                                              Clear filter
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </th>
                                  )}
                                  {effectiveVisibleColumns.has('description') && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase relative">
                                      <div className="flex items-center gap-1">
                                        <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('description')}>Description</span>
                                        {sortColumn === 'description' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setActiveFilterColumn(activeFilterColumn === 'description' ? null : 'description'); }}
                                          className={`p-0.5 rounded hover:bg-[var(--muted)] ${columnFilters['description'] ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      </div>
                                      {activeFilterColumn === 'description' && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
                                          <input
                                            type="text"
                                            placeholder="Filter Description..."
                                            value={columnFilters['description'] || ''}
                                            onChange={(e) => handleFilterChange('description', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {columnFilters['description'] && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleFilterChange('description', ''); }}
                                              className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                            >
                                              Clear filter
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </th>
                                  )}
                                  {showEndUserPerLine && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase relative">
                                      <div className="flex items-center gap-1">
                                        <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('endUser')}>End User</span>
                                        {sortColumn === 'endUser' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setActiveFilterColumn(activeFilterColumn === 'endUser' ? null : 'endUser'); }}
                                          className={`p-0.5 rounded hover:bg-[var(--muted)] ${columnFilters['endUser'] ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      </div>
                                      {activeFilterColumn === 'endUser' && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
                                          <input
                                            type="text"
                                            placeholder="Filter End User..."
                                            value={columnFilters['endUser'] || ''}
                                            onChange={(e) => handleFilterChange('endUser', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {columnFilters['endUser'] && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleFilterChange('endUser', ''); }}
                                              className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                            >
                                              Clear filter
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </th>
                                  )}
                                  {effectiveVisibleColumns.has('manufacturer') && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase relative">
                                      <div className="flex items-center gap-1">
                                        <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('manufacturer')}>Mfr</span>
                                        {sortColumn === 'manufacturer' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setActiveFilterColumn(activeFilterColumn === 'manufacturer' ? null : 'manufacturer'); }}
                                          className={`p-0.5 rounded hover:bg-[var(--muted)] ${columnFilters['manufacturer'] ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      </div>
                                      {activeFilterColumn === 'manufacturer' && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
                                          <input
                                            type="text"
                                            placeholder="Filter Manufacturer..."
                                            value={columnFilters['manufacturer'] || ''}
                                            onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {columnFilters['manufacturer'] && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleFilterChange('manufacturer', ''); }}
                                              className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                            >
                                              Clear filter
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </th>
                                  )}
                                  {effectiveVisibleColumns.has('quantity') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('quantity')}>
                                      <div className="flex items-center justify-center gap-1">
                                        Qty
                                        {sortColumn === 'quantity' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                      </div>
                                    </th>
                                  )}
                                  {effectiveVisibleColumns.has('uom') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                                      UOM
                                    </th>
                                  )}
                                  {effectiveVisibleColumns.has('base') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap" onClick={() => handleSort('base')}>
                                      <div className="flex items-center justify-center gap-1">
                                        Base Unit $
                                        {sortColumn === 'base' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                      </div>
                                    </th>
                                  )}
                                  {/* Show single Price column when recipient selected, otherwise show all price columns */}
                                  {selectedRecipient ? (
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                                      <div className="flex items-center justify-end gap-2">
                                        <span>Price</span>
                                        <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                                          selectedRecipient.level === 'Sell' ? 'bg-green-100 text-green-700' :
                                          selectedRecipient.level === 'L1' ? 'bg-blue-100 text-blue-700' :
                                          selectedRecipient.level === 'L2' ? 'bg-purple-100 text-purple-700' :
                                          'bg-orange-100 text-orange-700'
                                        }`}>{selectedRecipient.level}</span>
                                      </div>
                                    </th>
                                  ) : (
                                    <>
                                      {effectiveVisibleColumns.has('overage') && (
                                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('overage')}>
                                          <div className="flex items-center justify-center gap-1">
                                            % Over
                                            {sortColumn === 'overage' && (
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                                <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                        </th>
                                      )}
                                      {effectiveVisibleColumns.has('sell') && (
                                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap" onClick={() => handleSort('sell')}>
                                          <div className="flex items-center justify-center gap-1">
                                            Sell Unit $
                                            {sortColumn === 'sell' && (
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                                <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                        </th>
                                      )}
                                      {effectiveVisibleColumns.has('sellTotal') && (
                                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap" onClick={() => handleSort('sellTotal')}>
                                          <div className="flex items-center justify-center gap-1">
                                            Sell $
                                            {sortColumn === 'sellTotal' && (
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                                <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                        </th>
                                      )}
                                      {effectiveVisibleColumns.has('l1') && (
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('l1')}>
                                          <div className="flex items-center justify-end gap-1">
                                            L1
                                            {sortColumn === 'l1' && (
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                                <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                        </th>
                                      )}
                                      {effectiveVisibleColumns.has('l2') && (
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('l2')}>
                                          <div className="flex items-center justify-end gap-1">
                                            L2
                                            {sortColumn === 'l2' && (
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                                <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                        </th>
                                      )}
                                      {effectiveVisibleColumns.has('l3') && (
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">L3</th>
                                      )}
                                    </>
                                  )}
                                  {effectiveVisibleColumns.has('commRate') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Com %</th>
                                  )}
                                  {effectiveVisibleColumns.has('baseComm') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Com $</th>
                                  )}
                                  {effectiveVisibleColumns.has('overageShare') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Ovg %</th>
                                  )}
                                  {effectiveVisibleColumns.has('overageComm') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Ovg $</th>
                                  )}
                                  {effectiveVisibleColumns.has('effRate') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Earn %</th>
                                  )}
                                  {effectiveVisibleColumns.has('totalEarn') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Earn $</th>
                                  )}
                                  {effectiveVisibleColumns.has('trend') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Trend</th>
                                  )}
                          {effectiveVisibleColumns.has('specSheet') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Spec</th>
                          )}
                          {effectiveVisibleColumns.has('outsideReps') && showCommissionSplits && (
                            <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Outside Reps</th>
                          )}
                          {effectiveVisibleColumns.has('commissionDiscountPercent') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Comm Disc %</th>
                          )}
                          {effectiveVisibleColumns.has('commissionDiscountAmount') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Comm Disc $</th>
                          )}
                          {effectiveVisibleColumns.has('lineDiscountPercent') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Line Disc %</th>
                          )}
                          {effectiveVisibleColumns.has('lineDiscountAmount') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Line Disc $</th>
                          )}
                          {effectiveVisibleColumns.has('leadTime') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Lead Time</th>
                          )}
                          {effectiveVisibleColumns.has('divisor') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Multiplier</th>
                          )}
                          {/* Empty header for expand/more button column */}
                          <th className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Overage View - Sections with headers and totals */}
                        {quoteViewMode === 'overage' && mockSections.map(section => {
                          const sectionItems = quoteLineItems.filter(li => li.sectionId === section.id);
                          if (sectionItems.length === 0) return null;

                          const isCollapsed = collapsedSections.has(section.id);
                          const sectionTotals = sectionItems.reduce((acc, item) => {
                            let sellPrice = item.sellPrice;
                            if (selectedRecipient) {
                              switch (selectedRecipient.level) {
                                case 'L1': sellPrice = item.level1Price; break;
                                case 'L2': sellPrice = item.level2Price; break;
                                case 'L3': sellPrice = item.level3Price; break;
                                default: sellPrice = item.sellPrice;
                              }
                            }
                            const mfr = item.manufacturers[0];
                            const overageAmt = (item.sellPrice - item.basePrice) * item.quantity;
                            const baseComm = item.basePrice * mfr.commissionRate * item.quantity;
                            const overageComm = (item.sellPrice - item.basePrice) * mfr.overageShare * item.quantity;
                            const totalComm = baseComm + overageComm;
                            return {
                              baseTotal: acc.baseTotal + (item.basePrice * item.quantity),
                              sellTotal: acc.sellTotal + (sellPrice * item.quantity),
                              overageTotal: acc.overageTotal + overageAmt,
                              commissionTotal: acc.commissionTotal + totalComm,
                              earnTotal: acc.earnTotal + totalComm
                            };
                          }, { baseTotal: 0, sellTotal: 0, overageTotal: 0, commissionTotal: 0, earnTotal: 0 });
                          // Keep backwards compatible names
                          const sectionTotal = sectionTotals.sellTotal;
                          const sectionEarnings = {
                            overageTotal: sectionTotals.overageTotal,
                            baseCommTotal: 0, // Not used anymore
                            overageCommTotal: 0, // Not used anymore
                            earnTotal: sectionTotals.earnTotal
                          };
                          const sectionNeedsApproval = sectionItems.some(item =>
                            item.manufacturers.some(m => m.approvalStatus === 'not_approved')
                          );

                          // Calculate total columns for colspan
                          const totalColumns = 1 + effectiveVisibleColumns.size; // checkbox + visible columns

                          // Filter and sort section items
                          const filteredSortedItems = sectionItems
                            .filter(item => {
                              const partFilter = columnFilters['partNumber']?.toLowerCase() || '';
                              const descFilter = columnFilters['description']?.toLowerCase() || '';
                              const mfrFilter = columnFilters['manufacturer']?.toLowerCase() || '';
                              return (
                                (!partFilter || item.productNumber.toLowerCase().includes(partFilter)) &&
                                (!descFilter || item.description.toLowerCase().includes(descFilter)) &&
                                (!mfrFilter || item.manufacturers[0].name.toLowerCase().includes(mfrFilter))
                              );
                            })
                            .sort((a, b) => {
                              if (!sortColumn) return 0;
                              let aVal: string | number = '';
                              let bVal: string | number = '';
                              switch (sortColumn) {
                                case 'partNumber': aVal = a.productNumber; bVal = b.productNumber; break;
                                case 'description': aVal = a.description; bVal = b.description; break;
                                case 'quantity': aVal = a.quantity; bVal = b.quantity; break;
                                case 'manufacturer': aVal = a.manufacturers[0].name; bVal = b.manufacturers[0].name; break;
                                case 'base': aVal = a.basePrice; bVal = b.basePrice; break;
                                case 'sell': aVal = a.sellPrice; bVal = b.sellPrice; break;
                                case 'overage': aVal = a.overagePercent; bVal = b.overagePercent; break;
                                case 'l1': aVal = a.level1Price; bVal = b.level1Price; break;
                                case 'l2': aVal = a.level2Price; bVal = b.level2Price; break;
                              }
                              if (typeof aVal === 'string') {
                                return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
                              }
                              return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
                            });

                          return (
                            <React.Fragment key={section.id}>
                              {/* Section Header Row */}
                              <tr
                                className="bg-[var(--muted)]/30 border-b border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors"
                              >
                                <td colSpan={totalColumns} className="px-4 py-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={sectionItems.length > 0 && sectionItems.every(item => selectedLineItems.has(item.id))}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          const sectionItemIds = sectionItems.map(item => item.id);
                                          setSelectedLineItems(prev => {
                                            const newSet = new Set(prev);
                                            const allSelected = sectionItemIds.every(id => newSet.has(id));
                                            if (allSelected) {
                                              // Deselect all in section
                                              sectionItemIds.forEach(id => newSet.delete(id));
                                            } else {
                                              // Select all in section
                                              sectionItemIds.forEach(id => newSet.add(id));
                                            }
                                            return newSet;
                                          });
                                        }}
                                        className="accent-[var(--primary)]"
                                        title="Select all items in section"
                                      />
                                      <button
                                        onClick={() => toggleSectionCollapse(section.id)}
                                        className="flex items-center gap-2 hover:bg-[var(--muted)] rounded px-1 -ml-1 transition-colors"
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 20 20"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                                        >
                                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <h3 className="font-semibold text-[var(--foreground)]">{section.name}</h3>
                                      </button>
                                      <span className="text-sm text-[var(--muted-foreground)]">({sectionItems.length} items)</span>
                                      {sectionNeedsApproval && (
                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                          Approval Needed
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-3 text-xs">
                                        <span className="text-[var(--muted-foreground)]">
                                          Base Price: <span className="font-medium text-[var(--foreground)]">${sectionTotals.baseTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                        </span>
                                        <span className="text-[var(--muted-foreground)]">|</span>
                                        <span className="text-[var(--muted-foreground)]">
                                          Sell Price: <span className="font-semibold text-[var(--foreground)]">${sectionTotals.sellTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                        </span>
                                        {quoteViewMode === 'overage' && (
                                          <>
                                            <span className="text-[var(--muted-foreground)]">|</span>
                                            <span className="text-[var(--muted-foreground)]">
                                              Commission: <span className="font-medium text-purple-600">${sectionTotals.commissionTotal.toLocaleString(undefined, {maximumFractionDigits: 0})} ({sectionTotals.sellTotal > 0 ? ((sectionTotals.commissionTotal / sectionTotals.sellTotal) * 100).toFixed(1) : 0}%)</span>
                                            </span>
                                            <span className="text-[var(--muted-foreground)]">|</span>
                                            <span className="text-[var(--muted-foreground)]">
                                              Overage: <span className="font-medium text-orange-600">${sectionTotals.overageTotal.toLocaleString(undefined, {maximumFractionDigits: 0})} ({sectionTotals.baseTotal > 0 ? ((sectionTotals.overageTotal / sectionTotals.baseTotal) * 100).toFixed(1) : 0}%)</span>
                                            </span>
                                            <span className="text-[var(--muted-foreground)]">|</span>
                                            <span className="text-[var(--muted-foreground)]">
                                              Earnings: <span className="font-semibold text-green-600">${(sectionTotals.overageTotal + sectionTotals.commissionTotal).toLocaleString(undefined, {maximumFractionDigits: 0})} ({sectionTotals.sellTotal > 0 ? (((sectionTotals.overageTotal + sectionTotals.commissionTotal) / sectionTotals.sellTotal) * 100).toFixed(1) : 0}%)</span>
                                            </span>
                                          </>
                                        )}
                                      </div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); }}
                                        className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="10" cy="5" r="1.5"/>
                                          <circle cx="10" cy="10" r="1.5"/>
                                          <circle cx="10" cy="15" r="1.5"/>
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              {/* Section Line Items - Only show if not collapsed */}
                              {!isCollapsed && filteredSortedItems.map(item => (
                                  <React.Fragment key={item.id}>
                                  <tr
                                    className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
                                      selectedLineItems.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                                    } ${item.locked ? 'opacity-75' : ''} ${expandedLineItems.has(item.id) ? 'border-b-0' : ''}`}
                                  >
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedLineItems(prev => {
                                              const newSet = new Set(prev);
                                              if (newSet.has(item.id)) {
                                                newSet.delete(item.id);
                                              } else {
                                                newSet.add(item.id);
                                              }
                                              return newSet;
                                            });
                                          }}
                                          className="p-0.5 hover:bg-[var(--muted)] rounded transition-colors"
                                          title={expandedLineItems.has(item.id) ? 'Collapse details' : 'Expand details'}
                                        >
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className={`text-[var(--muted-foreground)] transition-transform ${expandedLineItems.has(item.id) ? 'rotate-90' : ''}`}
                                          >
                                            <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        </button>
                                        <input
                                          type="checkbox"
                                          checked={selectedLineItems.has(item.id)}
                                          onChange={() => toggleLineItemSelection(item.id)}
                                          className="accent-[var(--primary)]"
                                        />
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setQuoteLineItems(prev => prev.map(li =>
                                              li.id === item.id ? { ...li, locked: !li.locked } : li
                                            ));
                                          }}
                                          className={`p-0.5 rounded transition-colors ${item.locked ? 'text-amber-600 hover:bg-amber-50' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] opacity-40 hover:opacity-100'}`}
                                          title={item.locked ? 'Unlock overage (allow bulk changes)' : 'Lock overage (prevent bulk changes)'}
                                        >
                                          {item.locked ? (
                                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                              <rect x="5" y="9" width="10" height="8" rx="1"/>
                                              <path d="M7 9V6a3 3 0 016 0v3"/>
                                            </svg>
                                          ) : (
                                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                              <rect x="5" y="9" width="10" height="8" rx="1"/>
                                              <path d="M13 9V6a3 3 0 00-6 0"/>
                                            </svg>
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                    {effectiveVisibleColumns.has('partNumber') && (
                                      <td className="px-3 py-2 font-mono text-sm text-[var(--foreground)]">
                                        {editingCell?.itemId === item.id && editingCell?.column === 'partNumber' ? (
                                          <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => saveEdit()}
                                            onKeyDown={(e) => e.key === 'Enter' ? saveEdit() : e.key === 'Escape' && cancelEdit()}
                                            className="w-full px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded" onClick={() => startEditing(item.id, 'partNumber', item.productNumber)}>
                                            {item.productNumber}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('description') && (
                                      <td className="px-3 py-2 text-sm text-[var(--foreground)] max-w-[300px]">
                                        {editingCell?.itemId === item.id && editingCell?.column === 'description' ? (
                                          <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => saveEdit()}
                                            onKeyDown={(e) => e.key === 'Enter' ? saveEdit() : e.key === 'Escape' && cancelEdit()}
                                            className="w-full px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded truncate block" title={item.description} onClick={() => startEditing(item.id, 'description', item.description)}>
                                            {item.description}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {showEndUserPerLine && (
                                      <td className="px-3 py-2">
                                        <select
                                          value={item.endUser}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setQuoteLineItems(prev => prev.map(li =>
                                              li.id === item.id ? { ...li, endUser: e.target.value } : li
                                            ));
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full max-w-[150px] px-2 py-1 text-xs border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)] truncate"
                                          title={item.endUser || 'Select end user'}
                                        >
                                          <option value="">{selectedQuote.soldToCustomer} (Default)</option>
                                          {availableEndUsers.map(user => (
                                            <option key={user} value={user}>{user}</option>
                                          ))}
                                        </select>
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('manufacturer') && (
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-1">
                                          <LineApprovalIcon status={item.manufacturers[0].approvalStatus} />
                                          <span className="text-xs text-[var(--foreground)] truncate" title={item.manufacturers[0].name}>
                                            {item.manufacturers[0].name}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('quantity') && (
                                      <td className="px-3 py-2 text-right text-sm text-[var(--foreground)]">
                                        {editingCell?.itemId === item.id && editingCell?.column === 'quantity' ? (
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => saveEdit()}
                                            onKeyDown={(e) => e.key === 'Enter' ? saveEdit() : e.key === 'Escape' && cancelEdit()}
                                            className="w-20 px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none text-right"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded" onClick={() => startEditing(item.id, 'quantity', String(item.quantity))}>
                                            {item.quantity}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('uom') && (
                                      <td className="px-3 py-2 text-center text-sm text-[var(--muted-foreground)]">
                                        {item.uom || 'EA'}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('base') && (
                                      <td className="px-3 py-2 text-right text-sm text-[var(--muted-foreground)]">
                                        ${item.basePrice.toFixed(2)}
                                      </td>
                                    )}
                                    {/* Show single Price column when recipient selected, otherwise show all price columns */}
                                    {selectedRecipient ? (
                                      <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="text-sm font-medium text-[var(--foreground)]">
                                            ${(() => {
                                              switch (selectedRecipient.level) {
                                                case 'Sell': return item.sellPrice.toFixed(2);
                                                case 'L1': return item.level1Price.toFixed(2);
                                                case 'L2': return item.level2Price.toFixed(2);
                                                case 'L3': return item.level3Price.toFixed(2);
                                                default: return item.sellPrice.toFixed(2);
                                              }
                                            })()}
                                          </span>
                                          <select
                                            value={selectedRecipient.level}
                                            onChange={(e) => {
                                              // Per-line item level change - in real app would track per-item overrides
                                              e.stopPropagation();
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`px-1.5 py-0.5 text-xs font-semibold rounded border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                                              selectedRecipient.level === 'Sell' ? 'bg-green-100 text-green-700' :
                                              selectedRecipient.level === 'L1' ? 'bg-blue-100 text-blue-700' :
                                              selectedRecipient.level === 'L2' ? 'bg-purple-100 text-purple-700' :
                                              'bg-orange-100 text-orange-700'
                                            }`}
                                            title="Change price level for this line"
                                          >
                                            <option value="Sell">Sell</option>
                                            <option value="L1">L1</option>
                                            <option value="L2">L2</option>
                                            <option value="L3">L3</option>
                                          </select>
                                        </div>
                                      </td>
                                    ) : (
                                      <>
                                        {effectiveVisibleColumns.has('overage') && (
                                          <td className="px-3 py-2 text-right">
                                            {editingCell?.itemId === item.id && editingCell?.column === 'overage' ? (
                                              <input
                                                type="text"
                                                inputMode="decimal"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => saveEdit()}
                                                onKeyDown={handleEditKeyDown}
                                                onFocus={(e) => e.target.select()}
                                                className="w-16 px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none text-right bg-white"
                                                autoFocus
                                              />
                                            ) : (
                                              <span
                                                className="text-sm font-medium cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded text-[var(--foreground)]"
                                                onClick={() => startEditing(item.id, 'overage', item.overagePercent.toFixed(1))}
                                                title="Click to edit"
                                              >
                                                {item.overagePercent.toFixed(1)}%
                                              </span>
                                            )}
                                          </td>
                                        )}
                                        {effectiveVisibleColumns.has('sell') && (
                                          <td className="px-3 py-2 text-right text-sm font-medium text-[var(--foreground)]">
                                            {editingCell?.itemId === item.id && editingCell?.column === 'sell' ? (
                                              <input
                                                type="text"
                                                inputMode="decimal"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => saveEdit()}
                                                onKeyDown={handleEditKeyDown}
                                                onFocus={(e) => e.target.select()}
                                                className="w-24 px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none text-right bg-white"
                                                autoFocus
                                              />
                                            ) : (
                                              <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded" onClick={() => startEditing(item.id, 'sell', item.sellPrice.toFixed(2))}>
                                                ${item.sellPrice.toFixed(2)}
                                              </span>
                                            )}
                                          </td>
                                        )}
                                        {effectiveVisibleColumns.has('sellTotal') && (
                                          <td className="px-3 py-2 text-right text-sm font-medium text-[var(--foreground)]">
                                            ${(item.sellPrice * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                          </td>
                                        )}
                                        {effectiveVisibleColumns.has('l1') && (
                                          <td className="px-3 py-2 text-right text-sm text-[var(--muted-foreground)]">
                                            {editingCell?.itemId === item.id && editingCell?.column === 'l1' ? (
                                              <input
                                                type="text"
                                                inputMode="decimal"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => saveEdit()}
                                                onKeyDown={handleEditKeyDown}
                                                onFocus={(e) => e.target.select()}
                                                className="w-24 px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none text-right bg-white"
                                                autoFocus
                                              />
                                            ) : (
                                              <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded" onClick={() => startEditing(item.id, 'l1', item.level1Price.toFixed(2))}>
                                                ${item.level1Price.toFixed(2)}
                                              </span>
                                            )}
                                          </td>
                                        )}
                                        {effectiveVisibleColumns.has('l2') && (
                                          <td className="px-3 py-2 text-right text-sm text-[var(--muted-foreground)]">
                                            {editingCell?.itemId === item.id && editingCell?.column === 'l2' ? (
                                              <input
                                                type="text"
                                                inputMode="decimal"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => saveEdit()}
                                                onKeyDown={handleEditKeyDown}
                                                onFocus={(e) => e.target.select()}
                                                className="w-24 px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none text-right bg-white"
                                                autoFocus
                                              />
                                            ) : (
                                              <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded" onClick={() => startEditing(item.id, 'l2', item.level2Price.toFixed(2))}>
                                                ${item.level2Price.toFixed(2)}
                                              </span>
                                            )}
                                          </td>
                                        )}
                                        {effectiveVisibleColumns.has('l3') && (
                                          <td className="px-3 py-2 text-right text-sm text-[var(--muted-foreground)]">
                                            ${item.level3Price.toFixed(2)}
                                          </td>
                                        )}
                                      </>
                                    )}
                                    {/* Commission & Earnings columns with calculated values */}
                                    {(() => {
                                      const mfr = item.manufacturers[0];
                                      const unitOverageAmt = item.sellPrice - item.basePrice;
                                      const unitBaseComm = item.basePrice * mfr.commissionRate;
                                      const unitOverageComm = unitOverageAmt * mfr.overageShare;
                                      const unitTotalEarn = unitBaseComm + unitOverageComm;
                                      const effRate = item.basePrice > 0 ? (unitTotalEarn / item.basePrice) * 100 : 0;

                                      // Line totals (unit × quantity)
                                      const lineOverageAmt = unitOverageAmt * item.quantity;
                                      const lineBaseComm = unitBaseComm * item.quantity;
                                      const lineOverageComm = unitOverageComm * item.quantity;
                                      const lineTotalEarn = unitTotalEarn * item.quantity;

                                      return (
                                        <>
                                          {effectiveVisibleColumns.has('commRate') && (
                                            <td className="px-3 py-2 text-right text-sm text-purple-600 font-medium">
                                              {(mfr.commissionRate * 100).toFixed(0)}%
                                            </td>
                                          )}
                                          {effectiveVisibleColumns.has('baseComm') && (
                                            <td className="px-3 py-2 text-right text-sm text-purple-600 font-medium">
                                              ${lineBaseComm.toFixed(2)}
                                            </td>
                                          )}
                                          {effectiveVisibleColumns.has('overageShare') && (
                                            <td className="px-3 py-2 text-right text-sm text-orange-600 font-medium">
                                              {(mfr.overageShare * 100).toFixed(0)}%
                                            </td>
                                          )}
                                          {effectiveVisibleColumns.has('overageComm') && (
                                            <td className="px-3 py-2 text-right text-sm text-orange-600 font-medium">
                                              ${lineOverageComm.toFixed(2)}
                                            </td>
                                          )}
                                          {effectiveVisibleColumns.has('effRate') && (
                                            <td className="px-3 py-2 text-right text-sm font-medium text-green-600">
                                              {effRate.toFixed(1)}%
                                            </td>
                                          )}
                                          {effectiveVisibleColumns.has('totalEarn') && (
                                            <td className="px-3 py-2 text-right text-sm text-green-600 font-bold">
                                              ${lineTotalEarn.toFixed(2)}
                                            </td>
                                          )}
                                        </>
                                      );
                                    })()}
                                    {effectiveVisibleColumns.has('trend') && (
                                      <td className="px-3 py-2">
                                        <div className="flex items-center justify-center gap-1">
                                          <Sparkline manufacturerPriceHistory={item.priceHistory} quotedPriceHistory={item.quotedPriceHistory} productNumber={item.productNumber} />
                                          <button
                                            onClick={() => setShowPriceLookupModal(item.productNumber)}
                                            className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                                            title="Price Lookup"
                                          >
                                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                                              <circle cx="9" cy="9" r="5"/>
                                              <path d="M14 14l3 3" strokeLinecap="round"/>
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('specSheet') && (
                                      <td className="px-3 py-2 text-center">
                                        {item.hasSpecSheet ? (
                                          <button
                                            onClick={() => {
                                              setSpecSheetSelections(prev => {
                                                const newSet = new Set(prev);
                                                if (newSet.has(item.id)) {
                                                  newSet.delete(item.id);
                                                } else {
                                                  newSet.add(item.id);
                                                }
                                                return newSet;
                                              });
                                            }}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                              specSheetSelections.has(item.id)
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                            title={specSheetSelections.has(item.id) ? 'Spec sheet will be included in email' : 'Click to include spec sheet in email'}
                                          >
                                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                                              <path d="M8 10h4M8 14h4"/>
                                            </svg>
                                            {specSheetSelections.has(item.id) ? (
                                              <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M16 5l-9 9-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            ) : null}
                                          </button>
                                        ) : (
                                          <span className="text-xs text-[var(--muted-foreground)]">—</span>
                                        )}
                                      </td>
                                    )}
                                    {/* Outside Reps Column - Only visible when showCommissionSplits is enabled */}
                                    {effectiveVisibleColumns.has('outsideReps') && showCommissionSplits && (
                                      <td className="px-3 py-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setCommissionSplitsModalItem(item);
                                            setShowCommissionSplitsModal(true);
                                          }}
                                          className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-[var(--muted)] transition-colors group"
                                        >
                                          {item.outsideRepSplits.length === 0 ? (
                                            <span className="text-[var(--muted-foreground)]">—</span>
                                          ) : item.outsideRepSplits.length === 1 ? (
                                            <span className="text-[var(--foreground)]">{item.outsideRepSplits[0].repName}</span>
                                          ) : (
                                            <span className="text-[var(--primary)]">
                                              {item.outsideRepSplits.length} Reps Split
                                            </span>
                                          )}
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <path d="M8 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        </button>
                                      </td>
                                    )}
                                    {/* Discount columns */}
                                    {effectiveVisibleColumns.has('commissionDiscountPercent') && (
                                      <td className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">
                                        {item.commissionDiscountPercent ? `${item.commissionDiscountPercent}%` : '—'}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('commissionDiscountAmount') && (
                                      <td className="px-3 py-2 text-sm text-right text-[var(--muted-foreground)]">
                                        {item.commissionDiscountAmount ? `$${item.commissionDiscountAmount.toFixed(2)}` : '—'}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('lineDiscountPercent') && (
                                      <td className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">
                                        {item.lineDiscountPercent ? `${item.lineDiscountPercent}%` : '—'}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('lineDiscountAmount') && (
                                      <td className="px-3 py-2 text-sm text-right text-[var(--muted-foreground)]">
                                        {item.lineDiscountAmount ? `$${item.lineDiscountAmount.toFixed(2)}` : '—'}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('leadTime') && (
                                      <td className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">
                                        {item.leadTime || '—'}
                                      </td>
                                    )}
                                    {/* Multiplier/Divisor Column */}
                                    {effectiveVisibleColumns.has('divisor') && (
                                      <td className="px-3 py-2 text-center text-sm text-[var(--muted-foreground)]">
                                        {item.useDivisor ? `÷${item.divisor}` : '—'}
                                      </td>
                                    )}
                                    {/* Expand/More Actions Button */}
                                    <td className="px-2 py-2 text-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLineDetailsModalItem(item);
                                          setShowLineDetailsModal(true);
                                        }}
                                        className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                                        title="More details"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)]">
                                          <circle cx="4" cy="10" r="2"/>
                                          <circle cx="10" cy="10" r="2"/>
                                          <circle cx="16" cy="10" r="2"/>
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                  {/* Expanded Product Details Row */}
                                  {expandedLineItems.has(item.id) && (
                                    <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                                      <td colSpan={effectiveVisibleColumns.size + 1} className="px-0 py-0">
                                        <div className="px-8 py-3">
                                          {/* Product & Manufacturer Info Grid */}
                                          <div className="grid grid-cols-3 gap-4 max-w-6xl">
                                            {/* Left Column - Product Info */}
                                            <div className="space-y-3">
                                              <div>
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Product Information</div>
                                                <div className="bg-[var(--card)] rounded border border-[var(--border)] p-3 space-y-2">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Product Category</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">{mockSections.find(s => s.id === item.sectionId)?.name || 'General Lighting'}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Category Base Commission</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">8.0%</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Product Commission</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">{(item.manufacturers[0].commissionRate * 100).toFixed(1)}%</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Base Price</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">${item.basePrice.toFixed(2)}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Customer Part Number</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">N/A</span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Manufacturer Info */}
                                              <div>
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-3">Manufacturer: {item.manufacturers[0].name}</div>
                                                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 space-y-3">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Approval Status</span>
                                                    <div className="flex items-center gap-2">
                                                      <LineApprovalIcon status={item.manufacturers[0].approvalStatus} />
                                                      <span className={`text-sm font-medium ${
                                                        item.manufacturers[0].approvalStatus === 'approved' ? 'text-green-600' :
                                                        item.manufacturers[0].approvalStatus === 'conditional' ? 'text-yellow-600' :
                                                        item.manufacturers[0].approvalStatus === 'not_approved' ? 'text-red-600' : 'text-gray-500'
                                                      }`}>
                                                        {item.manufacturers[0].approvalStatus === 'approved' ? 'Approved' :
                                                         item.manufacturers[0].approvalStatus === 'conditional' ? 'Conditional' :
                                                         item.manufacturers[0].approvalStatus === 'not_approved' ? 'Not Approved' : 'Unknown'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Manufacturer Base Commission</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">{(item.manufacturers[0].commissionRate * 100).toFixed(1)}%</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Overage Share %</span>
                                                    <span className="text-sm font-medium text-blue-600">{(item.manufacturers[0].overageShare * 100).toFixed(1)}%</span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Sales Representatives */}
                                              <div>
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-3">Sales Representatives</div>
                                                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                                                  <div className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Outside Rep*</div>
                                                      <select className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]">
                                                        <option>Select Rep...</option>
                                                        <option>Sarah Chen</option>
                                                        <option>Mike Torres</option>
                                                        <option>John Smith</option>
                                                      </select>
                                                    </div>
                                                    <button className="mt-4 w-7 h-7 rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] flex items-center justify-center hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex-shrink-0">
                                                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
                                                      </svg>
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Discounts */}
                                              <div>
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-3">Discounts</div>
                                                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                                                  <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Commission Discount %</div>
                                                      <div className="relative">
                                                        <input
                                                          type="text"
                                                          defaultValue="0"
                                                          className="w-full px-3 py-1.5 pr-7 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">%</span>
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Commission Discount $</div>
                                                      <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">$</span>
                                                        <input
                                                          type="text"
                                                          defaultValue="0"
                                                          className="w-full px-3 py-1.5 pl-5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                                                        />
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Line Discount %</div>
                                                      <div className="relative">
                                                        <input
                                                          type="text"
                                                          defaultValue="0"
                                                          className="w-full px-3 py-1.5 pr-7 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">%</span>
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Line Discount $</div>
                                                      <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">$</span>
                                                        <input
                                                          type="text"
                                                          defaultValue="0"
                                                          className="w-full px-3 py-1.5 pl-5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Right Column - Pricing Bands */}
                                            <div>
                                              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-3">Pricing Bands</div>
                                              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                                                <table className="w-full text-sm">
                                                  <thead className="bg-[var(--muted)]/50">
                                                    <tr>
                                                      <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Band</th>
                                                      <th className="text-right px-4 py-2 font-medium text-[var(--muted-foreground)]">Price</th>
                                                      <th className="text-right px-4 py-2 font-medium text-[var(--muted-foreground)]">Band Comm.</th>
                                                      <th className="text-right px-4 py-2 font-medium text-[var(--muted-foreground)]">Comm. $</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    <tr className="border-t border-[var(--border)]">
                                                      <td className="px-4 py-3">
                                                        <span className="font-medium text-[var(--foreground)]">Sell</span>
                                                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">(Full Price)</span>
                                                      </td>
                                                      <td className="text-right px-4 py-3 font-medium text-[var(--foreground)]">${item.sellPrice.toFixed(2)}</td>
                                                      <td className="text-right px-4 py-3 text-[var(--foreground)]">{(item.manufacturers[0].commissionRate * 100).toFixed(1)}%</td>
                                                      <td className="text-right px-4 py-3 font-medium text-green-600">${(item.sellPrice * item.manufacturers[0].commissionRate).toFixed(2)}</td>
                                                    </tr>
                                                    <tr className="border-t border-[var(--border)]">
                                                      <td className="px-4 py-3">
                                                        <span className="font-medium text-[var(--foreground)]">Band 1</span>
                                                      </td>
                                                      <td className="text-right px-4 py-3 font-medium text-[var(--foreground)]">${(item.sellPrice * 0.95).toFixed(2)}</td>
                                                      <td className="text-right px-4 py-3 text-[var(--foreground)]">{((item.manufacturers[0].commissionRate * 100) - 1).toFixed(1)}%</td>
                                                      <td className="text-right px-4 py-3 font-medium text-green-600">${(item.sellPrice * 0.95 * (item.manufacturers[0].commissionRate - 0.01)).toFixed(2)}</td>
                                                    </tr>
                                                    <tr className="border-t border-[var(--border)]">
                                                      <td className="px-4 py-3">
                                                        <span className="font-medium text-[var(--foreground)]">Band 2</span>
                                                      </td>
                                                      <td className="text-right px-4 py-3 font-medium text-[var(--foreground)]">${(item.sellPrice * 0.90).toFixed(2)}</td>
                                                      <td className="text-right px-4 py-3 text-[var(--foreground)]">{((item.manufacturers[0].commissionRate * 100) - 2).toFixed(1)}%</td>
                                                      <td className="text-right px-4 py-3 font-medium text-green-600">${(item.sellPrice * 0.90 * (item.manufacturers[0].commissionRate - 0.02)).toFixed(2)}</td>
                                                    </tr>
                                                    <tr className="border-t border-[var(--border)]">
                                                      <td className="px-4 py-3">
                                                        <span className="font-medium text-[var(--foreground)]">Band 3</span>
                                                      </td>
                                                      <td className="text-right px-4 py-3 font-medium text-[var(--foreground)]">${(item.sellPrice * 0.85).toFixed(2)}</td>
                                                      <td className="text-right px-4 py-3 text-[var(--foreground)]">{((item.manufacturers[0].commissionRate * 100) - 3).toFixed(1)}%</td>
                                                      <td className="text-right px-4 py-3 font-medium text-green-600">${(item.sellPrice * 0.85 * (item.manufacturers[0].commissionRate - 0.03)).toFixed(2)}</td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </div>

                                              {/* Commission Summary */}
                                              <div className="mt-4 bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase px-4 py-2 bg-[var(--muted)]/30">Commission Summary</div>
                                                <table className="w-full text-sm">
                                                  <tbody>
                                                    <tr className="border-b border-[var(--border)]">
                                                      <td className="px-4 py-2 text-[var(--muted-foreground)]">Base Commission</td>
                                                      <td className="px-4 py-2 text-right text-[var(--muted-foreground)]">{(item.manufacturers[0].commissionRate * 100).toFixed(1)}%</td>
                                                      <td className="px-4 py-2 text-right font-medium text-[var(--foreground)]">${(item.basePrice * item.manufacturers[0].commissionRate).toFixed(2)}</td>
                                                    </tr>
                                                    <tr className="border-b border-[var(--border)]">
                                                      <td className="px-4 py-2 text-[var(--muted-foreground)]">Overage Share</td>
                                                      <td className="px-4 py-2 text-right">
                                                        {item.manufacturers[0].overageShare > 0 ? (
                                                          <span className="text-[var(--muted-foreground)]">{(item.manufacturers[0].overageShare * 100).toFixed(0)}%</span>
                                                        ) : (
                                                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">Ineligible</span>
                                                        )}
                                                      </td>
                                                      <td className="px-4 py-2 text-right font-medium">
                                                        {item.manufacturers[0].overageShare > 0 ? (
                                                          <span className="text-blue-600">${((item.sellPrice - item.basePrice) * item.manufacturers[0].overageShare).toFixed(2)}</span>
                                                        ) : (
                                                          <span className="text-gray-400">$0.00</span>
                                                        )}
                                                      </td>
                                                    </tr>
                                                    <tr className="bg-[var(--muted)]/20">
                                                      <td className="px-4 py-2 font-medium text-[var(--foreground)]">Total Commission</td>
                                                      <td className="px-4 py-2 text-right text-[var(--muted-foreground)]">
                                                        {(((item.basePrice * item.manufacturers[0].commissionRate) + ((item.sellPrice - item.basePrice) * item.manufacturers[0].overageShare)) / item.sellPrice * 100).toFixed(1)}% eff.
                                                      </td>
                                                      <td className="px-4 py-2 text-right font-semibold text-green-600">
                                                        ${((item.basePrice * item.manufacturers[0].commissionRate) + ((item.sellPrice - item.basePrice) * item.manufacturers[0].overageShare)).toFixed(2)}
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </div>

                                              {/* Lead Time & Multiplier */}
                                              <div className="mt-4">
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-3">Lead Time & Multiplier</div>
                                                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                                                  <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Lead Time</div>
                                                      <input
                                                        type="text"
                                                        placeholder="e.g., 2-3 weeks"
                                                        className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                                                      />
                                                    </div>
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Multiplier</div>
                                                      <div className="flex items-center gap-3 mt-1">
                                                        <button
                                                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors bg-[var(--muted)]"
                                                        >
                                                          <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform translate-x-0.5" />
                                                        </button>
                                                        <span className="text-sm text-[var(--muted-foreground)]">Disabled</span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                    )}
                  </div>
                </div>

                {/* Set Overage Modal - Enhanced with Tabs */}
                {showSetOverageModal && (() => {
                  // Calculate preview values based on selected items
                  const selectedItems = quoteLineItems.filter(li => selectedLineItems.has(li.id));
                  const currentBaseTotal = selectedItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
                  const currentSellTotal = selectedItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
                  const currentOverage = currentSellTotal - currentBaseTotal;
                  const currentAvgOveragePercent = currentBaseTotal > 0 ? (currentOverage / currentBaseTotal) * 100 : 0;

                  // Calculate new values based on mode
                  let newSellTotal = currentSellTotal;
                  let newOveragePercent = currentAvgOveragePercent;
                  let newOverageAmount = currentOverage;

                  if (overageModalTab === 'percentage' && overageInputPercent) {
                    const targetPercent = parseFloat(overageInputPercent) || 0;
                    newSellTotal = currentBaseTotal * (1 + targetPercent / 100);
                    newOveragePercent = targetPercent;
                    newOverageAmount = newSellTotal - currentBaseTotal;
                  } else if (overageModalTab === 'targetPrice' && overageInputTargetPrice) {
                    newSellTotal = parseFloat(overageInputTargetPrice) || currentSellTotal;
                    newOverageAmount = newSellTotal - currentBaseTotal;
                    newOveragePercent = currentBaseTotal > 0 ? (newOverageAmount / currentBaseTotal) * 100 : 0;
                  } else if (overageModalTab === 'targetMargin' && overageInputTargetMargin) {
                    newOverageAmount = parseFloat(overageInputTargetMargin) || currentOverage;
                    newSellTotal = currentBaseTotal + newOverageAmount;
                    newOveragePercent = currentBaseTotal > 0 ? (newOverageAmount / currentBaseTotal) * 100 : 0;
                  }

                  // Calculate commission impact (simplified)
                  const avgCommissionRate = 0.08; // 8% average
                  const avgOverageShare = 0.85; // 85% average
                  const currentCommission = (currentBaseTotal * avgCommissionRate) + (currentOverage * avgOverageShare);
                  const newCommission = (currentBaseTotal * avgCommissionRate) + (newOverageAmount * avgOverageShare);

                  return (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
                      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Overage Calculator</h2>
                        <button
                          onClick={() => { setShowSetOverageModal(false); setOverageModalTab('percentage'); }}
                          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>

                      {/* Tabs */}
                      <div className="flex border-b border-[var(--border)]">
                        <button
                          onClick={() => setOverageModalTab('percentage')}
                          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            overageModalTab === 'percentage'
                              ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--primary)]/5'
                              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          Set Percentage
                        </button>
                        <button
                          onClick={() => setOverageModalTab('targetPrice')}
                          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            overageModalTab === 'targetPrice'
                              ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--primary)]/5'
                              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          Target Price
                        </button>
                        <button
                          onClick={() => setOverageModalTab('targetMargin')}
                          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            overageModalTab === 'targetMargin'
                              ? 'text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--primary)]/5'
                              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          Target Margin
                        </button>
                      </div>

                      <div className="p-6 space-y-4">
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Apply to {selectedLineItems.size} selected line{selectedLineItems.size !== 1 ? 's' : ''} (Base: ${currentBaseTotal.toLocaleString()})
                        </p>

                        {/* Tab Content */}
                        {overageModalTab === 'percentage' && (
                          <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                              Overage Percentage
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={overageInputPercent}
                                onChange={(e) => setOverageInputPercent(e.target.value)}
                                className="w-28 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-right"
                                placeholder="10"
                              />
                              <span className="text-sm text-[var(--muted-foreground)]">%</span>
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                              Current avg: {currentAvgOveragePercent.toFixed(1)}%
                            </p>
                          </div>
                        )}

                        {overageModalTab === 'targetPrice' && (
                          <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                              Target Sell Price Total
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[var(--muted-foreground)]">$</span>
                              <input
                                type="number"
                                value={overageInputTargetPrice}
                                onChange={(e) => setOverageInputTargetPrice(e.target.value)}
                                className="w-36 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-right"
                                placeholder={currentSellTotal.toFixed(0)}
                              />
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                              Current: ${currentSellTotal.toLocaleString()}
                            </p>
                          </div>
                        )}

                        {overageModalTab === 'targetMargin' && (
                          <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                              Target Margin Amount
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[var(--muted-foreground)]">$</span>
                              <input
                                type="number"
                                value={overageInputTargetMargin}
                                onChange={(e) => setOverageInputTargetMargin(e.target.value)}
                                className="w-36 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-right"
                                placeholder={currentOverage.toFixed(0)}
                              />
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                              Current margin: ${currentOverage.toLocaleString()}
                            </p>
                          </div>
                        )}

                        {/* Preview Section */}
                        <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
                          <h4 className="text-sm font-medium text-[var(--foreground)]">Preview</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-[var(--muted-foreground)]">Current</p>
                              <div className="space-y-1 mt-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--muted-foreground)]">Sell:</span>
                                  <span>${currentSellTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--muted-foreground)]">Overage:</span>
                                  <span>${currentOverage.toLocaleString()} ({currentAvgOveragePercent.toFixed(1)}%)</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--muted-foreground)]">Commission:</span>
                                  <span>${currentCommission.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="border-l border-[var(--border)] pl-4">
                              <p className="text-xs text-[var(--muted-foreground)]">New</p>
                              <div className="space-y-1 mt-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--muted-foreground)]">Sell:</span>
                                  <span className={newSellTotal !== currentSellTotal ? 'text-[var(--primary)] font-medium' : ''}>
                                    ${newSellTotal.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--muted-foreground)]">Overage:</span>
                                  <span className={newOverageAmount !== currentOverage ? 'text-green-600 font-medium' : ''}>
                                    ${newOverageAmount.toLocaleString()} ({newOveragePercent.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--muted-foreground)]">Commission:</span>
                                  <span className={newCommission !== currentCommission ? 'text-blue-600 font-medium' : ''}>
                                    ${newCommission.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Change Summary */}
                          {(newSellTotal !== currentSellTotal || newOverageAmount !== currentOverage) && (
                            <div className="pt-3 border-t border-[var(--border)]">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-[var(--muted-foreground)]">Change:</span>
                                <span className={newOverageAmount > currentOverage ? 'text-green-600' : newOverageAmount < currentOverage ? 'text-red-600' : ''}>
                                  {newOverageAmount >= currentOverage ? '+' : ''}${(newOverageAmount - currentOverage).toLocaleString()}
                                  {' '}({newOverageAmount >= currentOverage ? '+' : ''}{(newOveragePercent - currentAvgOveragePercent).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                        <button
                          onClick={() => { setShowSetOverageModal(false); setOverageModalTab('percentage'); }}
                          className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            // Apply the overage changes to selected items (skip locked)
                            setQuoteLineItems(prev => prev.map(item => {
                              if (!selectedLineItems.has(item.id) || item.locked) return item;
                              return {
                                ...item,
                                sellPrice: item.basePrice * (1 + newOveragePercent / 100),
                                overagePercent: newOveragePercent
                              };
                            }));
                            setShowSetOverageModal(false);
                            setOverageModalTab('percentage');
                          }}
                          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          Apply to {quoteLineItems.filter(li => selectedLineItems.has(li.id) && !li.locked).length} Line{quoteLineItems.filter(li => selectedLineItems.has(li.id) && !li.locked).length !== 1 ? 's' : ''}
                          {quoteLineItems.filter(li => selectedLineItems.has(li.id) && li.locked).length > 0 && (
                            <span className="ml-1 text-xs opacity-75">({quoteLineItems.filter(li => selectedLineItems.has(li.id) && li.locked).length} locked)</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* Set Minimum Overage Modal */}
                {showMinOverageModal && (() => {
                  const selectedItems = quoteLineItems.filter(li => selectedLineItems.has(li.id));
                  const unlockedSelectedItems = selectedItems.filter(li => !li.locked);
                  const lockedCount = selectedItems.filter(li => li.locked).length;
                  const minOveragePercent = parseFloat(minOverageInput) || 0;
                  const affectedItems = unlockedSelectedItems.filter(item => item.overagePercent < minOveragePercent);

                  // Calculate preview (only for unlocked items)
                  const currentSellTotal = unlockedSelectedItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
                  const newSellTotal = unlockedSelectedItems.reduce((sum, item) => {
                    if (item.overagePercent < minOveragePercent) {
                      return sum + (item.basePrice * (1 + minOveragePercent / 100) * item.quantity);
                    }
                    return sum + (item.sellPrice * item.quantity);
                  }, 0);

                  return (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
                      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Set Minimum Overage</h2>
                        <button
                          onClick={() => { setShowMinOverageModal(false); setMinOverageInput(''); }}
                          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Only update line items where the current overage is below the minimum. Lines already at or above the minimum will not be changed.
                        </p>

                        <div>
                          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                            Minimum Overage %
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={minOverageInput}
                              onChange={(e) => setMinOverageInput(e.target.value)}
                              placeholder="10"
                              className="w-24 px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                              autoFocus
                            />
                            <span className="text-sm text-[var(--muted-foreground)]">%</span>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
                          <h4 className="text-sm font-medium text-[var(--foreground)]">Preview</h4>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">Selected Lines:</span>
                            <span className="text-[var(--foreground)]">{selectedItems.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">Lines Below Minimum:</span>
                            <span className={`font-medium ${affectedItems.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {affectedItems.length}
                            </span>
                          </div>
                          {minOverageInput && (
                            <>
                              <div className="border-t border-[var(--border)] pt-3 mt-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--muted-foreground)]">Current Sell Total:</span>
                                  <span className="text-[var(--foreground)]">${currentSellTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                  <span className="text-[var(--muted-foreground)]">New Sell Total:</span>
                                  <span className="font-medium text-green-600">${newSellTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                  <span className="text-[var(--muted-foreground)]">Difference:</span>
                                  <span className="font-medium text-green-600">+${(newSellTotal - currentSellTotal).toLocaleString()}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Affected Items List */}
                        {affectedItems.length > 0 && (
                          <div className="max-h-32 overflow-y-auto border border-[var(--border)] rounded-lg">
                            <div className="px-3 py-2 bg-[var(--muted)]/30 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                              Lines to Update
                            </div>
                            {affectedItems.slice(0, 5).map(item => (
                              <div key={item.id} className="px-3 py-2 flex justify-between text-sm border-t border-[var(--border)]">
                                <span className="truncate max-w-[200px]">{item.productNumber}</span>
                                <span className="text-red-600">{item.overagePercent.toFixed(1)}% → <span className="text-green-600">{minOveragePercent.toFixed(1)}%</span></span>
                              </div>
                            ))}
                            {affectedItems.length > 5 && (
                              <div className="px-3 py-2 text-xs text-center text-[var(--muted-foreground)] border-t border-[var(--border)]">
                                +{affectedItems.length - 5} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                        <button
                          onClick={() => { setShowMinOverageModal(false); setMinOverageInput(''); }}
                          className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const minPercent = parseFloat(minOverageInput) || 0;
                            if (minPercent > 0) {
                              setQuoteLineItems(prev => prev.map(item => {
                                if (!selectedLineItems.has(item.id) || item.locked) return item;
                                if (item.overagePercent >= minPercent) return item;
                                return {
                                  ...item,
                                  sellPrice: item.basePrice * (1 + minPercent / 100),
                                  overagePercent: minPercent
                                };
                              }));
                            }
                            setShowMinOverageModal(false);
                            setMinOverageInput('');
                          }}
                          disabled={!minOverageInput || affectedItems.length === 0}
                          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Update {affectedItems.length} Line{affectedItems.length !== 1 ? 's' : ''}
                          {lockedCount > 0 && (
                            <span className="ml-1 text-xs opacity-75">({lockedCount} locked)</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* Auto-Calculate Overage Modal */}
                {showAutoCalcModal && (() => {
                  // Get eligible items (unlocked and overage-eligible)
                  const allItems = quoteLineItems;
                  const eligibleItems = allItems.filter(item => !item.locked && item.manufacturers[0].overageShare > 0);
                  const lockedItems = allItems.filter(item => item.locked);
                  const ineligibleItems = allItems.filter(item => !item.locked && item.manufacturers[0].overageShare === 0);

                  // Current totals
                  const currentBaseTotal = allItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
                  const currentSellTotal = allItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
                  const currentOverage = currentSellTotal - currentBaseTotal;
                  const currentOveragePercent = currentBaseTotal > 0 ? (currentOverage / currentBaseTotal) * 100 : 0;

                  // Current commission
                  const currentCommission = allItems.reduce((sum, item) => {
                    const baseComm = item.basePrice * item.quantity * item.manufacturers[0].commissionRate;
                    const overageAmt = (item.sellPrice - item.basePrice) * item.quantity;
                    const overageComm = overageAmt * item.manufacturers[0].overageShare;
                    return sum + baseComm + overageComm;
                  }, 0);

                  // Calculate fixed amounts (from locked and ineligible items)
                  const fixedBaseTotal = [...lockedItems, ...ineligibleItems].reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
                  const fixedSellTotal = [...lockedItems, ...ineligibleItems].reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
                  const fixedCommission = [...lockedItems, ...ineligibleItems].reduce((sum, item) => {
                    const baseComm = item.basePrice * item.quantity * item.manufacturers[0].commissionRate;
                    const overageAmt = (item.sellPrice - item.basePrice) * item.quantity;
                    const overageComm = overageAmt * item.manufacturers[0].overageShare;
                    return sum + baseComm + overageComm;
                  }, 0);

                  // Eligible items base total
                  const eligibleBaseTotal = eligibleItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
                  const eligibleBaseCommission = eligibleItems.reduce((sum, item) => sum + (item.basePrice * item.quantity * item.manufacturers[0].commissionRate), 0);

                  // Calculate target values
                  let targetOveragePercent = 0;
                  let targetSellTotal = currentSellTotal;
                  let targetCommission = currentCommission;

                  if (autoCalcMode === 'overage' && autoCalcTargetOverage) {
                    targetOveragePercent = parseFloat(autoCalcTargetOverage) || 0;
                    // Apply target overage to eligible items
                    const newEligibleSell = eligibleItems.reduce((sum, item) => {
                      return sum + (item.basePrice * (1 + targetOveragePercent / 100) * item.quantity);
                    }, 0);
                    targetSellTotal = fixedSellTotal + newEligibleSell;
                    // Recalculate commission
                    targetCommission = fixedCommission + eligibleItems.reduce((sum, item) => {
                      const baseComm = item.basePrice * item.quantity * item.manufacturers[0].commissionRate;
                      const newOverageAmt = item.basePrice * (targetOveragePercent / 100) * item.quantity;
                      const overageComm = newOverageAmt * item.manufacturers[0].overageShare;
                      return sum + baseComm + overageComm;
                    }, 0);
                  } else if (autoCalcMode === 'commission' && autoCalcTargetCommission) {
                    targetCommission = parseFloat(autoCalcTargetCommission) || 0;
                    // Calculate required overage to hit target commission
                    // targetCommission = fixedCommission + eligibleBaseCommission + (eligibleOverageAmount * avgOverageShare)
                    // Solve for overage amount, then overage %
                    const requiredOverageCommission = targetCommission - fixedCommission - eligibleBaseCommission;
                    const avgOverageShare = eligibleItems.length > 0
                      ? eligibleItems.reduce((sum, item) => sum + item.manufacturers[0].overageShare, 0) / eligibleItems.length
                      : 0.85;
                    const requiredOverageAmount = avgOverageShare > 0 ? requiredOverageCommission / avgOverageShare : 0;
                    targetOveragePercent = eligibleBaseTotal > 0 ? (requiredOverageAmount / eligibleBaseTotal) * 100 : 0;
                    targetOveragePercent = Math.max(0, targetOveragePercent); // Can't be negative
                    targetSellTotal = fixedSellTotal + eligibleBaseTotal * (1 + targetOveragePercent / 100);
                  }

                  const canApply = eligibleItems.length > 0 && (
                    (autoCalcMode === 'overage' && autoCalcTargetOverage) ||
                    (autoCalcMode === 'commission' && autoCalcTargetCommission)
                  );

                  return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
                        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-[var(--foreground)]">Auto-Calculate Overage</h2>
                          <button
                            onClick={() => {
                              setShowAutoCalcModal(false);
                              setAutoCalcTargetOverage('');
                              setAutoCalcTargetCommission('');
                            }}
                            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>

                        <div className="p-6 space-y-4">
                          <p className="text-sm text-[var(--muted-foreground)]">
                            Set a target overage percentage or total commission, and the system will adjust the overage on all eligible lines to achieve it.
                          </p>

                          {/* Mode Tabs */}
                          <div className="flex border-b border-[var(--border)]">
                            <button
                              onClick={() => setAutoCalcMode('overage')}
                              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                autoCalcMode === 'overage'
                                  ? 'border-[var(--primary)] text-[var(--primary)]'
                                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                              }`}
                            >
                              Target Overage %
                            </button>
                            <button
                              onClick={() => setAutoCalcMode('commission')}
                              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                autoCalcMode === 'commission'
                                  ? 'border-[var(--primary)] text-[var(--primary)]'
                                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                              }`}
                            >
                              Target Commission
                            </button>
                          </div>

                          {/* Input */}
                          {autoCalcMode === 'overage' ? (
                            <div>
                              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Target Overage Percentage
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={autoCalcTargetOverage}
                                  onChange={(e) => setAutoCalcTargetOverage(e.target.value)}
                                  placeholder={currentOveragePercent.toFixed(1)}
                                  className="w-32 px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                                  autoFocus
                                />
                                <span className="text-sm text-[var(--muted-foreground)]">%</span>
                                <span className="text-xs text-[var(--muted-foreground)]">(current: {currentOveragePercent.toFixed(1)}%)</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Target Total Commission
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[var(--muted-foreground)]">$</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={autoCalcTargetCommission}
                                  onChange={(e) => setAutoCalcTargetCommission(e.target.value)}
                                  placeholder={currentCommission.toFixed(0)}
                                  className="w-32 px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                                  autoFocus
                                />
                                <span className="text-xs text-[var(--muted-foreground)]">(current: ${currentCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                              </div>
                            </div>
                          )}

                          {/* Line counts */}
                          <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[var(--muted-foreground)]">Total Lines:</span>
                              <span className="text-[var(--foreground)]">{allItems.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--muted-foreground)]">Eligible (will be modified):</span>
                              <span className="text-green-600 font-medium">{eligibleItems.length}</span>
                            </div>
                            {lockedItems.length > 0 && (
                              <div className="flex justify-between">
                                <span className="text-[var(--muted-foreground)]">Locked (won&apos;t change):</span>
                                <span className="text-amber-600">{lockedItems.length}</span>
                              </div>
                            )}
                            {ineligibleItems.length > 0 && (
                              <div className="flex justify-between">
                                <span className="text-[var(--muted-foreground)]">Overage Ineligible:</span>
                                <span className="text-gray-500">{ineligibleItems.length}</span>
                              </div>
                            )}
                          </div>

                          {/* Preview */}
                          {canApply && (
                            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                              <div className="px-4 py-2 bg-[var(--muted)]/30 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                                Preview
                              </div>
                              <div className="p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-[var(--muted-foreground)]">New Overage %:</span>
                                  <span className={`font-medium ${targetOveragePercent > currentOveragePercent ? 'text-green-600' : targetOveragePercent < currentOveragePercent ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                                    {targetOveragePercent.toFixed(1)}%
                                    <span className="text-xs ml-1">({targetOveragePercent >= currentOveragePercent ? '+' : ''}{(targetOveragePercent - currentOveragePercent).toFixed(1)}%)</span>
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[var(--muted-foreground)]">New Sell Total:</span>
                                  <span className={`font-medium ${targetSellTotal > currentSellTotal ? 'text-green-600' : targetSellTotal < currentSellTotal ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                                    ${targetSellTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    <span className="text-xs ml-1">({targetSellTotal >= currentSellTotal ? '+' : ''}${(targetSellTotal - currentSellTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                                  </span>
                                </div>
                                <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                                  <span className="text-[var(--foreground)] font-medium">New Commission:</span>
                                  <span className={`font-semibold ${targetCommission > currentCommission ? 'text-green-600' : targetCommission < currentCommission ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                                    ${targetCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    <span className="text-xs ml-1">({targetCommission >= currentCommission ? '+' : ''}${(targetCommission - currentCommission).toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setShowAutoCalcModal(false);
                              setAutoCalcTargetOverage('');
                              setAutoCalcTargetCommission('');
                            }}
                            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              // Apply the calculated overage to eligible items
                              setQuoteLineItems(prev => prev.map(item => {
                                if (item.locked || item.manufacturers[0].overageShare === 0) return item;
                                const newSellPrice = item.basePrice * (1 + targetOveragePercent / 100);
                                return {
                                  ...item,
                                  sellPrice: newSellPrice,
                                  overagePercent: targetOveragePercent
                                };
                              }));
                              setShowAutoCalcModal(false);
                              setAutoCalcTargetOverage('');
                              setAutoCalcTargetCommission('');
                            }}
                            disabled={!canApply || targetOveragePercent < 0}
                            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Apply to {eligibleItems.length} Lines
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Set End User Modal */}
                {showSetEndUserModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
                      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Set End User</h2>
                        <button
                          onClick={() => { setShowSetEndUserModal(false); setSelectedEndUser(''); }}
                          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Set the end user for {selectedLineItems.size} selected line item{selectedLineItems.size !== 1 ? 's' : ''}.
                        </p>

                        <div>
                          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                            End User
                          </label>
                          <select
                            value={selectedEndUser}
                            onChange={(e) => setSelectedEndUser(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            autoFocus
                          >
                            <option value="">{selectedQuote.soldToCustomer} (Default)</option>
                            {availableEndUsers.map(user => (
                              <option key={user} value={user}>{user}</option>
                            ))}
                          </select>
                        </div>

                        {/* Preview */}
                        <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Preview</h4>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">Lines to Update:</span>
                            <span className="text-[var(--foreground)]">{selectedLineItems.size}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-[var(--muted-foreground)]">New End User:</span>
                            <span className="font-medium text-[var(--foreground)]">
                              {selectedEndUser || selectedQuote.soldToCustomer}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                        <button
                          onClick={() => { setShowSetEndUserModal(false); setSelectedEndUser(''); }}
                          className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setQuoteLineItems(prev => prev.map(item =>
                              selectedLineItems.has(item.id) ? { ...item, endUser: selectedEndUser } : item
                            ));
                            setShowSetEndUserModal(false);
                            setSelectedEndUser('');
                          }}
                          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          Apply to {selectedLineItems.size} Line{selectedLineItems.size !== 1 ? 's' : ''}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Copy Price Modal */}
                {showCopyPriceModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
                      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">
                          Copy Sell to {showCopyPriceModal.toUpperCase()}
                        </h2>
                        <button
                          onClick={() => setShowCopyPriceModal(null)}
                          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input type="radio" name="applyTo" defaultChecked className="accent-[var(--primary)]" />
                            <span className="text-sm text-[var(--foreground)]">Selected ({selectedLineItems.size} lines)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" name="applyTo" className="accent-[var(--primary)]" />
                            <span className="text-sm text-[var(--foreground)]">All lines</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                            Markup %
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--muted-foreground)]">+</span>
                            <input
                              type="number"
                              defaultValue={showCopyPriceModal === 'l1' ? 10 : showCopyPriceModal === 'l2' ? 15 : 20}
                              className="w-24 px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                            />
                            <span className="text-sm text-[var(--muted-foreground)]">%</span>
                          </div>
                        </div>
                        <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
                          <h4 className="text-sm font-medium text-[var(--foreground)]">Preview</h4>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">Sell Total:</span>
                            <span className="text-[var(--foreground)]">${totals.sellTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">{showCopyPriceModal.toUpperCase()} Total:</span>
                            <span className="font-medium text-[var(--foreground)]">
                              ${Math.round(totals.sellTotal * (showCopyPriceModal === 'l1' ? 1.10 : showCopyPriceModal === 'l2' ? 1.15 : 1.20)).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)] mt-2">
                            2 lines skipped (locked)
                          </p>
                        </div>
                      </div>
                      <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                        <button
                          onClick={() => setShowCopyPriceModal(null)}
                          className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setShowCopyPriceModal(null)}
                          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Lookup Modal - Enhanced with Overage Calculator */}
                {showPriceLookupModal && (() => {
                  // Get the line item for this product
                  const lineItem = quoteLineItems.find(li => li.productNumber === showPriceLookupModal);
                  const basePrice = lineItem?.basePrice || 245;
                  const currentSellPrice = lineItem?.sellPrice || 275;
                  const commissionRate = lineItem?.manufacturers[0].commissionRate || 0.10;
                  const overageShare = lineItem?.manufacturers[0].overageShare || 0.90;

                  // Commission bands
                  const bands = [
                    { band: 1, minPrice: basePrice, rate: 0.10, overageEligible: true },
                    { band: 2, minPrice: basePrice * 0.90, rate: 0.08, overageEligible: false },
                    { band: 3, minPrice: basePrice * 0.80, rate: 0.06, overageEligible: false },
                    { band: 4, minPrice: 0, rate: 0.04, overageEligible: false },
                  ];

                  // Calculate which band the current price falls into
                  const getCurrentBand = (price: number) => {
                    if (price >= basePrice) return 1;
                    if (price >= basePrice * 0.90) return 2;
                    if (price >= basePrice * 0.80) return 3;
                    return 4;
                  };

                  const currentBand = getCurrentBand(currentSellPrice);
                  const targetPrice = priceLookupTargetPrice ? parseFloat(priceLookupTargetPrice) : currentSellPrice;
                  const targetBand = getCurrentBand(targetPrice);
                  const targetBandData = bands[targetBand - 1];

                  const targetOverage = targetPrice - basePrice;
                  const targetOveragePercent = basePrice > 0 ? (targetOverage / basePrice) * 100 : 0;
                  const targetCommission = targetBandData.overageEligible
                    ? (basePrice * targetBandData.rate) + (Math.max(0, targetOverage) * overageShare)
                    : (targetPrice * targetBandData.rate);

                  // Historical overage
                  const avgHistoricalOverage = lineItem
                    ? lineItem.quotedPriceHistory.reduce((sum, p, i) => sum + p - lineItem.priceHistory[i], 0) / lineItem.priceHistory.length
                    : 30;
                  const avgHistoricalOveragePercent = lineItem && lineItem.priceHistory.length > 0
                    ? (avgHistoricalOverage / (lineItem.priceHistory.reduce((a, b) => a + b, 0) / lineItem.priceHistory.length)) * 100
                    : 12;

                  return (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)]">
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">
                          Price Lookup: {showPriceLookupModal}
                        </h2>
                        <button
                          onClick={() => { setShowPriceLookupModal(null); setPriceLookupTargetPrice(''); }}
                          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        {/* Manufacturer Info */}
                        <div className="flex items-center justify-between p-3 bg-[var(--muted)]/30 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)]">Manufacturer</p>
                            <p className="text-sm text-[var(--muted-foreground)]">{lineItem?.manufacturers[0].name || 'Acuity Brands'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                              <circle cx="10" cy="10" r="7"/>
                              <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-sm text-green-600">Approved</span>
                          </div>
                        </div>

                        {/* Price Calculator */}
                        <div className="p-4 border border-[var(--primary)]/30 bg-[var(--primary)]/5 rounded-lg">
                          <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                              <rect x="3" y="3" width="14" height="14" rx="2"/>
                              <path d="M7 7h6M7 10h6M7 13h4"/>
                            </svg>
                            Price Calculator
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Target Sell Price</label>
                              <div className="flex items-center gap-1">
                                <span className="text-sm">$</span>
                                <input
                                  type="number"
                                  value={priceLookupTargetPrice}
                                  onChange={(e) => setPriceLookupTargetPrice(e.target.value)}
                                  placeholder={currentSellPrice.toFixed(2)}
                                  className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Base Price</label>
                              <p className="text-sm font-medium py-1.5">${basePrice.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Calculator Results */}
                          <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <p className="text-xs text-[var(--muted-foreground)]">Overage</p>
                              <p className={`text-lg font-semibold ${targetOverage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${targetOverage.toFixed(2)}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">{targetOveragePercent.toFixed(1)}%</p>
                            </div>
                            <div className="text-center border-x border-[var(--border)]">
                              <p className="text-xs text-[var(--muted-foreground)]">Band</p>
                              <p className={`text-lg font-semibold ${targetBand === 1 ? 'text-green-600' : targetBand === 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {targetBand}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">{(targetBandData.rate * 100).toFixed(0)}% rate</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-[var(--muted-foreground)]">Commission</p>
                              <p className="text-lg font-semibold text-blue-600">
                                ${targetCommission.toFixed(2)}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {targetBandData.overageEligible ? `+${(overageShare * 100).toFixed(0)}% overage` : 'flat rate'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Commission Bands Table */}
                        <div>
                          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Commission Bands</h4>
                          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-[var(--muted)]/30">
                                <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                                  <th className="px-3 py-2">Band</th>
                                  <th className="px-3 py-2">Price Range</th>
                                  <th className="px-3 py-2">Rate</th>
                                  <th className="px-3 py-2">Overage</th>
                                  <th className="px-3 py-2"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border)]">
                                {bands.map((band, idx) => {
                                  const isTarget = targetBand === band.band;
                                  const isCurrent = currentBand === band.band && !priceLookupTargetPrice;
                                  const priceRange = idx === 0
                                    ? `≥ $${basePrice.toFixed(2)}`
                                    : idx === bands.length - 1
                                      ? `< $${bands[idx - 1].minPrice.toFixed(2)}`
                                      : `$${band.minPrice.toFixed(2)}-$${bands[idx - 1].minPrice.toFixed(2)}`;
                                  return (
                                    <tr key={band.band} className={isTarget ? 'bg-[var(--primary)]/10' : isCurrent ? 'bg-green-50' : ''}>
                                      <td className="px-3 py-2">
                                        <span className={`flex items-center gap-2 ${isTarget || isCurrent ? 'font-medium' : ''}`}>
                                          {isTarget && (
                                            <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
                                          )}
                                          {isCurrent && !isTarget && (
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                          )}
                                          {band.band}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-sm">{priceRange}</td>
                                      <td className="px-3 py-2 text-sm font-medium">{(band.rate * 100).toFixed(0)}%</td>
                                      <td className="px-3 py-2">
                                        {band.overageEligible ? (
                                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                                            <path d="M5 10l3 3 7-7"/>
                                          </svg>
                                        ) : (
                                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                          </svg>
                                        )}
                                      </td>
                                      <td className="px-3 py-2">
                                        <button
                                          onClick={() => setPriceLookupTargetPrice(band.minPrice.toFixed(2))}
                                          className="text-xs text-[var(--primary)] hover:underline"
                                        >
                                          Use
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Historical Average */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Historical Avg Overage:</span> ${avgHistoricalOverage.toFixed(2)} ({avgHistoricalOveragePercent.toFixed(1)}%)
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Based on last 12 months of quoted prices
                          </p>
                        </div>

                        {/* Current Status */}
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700">
                            <span className="font-medium">Current:</span> Band {currentBand} (Sell ${currentSellPrice.toFixed(2)}, Base ${basePrice.toFixed(2)})
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Overage: ${(currentSellPrice - basePrice).toFixed(2)} ({((currentSellPrice - basePrice) / basePrice * 100).toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                      <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between sticky bottom-0 bg-[var(--card)]">
                        <button
                          onClick={() => setPriceLookupTargetPrice('')}
                          className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                          Reset Calculator
                        </button>
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setShowPriceLookupModal(null); setPriceLookupTargetPrice(''); }}
                            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                          >
                            Close
                          </button>
                          {priceLookupTargetPrice && (
                            <button
                              onClick={() => { setShowPriceLookupModal(null); setPriceLookupTargetPrice(''); }}
                              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
                            >
                              Apply ${parseFloat(priceLookupTargetPrice).toFixed(2)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* Save View Modal */}
                {showSaveViewModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
                      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Save View</h2>
                        <button
                          onClick={() => { setShowSaveViewModal(false); setNewViewName(''); }}
                          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                            View Name
                          </label>
                          <input
                            type="text"
                            value={newViewName}
                            onChange={(e) => setNewViewName(e.target.value)}
                            placeholder="Enter view name..."
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            autoFocus
                          />
                        </div>
                        <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Columns Included ({effectiveVisibleColumns.size})</h4>
                          <div className="flex flex-wrap gap-2">
                            {columnDefinitions.filter(c => effectiveVisibleColumns.has(c.key)).map(col => (
                              <span key={col.key} className="px-2 py-1 bg-white border border-[var(--border)] rounded text-xs text-[var(--foreground)]">
                                {col.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                        <button
                          onClick={() => { setShowSaveViewModal(false); setNewViewName(''); }}
                          className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveCurrentView}
                          disabled={!newViewName.trim()}
                          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save View
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Approvals Tab */}
            {detailTab === 'approvals' && (
              <div className="space-y-6">
                {/* Header with Builder Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Manufacturer Approvals</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Builder: {selectedQuote.soldToCustomer}</p>
                  </div>
                  {(() => {
                    const notApprovedMfrsHeader = quoteLineItems
                      .filter(li => li.manufacturers[0].approvalStatus === 'not_approved' || li.manufacturers[0].approvalStatus === 'unknown')
                      .reduce((acc, li) => {
                        const mfr = li.manufacturers[0];
                        if (!acc[mfr.name]) {
                          acc[mfr.name] = { lines: 0, value: 0, status: mfr.approvalStatus, items: [] as typeof quoteLineItems };
                        }
                        acc[mfr.name].lines++;
                        acc[mfr.name].value += li.sellPrice * li.quantity;
                        acc[mfr.name].items.push(li);
                        return acc;
                      }, {} as Record<string, { lines: number; value: number; status: string; items: typeof quoteLineItems }>);

                    const hasNotApprovedHeader = Object.keys(notApprovedMfrsHeader).length > 0;

                    const generateAllManufacturersPdfDataHeader = () => {
                      const allProducts: { manufacturer: string; sku: string; description: string; qty: number; value: number }[] = [];
                      let totalValue = 0;

                      Object.entries(notApprovedMfrsHeader).forEach(([mfrName, data]) => {
                        data.items.forEach(li => {
                          allProducts.push({
                            manufacturer: mfrName,
                            sku: li.productNumber,
                            description: li.description,
                            qty: li.quantity,
                            value: li.sellPrice * li.quantity,
                          });
                          totalValue += li.sellPrice * li.quantity;
                        });
                      });

                      return {
                        manufacturers: Object.keys(notApprovedMfrsHeader),
                        builder: selectedQuote?.soldToCustomer || '',
                        project: selectedQuote?.name || '',
                        products: allProducts,
                        justification: `Requesting approval for ${Object.keys(notApprovedMfrsHeader).join(', ')} products on the ${selectedQuote?.name} project. These products meet the project specifications and offer competitive pricing.`,
                        totalValue,
                      };
                    };

                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!hasNotApprovedHeader) return;
                            const data = generateAllManufacturersPdfDataHeader();
                            setGeneratedPdfData({
                              manufacturer: data.manufacturers.join(', '),
                              builder: data.builder,
                              project: data.project,
                              products: data.products.map(p => ({
                                sku: p.sku,
                                description: p.description,
                                qty: p.qty,
                                value: p.value,
                              })),
                              justification: data.justification,
                              totalValue: data.totalValue,
                            });
                            setShowPdfPreviewModal(true);
                          }}
                          disabled={!hasNotApprovedHeader}
                          className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                            hasNotApprovedHeader
                              ? 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                              : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          title={hasNotApprovedHeader ? "Generate PDF for all manufacturers needing approval" : "No manufacturers need approval"}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6"/>
                            <path d="M9 15h6M9 11h6"/>
                          </svg>
                          Generate PDF
                        </button>
                        <button
                          onClick={() => setShowEditTemplateModal(true)}
                          className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                          title="Edit PDF Template"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit Template
                        </button>
                        <button
                          onClick={() => {
                            if (!hasNotApprovedHeader) return;
                            const data = generateAllManufacturersPdfDataHeader();
                            setGeneratedPdfData({
                              manufacturer: data.manufacturers.join(', '),
                              builder: data.builder,
                              project: data.project,
                              products: data.products.map(p => ({
                                sku: p.sku,
                                description: p.description,
                                qty: p.qty,
                                value: p.value,
                              })),
                              justification: data.justification,
                              totalValue: data.totalValue,
                            });
                            setShowSendEmailModal(true);
                          }}
                          disabled={!hasNotApprovedHeader}
                          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                            hasNotApprovedHeader
                              ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          title={hasNotApprovedHeader ? "Send approval request email" : "No manufacturers need approval"}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="M22 7l-10 7L2 7"/>
                          </svg>
                          Send Request
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Approved Manufacturers */}
                <div className="bg-[var(--card)] rounded-lg border border-green-200 overflow-hidden">
                  <div className="px-4 py-3 bg-green-50 border-b border-green-200 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                      <circle cx="10" cy="10" r="7"/>
                      <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h3 className="font-semibold text-green-800">Approved</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--muted)]/30">
                        <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                          <th className="px-4 py-2">Manufacturer</th>
                          <th className="px-4 py-2">Category</th>
                          <th className="px-4 py-2">Lines</th>
                          <th className="px-4 py-2">Value</th>
                          <th className="px-4 py-2">Approved</th>
                          <th className="px-4 py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {(() => {
                          const approvedMfrs = quoteLineItems
                            .filter(li => li.manufacturers[0].approvalStatus === 'approved')
                            .reduce((acc, li) => {
                              const mfr = li.manufacturers[0];
                              if (!acc[mfr.name]) {
                                acc[mfr.name] = { lines: 0, value: 0, date: mfr.approvalDate, notes: mfr.approvalNotes };
                              }
                              acc[mfr.name].lines++;
                              acc[mfr.name].value += li.sellPrice * li.quantity;
                              return acc;
                            }, {} as Record<string, { lines: number; value: number; date: string | null; notes: string | null }>);

                          return Object.entries(approvedMfrs).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-4 text-center text-sm text-[var(--muted-foreground)]">
                                No approved manufacturers for this quote
                              </td>
                            </tr>
                          ) : Object.entries(approvedMfrs).map(([name, data]) => (
                            <tr key={name} className="hover:bg-[var(--muted)]/20">
                              <td className="px-4 py-3 font-medium text-[var(--foreground)]">{name}</td>
                              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">Lighting</td>
                              <td className="px-4 py-3 text-sm text-[var(--foreground)]">{data.lines}</td>
                              <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">${data.value.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{data.date}</td>
                              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] truncate max-w-[200px]" title={data.notes || ''}>
                                {data.notes || 'All products'}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Needs Review (Conditional/Pending) */}
                <div className="bg-[var(--card)] rounded-lg border border-yellow-200 overflow-hidden">
                  <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                      <circle cx="10" cy="10" r="7"/>
                      <path d="M10 6v4l2 2" strokeLinecap="round"/>
                    </svg>
                    <h3 className="font-semibold text-yellow-800">Needs Review (Conditional / Pending)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--muted)]/30">
                        <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                          <th className="px-4 py-2">Manufacturer</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Lines</th>
                          <th className="px-4 py-2">Details</th>
                          <th className="px-4 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {(() => {
                          const conditionalMfrs = quoteLineItems
                            .filter(li => li.manufacturers[0].approvalStatus === 'conditional')
                            .reduce((acc, li) => {
                              const mfr = li.manufacturers[0];
                              if (!acc[mfr.name]) {
                                acc[mfr.name] = { lines: 0, status: 'Conditional', notes: mfr.approvalNotes, date: mfr.approvalDate };
                              }
                              acc[mfr.name].lines++;
                              return acc;
                            }, {} as Record<string, { lines: number; status: string; notes: string | null; date: string | null }>);

                          // Add pending requests
                          mockApprovalRequests
                            .filter(ar => ar.quoteId === selectedQuote.id && ar.status === 'pending')
                            .forEach(ar => {
                              conditionalMfrs[ar.manufacturerName] = {
                                lines: ar.skus.length,
                                status: 'Pending',
                                notes: `Requested ${ar.requestedDate}`,
                                date: ar.requestedDate,
                              };
                            });

                          return Object.entries(conditionalMfrs).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-sm text-[var(--muted-foreground)]">
                                No conditional or pending approvals
                              </td>
                            </tr>
                          ) : Object.entries(conditionalMfrs).map(([name, data]) => (
                            <tr key={name} className="hover:bg-[var(--muted)]/20">
                              <td className="px-4 py-3 font-medium text-[var(--foreground)]">{name}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  data.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {data.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--foreground)]">{data.lines}</td>
                              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{data.notes}</td>
                              <td className="px-4 py-3">
                                <button className="px-3 py-1 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors">
                                  {data.status === 'Pending' ? 'View Request' : 'Check SKUs'}
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Not Approved (Action Required) */}
                <div className="bg-[var(--card)] rounded-lg border border-red-200 overflow-hidden">
                  <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                      <circle cx="10" cy="10" r="7"/>
                      <path d="M8 8l4 4M12 8l-4 4" strokeLinecap="round"/>
                    </svg>
                    <h3 className="font-semibold text-red-800">Not Approved (Action Required)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--muted)]/30">
                        <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                          <th className="px-4 py-2">Manufacturer</th>
                          <th className="px-4 py-2">Category</th>
                          <th className="px-4 py-2">Lines</th>
                          <th className="px-4 py-2">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {(() => {
                          const notApprovedMfrs = quoteLineItems
                            .filter(li => li.manufacturers[0].approvalStatus === 'not_approved' || li.manufacturers[0].approvalStatus === 'unknown')
                            .reduce((acc, li) => {
                              const mfr = li.manufacturers[0];
                              if (!acc[mfr.name]) {
                                acc[mfr.name] = { lines: 0, value: 0, status: mfr.approvalStatus };
                              }
                              acc[mfr.name].lines++;
                              acc[mfr.name].value += li.sellPrice * li.quantity;
                              return acc;
                            }, {} as Record<string, { lines: number; value: number; status: string }>);

                          return Object.keys(notApprovedMfrs).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-4 text-center text-sm text-green-600">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-2">
                                  <circle cx="10" cy="10" r="7"/>
                                  <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                All manufacturers approved or requests pending
                              </td>
                            </tr>
                          ) : Object.entries(notApprovedMfrs).map(([name, data]) => (
                            <tr key={name} className="hover:bg-[var(--muted)]/20">
                              <td className="px-4 py-3 font-medium text-[var(--foreground)]">{name}</td>
                              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                                {data.status === 'unknown' ? 'Unknown' : 'Lighting'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--foreground)]">{data.lines}</td>
                              <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">${data.value.toLocaleString()}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pending Approval Requests */}
                {mockApprovalRequests.filter(ar => ar.quoteId === selectedQuote.id && ar.status === 'pending').length > 0 && (
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <h3 className="font-semibold text-[var(--foreground)]">Pending Approval Requests</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {mockApprovalRequests
                        .filter(ar => ar.quoteId === selectedQuote.id && ar.status === 'pending')
                        .map(request => (
                          <div key={request.id} className="border border-[var(--border)] rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-[var(--foreground)]">{request.manufacturerName}</h4>
                                  <span className="text-xs text-[var(--muted-foreground)]">#{request.id}</span>
                                </div>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                  Requested: {request.requestedDate} ({Math.floor((Date.now() - new Date(request.requestedDate).getTime()) / (1000 * 60 * 60 * 24))} days ago)
                                </p>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                  Sent to: {request.requestedBy}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="10" cy="10" r="7"/>
                                  <path d="M10 6v4l2 2" strokeLinecap="round"/>
                                </svg>
                                Awaiting Response
                              </span>
                            </div>
                            <p className="text-sm text-[var(--foreground)] mb-3 line-clamp-2">{request.justification}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs text-[var(--muted-foreground)]">SKUs:</span>
                              {request.skus.map(sku => (
                                <span key={sku} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                  {sku}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors">
                                View Request
                              </button>
                              <button className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors">
                                Resend
                              </button>
                              <button
                                onClick={() => setShowMarkApprovalModal(true)}
                                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                Mark as Approved
                              </button>
                              <button className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors">
                                Attach Response
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recipients Tab */}
            {detailTab === 'recipients' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Recipients</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Manage quote recipients, distributor quotes, and send quotes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                      </svg>
                      Add Recipient
                    </button>
                    <button
                      onClick={() => setShowDistributorModal(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="14" height="14" rx="2"/>
                        <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                      </svg>
                      Generate All Distributor Quotes
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h12v12l-3-3H7l-3 3V4z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Send to Selected
                    </button>
                  </div>
                </div>

                {/* Approval Warning */}
                {quoteLineItems.some(li => li.manufacturers[0].approvalStatus === 'not_approved') && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600 mt-0.5">
                        <path d="M10 6v4M10 14h.01"/>
                        <circle cx="10" cy="10" r="7"/>
                      </svg>
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-800">Approval Warning</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          {quoteLineItems.filter(li => li.manufacturers[0].approvalStatus === 'not_approved').length} manufacturers on this quote need approval from {selectedQuote.soldToCustomer}:
                        </p>
                        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                          {Object.entries(
                            quoteLineItems
                              .filter(li => li.manufacturers[0].approvalStatus === 'not_approved')
                              .reduce((acc, li) => {
                                const mfr = li.manufacturers[0].name;
                                if (!acc[mfr]) acc[mfr] = { lines: 0, value: 0 };
                                acc[mfr].lines++;
                                acc[mfr].value += li.sellPrice * li.quantity;
                                return acc;
                              }, {} as Record<string, { lines: number; value: number }>)
                          ).map(([name, data]) => (
                            <li key={name}>• {name} ({data.lines} lines, ${data.value.toLocaleString()})</li>
                          ))}
                        </ul>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => setShowApprovalRequestModal(true)}
                            className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                          >
                            Request Approvals Now
                          </button>
                          <button className="px-3 py-1.5 text-sm text-yellow-700 hover:underline">
                            Send Anyway (Not Recommended)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recipients Table */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[var(--muted)]/30">
                      <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                        <th className="px-4 py-3 w-10">
                          <input type="checkbox" className="accent-[var(--primary)]" />
                        </th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Level</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Distributor Quote</th>
                        <th className="px-4 py-3">Sent</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {((): Recipient[] => [
                        { id: 'rec-1', company: 'Graybar Electric', contact: 'John Smith', email: 'john@graybar.com', level: 'Sell', price: totals.sellTotal, sent: 'Mar 15', opened: true, distributorQuote: quoteDistributorQuotes.find(dq => dq.distributorName === 'Graybar Electric') || null, version: 3 },
                        { id: 'rec-2', company: 'HD Supply', contact: 'Sarah Lee', email: 'sarah@hdsupply.com', level: 'L1', price: totals.l1Total, sent: null, opened: false, distributorQuote: quoteDistributorQuotes.find(dq => dq.distributorName === 'HD Supply') || null, version: 2 },
                        { id: 'rec-3', company: selectedQuote.soldToCustomer, contact: 'Mike Johnson', email: 'mike@turner.com', level: 'Sell', price: totals.sellTotal, sent: 'Mar 15', opened: true, distributorQuote: null, version: 3 },
                        { id: 'rec-4', company: 'Echo Electric', contact: 'Amy Wong', email: 'amy@echo.com', level: 'L1', price: totals.l1Total, sent: null, opened: false, distributorQuote: null, version: 1 },
                      ])().map((recipient, idx) => (
                        <tr key={idx} className="hover:bg-[var(--muted)]/20 cursor-pointer" onClick={() => { setSelectedRecipient(recipient); setRecipientQuoteVersion(recipient.version); setDetailTab('lines'); }}>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="accent-[var(--primary)]"
                              defaultChecked={!recipient.sent}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-[var(--primary)] hover:underline">{recipient.company}</td>
                          <td className="px-4 py-3 text-[var(--foreground)]">{recipient.contact}</td>
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">{recipient.email}</td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <select className="px-2 py-1 text-sm border border-[var(--border)] rounded bg-white" defaultValue={recipient.level}>
                              <option value="Sell">Sell</option>
                              <option value="L1">L1</option>
                              <option value="L2">L2</option>
                              <option value="L3">L3</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 font-medium text-[var(--foreground)]">${recipient.price.toLocaleString()}</td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            {recipient.distributorQuote ? (
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  recipient.distributorQuote.status === 'ready_to_send' ? 'bg-green-100 text-green-700' :
                                  recipient.distributorQuote.status === 'requires_cross' ? 'bg-yellow-100 text-yellow-700' :
                                  recipient.distributorQuote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {recipient.distributorQuote.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <button
                                  onClick={() => setSelectedDistributorQuote(recipient.distributorQuote!)}
                                  className="text-xs text-[var(--primary)] hover:underline"
                                >
                                  View
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  alert(`Creating distributor quote for ${recipient.company}...`);
                                }}
                                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                              >
                                + Create
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {recipient.sent ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[var(--muted-foreground)]">{recipient.sent}</span>
                                {recipient.opened && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Opened</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-[var(--muted-foreground)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="10" cy="5" r="1"/>
                                <circle cx="10" cy="10" r="1"/>
                                <circle cx="10" cy="15" r="1"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Send History */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Send History</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-[var(--muted)]/20 rounded-lg">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 mt-0.5">
                        <path d="M20 4L9 15l-5-5"/>
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--foreground)]">
                          <span className="font-medium">Quote sent to Graybar Electric</span> - John Smith
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          Mar 15, 2024 at 2:30 PM • Sell Price: $2,450,000 • Opened Mar 15 at 3:45 PM
                        </p>
                      </div>
                      <button className="text-sm text-[var(--primary)] hover:underline">Resend</button>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-[var(--muted)]/20 rounded-lg">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 mt-0.5">
                        <path d="M20 4L9 15l-5-5"/>
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--foreground)]">
                          <span className="font-medium">Quote sent to {selectedQuote.soldToCustomer}</span> - Mike Johnson
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">
                          Mar 15, 2024 at 2:30 PM • Sell Price: $2,450,000 • Opened Mar 16 at 9:15 AM
                        </p>
                      </div>
                      <button className="text-sm text-[var(--primary)] hover:underline">Resend</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Versions Tab */}
            {detailTab === 'versions' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Version History</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Track changes and compare versions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="6" height="14" rx="1"/>
                        <rect x="11" y="3" width="6" height="14" rx="1"/>
                      </svg>
                      Compare Versions
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                      </svg>
                      Create Revision
                    </button>
                  </div>
                </div>

                {/* Version List */}
                <div className="space-y-3">
                  {[
                    { version: 3, current: true, date: 'Mar 20, 2024', user: 'Sarah Chen', changes: 'Price adjustments', approvalStatus: 'pending', approvalCount: 2, value: 2450000 },
                    { version: 2, current: false, date: 'Mar 18, 2024', user: 'Mike Torres', changes: 'Added fixtures', approvalStatus: 'needed', approvalCount: 4, value: 2380000 },
                    { version: 1, current: false, date: 'Mar 15, 2024', user: 'Sarah Chen', changes: 'Initial quote', approvalStatus: 'needed', approvalCount: 5, value: 2200000 },
                  ].map(history => (
                    <div
                      key={history.version}
                      className={`p-4 rounded-lg border ${history.current ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] bg-[var(--card)]'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="version"
                            defaultChecked={history.current}
                            className="accent-[var(--primary)]"
                          />
                          <div className="flex flex-col items-center">
                            <span className={`px-2 py-1 rounded text-sm font-semibold ${history.current ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 text-gray-700'}`}>
                              v{history.version}
                            </span>
                            {history.current && (
                              <span className="text-xs text-[var(--primary)] mt-1">current</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium text-[var(--foreground)]">{history.date}</span>
                            <span className="text-[var(--muted-foreground)]">•</span>
                            <span className="text-[var(--muted-foreground)]">{history.user}</span>
                          </div>
                          <p className="text-sm text-[var(--foreground)]">{history.changes}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm font-medium text-[var(--foreground)]">${history.value.toLocaleString()}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              history.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {history.approvalStatus === 'pending' ? `${history.approvalCount} pending` : `${history.approvalCount} needed`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors">
                            View
                          </button>
                          {!history.current && (
                            <button
                              onClick={() => setShowRevertModal(true)}
                              className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 border border-orange-200 rounded hover:bg-orange-200 transition-colors"
                            >
                              Revert to v{history.version}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Changes Summary */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">Changes in v3 (from v2)</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                        <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                      </svg>
                      <span className="text-sm text-green-700">Added 3 emergency lighting items ($45,000)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                        <path d="M12 5l-4 14M7 7l-2 2 2 2M13 11l2 2-2 2"/>
                      </svg>
                      <span className="text-sm text-yellow-700">Price changed on 5 corridor fixtures (+4% overage applied)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                        <circle cx="10" cy="10" r="7"/>
                        <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm text-blue-700">Lutron approval status changed: Not Approved → Conditional</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                        <path d="M4 6h12M4 10h12M4 14h8"/>
                      </svg>
                      <span className="text-sm text-gray-700">Total value: $2,380,000 → $2,450,000 (+$70,000 / +2.9%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Files Tab */}
            {detailTab === 'files' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Quote Files</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Manage files attached to this quote and control which are included in emails</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                      <path d="M10 10v4M8 12h4" strokeLinecap="round"/>
                    </svg>
                    Upload File
                  </button>
                </div>

                {/* Files Table */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[var(--muted)]/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">File Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Size</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Uploaded</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Include in Email</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteFiles.filter(f => f.quoteId === selectedQuote.id).map(file => {
                        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
                        const getFileIcon = () => {
                          switch (fileExtension) {
                            case 'pdf':
                              return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-500"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/><text x="6" y="18" fontSize="6" fill="currentColor" fontWeight="bold">PDF</text></svg>;
                            case 'xlsx':
                            case 'xls':
                              return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-600"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/><text x="5" y="18" fontSize="5" fill="currentColor" fontWeight="bold">XLS</text></svg>;
                            case 'dwg':
                            case 'dxf':
                              return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-600"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/><text x="4" y="18" fontSize="5" fill="currentColor" fontWeight="bold">CAD</text></svg>;
                            case 'zip':
                            case 'rar':
                              return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-yellow-600"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/><text x="5" y="18" fontSize="5" fill="currentColor" fontWeight="bold">ZIP</text></svg>;
                            default:
                              return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-500"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/></svg>;
                          }
                        };
                        const formatFileSize = (bytes: number) => {
                          if (bytes < 1024) return `${bytes} B`;
                          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                          return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                        };
                        return (
                          <tr key={file.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/20">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {getFileIcon()}
                                <span className="text-sm font-medium text-[var(--foreground)]">{file.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-[var(--muted-foreground)] uppercase">{fileExtension}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-[var(--muted-foreground)]">{formatFileSize(file.size)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                <div className="text-[var(--foreground)]">{new Date(file.uploadedAt).toLocaleDateString()}</div>
                                <div className="text-xs text-[var(--muted-foreground)]">by {file.uploadedBy}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setQuoteFiles(prev => prev.map(f =>
                                    f.id === file.id ? { ...f, includeInEmail: !f.includeInEmail } : f
                                  ));
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  file.includeInEmail
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {file.includeInEmail ? (
                                  <>
                                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M16 5l-9 9-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Include
                                  </>
                                ) : (
                                  <>
                                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                    </svg>
                                    Exclude
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors" title="Download">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                                    <path d="M10 3v10M6 9l4 4 4-4M4 15h12" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                <button className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors" title="Preview">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                                    <circle cx="10" cy="10" r="3"/>
                                    <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                                  </svg>
                                </button>
                                <button className="p-1.5 hover:bg-red-50 rounded transition-colors" title="Delete">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                                    <path d="M4 6h12M8 6V4h4v2M6 6v10a1 1 0 001 1h6a1 1 0 001-1V6"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Spec Sheets Section */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-md font-semibold text-[var(--foreground)]">Line Item Spec Sheets</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">Select which product spec sheets to include when sending the quote</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const lineItemsWithSpecs = quoteLineItems.filter(li => li.hasSpecSheet);
                          setSpecSheetSelections(new Set(lineItemsWithSpecs.map(li => li.id)));
                        }}
                        className="text-sm text-[var(--primary)] hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-[var(--muted-foreground)]">|</span>
                      <button
                        onClick={() => setSpecSheetSelections(new Set())}
                        className="text-sm text-[var(--primary)] hover:underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[var(--muted)]/30">
                        <tr>
                          <th className="w-12 px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={quoteLineItems.filter(li => li.hasSpecSheet).every(li => specSheetSelections.has(li.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSpecSheetSelections(new Set(quoteLineItems.filter(li => li.hasSpecSheet).map(li => li.id)));
                                } else {
                                  setSpecSheetSelections(new Set());
                                }
                              }}
                              className="accent-[var(--primary)]"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part #</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Manufacturer</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Include in Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quoteLineItems.filter(li => li.hasSpecSheet).map(item => (
                          <tr key={item.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/20">
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={specSheetSelections.has(item.id)}
                                onChange={() => {
                                  setSpecSheetSelections(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(item.id)) {
                                      newSet.delete(item.id);
                                    } else {
                                      newSet.add(item.id);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="accent-[var(--primary)]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm text-[var(--foreground)]">{item.productNumber}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-[var(--foreground)]">{item.description}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-[var(--muted-foreground)]">{item.manufacturers[0].name}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setSpecSheetSelections(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(item.id)) {
                                      newSet.delete(item.id);
                                    } else {
                                      newSet.add(item.id);
                                    }
                                    return newSet;
                                  });
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  specSheetSelections.has(item.id)
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {specSheetSelections.has(item.id) ? (
                                  <>
                                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M16 5l-9 9-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Include
                                  </>
                                ) : (
                                  <>
                                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                    </svg>
                                    Exclude
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="10" cy="10" r="8"/>
                      <path d="M10 6v4M10 14h.01"/>
                    </svg>
                    {specSheetSelections.size} of {quoteLineItems.filter(li => li.hasSpecSheet).length} spec sheets selected for inclusion
                  </div>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {detailTab === 'notes' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Notes</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Internal notes for this quote</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                    Add Note
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                  {/* Note 1 */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-[var(--foreground)]">SC</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-[var(--foreground)]">Sarah Chen</span>
                          <span className="text-xs text-[var(--muted-foreground)]">Mar 20, 2024 at 2:34 PM</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)]">
                          Customer asked for 5% discount on corridor fixtures. Applied 4% - need manager approval for more.
                        </p>
                      </div>
                      <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="10" cy="5" r="1"/>
                          <circle cx="10" cy="10" r="1"/>
                          <circle cx="10" cy="15" r="1"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Note 2 */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-[var(--foreground)]">MT</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-[var(--foreground)]">Mike Torres</span>
                          <span className="text-xs text-[var(--muted-foreground)]">Mar 18, 2024 at 4:15 PM</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)]">
                          Spoke with Turner Construction - they prefer Lutron but are open to alternatives if pricing is better. Deadline for approval response is end of month.
                        </p>
                      </div>
                      <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="10" cy="5" r="1"/>
                          <circle cx="10" cy="10" r="1"/>
                          <circle cx="10" cy="15" r="1"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Note 3 */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-[var(--foreground)]">SC</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-[var(--foreground)]">Sarah Chen</span>
                          <span className="text-xs text-[var(--muted-foreground)]">Mar 10, 2024 at 9:15 AM</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)]">
                          Customer has expressed interest in upgrading to premium fixtures. May need to adjust lead times based on manufacturer availability. Follow up with Turner Construction regarding approval timeline.
                        </p>
                      </div>
                      <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="10" cy="5" r="1"/>
                          <circle cx="10" cy="10" r="1"/>
                          <circle cx="10" cy="15" r="1"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {detailTab === 'tasks' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Tasks</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Track action items and follow-ups for this quote</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                    </svg>
                    Add Task
                  </button>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                  {/* Overdue Task */}
                  <div className="bg-[var(--card)] rounded-lg border border-red-200 p-4">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 accent-[var(--primary)]" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-[var(--foreground)]">Follow up with Turner Construction</span>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">Overdue</span>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)]">Confirm approval timeline for Lutron fixtures</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                          <span>Due: Mar 25, 2024</span>
                          <span>Assigned: Sarah Chen</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Task */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 accent-[var(--primary)]" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-[var(--foreground)]">Send revised pricing to customer</span>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Due Soon</span>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)]">Include updated overage calculations</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                          <span>Due: Mar 28, 2024</span>
                          <span>Assigned: Mike Torres</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Completed Task */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 opacity-60">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked className="mt-1 accent-[var(--primary)]" readOnly />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-[var(--foreground)] line-through">Submit approval request to Philips</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Completed</span>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)]">Request approval for LED panels</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                          <span>Completed: Mar 20, 2024</span>
                          <span>By: Sarah Chen</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {detailTab === 'activity' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Activity Feed</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">All activity and changes on this quote</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                      <option>All Activity</option>
                      <option>Price Changes</option>
                      <option>Approvals</option>
                      <option>Emails</option>
                      <option>Versions</option>
                    </select>
                  </div>
                </div>

                {/* Activity List */}
                <div className="space-y-4">
                  {/* Price Update */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                          <path d="M12 4v12M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">PRICE UPDATE</span>
                          <span className="text-xs text-[var(--muted-foreground)]">2 hours ago</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)] mb-1">Sarah Chen updated pricing</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Changed overage from 10% to 12.8% on LED Troffer items</p>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                          <circle cx="10" cy="10" r="8"/>
                          <path d="M10 6v4l2.5 1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">APPROVAL UPDATE</span>
                          <span className="text-xs text-[var(--muted-foreground)]">Yesterday at 4:30 PM</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)] mb-1">Lutron approval status changed</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Status changed to "Conditional" - specific products only approved</p>
                      </div>
                    </div>
                  </div>

                  {/* Email Sent */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                          <rect x="2" y="4" width="16" height="12" rx="2"/>
                          <path d="M18 6l-8 5-8-5"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700">APPROVAL SENT</span>
                          <span className="text-xs text-[var(--muted-foreground)]">Mar 18, 2024 at 2:15 PM</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)] mb-1">Mike Torres sent approval request</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Sent Lutron approval request to builder@turnerconstruction.com</p>
                      </div>
                    </div>
                  </div>

                  {/* Quote Sent */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                          <path d="M4 4l12 6-12 6V4z" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700">QUOTE SENT</span>
                          <span className="text-xs text-[var(--muted-foreground)]">Mar 16, 2024 at 10:30 AM</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)] mb-1">Sarah Chen sent quote to recipient</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Sent to John Smith at Graybar (Level: Sell)</p>
                      </div>
                    </div>
                  </div>

                  {/* Version Created */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                          <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                          <path d="M14 2v4h-4"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">VERSION CREATED</span>
                          <span className="text-xs text-[var(--muted-foreground)]">Mar 15, 2024 at 3:45 PM</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)] mb-1">Sarah Chen created version v3</p>
                        <p className="text-sm text-[var(--muted-foreground)]">New version created with updated fixture selections</p>
                      </div>
                    </div>
                  </div>

                  {/* Quote Created */}
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                          <circle cx="10" cy="10" r="8"/>
                          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">QUOTE CREATED</span>
                          <span className="text-xs text-[var(--muted-foreground)]">Mar 10, 2024 at 9:00 AM</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)] mb-1">Sarah Chen created this quote</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Quote Q-2024-0892 created for Downtown Office Tower</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submittals Tab */}
            {detailTab === 'submittals' && (() => {
              const quoteSubmittals = submittals.filter(s => s.quoteIds.includes(selectedQuote.id));
              const hasSubmittals = quoteSubmittals.length > 0;

              return (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">Submittals</h2>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {hasSubmittals
                          ? `${quoteSubmittals.length} submittal${quoteSubmittals.length > 1 ? 's' : ''} for this quote`
                          : 'Manage product submittals and documentation for this quote'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasSubmittals && (
                        <button
                          onClick={() => setPrintSubmittal(quoteSubmittals[0])}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Create PDF
                        </button>
                      )}
                      <button
                        onClick={() => setShowCreateSubmittalModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                        </svg>
                        Create Submittal
                      </button>
                    </div>
                  </div>

                  {/* Existing Submittals */}
                  {hasSubmittals && (
                    <div className="space-y-4">
                      {quoteSubmittals.map((submittal) => (
                        <div key={submittal.id} className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden hover:border-[var(--primary)]/50 transition-colors cursor-pointer" onClick={() => setSelectedSubmittalForDetail(submittal)}>
                          {/* Submittal Header */}
                          <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{submittal.jobName}</h3>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${submittalStatusColors[submittal.status].bg} ${submittalStatusColors[submittal.status].text}`}>
                                    {submittalStatusLabels[submittal.status]}
                                  </span>
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)]">
                                  Rev {submittal.currentRevision} • {submittal.items.length} items • Updated {new Date(submittal.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSubmittalId(submittal.id);
                                  setShowSubmittalConfigModal(true);
                                }}
                                className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                                title="Configure"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="3"/>
                                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                                </svg>
                              </button>
                              {submittal.revisions.length > 0 && submittal.revisions[submittal.currentRevision]?.generatedPdfUrl && (
                                <button onClick={(e) => e.stopPropagation()} className="px-3 py-1 text-xs bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors">
                                  Download PDF
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Meta Information Bar */}
                          <div className="px-4 py-2 bg-[var(--background)] border-b border-[var(--border)] flex items-center gap-6 text-xs" onClick={(e) => e.stopPropagation()}>
                            {/* Architect */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSubmittalId(submittal.id);
                                setShowSubmittalConfigModal(true);
                              }}
                              className="flex items-center gap-1.5 hover:bg-[var(--muted)] px-2 py-1 -mx-2 -my-1 rounded transition-colors"
                            >
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 flex-shrink-0">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                                  <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                                </svg>
                              </div>
                              <span className="text-[var(--muted-foreground)]">Architect:</span>
                              <span className="text-[var(--foreground)] font-medium">
                                {submittal.architects.length > 0 ? submittal.architects[0].contactName : <span className="italic text-[var(--muted-foreground)]">+ Add</span>}
                              </span>
                            </button>

                            <div className="w-px h-4 bg-[var(--border)]" />

                            {/* Engineer */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSubmittalId(submittal.id);
                                setShowSubmittalConfigModal(true);
                              }}
                              className="flex items-center gap-1.5 hover:bg-[var(--muted)] px-2 py-1 -mx-2 -my-1 rounded transition-colors"
                            >
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 flex-shrink-0">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                                  <circle cx="12" cy="12" r="3"/>
                                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                                </svg>
                              </div>
                              <span className="text-[var(--muted-foreground)]">Engineer:</span>
                              <span className="text-[var(--foreground)] font-medium">
                                {submittal.engineers.length > 0 ? submittal.engineers[0].contactName : <span className="italic text-[var(--muted-foreground)]">+ Add</span>}
                              </span>
                            </button>

                            <div className="w-px h-4 bg-[var(--border)]" />

                            {/* Customer */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSubmittalId(submittal.id);
                                setShowSubmittalConfigModal(true);
                              }}
                              className="flex items-center gap-1.5 hover:bg-[var(--muted)] px-2 py-1 -mx-2 -my-1 rounded transition-colors"
                            >
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 flex-shrink-0">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                              </div>
                              <span className="text-[var(--muted-foreground)]">Customer:</span>
                              <span className="text-[var(--foreground)] font-medium">
                                {submittal.customers.length > 0 ? submittal.customers[0].contactName : <span className="italic text-[var(--muted-foreground)]">+ Add</span>}
                              </span>
                            </button>
                          </div>

                          {/* Submittal Items */}
                          <table className="w-full" onClick={(e) => e.stopPropagation()}>
                            <thead>
                              <tr className="border-b border-[var(--border)]">
                                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Product</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Manufacturer</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Spec Sheet</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                              {submittal.items.map((item) => (
                                <tr key={item.id} className="hover:bg-[var(--muted)]/20">
                                  <td className="px-4 py-2">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-[var(--muted)] text-xs font-semibold text-[var(--foreground)]">
                                      {item.fixtureType}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <div>
                                      <p className="text-sm font-medium text-[var(--foreground)]">{item.catalogNumber}</p>
                                      <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[200px]">{item.description}</p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-[var(--foreground)]">{item.manufacturer}</td>
                                  <td className="px-4 py-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${matchStatusColors[item.matchStatus].bg} ${matchStatusColors[item.matchStatus].text}`}>
                                      {item.matchStatus === 'matched_with_highlight' && (
                                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M16 6l-8 8-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      )}
                                      {item.matchStatus === 'matched_no_highlight' && (
                                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="10" cy="10" r="8"/>
                                          <path d="M10 6v4" strokeLinecap="round"/>
                                          <circle cx="10" cy="14" r="0.5" fill="currentColor"/>
                                        </svg>
                                      )}
                                      {item.matchStatus === 'no_match' && (
                                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="10" cy="10" r="8"/>
                                          <path d="M7 7l6 6M13 7l-6 6" strokeLinecap="round"/>
                                        </svg>
                                      )}
                                      {matchStatusLabels[item.matchStatus]}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <button onClick={(e) => e.stopPropagation()} className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">
                                      {item.matchStatus === 'no_match' ? 'Attach' : item.matchStatus === 'matched_no_highlight' ? 'Highlight' : 'View'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Submittal Footer Stats */}
                          <div className="px-4 py-2 bg-[var(--muted)]/20 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length} ready
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                {submittal.items.filter(i => i.matchStatus === 'matched_no_highlight').length} need highlights
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                {submittal.items.filter(i => i.matchStatus === 'no_match').length} missing spec sheets
                              </span>
                            </div>
                            {submittal.customers.length > 0 && (
                              <span>To: {submittal.customers.map(c => c.companyName || c.contactName).join(', ')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {!hasSubmittals && (
                    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No submittals yet</h3>
                      <p className="text-sm text-[var(--muted-foreground)] mb-4">Create a submittal package to send spec sheets to engineers and architects</p>
                      <button
                        onClick={() => setShowCreateSubmittalModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                        </svg>
                        Create Submittal
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Settings Tab */}
            {detailTab === 'settings' && (
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
                <div className="space-y-5">
                  {/* Price Level Markups - Vertical Layout */}
                  <div className="space-y-3">
                    {quotePriceLevels.map((level, index) => (
                      <div key={level.id} className="flex items-center gap-4">
                        <span className={`w-8 text-sm font-medium ${priceLevelColors[index % priceLevelColors.length]}`}>L{index + 1}</span>
                        <div className="relative w-24">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={level.percent}
                            onChange={(e) => setQuotePriceLevels(prev => prev.map(l =>
                              l.id === level.id ? { ...l, percent: parseFloat(e.target.value) || 0 } : l
                            ))}
                            className="w-full px-3 py-1.5 pr-7 border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)] text-sm"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">%</span>
                        </div>
                        <input
                          type="text"
                          value={level.description}
                          onChange={(e) => setQuotePriceLevels(prev => prev.map(l =>
                            l.id === level.id ? { ...l, description: e.target.value } : l
                          ))}
                          placeholder="Description"
                          className="flex-1 px-3 py-1.5 border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)] text-sm text-[var(--muted-foreground)]"
                        />
                        {quotePriceLevels.length > 1 && (
                          <button
                            onClick={() => setQuotePriceLevels(prev => prev.filter(l => l.id !== level.id))}
                            className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0"
                            title="Remove level"
                          >
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 10h12" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add Level Button */}
                    <button
                      onClick={() => {
                        const maxId = Math.max(...quotePriceLevels.map(l => l.id));
                        const lastPercent = quotePriceLevels[quotePriceLevels.length - 1]?.percent || 20;
                        setQuotePriceLevels(prev => [...prev, {
                          id: maxId + 1,
                          percent: lastPercent + 5,
                          description: ''
                        }]);
                      }}
                      className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors mt-2"
                    >
                      <span className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
                        </svg>
                      </span>
                      Add price level
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[var(--border)]"></div>

                  {/* End User Toggle - Simple row */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowEndUserPerLine(!showEndUserPerLine)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                        showEndUserPerLine ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                          showEndUserPerLine ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-[var(--foreground)]">Specify end user per line item</span>
                  </div>

                  {/* Commission Splits Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowCommissionSplits(!showCommissionSplits)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                        showCommissionSplits ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                          showCommissionSplits ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-[var(--foreground)]">Enable commission splits per line</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Commission Splits Modal */}
        {showCommissionSplitsModal && commissionSplitsModalItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Commission Splits</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">{commissionSplitsModalItem.productNumber} - {commissionSplitsModalItem.description.slice(0, 40)}...</p>
                </div>
                <button
                  onClick={() => {
                    setShowCommissionSplitsModal(false);
                    setCommissionSplitsModalItem(null);
                    setApplyToAllLines(false);
                  }}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Current Splits */}
                <div className="space-y-3">
                  {commissionSplitsModalItem.outsideRepSplits.map((split, index) => (
                    <div key={split.repId} className="flex items-center gap-3">
                      <select
                        value={split.repId}
                        onChange={(e) => {
                          const rep = availableOutsideReps.find(r => r.id === e.target.value);
                          if (rep) {
                            setQuoteLineItems(prev => prev.map(item =>
                              item.id === commissionSplitsModalItem.id
                                ? {
                                    ...item,
                                    outsideRepSplits: item.outsideRepSplits.map((s, i) =>
                                      i === index ? { ...s, repId: rep.id, repName: rep.name } : s
                                    )
                                  }
                                : item
                            ));
                            setCommissionSplitsModalItem(prev => prev ? {
                              ...prev,
                              outsideRepSplits: prev.outsideRepSplits.map((s, i) =>
                                i === index ? { ...s, repId: rep.id, repName: rep.name } : s
                              )
                            } : null);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        {availableOutsideReps.map(rep => (
                          <option key={rep.id} value={rep.id}>{rep.name}</option>
                        ))}
                      </select>
                      <div className="relative w-24">
                        <input
                          type="number"
                          value={split.percentage}
                          onChange={(e) => {
                            const newPercentage = parseFloat(e.target.value) || 0;
                            setQuoteLineItems(prev => prev.map(item =>
                              item.id === commissionSplitsModalItem.id
                                ? {
                                    ...item,
                                    outsideRepSplits: item.outsideRepSplits.map((s, i) =>
                                      i === index ? { ...s, percentage: newPercentage } : s
                                    )
                                  }
                                : item
                            ));
                            setCommissionSplitsModalItem(prev => prev ? {
                              ...prev,
                              outsideRepSplits: prev.outsideRepSplits.map((s, i) =>
                                i === index ? { ...s, percentage: newPercentage } : s
                              )
                            } : null);
                          }}
                          className="w-full px-3 py-2 pr-7 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">%</span>
                      </div>
                      {commissionSplitsModalItem.outsideRepSplits.length > 1 && (
                        <button
                          onClick={() => {
                            setQuoteLineItems(prev => prev.map(item =>
                              item.id === commissionSplitsModalItem.id
                                ? {
                                    ...item,
                                    outsideRepSplits: item.outsideRepSplits.filter((_, i) => i !== index)
                                  }
                                : item
                            ));
                            setCommissionSplitsModalItem(prev => prev ? {
                              ...prev,
                              outsideRepSplits: prev.outsideRepSplits.filter((_, i) => i !== index)
                            } : null);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Rep Button */}
                <button
                  onClick={() => {
                    const usedRepIds = commissionSplitsModalItem.outsideRepSplits.map(s => s.repId);
                    const availableRep = availableOutsideReps.find(r => !usedRepIds.includes(r.id));
                    if (availableRep) {
                      const newSplit = { repId: availableRep.id, repName: availableRep.name, percentage: 0 };
                      setQuoteLineItems(prev => prev.map(item =>
                        item.id === commissionSplitsModalItem.id
                          ? { ...item, outsideRepSplits: [...item.outsideRepSplits, newSplit] }
                          : item
                      ));
                      setCommissionSplitsModalItem(prev => prev ? {
                        ...prev,
                        outsideRepSplits: [...prev.outsideRepSplits, newSplit]
                      } : null);
                    }
                  }}
                  className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
                  </svg>
                  Add Rep
                </button>

                {/* Total Percentage Warning */}
                {(() => {
                  const total = commissionSplitsModalItem.outsideRepSplits.reduce((sum, s) => sum + s.percentage, 0);
                  if (total !== 100) {
                    return (
                      <div className={`text-sm px-3 py-2 rounded-lg ${total > 100 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        Total: {total}% — {total > 100 ? 'Exceeds' : 'Does not equal'} 100%
                      </div>
                    );
                  }
                  return (
                    <div className="text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700">
                      Total: 100% ✓
                    </div>
                  );
                })()}
              </div>
              <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <input
                    type="checkbox"
                    checked={applyToAllLines}
                    onChange={(e) => setApplyToAllLines(e.target.checked)}
                    className="accent-[var(--primary)]"
                  />
                  Apply to all line items
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowCommissionSplitsModal(false);
                      setCommissionSplitsModalItem(null);
                      setApplyToAllLines(false);
                    }}
                    className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (applyToAllLines) {
                        setQuoteLineItems(prev => prev.map(item => ({
                          ...item,
                          outsideRepSplits: [...commissionSplitsModalItem.outsideRepSplits]
                        })));
                      }
                      setShowCommissionSplitsModal(false);
                      setCommissionSplitsModalItem(null);
                      setApplyToAllLines(false);
                    }}
                    className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Columns Configuration Modal */}
        {showColumnsMenu && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Configure Columns</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">Drag to reorder, check to show in table</p>
                </div>
                <button
                  onClick={() => setShowColumnsMenu(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-1">
                  {columnOrder
                    .filter(colKey => {
                      // In simple view, filter out overage/commission/levels columns
                      if (quoteViewMode === 'simple') {
                        const col = columnDefinitions.find(c => c.key === colKey);
                        if (col && ['Overage', 'Commission', 'Levels'].includes(col.group)) {
                          return false;
                        }
                      }
                      return true;
                    })
                    .map((colKey, index) => {
                      const col = columnDefinitions.find(c => c.key === colKey);
                      if (!col) return null;
                      const isChecked = quoteViewMode === 'simple' ? simpleViewColumns.has(colKey) : visibleColumns.has(colKey);
                      return (
                        <div
                          key={colKey}
                          draggable
                          onDragStart={(e) => {
                            setDraggingColumn(colKey);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (!draggingColumn || draggingColumn === colKey) return;
                            const filteredOrder = columnOrder.filter(ck => {
                              if (quoteViewMode === 'simple') {
                                const c = columnDefinitions.find(cd => cd.key === ck);
                                if (c && ['Overage', 'Commission', 'Levels'].includes(c.group)) return false;
                              }
                              return true;
                            });
                            const dragIndex = filteredOrder.indexOf(draggingColumn);
                            const targetIndex = filteredOrder.indexOf(colKey);
                            if (dragIndex !== -1 && targetIndex !== -1) {
                              const newOrder = [...columnOrder];
                              const actualDragIndex = newOrder.indexOf(draggingColumn);
                              const actualTargetIndex = newOrder.indexOf(colKey);
                              newOrder.splice(actualDragIndex, 1);
                              newOrder.splice(actualTargetIndex, 0, draggingColumn);
                              setColumnOrder(newOrder);
                            }
                          }}
                          onDragEnd={() => setDraggingColumn(null)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                            draggingColumn === colKey
                              ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-lg scale-[1.02]'
                              : 'bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]/50'
                          }`}
                        >
                          {/* Drag Handle */}
                          <div className="text-[var(--muted-foreground)]">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <circle cx="5" cy="3" r="1.5"/>
                              <circle cx="11" cy="3" r="1.5"/>
                              <circle cx="5" cy="8" r="1.5"/>
                              <circle cx="11" cy="8" r="1.5"/>
                              <circle cx="5" cy="13" r="1.5"/>
                              <circle cx="11" cy="13" r="1.5"/>
                            </svg>
                          </div>
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumn(colKey)}
                            className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {/* Label */}
                          <span className="flex-1 text-sm font-medium">{col.label}</span>
                          {/* Group Badge */}
                          <span className="px-2 py-0.5 text-xs rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                            {col.group}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
                <button
                  onClick={() => setShowColumnsMenu(false)}
                  className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Line Item Details Modal (shows only columns NOT visible in table) */}
        {showLineDetailsModal && lineDetailsModalItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Additional Details</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">{lineDetailsModalItem.productNumber} - {lineDetailsModalItem.description}</p>
                </div>
                <button
                  onClick={() => {
                    setShowLineDetailsModal(false);
                    setLineDetailsModalItem(null);
                  }}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Only show fields that are NOT visible in the table */}

                {/* Quantity - only show if not in table */}
                {!effectiveVisibleColumns.has('quantity') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Quantity</label>
                    <input
                      type="number"
                      value={lineDetailsModalItem.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setQuoteLineItems(prev => prev.map(li =>
                          li.id === lineDetailsModalItem.id ? { ...li, quantity: val } : li
                        ));
                        setLineDetailsModalItem(prev => prev ? { ...prev, quantity: val } : null);
                      }}
                      className="w-24 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                )}

                {/* Manufacturer - only show if not in table */}
                {!effectiveVisibleColumns.has('manufacturer') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Manufacturer</label>
                    <span className="text-sm text-[var(--foreground)]">{lineDetailsModalItem.manufacturers[0]?.name || '—'}</span>
                  </div>
                )}

                {/* Base Price - only show if not in table */}
                {!effectiveVisibleColumns.has('base') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Base Price</label>
                    <span className="text-sm text-[var(--foreground)]">${lineDetailsModalItem.basePrice.toFixed(2)}</span>
                  </div>
                )}

                {/* Sell Price - only show if not in table */}
                {!effectiveVisibleColumns.has('sell') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Sell Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={lineDetailsModalItem.sellPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setQuoteLineItems(prev => prev.map(li =>
                          li.id === lineDetailsModalItem.id ? { ...li, sellPrice: val } : li
                        ));
                        setLineDetailsModalItem(prev => prev ? { ...prev, sellPrice: val } : null);
                      }}
                      className="w-28 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                )}

                {/* Sell Total - only show if not in table */}
                {!effectiveVisibleColumns.has('sellTotal') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Sell Total</label>
                    <span className="text-sm text-[var(--foreground)]">${(lineDetailsModalItem.sellPrice * lineDetailsModalItem.quantity).toFixed(2)}</span>
                  </div>
                )}

                {/* End User - only show if End User Per Line is enabled AND not visible in table */}
                {showEndUserPerLine && !effectiveVisibleColumns.has('endUser') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">End User</label>
                    <input
                      type="text"
                      value={lineDetailsModalItem.endUser || ''}
                      onChange={(e) => {
                        setQuoteLineItems(prev => prev.map(li =>
                          li.id === lineDetailsModalItem.id ? { ...li, endUser: e.target.value } : li
                        ));
                        setLineDetailsModalItem(prev => prev ? { ...prev, endUser: e.target.value } : null);
                      }}
                      placeholder="Enter end user"
                      className="w-40 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                )}

                {/* Commission Discount % - only show if not in table */}
                {!effectiveVisibleColumns.has('commissionDiscountPercent') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Commission Discount %</label>
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={lineDetailsModalItem.commissionDiscountPercent || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === lineDetailsModalItem.id ? { ...li, commissionDiscountPercent: val } : li
                          ));
                          setLineDetailsModalItem(prev => prev ? { ...prev, commissionDiscountPercent: val } : null);
                        }}
                        className="w-full px-3 py-2 pr-7 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">%</span>
                    </div>
                  </div>
                )}

                {/* Commission Discount $ - only show if not in table */}
                {!effectiveVisibleColumns.has('commissionDiscountAmount') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Commission Discount $</label>
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">$</span>
                      <input
                        type="number"
                        value={lineDetailsModalItem.commissionDiscountAmount || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === lineDetailsModalItem.id ? { ...li, commissionDiscountAmount: val } : li
                          ));
                          setLineDetailsModalItem(prev => prev ? { ...prev, commissionDiscountAmount: val } : null);
                        }}
                        className="w-full px-3 py-2 pl-7 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                    </div>
                  </div>
                )}

                {/* Line Discount % - only show if not in table */}
                {!effectiveVisibleColumns.has('lineDiscountPercent') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Line Discount %</label>
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={lineDetailsModalItem.lineDiscountPercent || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === lineDetailsModalItem.id ? { ...li, lineDiscountPercent: val } : li
                          ));
                          setLineDetailsModalItem(prev => prev ? { ...prev, lineDiscountPercent: val } : null);
                        }}
                        className="w-full px-3 py-2 pr-7 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">%</span>
                    </div>
                  </div>
                )}

                {/* Line Discount $ - only show if not in table */}
                {!effectiveVisibleColumns.has('lineDiscountAmount') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Line Discount $</label>
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">$</span>
                      <input
                        type="number"
                        value={lineDetailsModalItem.lineDiscountAmount || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === lineDetailsModalItem.id ? { ...li, lineDiscountAmount: val } : li
                          ));
                          setLineDetailsModalItem(prev => prev ? { ...prev, lineDiscountAmount: val } : null);
                        }}
                        className="w-full px-3 py-2 pl-7 border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                    </div>
                  </div>
                )}

                {/* Lead Time - only show if not in table */}
                {!effectiveVisibleColumns.has('leadTime') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Lead Time</label>
                    <input
                      type="text"
                      value={lineDetailsModalItem.leadTime || ''}
                      onChange={(e) => {
                        setQuoteLineItems(prev => prev.map(li =>
                          li.id === lineDetailsModalItem.id ? { ...li, leadTime: e.target.value } : li
                        ));
                        setLineDetailsModalItem(prev => prev ? { ...prev, leadTime: e.target.value } : null);
                      }}
                      placeholder="e.g. 2-3 weeks"
                      className="w-32 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                )}

                {/* UOM - only show if not in table */}
                {!effectiveVisibleColumns.has('uom') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">UOM</label>
                    <span className="text-sm text-[var(--foreground)]">{lineDetailsModalItem.uom || 'EA'}</span>
                  </div>
                )}

                {/* Multiplier/Divisor - only show if not in table */}
                {!effectiveVisibleColumns.has('divisor') && lineDetailsModalItem.useDivisor && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Multiplier</label>
                    <span className="text-sm text-[var(--foreground)]">{lineDetailsModalItem.divisor}</span>
                  </div>
                )}

                {/* Spec Sheet - only show if not in table */}
                {!effectiveVisibleColumns.has('specSheet') && lineDetailsModalItem.hasSpecSheet && lineDetailsModalItem.specSheetUrl && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-[var(--muted-foreground)]">Spec Sheet</label>
                    <a href={lineDetailsModalItem.specSheetUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--primary)] hover:underline">View</a>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
                <button
                  onClick={() => {
                    setShowLineDetailsModal(false);
                    setLineDetailsModalItem(null);
                  }}
                  className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approval Request Modal - Enhanced */}
        {showApprovalRequestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Request Manufacturer Approval</h2>
                <button
                  onClick={() => setShowApprovalRequestModal(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Builder and Project Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--muted)]/30 rounded-lg">
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Builder</p>
                    <p className="font-medium text-[var(--foreground)]">{selectedQuote.soldToCustomer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Project</p>
                    <p className="font-medium text-[var(--foreground)]">{selectedQuote.name}</p>
                  </div>
                </div>

                {/* Manufacturer Selection */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Manufacturer Requesting Approval</label>
                  <select className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white">
                    <option>Select manufacturer...</option>
                    {mockManufacturers.map(m => (
                      <option key={m.domain} value={m.domain}>{m.manufacturer_name}</option>
                    ))}
                  </select>
                </div>

                {/* Products/SKUs Included */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[var(--foreground)]">Products/SKUs Included</label>
                    <span className="text-xs text-[var(--muted-foreground)]">5 line items</span>
                  </div>
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      {[
                        { sku: 'PLX-200-DIM', desc: 'Programmable Dimmer Switch with Daylight Harvesting', qty: 75, price: 185, total: 13875 },
                        { sku: 'PEND-MOD-18', desc: 'Modern Pendant Light 18" Decorative LED', qty: 24, price: 385, total: 9240 },
                        { sku: 'TRK-LED-30W', desc: 'Track Light Head LED 30W Adjustable Beam', qty: 48, price: 165, total: 7920 },
                      ].map((item, idx) => (
                        <label key={idx} className="flex items-center justify-between p-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)]/20 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
                            <div>
                              <span className="font-mono text-sm text-[var(--foreground)]">{item.sku}</span>
                              <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[300px]">{item.desc}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[var(--foreground)]">{item.qty} x ${item.price}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">${item.total.toLocaleString()}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="px-3 py-2 bg-[var(--muted)]/30 border-t border-[var(--border)] flex justify-between">
                      <span className="text-sm font-medium text-[var(--foreground)]">Total Value:</span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">$31,035</span>
                    </div>
                  </div>
                </div>

                {/* Justification */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Justification / Reason for Request</label>
                  <textarea
                    placeholder="Explain why this manufacturer should be approved for this project..."
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-32 resize-none"
                    defaultValue="Lutron dimmers provide superior daylight harvesting integration with the Acuity fixtures already approved. Lead time is 2 weeks vs 6 weeks for alternatives. The dimming system is required to meet the energy code compliance for this medical facility."
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Attachments</label>
                  <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-4 text-center hover:border-[var(--primary)] transition-colors cursor-pointer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2 text-[var(--muted-foreground)]">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="text-sm text-[var(--muted-foreground)]">Drop files here or click to upload</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">PDF, DOC, XLS up to 10MB</p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between p-2 bg-[var(--muted)]/30 rounded text-sm">
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <path d="M14 2v6h6"/>
                        </svg>
                        lutron-spec-sheet.pdf
                      </span>
                      <button className="text-[var(--muted-foreground)] hover:text-red-600">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[var(--muted)]/30 rounded text-sm">
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <path d="M14 2v6h6"/>
                        </svg>
                        comparison-analysis.pdf
                      </span>
                      <button className="text-[var(--muted-foreground)] hover:text-red-600">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Send To Section */}
                <div className="border-t border-[var(--border)] pt-6">
                  <h3 className="text-sm font-medium text-[var(--foreground)] mb-4">Send To</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Contact</label>
                      <select className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white">
                        <option>Mike Johnson (Procurement)</option>
                        <option>John Smith (Engineering)</option>
                        <option>Sarah Williams (Project Manager)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Email</label>
                      <input
                        type="email"
                        value="mike.johnson@turner.com"
                        readOnly
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--muted)]/30"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs text-[var(--muted-foreground)] mb-1">CC (optional)</label>
                    <input
                      type="text"
                      placeholder="Additional email addresses..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input type="checkbox" className="accent-[var(--primary)]" />
                    <span className="text-sm text-[var(--foreground)]">Also send via FlowConnect message</span>
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between sticky bottom-0 bg-[var(--card)]">
                <button className="px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors">
                  Preview PDF
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApprovalRequestModal(false)}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => setShowApprovalRequestModal(false)}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
                    Send Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Preview Modal */}
        {showPdfPreviewModal && generatedPdfData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">Approval Request PDF</h2>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">PDF Preview</span>
                </div>
                <button
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* PDF Preview Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                <div className="bg-white shadow-lg mx-auto max-w-[8.5in] p-8 min-h-[11in]" style={{ fontFamily: 'Georgia, serif' }}>
                  {/* PDF Header */}
                  {pdfTemplate.companyLogo && (
                    <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
                      <div>
                        <div className="w-16 h-16 bg-[var(--primary)] rounded-lg flex items-center justify-center mb-2">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="4"/>
                          </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">{pdfTemplate.companyName}</h1>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{pdfTemplate.companyAddress}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">Ref: APR-{Date.now().toString().slice(-6)}</p>
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">{pdfTemplate.headerText}</h2>
                  </div>

                  {/* Project Details */}
                  {pdfTemplate.includeProjectDetails && (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Project Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Builder:</span>
                          <p className="font-semibold text-gray-800">{generatedPdfData.builder}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Project:</span>
                          <p className="font-semibold text-gray-800">{generatedPdfData.project}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Manufacturer:</span>
                          <p className="font-semibold text-gray-800">{generatedPdfData.manufacturer}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Value:</span>
                          <p className="font-semibold text-gray-800">${generatedPdfData.totalValue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product List */}
                  {pdfTemplate.includeProductList && (
                    <div className="mb-8">
                      <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Products Requiring Approval</h3>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="text-left p-2 border border-gray-300 font-semibold">SKU</th>
                            <th className="text-left p-2 border border-gray-300 font-semibold">Description</th>
                            <th className="text-center p-2 border border-gray-300 font-semibold">Qty</th>
                            <th className="text-right p-2 border border-gray-300 font-semibold">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedPdfData.products.map((product, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="p-2 border border-gray-300 font-mono">{product.sku}</td>
                              <td className="p-2 border border-gray-300">{product.description}</td>
                              <td className="p-2 border border-gray-300 text-center">{product.qty}</td>
                              <td className="p-2 border border-gray-300 text-right">${product.value.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold">
                            <td colSpan={3} className="p-2 border border-gray-300 text-right">Total:</td>
                            <td className="p-2 border border-gray-300 text-right">${generatedPdfData.totalValue.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Justification */}
                  {pdfTemplate.includeJustification && (
                    <div className="mb-8">
                      <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Justification</h3>
                      <p className="text-gray-700 leading-relaxed">{generatedPdfData.justification}</p>
                    </div>
                  )}

                  {/* Custom Message */}
                  {pdfTemplate.customMessage && (
                    <div className="mb-8">
                      <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Additional Notes</h3>
                      <p className="text-gray-700 leading-relaxed">{pdfTemplate.customMessage}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-8 border-t border-gray-300">
                    <p className="text-sm text-gray-600 text-center italic">{pdfTemplate.footerText}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between bg-[var(--card)]">
                <button
                  onClick={() => {
                    setShowPdfPreviewModal(false);
                    setShowEditTemplateModal(true);
                  }}
                  className="px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Template
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPdfPreviewModal(false)}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Simulate PDF download
                      alert('PDF downloaded: Approval_Request_' + generatedPdfData.manufacturer.replace(/\s+/g, '_') + '.pdf');
                    }}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download PDF
                  </button>
                  <button
                    onClick={() => {
                      setShowPdfPreviewModal(false);
                      setShowSendEmailModal(true);
                    }}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M22 7l-10 7L2 7"/>
                    </svg>
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Submittal Modal */}
        {printSubmittal && (
          <PrintSubmittalDialog
            submittal={printSubmittal}
            onClose={() => setPrintSubmittal(null)}
            onPrint={(settings: PrintSettings) => {
              console.log('Printing submittal with settings:', settings);
              setPrintSubmittal(null);
            }}
          />
        )}

        {/* Rep Split Modal */}
        {repSplitModalItem && (
          <RepSplitModal
            lineItemId={repSplitModalItem.id}
            lineItemDescription={repSplitModalItem.description}
            currentSplits={repSplitModalItem.outsideRepSplits}
            availableReps={availableOutsideReps}
            onClose={() => setRepSplitModalItem(null)}
            onSave={(splits) => {
              // TODO: Update line item with new splits
              console.log('Saving splits for item:', repSplitModalItem.id, splits);
              setRepSplitModalItem(null);
            }}
            onApplyToSection={(splits) => {
              // TODO: Apply splits to all items in the same section
              console.log('Applying splits to section:', repSplitModalItem.sectionId, splits);
              setRepSplitModalItem(null);
            }}
            onApplyToAll={(splits) => {
              // TODO: Apply splits to all line items
              console.log('Applying splits to all items:', splits);
              setRepSplitModalItem(null);
            }}
          />
        )}

        {/* Edit Template Modal */}
        {showEditTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Edit PDF Template</h2>
                <button
                  onClick={() => setShowEditTemplateModal(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Company Information */}
                <div>
                  <h3 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    Company Information
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfTemplate.companyLogo}
                        onChange={(e) => setPdfTemplate(prev => ({ ...prev, companyLogo: e.target.checked }))}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">Include company logo</span>
                    </label>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Company Name</label>
                      <input
                        type="text"
                        value={pdfTemplate.companyName}
                        onChange={(e) => setPdfTemplate(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Company Address</label>
                      <textarea
                        value={pdfTemplate.companyAddress}
                        onChange={(e) => setPdfTemplate(prev => ({ ...prev, companyAddress: e.target.value }))}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Sections */}
                <div>
                  <h3 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6"/>
                      <path d="M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                    Content Sections
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--muted)]/30 rounded">
                      <input
                        type="checkbox"
                        checked={pdfTemplate.includeProjectDetails}
                        onChange={(e) => setPdfTemplate(prev => ({ ...prev, includeProjectDetails: e.target.checked }))}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">Include project details (builder, project name, manufacturer, value)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--muted)]/30 rounded">
                      <input
                        type="checkbox"
                        checked={pdfTemplate.includeProductList}
                        onChange={(e) => setPdfTemplate(prev => ({ ...prev, includeProductList: e.target.checked }))}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">Include product list table</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--muted)]/30 rounded">
                      <input
                        type="checkbox"
                        checked={pdfTemplate.includeSpecSheets}
                        onChange={(e) => setPdfTemplate(prev => ({ ...prev, includeSpecSheets: e.target.checked }))}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">Include spec sheet attachments</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--muted)]/30 rounded">
                      <input
                        type="checkbox"
                        checked={pdfTemplate.includeJustification}
                        onChange={(e) => setPdfTemplate(prev => ({ ...prev, includeJustification: e.target.checked }))}
                        className="accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)]">Include justification text</span>
                    </label>
                  </div>
                </div>

                {/* Header & Footer Text */}
                <div>
                  <h3 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
                    </svg>
                    Header & Footer
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Header Text</label>
                      <input
                        type="text"
                        value={pdfTemplate.headerText}
                        onChange={(e) => setPdfTemplate(prev => ({ ...prev, headerText: e.target.value }))}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1">Footer Text</label>
                      <textarea
                        value={pdfTemplate.footerText}
                        onChange={(e) => setPdfTemplate(prev => ({ ...prev, footerText: e.target.value }))}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-16 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Message */}
                <div>
                  <h3 className="font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    Custom Message (Optional)
                  </h3>
                  <textarea
                    value={pdfTemplate.customMessage}
                    onChange={(e) => setPdfTemplate(prev => ({ ...prev, customMessage: e.target.value }))}
                    placeholder="Add any additional notes or custom message to include in the PDF..."
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-24 resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between sticky bottom-0 bg-[var(--card)]">
                <button
                  onClick={() => {
                    // Reset to defaults
                    setPdfTemplate({
                      companyLogo: true,
                      companyName: 'FlowConnect Lighting',
                      companyAddress: '123 Main Street, Suite 400\nAnytown, ST 12345',
                      includeProjectDetails: true,
                      includeProductList: true,
                      includeSpecSheets: true,
                      includeJustification: true,
                      headerText: 'Manufacturer Approval Request',
                      footerText: 'Thank you for your consideration. Please respond within 5 business days.',
                      customMessage: '',
                    });
                  }}
                  className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  Reset to Default
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditTemplateModal(false)}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Save template (in real app, would persist to localStorage or backend)
                      alert('Template saved successfully!');
                      setShowEditTemplateModal(false);
                    }}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Email Modal */}
        {showSendEmailModal && generatedPdfData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Send Approval Request Email</h2>
                <button
                  onClick={() => setShowSendEmailModal(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Request Summary */}
                <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                    <span className="font-medium text-[var(--foreground)]">Approval Request for {generatedPdfData.manufacturer}</span>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {generatedPdfData.products.length} products | ${generatedPdfData.totalValue.toLocaleString()} total value
                  </p>
                </div>

                {/* Recipients */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">To</label>
                  <div className="space-y-2">
                    <select className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white">
                      <option>Mike Johnson (Procurement) - mike.johnson@turner.com</option>
                      <option>John Smith (Engineering) - john.smith@turner.com</option>
                      <option>Sarah Williams (Project Manager) - sarah.w@turner.com</option>
                    </select>
                  </div>
                </div>

                {/* CC */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">CC (optional)</label>
                  <input
                    type="text"
                    placeholder="Enter additional email addresses separated by commas..."
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Subject</label>
                  <input
                    type="text"
                    defaultValue={`Approval Request: ${generatedPdfData.manufacturer} for ${generatedPdfData.project}`}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                  />
                </div>

                {/* Email Body */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Message</label>
                  <textarea
                    defaultValue={`Dear Team,

Please find attached the manufacturer approval request for ${generatedPdfData.manufacturer} products for the ${generatedPdfData.project} project.

This request includes ${generatedPdfData.products.length} product(s) with a total value of $${generatedPdfData.totalValue.toLocaleString()}.

${generatedPdfData.justification}

Please review and respond at your earliest convenience.

Best regards,
FlowConnect Lighting`}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-48 resize-none"
                  />
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Attachments</label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-[var(--muted)]/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <path d="M14 2v6h6"/>
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">Approval_Request_{generatedPdfData.manufacturer.replace(/\s+/g, '_')}.pdf</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Generated approval request document</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Attached</span>
                    </div>
                    {pdfTemplate.includeSpecSheets && (
                      <div className="flex items-center justify-between p-3 bg-[var(--muted)]/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6"/>
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)]">Product_Spec_Sheets.zip</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{generatedPdfData.products.length} spec sheet(s)</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Attached</span>
                      </div>
                    )}
                    <button className="w-full p-3 border-2 border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                      + Add additional attachments
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
                    <span className="text-sm text-[var(--foreground)]">Request read receipt</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[var(--primary)]" />
                    <span className="text-sm text-[var(--foreground)]">Send copy to myself</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[var(--primary)]" />
                    <span className="text-sm text-[var(--foreground)]">Schedule follow-up reminder (5 business days)</span>
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between sticky bottom-0 bg-[var(--card)]">
                <button
                  onClick={() => {
                    setShowSendEmailModal(false);
                    setShowPdfPreviewModal(true);
                  }}
                  className="px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Preview PDF
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSendEmailModal(false)}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert('Email sent successfully to Mike Johnson with approval request for ' + generatedPdfData.manufacturer);
                      setShowSendEmailModal(false);
                      setGeneratedPdfData(null);
                      setSelectedManufacturerForApproval(null);
                    }}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9"/>
                    </svg>
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mark Approval Status Modal */}
        {showMarkApprovalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Update Approval Status</h2>
                <button
                  onClick={() => setShowMarkApprovalModal(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Info Section */}
                <div className="p-4 bg-[var(--muted)]/30 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Manufacturer:</span>
                    <span className="font-medium text-[var(--foreground)]">Lutron</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Builder:</span>
                    <span className="font-medium text-[var(--foreground)]">{selectedQuote.soldToCustomer}</span>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-3">New Status</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/20">
                      <input type="radio" name="status" value="approved" className="accent-green-600" />
                      <div className="flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                          <circle cx="10" cy="10" r="7"/>
                          <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[var(--foreground)]">Approved (full approval for all products)</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/20 bg-[var(--primary)]/5 border-[var(--primary)]">
                      <input type="radio" name="status" value="conditional" defaultChecked className="accent-[var(--primary)]" />
                      <div className="flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                          <circle cx="10" cy="10" r="7"/>
                          <path d="M10 6v4l2 2" strokeLinecap="round"/>
                        </svg>
                        <span className="text-[var(--foreground)]">Approved with Conditions</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--muted)]/20">
                      <input type="radio" name="status" value="rejected" className="accent-red-600" />
                      <div className="flex items-center gap-2">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                          <circle cx="10" cy="10" r="7"/>
                          <path d="M8 8l4 4M12 8l-4 4" strokeLinecap="round"/>
                        </svg>
                        <span className="text-[var(--foreground)]">Rejected</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Conditions (if applicable) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Conditions (if applicable)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-24 resize-none"
                    placeholder="Enter any conditions for the approval..."
                    defaultValue="Approved for PLX-200-DIM and PLX-300-DIM only. Other products require separate approval."
                  />
                </div>

                {/* Approved By */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Approved By</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                      placeholder="Name of approver"
                      defaultValue="Mike Johnson"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Date Approved</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm"
                      defaultValue="2024-03-23"
                    />
                  </div>
                </div>

                {/* Attach Proof */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Attach Proof (email, document)</label>
                  <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-4 text-center hover:border-[var(--primary)] transition-colors cursor-pointer">
                    <p className="text-sm text-[var(--muted-foreground)]">Drop files here or click to upload</p>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between p-2 bg-[var(--muted)]/30 rounded text-sm">
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <path d="M14 2v6h6"/>
                        </svg>
                        approval-email-mar23.pdf
                      </span>
                      <button className="text-[var(--muted-foreground)] hover:text-red-600">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm h-20 resize-none"
                    placeholder="Any additional notes..."
                    defaultValue="Phone call with Mike Johnson on 3/23. He confirmed the two dimmer types are approved. Will need separate request for sensors and controllers."
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
                    <span className="text-sm text-[var(--foreground)]">Save to builder&apos;s Approved Manufacturers List</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[var(--primary)]" />
                    <span className="text-sm text-[var(--foreground)]">Apply to all future quotes for this builder</span>
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                <button
                  onClick={() => setShowMarkApprovalModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowMarkApprovalModal(false)}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Save Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revert to Version Modal */}
        {showRevertModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Revert to Previous Version</h2>
                <button
                  onClick={() => setShowRevertModal(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600 flex-shrink-0 mt-0.5">
                      <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                      <path d="M3 17l7-12 7 12H3z"/>
                    </svg>
                    <div>
                      <p className="font-medium text-orange-800">This action will revert your quote</p>
                      <p className="text-sm text-orange-700 mt-1">
                        All changes made since this version will be discarded. This cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-[var(--muted-foreground)]">Reverting to:</p>
                  <div className="p-3 bg-[var(--muted)]/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-semibold">v2</span>
                        <span className="text-sm text-[var(--foreground)]">Mar 18, 2024</span>
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)]">$2,380,000</span>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Added fixtures</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="save-current" className="accent-[var(--primary)]" />
                  <label htmlFor="save-current" className="text-sm text-[var(--foreground)]">
                    Save current version as v{selectedQuote.version + 1} before reverting
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                <button
                  onClick={() => setShowRevertModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Revert logic - update version
                    setSelectedQuote({ ...selectedQuote, version: 2 });
                    setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, version: 2 } : q));
                    setShowRevertModal(false);
                    alert('Quote reverted to v2');
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                >
                  Revert to v2
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sale Credit Modal */}
        <CreditModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
          quoteName={selectedQuote?.name}
        />

        {/* Quote PDF Preview Modal */}
        {showQuotePdfPreview && selectedQuote && (
          <QuotePdfPreviewModal
            quote={{
              quoteNumber: selectedQuote.id,
              quoteName: selectedQuote.name,
              version: selectedQuote.version,
              stage: selectedQuote.stage,
              soldToCustomer: selectedQuote.soldToCustomer,
              billToCustomer: selectedQuote.billToCustomer,
              jobName: selectedQuote.jobName,
              quoteDate: selectedQuote.quoteDate,
              expirationDate: selectedQuote.expirationDate,
              revisedDate: selectedQuote.revisedDate,
              acceptDate: selectedQuote.acceptDate,
              paymentTerms: selectedQuote.paymentTerms,
              freightTerms: selectedQuote.freightTerms,
              lineItems: quoteLineItems.map(li => ({
                sectionName: li.sectionName,
                productNumber: li.productNumber,
                description: li.description,
                quantity: li.quantity,
                sellPrice: li.sellPrice,
                extendedPrice: li.sellPrice * li.quantity,
              })),
              totals: {
                baseTotal: totals.baseTotal,
                sellTotal: totals.sellTotal,
                commission: totals.commission,
                overage: totals.overage,
              },
            }}
            onClose={() => setShowQuotePdfPreview(false)}
          />
        )}

        {/* Convert Quote to Order Modal */}
        {showConvertToOrderModal && selectedQuote && (
          <ConvertQuoteToOrderModal
            quote={{
              id: selectedQuote.id,
              quoteNumber: selectedQuote.name,
              customerName: selectedQuote.soldToCustomer,
              projectName: selectedQuote.jobName,
              lineItems: quoteLineItems.map(li => ({
                id: li.id,
                partNumber: li.productNumber,
                description: li.description,
                manufacturer: li.manufacturers[0]?.name || 'Unknown',
                quantity: li.quantity,
                unitPrice: li.basePrice,
                sellPrice: li.sellPrice,
              })),
              totalValue: selectedQuote.valueNumber,
            }}
            onClose={() => setShowConvertToOrderModal(false)}
            onConvert={(order: Order) => {
              alert(`Order ${order.orderNumber} created successfully!`);
              setShowConvertToOrderModal(false);
            }}
          />
        )}

        {/* Generate Distributor Quotes Modal */}
        {showDistributorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Generate Distributor-Specific Quotes</h2>
                <button
                  onClick={() => setShowDistributorModal(false)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Select distributors to generate customized quotes with appropriate pricing and cross-references.
                </p>

                <div className="space-y-3">
                  {[
                    { name: 'Graybar Electric', domain: 'graybar.com', manufacturers: 8, category: 'Stocking' },
                    { name: 'HD Supply', domain: 'hdsupply.com', manufacturers: 6, category: 'Mixed' },
                    { name: 'Ferguson Enterprises', domain: 'fergusons.com', manufacturers: 5, category: 'Buy-Sell' },
                    { name: 'Rexel', domain: 'rexel.com', manufacturers: 4, category: 'Non-Stocking' },
                  ].map(dist => (
                    <label key={dist.domain} className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="accent-[var(--primary)]" defaultChecked={dist.domain === 'graybar.com'} />
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{dist.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{dist.manufacturers} manufacturers authorized</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{dist.category}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                <button
                  onClick={() => setShowDistributorModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowDistributorModal(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                >
                  Generate Quotes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Distributor Quote Detail Modal */}
        {selectedDistributorQuote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    {selectedDistributorQuote.distributorName} Quote
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">{selectedDistributorQuote.distributorDomain}</p>
                </div>
                <button
                  onClick={() => setSelectedDistributorQuote(null)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Original Total</p>
                    <p className="text-xl font-semibold text-[var(--foreground)]">${selectedDistributorQuote.originalTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 uppercase tracking-wider">Discounted Total</p>
                    <p className="text-xl font-semibold text-green-700">${selectedDistributorQuote.discountedTotal.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 uppercase tracking-wider">Total Savings</p>
                    <p className="text-xl font-semibold text-blue-700">${selectedDistributorQuote.totalDiscount.toLocaleString()}</p>
                    <p className="text-xs text-blue-500">({(selectedDistributorQuote.discountPercent * 100).toFixed(1)}% off)</p>
                  </div>
                  <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Line Status</p>
                    <p className="text-xl font-semibold text-[var(--foreground)]">{selectedDistributorQuote.linesApproved}/{selectedDistributorQuote.totalLines}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">approved lines</p>
                  </div>
                </div>

                {/* Status Alert */}
                {selectedDistributorQuote.linesRequiringCross > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                        <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                        <path d="M3 17l7-12 7 12H3z"/>
                      </svg>
                      <div>
                        <p className="font-medium text-yellow-800">{selectedDistributorQuote.linesRequiringCross} lines require cross-reference</p>
                        <p className="text-sm text-yellow-700">These products are not carried by {selectedDistributorQuote.distributorName} and need alternative suggestions.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Line Items Table */}
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-3">Line Items</h3>
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[var(--muted)]/30">
                        <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3">Manufacturer</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3 text-center">Qty</th>
                          <th className="px-4 py-3 text-right">Original</th>
                          <th className="px-4 py-3 text-right">Discounted</th>
                          <th className="px-4 py-3 text-right">Ext. Total</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {mockDistributorQuoteLines
                          .filter(line => line.distributorQuoteId === selectedDistributorQuote.id)
                          .map(line => (
                          <tr key={line.id} className={`hover:bg-[var(--muted)]/20 ${line.status === 'requires_cross' ? 'bg-yellow-50/50' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="font-mono text-sm">{line.finalSku || line.originalSku}</div>
                              {line.finalSku && line.finalSku !== line.originalSku && (
                                <div className="text-xs text-[var(--muted-foreground)] line-through">{line.originalSku}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--foreground)]">{line.description}</td>
                            <td className="px-4 py-3 text-sm">
                              <div>{(line.finalManufacturer || line.originalManufacturer).replace('.com', '')}</div>
                              {line.finalManufacturer && line.finalManufacturer !== line.originalManufacturer && (
                                <div className="text-xs text-[var(--muted-foreground)] line-through">{line.originalManufacturer.replace('.com', '')}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{line.priceCategory || '—'}</td>
                            <td className="px-4 py-3 text-sm text-center">{line.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right">${line.originalPrice.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                              {line.finalPrice ? `$${line.finalPrice.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">
                              {line.finalPrice ? `$${(line.finalPrice * line.quantity).toLocaleString()}` : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                line.status === 'approved' ? 'bg-green-100 text-green-700' :
                                line.status === 'requires_cross' ? 'bg-yellow-100 text-yellow-700' :
                                line.status === 'crossed' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {line.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[var(--muted)]/30">
                        <tr className="font-semibold">
                          <td colSpan={7} className="px-4 py-3 text-right">Total:</td>
                          <td className="px-4 py-3 text-right text-green-600">
                            ${mockDistributorQuoteLines
                              .filter(line => line.distributorQuoteId === selectedDistributorQuote.id && line.finalPrice)
                              .reduce((sum, line) => sum + (line.finalPrice! * line.quantity), 0)
                              .toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Audit Trail */}
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-3">Pricing Audit Log</h3>
                  <div className="space-y-2">
                    {mockCrossAuditLog
                      .filter(log => log.distributorDomain === selectedDistributorQuote.distributorDomain)
                      .slice(0, 3)
                      .map(log => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-[var(--muted)]/20 rounded-lg text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--muted-foreground)]">{new Date(log.timestamp).toLocaleString()}</span>
                          <span className="font-medium">{log.skuBefore}</span>
                          {log.skuAfter !== log.skuBefore && (
                            <>
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                                <path d="M5 10h10M12 7l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="font-medium text-blue-600">{log.skuAfter}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            {log.priceCategoryApplied} (-{(log.discountPercent * 100).toFixed(0)}%)
                          </span>
                          {log.crossSource && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              {log.crossSource} cross
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between items-center sticky bottom-0 bg-[var(--card)]">
                <button className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                  Export to PDF
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedDistributorQuote(null)}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
                  >
                    Close
                  </button>
                  {selectedDistributorQuote.status === 'requires_cross' && (
                    <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors">
                      Resolve Cross References
                    </button>
                  )}
                  {selectedDistributorQuote.status === 'ready_to_send' && (
                    <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
                      Send to Distributor
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recipient Quote Detail Modal */}
        {selectedRecipient && selectedQuote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { setSelectedRecipient(null); setShowCompareView(false); }}
                    className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--foreground)]">
                      Quote for {selectedRecipient.company}
                    </h2>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {selectedRecipient.contact} • {selectedRecipient.email} • {selectedRecipient.level} Pricing
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Version Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--muted-foreground)]">Version:</span>
                    <select
                      value={recipientQuoteVersion}
                      onChange={(e) => setRecipientQuoteVersion(parseInt(e.target.value))}
                      className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                    >
                      {[...Array(selectedQuote.version)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          v{i + 1} {i + 1 === selectedQuote.version ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Compare Button */}
                  <button
                    onClick={() => setShowCompareView(!showCompareView)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                      showCompareView
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'border-[var(--border)] hover:bg-[var(--muted)]'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="6" height="14" rx="1"/>
                      <rect x="12" y="3" width="6" height="14" rx="1"/>
                      <path d="M8 10h4" strokeLinecap="round"/>
                    </svg>
                    {showCompareView ? 'Exit Compare' : 'Compare to Original'}
                  </button>
                  <button
                    onClick={() => { setSelectedRecipient(null); setShowCompareView(false); }}
                    className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-auto">
                {showCompareView ? (
                  /* Compare View - Side by Side */
                  <div className="flex h-full">
                    {/* Original Quote */}
                    <div className="flex-1 border-r border-[var(--border)]">
                      <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                        <h3 className="font-semibold text-[var(--foreground)]">Original Quote (v{selectedQuote.version})</h3>
                        <p className="text-sm text-[var(--muted-foreground)]">Base pricing from quote</p>
                      </div>
                      <div className="p-4 overflow-auto max-h-[60vh]">
                        <table className="w-full text-sm">
                          <thead className="bg-[var(--muted)]/30 sticky top-0">
                            <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                              <th className="px-3 py-2">Part #</th>
                              <th className="px-3 py-2">Description</th>
                              <th className="px-3 py-2">Qty</th>
                              <th className="px-3 py-2 text-right">Price</th>
                              <th className="px-3 py-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {quoteLineItems.map(item => (
                              <tr key={item.id} className="hover:bg-[var(--muted)]/10">
                                <td className="px-3 py-2 font-mono text-xs">{item.productNumber}</td>
                                <td className="px-3 py-2 text-[var(--foreground)]">{item.description}</td>
                                <td className="px-3 py-2">{item.quantity}</td>
                                <td className="px-3 py-2 text-right">${item.sellPrice.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-medium">${(item.sellPrice * item.quantity).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-[var(--muted)]/30 font-semibold">
                            <tr>
                              <td colSpan={4} className="px-3 py-3 text-right">Total:</td>
                              <td className="px-3 py-3 text-right">${totals.sellTotal.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Recipient Quote */}
                    <div className="flex-1">
                      <div className="px-4 py-3 bg-blue-50 border-b border-[var(--border)]">
                        <h3 className="font-semibold text-blue-900">{selectedRecipient.company} Quote (v{recipientQuoteVersion})</h3>
                        <p className="text-sm text-blue-700">{selectedRecipient.level} pricing level</p>
                      </div>
                      <div className="p-4 overflow-auto max-h-[60vh]">
                        <table className="w-full text-sm">
                          <thead className="bg-blue-50/50 sticky top-0">
                            <tr className="text-left text-xs font-semibold text-blue-800 uppercase">
                              <th className="px-3 py-2">Part #</th>
                              <th className="px-3 py-2">Description</th>
                              <th className="px-3 py-2">Qty</th>
                              <th className="px-3 py-2 text-right">Price</th>
                              <th className="px-3 py-2 text-right">Total</th>
                              <th className="px-3 py-2 text-right">Diff</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {quoteLineItems.map(item => {
                              const recipientPrice = selectedRecipient.level === 'Sell' ? item.sellPrice :
                                selectedRecipient.level === 'L1' ? item.level1Price :
                                selectedRecipient.level === 'L2' ? item.level2Price : item.level3Price;
                              const diff = recipientPrice - item.sellPrice;
                              const diffPercent = ((recipientPrice - item.sellPrice) / item.sellPrice * 100);
                              return (
                                <tr key={item.id} className="hover:bg-blue-50/30">
                                  <td className="px-3 py-2 font-mono text-xs">{item.productNumber}</td>
                                  <td className="px-3 py-2 text-[var(--foreground)]">{item.description}</td>
                                  <td className="px-3 py-2">{item.quantity}</td>
                                  <td className="px-3 py-2 text-right">${recipientPrice.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right font-medium">${(recipientPrice * item.quantity).toLocaleString()}</td>
                                  <td className={`px-3 py-2 text-right text-xs ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {diff !== 0 ? `${diff > 0 ? '+' : ''}${diffPercent.toFixed(1)}%` : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-blue-50 font-semibold">
                            <tr>
                              <td colSpan={4} className="px-3 py-3 text-right">Total:</td>
                              <td className="px-3 py-3 text-right text-blue-900">
                                ${(selectedRecipient.level === 'Sell' ? totals.sellTotal :
                                  selectedRecipient.level === 'L1' ? totals.l1Total :
                                  selectedRecipient.level === 'L2' ? totals.l2Total : totals.l3Total).toLocaleString()}
                              </td>
                              <td className="px-3 py-3 text-right text-xs text-green-600">
                                {selectedRecipient.level !== 'Sell' && (
                                  <>+{(((selectedRecipient.level === 'L1' ? totals.l1Total : selectedRecipient.level === 'L2' ? totals.l2Total : totals.l3Total) - totals.sellTotal) / totals.sellTotal * 100).toFixed(1)}%</>
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Line Items View */
                  <div className="p-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Line Items</p>
                        <p className="text-xl font-semibold text-[var(--foreground)]">{quoteLineItems.length}</p>
                      </div>
                      <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Price Level</p>
                        <p className="text-xl font-semibold text-[var(--foreground)]">{selectedRecipient.level}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 uppercase tracking-wider">Quote Total</p>
                        <p className="text-xl font-semibold text-blue-700">
                          ${(selectedRecipient.level === 'Sell' ? totals.sellTotal :
                            selectedRecipient.level === 'L1' ? totals.l1Total :
                            selectedRecipient.level === 'L2' ? totals.l2Total : totals.l3Total).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Status</p>
                        <p className="text-xl font-semibold text-[var(--foreground)]">
                          {selectedRecipient.sent ? (
                            <span className="text-green-600">Sent</span>
                          ) : (
                            <span className="text-yellow-600">Draft</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--muted)]/30">
                          <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                            <th className="px-4 py-3">Section</th>
                            <th className="px-4 py-3">Part #</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Manufacturer</th>
                            <th className="px-4 py-3 text-center">Qty</th>
                            <th className="px-4 py-3 text-right">Unit Price</th>
                            <th className="px-4 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {quoteLineItems.map(item => {
                            const recipientPrice = selectedRecipient.level === 'Sell' ? item.sellPrice :
                              selectedRecipient.level === 'L1' ? item.level1Price :
                              selectedRecipient.level === 'L2' ? item.level2Price : item.level3Price;
                            return (
                              <tr key={item.id} className="hover:bg-[var(--muted)]/10">
                                <td className="px-4 py-3 text-[var(--muted-foreground)]">{item.sectionName}</td>
                                <td className="px-4 py-3 font-mono text-xs text-[var(--foreground)]">{item.productNumber}</td>
                                <td className="px-4 py-3 text-[var(--foreground)]">{item.description}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[var(--foreground)]">{item.manufacturers[0].name}</span>
                                    <span className={`w-2 h-2 rounded-full ${
                                      item.manufacturers[0].approvalStatus === 'approved' ? 'bg-green-500' :
                                      item.manufacturers[0].approvalStatus === 'conditional' ? 'bg-yellow-500' :
                                      item.manufacturers[0].approvalStatus === 'not_approved' ? 'bg-red-500' : 'bg-gray-400'
                                    }`} />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">{item.quantity}</td>
                                <td className="px-4 py-3 text-right font-medium">${recipientPrice.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-[var(--foreground)]">
                                  ${(recipientPrice * item.quantity).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-[var(--muted)]/30">
                          <tr className="font-semibold">
                            <td colSpan={6} className="px-4 py-3 text-right">Quote Total:</td>
                            <td className="px-4 py-3 text-right text-lg">
                              ${(selectedRecipient.level === 'Sell' ? totals.sellTotal :
                                selectedRecipient.level === 'L1' ? totals.l1Total :
                                selectedRecipient.level === 'L2' ? totals.l2Total : totals.l3Total).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between items-center bg-[var(--card)]">
                <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                  <span>Version {recipientQuoteVersion} of {selectedQuote.version}</span>
                  {selectedRecipient.sent && (
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                        <path d="M20 4L9 15l-5-5"/>
                      </svg>
                      Sent on {selectedRecipient.sent}
                      {selectedRecipient.opened && ' • Opened'}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                    Export to PDF
                  </button>
                  <button className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
                    Download Excel
                  </button>
                  {!selectedRecipient.sent && (
                    <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
                      Send to {selectedRecipient.company}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Submittal Modal */}
        {showCreateSubmittalModal && (
          <CreateSubmittalModal
            onClose={() => setShowCreateSubmittalModal(false)}
            onCreate={(submittalData) => {
              // Create a complete submittal object
              const newSubmittal: Submittal = {
                id: `SUB-${Date.now()}`,
                jobId: selectedQuote.jobId,
                jobName: submittalData.jobName || selectedQuote.jobName || selectedQuote.name,
                jobLocation: '',
                quoteIds: [selectedQuote.id],
                customers: submittalData.customers || [],
                engineers: submittalData.engineers || [],
                architects: submittalData.architects || [],
                submittalDate: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'draft',
                currentRevision: 1,
                items: submittalData.items || [],
                revisions: [],
                config: defaultSubmittalConfig,
                createdBy: 'Current User',
                updatedBy: 'Current User',
              };
              setSubmittals(prev => [...prev, newSubmittal]);
              setShowCreateSubmittalModal(false);
            }}
            preselectedQuoteId={selectedQuote.id}
            preselectedQuoteName={selectedQuote.name}
            quoteRecipients={recipients.map(r => ({
              id: r.id,
              name: r.contact,
              company: r.company,
              email: r.email,
              role: 'customer' as const,
            }))}
            quoteLineItems={quoteLineItems.map(li => ({
              id: li.id,
              catalogNumber: li.productNumber,
              manufacturer: li.manufacturers[0]?.name || 'Unknown',
              description: li.description,
              quantity: li.quantity,
            }))}
          />
        )}

        {/* Submittal Configuration Modal */}
        {showSubmittalConfigModal && editingSubmittalId && (
          <SubmittalConfigModal
            submittal={submittals.find(s => s.id === editingSubmittalId)!}
            onClose={() => {
              setShowSubmittalConfigModal(false);
              setEditingSubmittalId(null);
            }}
            onSave={(updates) => {
              setSubmittals(prev => prev.map(s =>
                s.id === editingSubmittalId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
              ));
              setShowSubmittalConfigModal(false);
              setEditingSubmittalId(null);
            }}
          />
        )}

        {/* Submittal Detail Panel Modal */}
        {selectedSubmittalForDetail && (
          <SubmittalDetailPanel
            submittal={selectedSubmittalForDetail}
            onClose={() => setSelectedSubmittalForDetail(null)}
            onUpdate={(updates) => {
              setSubmittals(prev => prev.map(s =>
                s.id === selectedSubmittalForDetail.id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
              ));
              // Update the selected submittal as well to reflect changes
              setSelectedSubmittalForDetail(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
            }}
            onPrint={() => setPrintSubmittal(selectedSubmittalForDetail)}
            onResubmit={(itemsToResubmit) => {
              // Handle resubmit - this would typically open the print dialog with pre-selected items
              console.log('Resubmit items:', itemsToResubmit);
              setPrintSubmittal(selectedSubmittalForDetail);
            }}
          />
        )}
      </main>
    );
  }

  // Main Quote List View
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Quotes</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Summary Stats */}
            <div className="flex items-center gap-4 mr-4 text-sm">
              <div className="text-center">
                <p className="text-[var(--muted-foreground)]">Pipeline</p>
                <p className="font-semibold text-[var(--foreground)]">
                  ${quotes.filter(q => !['Won', 'Lost'].includes(q.stage)).reduce((sum, q) => sum + q.valueNumber, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[var(--muted-foreground)]">Won YTD</p>
                <p className="font-semibold text-green-600">
                  ${quotes.filter(q => q.stage === 'Won').reduce((sum, q) => sum + q.valueNumber, 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Kanban View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="18" rx="1"/>
                  <rect x="14" y="3" width="7" height="10" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            <AdvancedFilters filterOptions={quoteFilterOptions} />
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              New Quote
            </button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-6 gap-4">
            {stages.map((stage) => {
              const stageQuotes = quotesByStage[stage.name] || [];
              const stageTotal = stageQuotes.reduce((sum, q) => sum + q.valueNumber, 0);
              const stageQuoteIds = stageQuotes.map(quote => quote.id);

              return (
                <SortableContext
                  key={stage.name}
                  id={`stage-${stage.name}`}
                  items={stageQuoteIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col">
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-3 py-2 mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-gray-900">
                          {stage.name}
                          <span className="ml-2 text-gray-500 font-normal">{stageQuotes.length}</span>
                        </h3>
                      </div>
                      <span className="text-xs text-gray-500">${(stageTotal / 1000000).toFixed(1)}M</span>
                    </div>

                    {/* Drop Zone */}
                    <div
                      id={`stage-${stage.name}`}
                      className="min-h-[500px]"
                    >
                      {stageQuotes.map((quote) => (
                        <SortableQuoteCard key={quote.id} quote={quote} onClick={() => handleQuoteSelect(quote)} />
                      ))}
                    </div>

                    {/* Add Card Button */}
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors mt-2">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                      </svg>
                      New
                    </button>
                  </div>
                </SortableContext>
              );
            })}
          </div>

          <DragOverlay>
            {activeQuote ? <QuoteCard quote={activeQuote} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[2200px]">
              <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                <tr>
                  {/* Checkbox */}
                  <th className="w-10 px-3 py-3 text-left">
                    <input type="checkbox" className="rounded border-[var(--border)]" />
                  </th>
                  {/* Quote Number */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('id')}>Quote Number</span>
                      {quotesSortColumn === 'id' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'id' ? null : 'id'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('id') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'id' && renderFilterDropdown('id', 'Quote Number')}
                  </th>
                  {/* Status */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('status')}>Status</span>
                      {quotesSortColumn === 'status' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'status' ? null : 'status'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('status') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'status' && renderFilterDropdown('status', 'Status')}
                  </th>
                  {/* Stage */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('stage')}>Stage</span>
                      {quotesSortColumn === 'stage' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'stage' ? null : 'stage'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('stage') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'stage' && renderFilterDropdown('stage', 'Stage')}
                  </th>
                  {/* Quote Amount */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('valueNumber')}>Quote Amount</span>
                      {quotesSortColumn === 'valueNumber' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'valueNumber' ? null : 'valueNumber'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('valueNumber') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'valueNumber' && renderFilterDropdown('valueNumber', 'Amount')}
                  </th>
                  {/* Bill-To */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('billToCustomer')}>Bill-To</span>
                      {quotesSortColumn === 'billToCustomer' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'billToCustomer' ? null : 'billToCustomer'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('billToCustomer') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'billToCustomer' && renderFilterDropdown('billToCustomer', 'Bill-To')}
                  </th>
                  {/* Entry Date */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('entryDate')}>Entry Date</span>
                      {quotesSortColumn === 'entryDate' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'entryDate' ? null : 'entryDate'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('entryDate') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'entryDate' && renderFilterDropdown('entryDate', 'Entry Date')}
                  </th>
                  {/* Quote Date */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('quoteDate')}>Quote Date</span>
                      {quotesSortColumn === 'quoteDate' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'quoteDate' ? null : 'quoteDate'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('quoteDate') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'quoteDate' && renderFilterDropdown('quoteDate', 'Quote Date')}
                  </th>
                  {/* Exp. Date */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('expirationDate')}>Exp. Date</span>
                      {quotesSortColumn === 'expirationDate' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'expirationDate' ? null : 'expirationDate'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('expirationDate') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'expirationDate' && renderFilterDropdown('expirationDate', 'Exp. Date')}
                  </th>
                  {/* Factory */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('factories')}>Factory</span>
                      {quotesSortColumn === 'factories' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'factories' ? null : 'factories'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('factories') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'factories' && renderFilterDropdown('factories', 'Factory')}
                  </th>
                  {/* Customer */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('soldToCustomer')}>Customer</span>
                      {quotesSortColumn === 'soldToCustomer' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'soldToCustomer' ? null : 'soldToCustomer'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('soldToCustomer') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'soldToCustomer' && renderFilterDropdown('soldToCustomer', 'Customer')}
                  </th>
                  {/* Job Name */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('jobName')}>Job Name</span>
                      {quotesSortColumn === 'jobName' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'jobName' ? null : 'jobName'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('jobName') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'jobName' && renderFilterDropdown('jobName', 'Job Name')}
                  </th>
                  {/* Win % */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('winProbability')}>Win %</span>
                      {quotesSortColumn === 'winProbability' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'winProbability' ? null : 'winProbability'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('winProbability') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'winProbability' && renderFilterDropdown('winProbability', 'Win %')}
                  </th>
                  {/* Approvals */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('approvalStatus')}>Approvals</span>
                      {quotesSortColumn === 'approvalStatus' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'approvalStatus' ? null : 'approvalStatus'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('approvalStatus') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'approvalStatus' && renderFilterDropdown('approvalStatus', 'Approvals')}
                  </th>
                  {/* End Users */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('endUsers')}>End Users</span>
                      {quotesSortColumn === 'endUsers' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'endUsers' ? null : 'endUsers'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('endUsers') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'endUsers' && renderFilterDropdown('endUsers', 'End Users')}
                  </th>
                  {/* Inside Reps */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('insideReps')}>Inside Reps</span>
                      {quotesSortColumn === 'insideReps' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'insideReps' ? null : 'insideReps'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('insideReps') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'insideReps' && renderFilterDropdown('insideReps', 'Inside Reps')}
                  </th>
                  {/* Outside Reps */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('outsideReps')}>Outside Reps</span>
                      {quotesSortColumn === 'outsideReps' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'outsideReps' ? null : 'outsideReps'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('outsideReps') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'outsideReps' && renderFilterDropdown('outsideReps', 'Outside Reps')}
                  </th>
                  {/* Published */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('published')}>Published</span>
                      {quotesSortColumn === 'published' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'published' ? null : 'published'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('published') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'published' && renderFilterDropdown('published', 'Published')}
                  </th>
                  {/* Tags */}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider relative">
                    <div className="flex items-center gap-1">
                      <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleQuotesSort('tags')}>Tags</span>
                      {quotesSortColumn === 'tags' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={quotesSortDirection === 'desc' ? 'rotate-180' : ''}>
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveQuoteFilterColumn(activeQuoteFilterColumn === 'tags' ? null : 'tags'); setFilterSearchText(''); }}
                        className={`p-0.5 rounded hover:bg-[var(--muted)] ${hasActiveFilter('tags') ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    {activeQuoteFilterColumn === 'tags' && renderFilterDropdown('tags', 'Tags')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    onClick={() => setSelectedQuote(quote)}
                    className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-[var(--border)]" />
                    </td>
                    {/* Quote Number */}
                    <td className="px-3 py-3">
                      <span className="text-sm font-medium text-[var(--primary)] hover:underline">{quote.id}</span>
                    </td>
                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        quote.status === 'Open' ? 'bg-green-100 text-green-800' :
                        quote.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                        quote.status === 'Expired' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {quote.status.toUpperCase()}
                      </span>
                    </td>
                    {/* Stage */}
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        quote.stage === 'Draft' ? 'bg-gray-100 text-gray-800' :
                        quote.stage === 'Review' ? 'bg-blue-100 text-blue-800' :
                        quote.stage === 'Sent' ? 'bg-purple-100 text-purple-800' :
                        quote.stage === 'Negotiating' ? 'bg-yellow-100 text-yellow-800' :
                        quote.stage === 'Won' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {quote.stage}
                      </span>
                    </td>
                    {/* Quote Amount */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--foreground)]">{quote.value}</span>
                    </td>
                    {/* Bill-To */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--foreground)] truncate block max-w-[120px]">{quote.billToCustomer}</span>
                    </td>
                    {/* Entry Date */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--foreground)]">{new Date(quote.entryDate).toLocaleDateString()}</span>
                    </td>
                    {/* Quote Date */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--foreground)]">{new Date(quote.quoteDate).toLocaleDateString()}</span>
                    </td>
                    {/* Exp. Date */}
                    <td className="px-3 py-3">
                      <span className={`text-sm ${new Date(quote.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-red-600 font-medium' : 'text-[var(--foreground)]'}`}>
                        {new Date(quote.expirationDate).toLocaleDateString()}
                      </span>
                    </td>
                    {/* Factory */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {quote.factories.length > 0 && (
                          <>
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium">
                              {quote.factories[0].name.charAt(0)}
                            </div>
                            {quote.factories.length === 1 ? (
                              <span className="text-sm text-[var(--foreground)] truncate max-w-[100px]">{quote.factories[0].name}</span>
                            ) : (
                              <span className="text-sm text-[var(--muted-foreground)]">{quote.factories.length} Factories</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    {/* Customer */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                          {quote.soldToCustomer.charAt(0)}
                        </div>
                        <span className="text-sm text-[var(--foreground)] truncate max-w-[120px]">{quote.soldToCustomer}</span>
                      </div>
                    </td>
                    {/* Job Name */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--foreground)] truncate block max-w-[150px]">{quote.jobName}</span>
                    </td>
                    {/* Win % */}
                    <td className="px-3 py-3">
                      <WinProbabilityBadge probability={quote.winProbability} approvalStatus={quote.approvalStatus} />
                    </td>
                    {/* Approvals */}
                    <td className="px-3 py-3">
                      <ApprovalStatusBadge status={quote.approvalStatus} count={quote.pendingApprovals} />
                    </td>
                    {/* End Users */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {quote.endUsers.length > 0 && (
                          <>
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium">
                              {quote.endUsers[0].name.charAt(0)}
                            </div>
                            {quote.endUsers.length === 1 ? (
                              <span className="text-sm text-[var(--foreground)] truncate max-w-[100px]">{quote.endUsers[0].name}</span>
                            ) : (
                              <span className="text-sm text-[var(--muted-foreground)]">{quote.endUsers.length} End Users</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    {/* Inside Reps */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-[var(--foreground)]">
                        {quote.insideReps.length > 0 ? quote.insideReps[0].name : '-'}
                      </span>
                    </td>
                    {/* Outside Reps */}
                    <td className="px-3 py-3">
                      {quote.outsideReps.length > 0 ? (
                        quote.outsideReps.length === 1 ? (
                          <span className="text-sm text-[var(--foreground)]">{quote.outsideReps[0].name}</span>
                        ) : (
                          <span className="text-sm text-[var(--muted-foreground)]">{quote.outsideReps.length} Reps Listed</span>
                        )
                      ) : (
                        <span className="text-sm text-[var(--muted-foreground)]">-</span>
                      )}
                    </td>
                    {/* Published */}
                    <td className="px-3 py-3 text-center">
                      {quote.published ? (
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-green-500 mx-auto">
                          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                          <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">-</span>
                      )}
                    </td>
                    {/* Tags */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {quote.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
