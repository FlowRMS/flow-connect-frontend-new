'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Submittal, SubmittalItem, TransmittalPurpose, SubmittalStakeholder, SubmittalConfig } from '../../lib/types/submittals';
import { defaultSubmittalConfig } from '../../lib/types/submittals';
import { searchQuotes, type QuoteSearchResult } from '../lib/api/search';
import { useQuote } from '../quotes/api/useQuotesApi';
import { useFactories } from '../warehouse/api/useFactoriesApi';

// Hook for searching quotes with debounce
function useQuoteSearch(searchTerm: string, enabled: boolean = true) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return useQuery<QuoteSearchResult[], Error>({
    queryKey: ['quotes', 'search', debouncedTerm],
    queryFn: () => searchQuotes(debouncedTerm || '', 20),
    enabled,
    staleTime: 30 * 1000,
  });
}

// Transform API quote to display format
interface QuoteForSubmittal {
  id: string;
  quoteId: string; // UUID for API calls
  name: string;
  customer: string;
  itemCount: number;
  recipients: QuoteRecipient[];
}

function transformQuoteResult(quote: QuoteSearchResult): QuoteForSubmittal {
  return {
    id: quote.quoteNumber || quote.id,
    quoteId: quote.id,
    name: quote.jobName || quote.quoteNumber || 'Unnamed Quote',
    customer: '', // Not available in search result
    itemCount: 0, // Will be populated when quote details are fetched
    recipients: [],
  };
}

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

