'use client';

import React, { useState, useMemo } from 'react';
import type { Submittal, SubmittalItem, TransmittalPurpose, SubmittalStakeholder, SubmittalConfig } from '../../lib/types/submittals';
import { defaultSubmittalConfig } from '../../lib/types/submittals';

// Mock quotes data with recipients (would come from actual quote data in real app)
const mockQuotesForSubmittal = [
  {
    id: 'Q-2024-001',
    name: 'Downtown Medical Center - Lighting Package',
    customer: 'Turner Construction',
    itemCount: 12,
    recipients: [
      { id: 'r1', name: 'John Smith', company: 'Turner Construction', role: 'customer' as const, email: 'jsmith@turner.com' },
      { id: 'r2', name: 'Sarah Johnson', company: 'HKS Architects', role: 'architect' as const, email: 'sjohnson@hks.com' },
      { id: 'r3', name: 'Mike Chen', company: 'WSP Engineering', role: 'engineer' as const, email: 'mchen@wsp.com' },
      { id: 'r4', name: 'Lisa Brown', company: 'Turner Construction', role: 'customer' as const, email: 'lbrown@turner.com' },
    ]
  },
  {
    id: 'Q-2024-002',
    name: 'Tech Campus Phase 2',
    customer: 'Skanska USA',
    itemCount: 8,
    recipients: [
      { id: 'r5', name: 'David Lee', company: 'Skanska USA', role: 'customer' as const, email: 'dlee@skanska.com' },
      { id: 'r6', name: 'Emily White', company: 'Gensler', role: 'architect' as const, email: 'ewhite@gensler.com' },
    ]
  },
  {
    id: 'Q-2024-003',
    name: 'Airport Terminal Expansion',
    customer: 'Walsh Group',
    itemCount: 24,
    recipients: [
      { id: 'r7', name: 'Robert Garcia', company: 'Walsh Group', role: 'customer' as const, email: 'rgarcia@walsh.com' },
      { id: 'r8', name: 'Jennifer Martinez', company: 'HNTB', role: 'engineer' as const, email: 'jmartinez@hntb.com' },
      { id: 'r9', name: 'Chris Taylor', company: 'SOM', role: 'architect' as const, email: 'ctaylor@som.com' },
    ]
  },
  {
    id: 'Q-2024-004',
    name: 'Convention Center Renovation',
    customer: 'JE Dunn',
    itemCount: 15,
    recipients: [
      { id: 'r10', name: 'Amanda Wilson', company: 'JE Dunn', role: 'customer' as const, email: 'awilson@jedunn.com' },
    ]
  },
];

// Recipient type that can be passed from quote
export interface QuoteRecipient {
  id: string;
  name: string;
  company: string;
  role: 'customer' | 'architect' | 'engineer' | 'gc' | 'ec' | 'other';
  email: string;
}

// Line item type that can be passed from quote
export interface QuoteLineItem {
  id: string;
  catalogNumber: string;
  manufacturer: string;
  description: string;
  quantity: number;
}

interface CreateSubmittalModalProps {
  onClose: () => void;
  onCreate: (submittal: Partial<Submittal>) => void;
  preselectedQuoteId?: string;
  preselectedQuoteName?: string;
  // Pass actual data from the quote page
  quoteRecipients?: QuoteRecipient[];
  quoteLineItems?: QuoteLineItem[];
}

type CreateMode = 'from-quote' | 'from-scratch';
type Step = 'select-mode' | 'select-quote' | 'select-recipients' | 'select-items' | 'configure' | 'review';

const TRANSMITTAL_PURPOSES: { value: TransmittalPurpose; label: string }[] = [
  { value: 'prior_approval', label: 'Prior Approval' },
  { value: 'approval', label: 'Approval' },
  { value: 'approval_as_submitted', label: 'Approval as Submitted' },
  { value: 'review_and_comment', label: 'Review and Comment' },
  { value: 'for_your_use', label: 'For Your Use' },
  { value: 'record', label: 'Record' },
  { value: 'bids_due_on', label: 'Bids Due On' },
];