// Submittals are always created from a quote
type Step = 'select-quote' | 'select-recipients' | 'select-items' | 'configure' | 'review';

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
  // Step state - if quote is preselected, skip to recipients; otherwise show quote search
  const [step, setStep] = useState<Step>(preselectedQuoteId ? 'select-recipients' : 'select-quote');

  // Quote selection - supports multiple quotes
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<Set<string>>(
    preselectedQuoteId ? new Set([preselectedQuoteId]) : new Set()
  );
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

  // API hooks for quote search
  const { data: quotesSearchResults, isLoading: isSearchingQuotes } = useQuoteSearch(quoteSearch, step === 'select-quote');

  // Fetch selected quote details when quotes are selected (first one for now, future: fetch all)
  const firstSelectedQuoteId = Array.from(selectedQuoteIds)[0] || '';
  const { data: selectedQuoteDetails, isLoading: isLoadingQuoteDetails } = useQuote(firstSelectedQuoteId);

  // Fetch factories for manufacturer name lookup
  const { data: factories } = useFactories();

  // Build factory ID to name map
  const factoryMap = useMemo(() => {
    const map = new Map<string, string>();
    factories?.forEach(f => map.set(f.id, f.title));
    return map;
  }, [factories]);

  // Transform search results to display format
  const filteredQuotes = useMemo(() => {
    if (!quotesSearchResults) return [];
    return quotesSearchResults.map(transformQuoteResult);
  }, [quotesSearchResults]);

  // Selected quotes info (from API or preselected props)
  const selectedQuotes = useMemo(() => {
    if (preselectedQuoteName && preselectedQuoteId) {
      return [{
        id: preselectedQuoteId,
        quoteId: preselectedQuoteId,
        name: preselectedQuoteName,
        customer: '',
        itemCount: quoteLineItems?.length || 0,
        recipients: [],
      }];
    }
    // Build list from search results and/or fetched details
    const quotes: QuoteForSubmittal[] = [];
    for (const quoteId of selectedQuoteIds) {
      // If we have details for this quote (first selected), use those
      if (selectedQuoteDetails && selectedQuoteDetails.id === quoteId) {
        quotes.push({
          id: selectedQuoteDetails.quoteNumber || selectedQuoteDetails.id,
          quoteId: selectedQuoteDetails.id,
          name: selectedQuoteDetails.soldToCustomer?.companyName || selectedQuoteDetails.quoteNumber || 'Unnamed Quote',
          customer: selectedQuoteDetails.soldToCustomer?.companyName || '',
          itemCount: selectedQuoteDetails.details?.length || 0,
          recipients: [],
        });
      } else {
        // Find from search results
        const fromSearch = filteredQuotes.find(q => q.quoteId === quoteId);
        if (fromSearch) {
          quotes.push(fromSearch);
        }
      }
    }
    return quotes;
  }, [preselectedQuoteName, preselectedQuoteId, selectedQuoteDetails, selectedQuoteIds, filteredQuotes, quoteLineItems]);

  // First selected quote (for display purposes)
  const selectedQuote = selectedQuotes[0] || null;

  // Line items - use passed items or from quote details
  const lineItems = useMemo(() => {
    // If line items were passed from the quote page, use those
    if (quoteLineItems && quoteLineItems.length > 0) {
      return quoteLineItems;
    }
    // Get line items from fetched quote details
    if (selectedQuoteDetails?.details && selectedQuoteDetails.details.length > 0) {
      return selectedQuoteDetails.details.map((detail, index) => ({
        id: detail.id || `li-${index}`,
        catalogNumber: detail.product?.factoryPartNumber || '',
        manufacturer: detail.factoryId ? (factoryMap.get(detail.factoryId) || '') : '',
        description: detail.product?.description || '',
        quantity: detail.quantity || 0,
      }));
    }
    return [];
  }, [selectedQuoteDetails, quoteLineItems, factoryMap]);

  // Recipients - use passed recipients, or extract from quote's customer data
  const recipients: QuoteRecipient[] = useMemo(() => {
    // If recipients were passed from the quote page, use those
    if (quoteRecipients && quoteRecipients.length > 0) {
      return quoteRecipients;
    }
    // Extract recipient from quote's soldToCustomer
    if (selectedQuoteDetails?.soldToCustomer) {
      const customer = selectedQuoteDetails.soldToCustomer;
      return [{
        id: customer.id || 'customer-1',
        name: customer.companyName || 'Customer',
        email: '', // Email not available in customer lite response
        company: customer.companyName || '',
        role: 'customer' as const,
      }];
    }
    // Fallback to quote's recipients if any
    return selectedQuote?.recipients || [];
  }, [quoteRecipients, selectedQuoteDetails, selectedQuote]);

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
        // First step when no preselected quote - close modal
        onClose();
        break;
      case 'select-recipients':
        // Go back to quote selection only if no preselected quote
        if (!preselectedQuoteId) {
          setStep('select-quote');
        } else {
          onClose();
        }
        break;
      case 'select-items':
        setStep('select-recipients');
        break;
      case 'configure':
        setStep('select-items');
        break;
      case 'review':
        setStep('configure');
        break;
    }
  };

  // Handle create
  const handleCreate = () => {
    // Always create from quote - get selected items
    const items: Partial<SubmittalItem>[] = lineItems
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
      }));

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
      quoteIds: Array.from(selectedQuoteIds),
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
      case 'select-quote':
        return selectedQuoteIds.size > 0;
      case 'select-recipients':
        // Allow proceeding if any recipients selected OR any manual contacts entered
        return selectedRecipientIds.size > 0 || architectName.trim() || engineerName.trim() || otherContactName.trim();
      case 'select-items':
        return selectedItemIds.size > 0;
      case 'configure':
        return !!submittalName.trim();
      case 'review':
        return true;
      default:
        return false;
    }
  }, [step, selectedQuoteIds, selectedRecipientIds, selectedItemIds, submittalName, architectName, engineerName, otherContactName]);

  // Step indicator - always from quote flow
  const steps = preselectedQuoteId
    ? ['Recipients', 'Items', 'Configure', 'Review']
    : ['Quotes', 'Recipients', 'Items', 'Configure', 'Review'];

  const stepKeys = preselectedQuoteId
    ? ['select-recipients', 'select-items', 'configure', 'review']
    : ['select-quote', 'select-recipients', 'select-items', 'configure', 'review'];

  const currentStepIndex = stepKeys.indexOf(step);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Submittal</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {step === 'select-quote' && 'Select one or more quotes to pull items from'}
              {step === 'select-recipients' && 'Add recipients and project contacts'}
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
          {/* Step: Select Quotes (multi-select) */}
          {step === 'select-quote' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {selectedQuoteIds.size} quote{selectedQuoteIds.size !== 1 ? 's' : ''} selected
                </p>
                {selectedQuoteIds.size > 0 && (
                  <button
                    onClick={() => setSelectedQuoteIds(new Set())}
                    className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              <div className="relative">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                  <circle cx="9" cy="9" r="6" />
                  <path d="M14 14l4 4" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  placeholder="Search quotes by number or job name..."
                  className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
                {isSearchingQuotes && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredQuotes.length === 0 && !isSearchingQuotes && (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <p>{quoteSearch ? 'No quotes found matching your search.' : 'Start typing to search for quotes.'}</p>
                  </div>
                )}
                {filteredQuotes.map(quote => (
                  <label
                    key={quote.quoteId}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedQuoteIds.has(quote.quoteId)
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:bg-[var(--muted)]/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedQuoteIds.has(quote.quoteId)}
                      onChange={() => {
                        setSelectedQuoteIds(prev => {
                          const next = new Set(prev);
                          if (next.has(quote.quoteId)) {
                            next.delete(quote.quoteId);
                          } else {
                            next.add(quote.quoteId);
                          }
                          return next;
                        });
                      }}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--foreground)]">{quote.name}</div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        {quote.id}{quote.customer ? ` • ${quote.customer}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      {isLoadingQuoteDetails && selectedQuoteIds.has(quote.quoteId) ? (
                        <div className="animate-spin h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
                      ) : (
                        <div className="text-sm text-[var(--muted-foreground)]">
                          {quote.itemCount > 0 ? `${quote.itemCount} items` : '—'}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step: Select Recipients (consolidated with manual contacts) */}
          {step === 'select-recipients' && (
            <div className="space-y-4">
              {/* Quote Recipients Section */}
              {recipients.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Quote Recipients
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

                  <div className="space-y-2 max-h-48 overflow-y-auto">
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
                </>
              )}

              {/* Manual Project Contacts Section */}
              <div className={recipients.length > 0 ? 'pt-4 border-t border-[var(--border)]' : ''}>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">
                  {recipients.length > 0 ? 'Additional Project Contacts' : 'Project Contacts'}
                </h4>
                <div className="space-y-3">
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

              {recipients.length === 0 && !architectName && !engineerName && !otherContactName && (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-2">
                  Add at least one recipient or project contact to continue.
                </p>
              )}
            </div>
          )}

          {/* Step: Select Items */}
          {step === 'select-items' && (
            <div className="space-y-4">
              {isLoadingQuoteDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-2 border-[var(--primary)] border-t-transparent rounded-full mr-3" />
                  <span className="text-[var(--muted-foreground)]">Loading line items...</span>
                </div>
              ) : lineItems.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  <p>No line items found for this quote.</p>
                  <p className="text-sm mt-1">The quote may not have any products yet.</p>
                </div>
              ) : (
                <>
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
                        <span className="font-medium text-[var(--foreground)]">{item.catalogNumber || 'No catalog #'}</span>
                        {item.manufacturer && (
                          <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">{item.manufacturer}</span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] truncate">{item.description}</p>
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)]">
                      Qty: {item.quantity}
                    </div>
                  </label>
                ))}
              </div>
                </>
              )}
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
                {selectedQuotes.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Source Quote{selectedQuotes.length > 1 ? 's' : ''}</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {selectedQuotes.map(q => q.id).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Recipients</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{selectedRecipientIds.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Items</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{selectedItemIds.size}</span>
                </div>
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

              {selectedRecipients.length > 0 && (
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
            onClick={handleBack}
            className="px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            {(step === 'select-quote' || (step === 'select-recipients' && preselectedQuoteId)) ? 'Cancel' : 'Back'}
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