const ROLE_LABELS: Record<QuoteRecipient['role'], string> = {
  customer: 'Customer',
  architect: 'Architect',
  engineer: 'Engineer',
  gc: 'General Contractor',
  ec: 'Electrical Contractor',
  other: 'Other',
};

const ROLE_COLORS: Record<QuoteRecipient['role'], { bg: string; text: string }> = {
  customer: { bg: 'bg-blue-100', text: 'text-blue-700' },
  architect: { bg: 'bg-purple-100', text: 'text-purple-700' },
  engineer: { bg: 'bg-green-100', text: 'text-green-700' },
  gc: { bg: 'bg-orange-100', text: 'text-orange-700' },
  ec: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export default function CreateSubmittalModal({
  onClose,
  onCreate,
  preselectedQuoteId,
  preselectedQuoteName,
  quoteRecipients,
  quoteLineItems,
}: CreateSubmittalModalProps) {
  // Mode and step state
  const [mode, setMode] = useState<CreateMode>(preselectedQuoteId ? 'from-quote' : 'from-scratch');
  const [step, setStep] = useState<Step>(preselectedQuoteId ? 'select-recipients' : 'select-mode');

  // Quote selection
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(preselectedQuoteId || null);
  const [quoteSearch, setQuoteSearch] = useState('');

  // Recipient selection
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());

  // Item selection (mock items for demo)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Configuration
  const [submittalName, setSubmittalName] = useState('');
  const [transmittalPurpose, setTransmittalPurpose] = useState<TransmittalPurpose>('approval');
  const [notes, setNotes] = useState('');

  // Optional contact fields (manual entry)
  const [architectName, setArchitectName] = useState('');
  const [architectCompany, setArchitectCompany] = useState('');
  const [engineerName, setEngineerName] = useState('');
  const [engineerCompany, setEngineerCompany] = useState('');
  const [otherContactName, setOtherContactName] = useState('');
  const [otherContactCompany, setOtherContactCompany] = useState('');

  // Submittal configuration options
  const [config, setConfig] = useState<SubmittalConfig>({ ...defaultSubmittalConfig });

  const updateConfig = (key: keyof SubmittalConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Line items - use passed items or fallback to mock
  const lineItems = useMemo(() => {
    // If line items were passed from the quote page, use those
    if (quoteLineItems && quoteLineItems.length > 0) {
      return quoteLineItems;
    }
    // Otherwise use mock data for demo
    if (!selectedQuoteId) return [];
    return [
      { id: 'li-1', catalogNumber: 'AX1-LED-40K-DIM', manufacturer: 'Acuity Brands', description: 'LED Panel 2x4', quantity: 48 },
      { id: 'li-2', catalogNumber: 'RR-LED-24-50K', manufacturer: 'Acuity Brands', description: 'Recessed Round Downlight', quantity: 24 },
      { id: 'li-3', catalogNumber: '?"RA2-MAIN', manufacturer: 'Lutron', description: 'RadioRA Main Repeater', quantity: 2 },
      { id: 'li-4', catalogNumber: 'PJ2-WALL-WH', manufacturer: 'Lutron', description: 'Pico Wireless Control', quantity: 16 },
      { id: 'li-5', catalogNumber: 'D4006-2K-WH', manufacturer: 'Leviton', description: 'Decora Dimmer Switch', quantity: 12 },
      { id: 'li-6', catalogNumber: 'OSW-P0W-WH', manufacturer: 'Leviton', description: 'Occupancy Sensor Wall Mount', quantity: 8 },
      { id: 'li-7', catalogNumber: 'EM-LED-UNV', manufacturer: 'Philips', description: 'Emergency LED Driver', quantity: 6 },
      { id: 'li-8', catalogNumber: 'TL5-HO-54W', manufacturer: 'Philips', description: 'T5HO Fluorescent Lamp', quantity: 100 },
    ];
  }, [selectedQuoteId, quoteLineItems]);

  // Filtered quotes (for quote selection step when not preselected)
  const filteredQuotes = useMemo(() => {
    if (!quoteSearch) return mockQuotesForSubmittal;
    const search = quoteSearch.toLowerCase();
    return mockQuotesForSubmittal.filter(q =>
      q.name.toLowerCase().includes(search) ||
      q.id.toLowerCase().includes(search) ||
      q.customer.toLowerCase().includes(search)
    );
  }, [quoteSearch]);

  // Selected quote (from mock data or use passed name)
  const selectedQuote = preselectedQuoteName
    ? { id: preselectedQuoteId || '', name: preselectedQuoteName, customer: '', itemCount: lineItems.length, recipients: [] }
    : mockQuotesForSubmittal.find(q => q.id === selectedQuoteId);

  // Recipients - use passed recipients or fallback to mock quote recipients
  const recipients: QuoteRecipient[] = (quoteRecipients && quoteRecipients.length > 0)
    ? quoteRecipients
    : (selectedQuote?.recipients || []);

  // Selected recipients details
  const selectedRecipients = recipients.filter(r => selectedRecipientIds.has(r.id));

  // Toggle recipient selection
  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipientIds(prev => {
      const next = new Set(prev);
      if (next.has(recipientId)) {
        next.delete(recipientId);
      } else {
        next.add(recipientId);
      }
      return next;
    });
  };

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Select/deselect all items
  const toggleAllItems = () => {
    if (selectedItemIds.size === lineItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(lineItems.map(li => li.id)));
    }
  };

  // Handle next step
  const handleNext = () => {
    switch (step) {
      case 'select-mode':
        setStep(mode === 'from-quote' ? 'select-quote' : 'configure');
        break;
      case 'select-quote':
        setStep('select-recipients');
        break;
      case 'select-recipients':
        setStep('select-items');
        break;
      case 'select-items':
        // Auto-generate name if not set
        if (!submittalName && selectedQuote) {
          setSubmittalName(`${selectedQuote.name} - Submittal`);
        }
        setStep('configure');
        break;
      case 'configure':
        setStep('review');
        break;
    }
  };

  // Handle back
  const handleBack = () => {
    switch (step) {
      case 'select-quote':
        setStep('select-mode');
        break;
      case 'select-recipients':
        setStep('select-quote');
        break;
      case 'select-items':
        setStep('select-recipients');
        break;
      case 'configure':
        setStep(mode === 'from-quote' ? 'select-items' : 'select-mode');
        break;
      case 'review':
        setStep('configure');
        break;
    }
  };

  // Handle create
  const handleCreate = () => {
    const items: Partial<SubmittalItem>[] = mode === 'from-quote'
      ? lineItems
          .filter(li => selectedItemIds.has(li.id))
          .map((li, index) => ({
            id: `SI-NEW-${Date.now()}-${index}`,
            catalogNumber: li.catalogNumber,
            manufacturer: li.manufacturer,
            description: li.description,
            quantity: li.quantity,
            sortOrder: index,
            matchStatus: 'no_match' as const,
            fixtureType: `F${index + 1}`,
          }))
      : [];

    // Convert selected recipients to stakeholders
    const customerRoles: QuoteRecipient['role'][] = ['customer', 'gc', 'ec', 'other'];
    const customers: SubmittalStakeholder[] = selectedRecipients
      .filter(r => customerRoles.includes(r.role))
      .map(r => ({
        contactId: r.id,
        contactName: r.name,
        companyName: r.company,
        email: r.email,
        role: r.role as SubmittalStakeholder['role'],
      }));

    const engineers: SubmittalStakeholder[] = selectedRecipients
      .filter(r => r.role === 'engineer')
      .map(r => ({
        contactId: r.id,
        contactName: r.name,
        companyName: r.company,
        email: r.email,
        role: r.role as SubmittalStakeholder['role'],
      }));

    const architects: SubmittalStakeholder[] = selectedRecipients
      .filter(r => r.role === 'architect')
      .map(r => ({
        contactId: r.id,
        contactName: r.name,
        companyName: r.company,
        email: r.email,
        role: r.role as SubmittalStakeholder['role'],
      }));

    // Add manually entered contacts if not already from recipients
    if (architectName.trim() && !architects.some(a => a.contactName === architectName.trim())) {
      architects.push({
        contactId: `manual-arch-${Date.now()}`,
        contactName: architectName.trim(),
        companyName: architectCompany.trim() || undefined,
        role: 'architect',
      });
    }

    if (engineerName.trim() && !engineers.some(e => e.contactName === engineerName.trim())) {
      engineers.push({
        contactId: `manual-eng-${Date.now()}`,
        contactName: engineerName.trim(),
        companyName: engineerCompany.trim() || undefined,
        role: 'engineer',
      });
    }

    if (otherContactName.trim() && !customers.some(c => c.contactName === otherContactName.trim())) {
      customers.push({
        contactId: `manual-other-${Date.now()}`,
        contactName: otherContactName.trim(),
        companyName: otherContactCompany.trim() || undefined,
        role: 'other',
      });
    }

    onCreate({
      jobName: submittalName,
      quoteIds: mode === 'from-quote' && selectedQuoteId ? [selectedQuoteId] : [],
      items: items as SubmittalItem[],
      status: 'draft',
      currentRevision: 0,
      customers,
      engineers,
      architects,
      config,
      revisions: [],
    });
  };

  // Can proceed to next step?
  const canProceed = useMemo(() => {
    switch (step) {
      case 'select-mode':
        return true;
      case 'select-quote':
        return !!selectedQuoteId;
      case 'select-recipients':
        return selectedRecipientIds.size > 0;
      case 'select-items':
        return selectedItemIds.size > 0;
      case 'configure':
        return !!submittalName.trim();
      case 'review':
        return true;
      default:
        return false;
    }
  }, [step, selectedQuoteId, selectedRecipientIds, selectedItemIds, submittalName]);

  // Step indicator
  const steps = mode === 'from-quote'
    ? ['Mode', 'Quote', 'Recipients', 'Items', 'Configure', 'Review']
    : ['Mode', 'Configure', 'Review'];

  const currentStepIndex = mode === 'from-quote'
    ? ['select-mode', 'select-quote', 'select-recipients', 'select-items', 'configure', 'review'].indexOf(step)
    : ['select-mode', 'configure', 'review'].indexOf(step);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Submittal</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {step === 'select-mode' && 'Choose how to create your submittal'}
              {step === 'select-quote' && 'Select a quote to pull items from'}
              {step === 'select-recipients' && 'Select who this submittal is for'}
              {step === 'select-items' && 'Choose which items to include'}
              {step === 'configure' && 'Configure submittal details'}
              {step === 'review' && 'Review and create'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${i <= currentStepIndex ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i < currentStepIndex
                      ? 'bg-[var(--primary)] text-white'
                      : i === currentStepIndex
                      ? 'border-2 border-[var(--primary)] text-[var(--primary)]'
                      : 'border border-[var(--muted-foreground)] text-[var(--muted-foreground)]'
                  }`}>
                    {i < currentStepIndex ? (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="text-sm hidden sm:inline">{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < currentStepIndex ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Select Mode */}
          {step === 'select-mode' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('from-quote')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  mode === 'from-quote'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    mode === 'from-quote' ? 'border-[var(--primary)]' : 'border-[var(--muted-foreground)]'
                  }`}>
                    {mode === 'from-quote' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-[var(--foreground)]">Create from Quote</div>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      Import line items from an existing quote. Spec sheets will be automatically matched.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('from-scratch')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  mode === 'from-scratch'
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    mode === 'from-scratch' ? 'border-[var(--primary)]' : 'border-[var(--muted-foreground)]'
                  }`}>
                    {mode === 'from-scratch' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-[var(--foreground)]">Create from Scratch</div>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      Start with a blank submittal and manually add items and spec sheets.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step: Select Quote */}
          {step === 'select-quote' && (
            <div className="space-y-4">
              <div className="relative">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                  <circle cx="9" cy="9" r="6" />
                  <path d="M14 14l4 4" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  placeholder="Search quotes..."
                  className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredQuotes.map(quote => (
                  <button
                    key={quote.id}
                    onClick={() => {
                      setSelectedQuoteId(quote.id);
                      // Reset recipient selection when quote changes
                      setSelectedRecipientIds(new Set());
                    }}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedQuoteId === quote.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:bg-[var(--muted)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[var(--foreground)]">{quote.name}</div>
                        <div className="text-sm text-[var(--muted-foreground)]">
                          {quote.id} • {quote.customer}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[var(--muted-foreground)]">
                          {quote.itemCount} items
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {quote.recipients.length} recipients
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Select Recipients */}
          {step === 'select-recipients' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {selectedRecipientIds.size} of {recipients.length} recipients selected
                </p>
                <button
                  onClick={() => {
                    if (selectedRecipientIds.size === recipients.length) {
                      setSelectedRecipientIds(new Set());
                    } else {
                      setSelectedRecipientIds(new Set(recipients.map(r => r.id)));
                    }
                  }}
                  className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  {selectedRecipientIds.size === recipients.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recipients.map(recipient => (
                  <label
                    key={recipient.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRecipientIds.has(recipient.id)
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:bg-[var(--muted)]/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipientIds.has(recipient.id)}
                      onChange={() => toggleRecipient(recipient.id)}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--foreground)]">{recipient.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${ROLE_COLORS[recipient.role].bg} ${ROLE_COLORS[recipient.role].text}`}>
                          {ROLE_LABELS[recipient.role]}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">{recipient.company}</p>
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      {recipient.email}
                    </div>
                  </label>
                ))}
              </div>

              {recipients.length === 0 && (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  <p>No recipients found for this quote.</p>
                  <p className="text-sm mt-1">Please add recipients to the quote first.</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Select Items */}
          {step === 'select-items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {selectedItemIds.size} of {lineItems.length} items selected
                </p>
                <button
                  onClick={toggleAllItems}
                  className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  {selectedItemIds.size === lineItems.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {lineItems.map(item => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedItemIds.has(item.id)
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:bg-[var(--muted)]/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="accent-[var(--primary)]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--foreground)]">{item.catalogNumber}</span>
                        <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">{item.manufacturer}</span>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] truncate">{item.description}</p>
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Qty: {item.quantity}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step: Configure */}
          {step === 'configure' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Submittal Name *
                </label>
                <input
                  type="text"
                  value={submittalName}
                  onChange={(e) => setSubmittalName(e.target.value)}
                  placeholder="Enter submittal name..."
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Transmittal Purpose
                </label>
                <select
                  value={transmittalPurpose}
                  onChange={(e) => setTransmittalPurpose(e.target.value as TransmittalPurpose)}
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  {TRANSMITTAL_PURPOSES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Project Contacts Section */}
              <div className="pt-4 border-t border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Project Contacts (Optional)</h4>
                <div className="space-y-4">
                  {/* Architect */}
                  <div className="p-3 bg-[var(--muted)]/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                          <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)]">Architect</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={architectName}
                        onChange={(e) => setArchitectName(e.target.value)}
                        placeholder="Name"
                        className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                      <input
                        type="text"
                        value={architectCompany}
                        onChange={(e) => setArchitectCompany(e.target.value)}
                        placeholder="Company"
                        className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>
                  </div>

                  {/* Engineer */}
                  <div className="p-3 bg-[var(--muted)]/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)]">Engineer</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={engineerName}
                        onChange={(e) => setEngineerName(e.target.value)}
                        placeholder="Name"
                        className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                      <input
                        type="text"
                        value={engineerCompany}
                        onChange={(e) => setEngineerCompany(e.target.value)}
                        placeholder="Company"
                        className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>
                  </div>

                  {/* Other Contact */}
                  <div className="p-3 bg-[var(--muted)]/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)]">Other Contact</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={otherContactName}
                        onChange={(e) => setOtherContactName(e.target.value)}
                        placeholder="Name"
                        className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                      <input
                        type="text"
                        value={otherContactCompany}
                        onChange={(e) => setOtherContactCompany(e.target.value)}
                        placeholder="Company"
                        className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submittal Configuration Options */}
              <div className="pt-4 border-t border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Submittal Configuration</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {/* Include Options */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeLamps}
                      onChange={(e) => updateConfig('includeLamps', e.target.checked)}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--foreground)]">Lamps</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeAccessories}
                      onChange={(e) => updateConfig('includeAccessories', e.target.checked)}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--foreground)]">Accessories</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeCQ}
                      onChange={(e) => updateConfig('includeCQ', e.target.checked)}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--foreground)]">CQ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeFromOrders}
                      onChange={(e) => updateConfig('includeFromOrders', e.target.checked)}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--foreground)]">From Orders</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.rollUpKits}
                      onChange={(e) => updateConfig('rollUpKits', e.target.checked)}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--foreground)]">Roll up kits</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.rollUpAccessories}
                      onChange={(e) => updateConfig('rollUpAccessories', e.target.checked)}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--foreground)]">Roll up Accessories</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeZeroQuantityItems}
                      onChange={(e) => updateConfig('includeZeroQuantityItems', e.target.checked)}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--foreground)]">Zero Quantity Items</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.dropDescriptions}
                      onChange={(e) => updateConfig('dropDescriptions', e.target.checked)}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--foreground)]">Drop Descriptions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.dropLineNotes}
                      onChange={(e) => updateConfig('dropLineNotes', e.target.checked)}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="text-sm text-[var(--foreground)]">Drop Line Notes</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or comments..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step: Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Submittal Name</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{submittalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Creation Mode</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {mode === 'from-quote' ? 'From Quote' : 'From Scratch'}
                  </span>
                </div>
                {mode === 'from-quote' && selectedQuote && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Source Quote</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">{selectedQuote.id}</span>
                  </div>
                )}
                {mode === 'from-quote' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Recipients</span>
                      <span className="text-sm font-medium text-[var(--foreground)]">{selectedRecipientIds.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[var(--muted-foreground)]">Items</span>
                      <span className="text-sm font-medium text-[var(--foreground)]">{selectedItemIds.size}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Transmittal Purpose</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {TRANSMITTAL_PURPOSES.find(p => p.value === transmittalPurpose)?.label}
                  </span>
                </div>
                {notes && (
                  <div>
                    <span className="text-sm text-[var(--muted-foreground)]">Notes</span>
                    <p className="text-sm text-[var(--foreground)] mt-1">{notes}</p>
                  </div>
                )}
              </div>

              {mode === 'from-quote' && selectedRecipients.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Selected Recipients</h4>
                  <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)] max-h-32 overflow-y-auto">
                    {selectedRecipients.map(recipient => (
                      <div key={recipient.id} className="px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--foreground)]">{recipient.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS[recipient.role].bg} ${ROLE_COLORS[recipient.role].text}`}>
                            {ROLE_LABELS[recipient.role]}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">{recipient.company}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'from-quote' && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Selected Items</h4>
                  <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)] max-h-48 overflow-y-auto">
                    {lineItems
                      .filter(li => selectedItemIds.has(li.id))
                      .map(item => (
                        <div key={item.id} className="px-3 py-2 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-[var(--foreground)]">{item.catalogNumber}</span>
                            <span className="text-xs text-[var(--muted-foreground)] ml-2">{item.manufacturer}</span>
                          </div>
                          <span className="text-xs text-[var(--muted-foreground)]">Qty: {item.quantity}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Project Contacts Summary */}
              {(architectName || engineerName || otherContactName) && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Project Contacts</h4>
                  <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
                    {architectName && (
                      <div className="px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                              <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-[var(--foreground)]">{architectName}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Architect</span>
                        </div>
                        {architectCompany && (
                          <span className="text-xs text-[var(--muted-foreground)]">{architectCompany}</span>
                        )}
                      </div>
                    )}
                    {engineerName && (
                      <div className="px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-[var(--foreground)]">{engineerName}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">Engineer</span>
                        </div>
                        {engineerCompany && (
                          <span className="text-xs text-[var(--muted-foreground)]">{engineerCompany}</span>
                        )}
                      </div>
                    )}
                    {otherContactName && (
                      <div className="px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-[var(--foreground)]">{otherContactName}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">Other</span>
                        </div>
                        {otherContactCompany && (
                          <span className="text-xs text-[var(--muted-foreground)]">{otherContactCompany}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <button
            onClick={step === 'select-mode' ? onClose : handleBack}
            className="px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            {step === 'select-mode' ? 'Cancel' : 'Back'}
          </button>

          {step === 'review' ? (
            <button
              onClick={handleCreate}
              className="px-6 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Create Submittal
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-6 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
