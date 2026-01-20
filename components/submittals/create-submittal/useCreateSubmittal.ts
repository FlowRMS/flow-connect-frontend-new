'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TransmittalPurpose, SubmittalItem, SubmittalStakeholder, SubmittalConfig } from '../../../lib/types/submittals';
import { defaultSubmittalConfig } from '../../../lib/types/submittals';
import { searchQuotes, type QuoteSearchResult } from '../../lib/api/search';
import { useQuote } from '../../quotes/api/useQuotesApi';
import { useFactories } from '../../warehouse/api/useFactoriesApi';
import { fetchContactsByQuoteId } from '../../lib/graphql';
import type {
  Step,
  QuoteRecipient,
  QuoteLineItem,
  QuoteForSubmittal,
  ManualContacts,
  CreateSubmittalModalProps,
} from './types';

// Hook for searching quotes with debounce
function useQuoteSearch(searchTerm: string, enabled: boolean = true) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
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
function transformQuoteResult(quote: QuoteSearchResult): QuoteForSubmittal {
  return {
    id: quote.quoteNumber || quote.id,
    quoteId: quote.id,
    name: quote.jobName || quote.quoteNumber || 'Unnamed Quote',
    customer: '',
    itemCount: 0,
    recipients: [],
  };
}

interface UseCreateSubmittalParams {
  preselectedQuoteId?: string;
  preselectedQuoteName?: string;
  quoteRecipients?: QuoteRecipient[];
  quoteLineItems?: QuoteLineItem[];
  onClose: () => void;
  onCreate: CreateSubmittalModalProps['onCreate'];
}

export function useCreateSubmittal({
  preselectedQuoteId,
  preselectedQuoteName,
  quoteRecipients,
  quoteLineItems,
  onClose,
  onCreate,
}: UseCreateSubmittalParams) {
  // Step state
  const [step, setStep] = useState<Step>(preselectedQuoteId ? 'select-recipients' : 'select-quote');

  // Loading state for creation
  const [isCreating, setIsCreating] = useState(false);

  // Quote selection
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<Set<string>>(
    preselectedQuoteId ? new Set([preselectedQuoteId]) : new Set()
  );
  const [quoteSearch, setQuoteSearch] = useState('');

  // Recipient selection
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());

  // Item selection
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Configuration
  const [submittalName, setSubmittalName] = useState('');
  const [transmittalPurpose, setTransmittalPurpose] = useState<TransmittalPurpose>('approval');
  const [notes, setNotes] = useState('');

  // Manual contacts
  const [manualContacts, setManualContacts] = useState<ManualContacts>({
    architectName: '',
    architectCompany: '',
    engineerName: '',
    engineerCompany: '',
    otherContactName: '',
    otherContactCompany: '',
  });

  // Submittal config
  const [config, setConfig] = useState<SubmittalConfig>({ ...defaultSubmittalConfig });

  const updateConfig = (key: keyof SubmittalConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // API hooks
  const { data: quotesSearchResults, isLoading: isSearchingQuotes } = useQuoteSearch(quoteSearch, step === 'select-quote');
  const firstSelectedQuoteId = Array.from(selectedQuoteIds)[0] || '';
  const { data: selectedQuoteDetails, isLoading: isLoadingQuoteDetails } = useQuote(firstSelectedQuoteId);
  const { data: factories } = useFactories();

  // Fetch contacts linked to the quote
  const { data: quoteContacts } = useQuery({
    queryKey: ['contacts', 'byQuote', firstSelectedQuoteId],
    queryFn: () => fetchContactsByQuoteId(firstSelectedQuoteId),
    enabled: !!firstSelectedQuoteId,
    staleTime: 30 * 1000,
  });

  // Factory map
  const factoryMap = useMemo(() => {
    const map = new Map<string, string>();
    factories?.forEach(f => map.set(f.id, f.title));
    return map;
  }, [factories]);

  // Transform search results
  const filteredQuotes = useMemo(() => {
    if (!quotesSearchResults) return [];
    return quotesSearchResults.map(transformQuoteResult);
  }, [quotesSearchResults]);

  // Selected quotes info
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
    const quotes: QuoteForSubmittal[] = [];
    for (const quoteId of selectedQuoteIds) {
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
        const fromSearch = filteredQuotes.find(q => q.quoteId === quoteId);
        if (fromSearch) quotes.push(fromSearch);
      }
    }
    return quotes;
  }, [preselectedQuoteName, preselectedQuoteId, selectedQuoteDetails, selectedQuoteIds, filteredQuotes, quoteLineItems]);

  const selectedQuote = selectedQuotes[0] || null;

  // Line items
  const lineItems = useMemo(() => {
    if (quoteLineItems && quoteLineItems.length > 0) return quoteLineItems;
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

  // Recipients - combine soldToCustomer with linked contacts
  const recipients: QuoteRecipient[] = useMemo(() => {
    if (quoteRecipients && quoteRecipients.length > 0) return quoteRecipients;

    const result: QuoteRecipient[] = [];

    // Add soldToCustomer as the primary customer
    if (selectedQuoteDetails?.soldToCustomer) {
      const customer = selectedQuoteDetails.soldToCustomer;
      result.push({
        id: customer.id || 'customer-1',
        name: customer.companyName || 'Customer',
        email: '',
        company: customer.companyName || '',
        role: 'customer' as const,
      });
    }

    // Add contacts linked to the quote
    if (quoteContacts && quoteContacts.length > 0) {
      for (const contact of quoteContacts) {
        // Map contact role to QuoteRecipient role
        const contactRole = contact.role?.toLowerCase() || '';
        let role: QuoteRecipient['role'] = 'other';
        if (contactRole.includes('architect')) role = 'architect';
        else if (contactRole.includes('engineer')) role = 'engineer';
        else if (contactRole.includes('customer') || contactRole.includes('gc') || contactRole.includes('contractor')) role = 'gc';

        result.push({
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`.trim(),
          email: contact.email || '',
          company: '', // Contact doesn't have company directly
          role,
        });
      }
    }

    return result.length > 0 ? result : (selectedQuote?.recipients || []);
  }, [quoteRecipients, selectedQuoteDetails, selectedQuote, quoteContacts]);

  const selectedRecipients = recipients.filter(r => selectedRecipientIds.has(r.id));

  // Toggle handlers
  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipientIds(prev => {
      const next = new Set(prev);
      next.has(recipientId) ? next.delete(recipientId) : next.add(recipientId);
      return next;
    });
  };

  const toggleItem = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  const toggleAllItems = () => {
    setSelectedItemIds(selectedItemIds.size === lineItems.length ? new Set() : new Set(lineItems.map(li => li.id)));
  };

  // Navigation
  const handleNext = () => {
    switch (step) {
      case 'select-quote': setStep('select-recipients'); break;
      case 'select-recipients': setStep('select-items'); break;
      case 'select-items':
        if (!submittalName && selectedQuote) {
          setSubmittalName(`${selectedQuote.name} - Submittal`);
        }
        setStep('configure');
        break;
      case 'configure': setStep('review'); break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'select-quote': onClose(); break;
      case 'select-recipients':
        preselectedQuoteId ? onClose() : setStep('select-quote');
        break;
      case 'select-items': setStep('select-recipients'); break;
      case 'configure': setStep('select-items'); break;
      case 'review': setStep('configure'); break;
    }
  };

  const handleCreate = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
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

      const customerRoles: QuoteRecipient['role'][] = ['customer', 'gc', 'ec', 'other'];
      const customers: SubmittalStakeholder[] = selectedRecipients
        .filter(r => customerRoles.includes(r.role))
        .map(r => ({ contactId: r.id, contactName: r.name, companyName: r.company, email: r.email, role: r.role as SubmittalStakeholder['role'] }));

      const engineers: SubmittalStakeholder[] = selectedRecipients
        .filter(r => r.role === 'engineer')
        .map(r => ({ contactId: r.id, contactName: r.name, companyName: r.company, email: r.email, role: r.role as SubmittalStakeholder['role'] }));

      const architects: SubmittalStakeholder[] = selectedRecipients
        .filter(r => r.role === 'architect')
        .map(r => ({ contactId: r.id, contactName: r.name, companyName: r.company, email: r.email, role: r.role as SubmittalStakeholder['role'] }));

      // Add manual contacts
      if (manualContacts.architectName.trim() && !architects.some(a => a.contactName === manualContacts.architectName.trim())) {
        architects.push({ contactId: `manual-arch-${Date.now()}`, contactName: manualContacts.architectName.trim(), companyName: manualContacts.architectCompany.trim() || undefined, role: 'architect' });
      }
      if (manualContacts.engineerName.trim() && !engineers.some(e => e.contactName === manualContacts.engineerName.trim())) {
        engineers.push({ contactId: `manual-eng-${Date.now()}`, contactName: manualContacts.engineerName.trim(), companyName: manualContacts.engineerCompany.trim() || undefined, role: 'engineer' });
      }
      if (manualContacts.otherContactName.trim() && !customers.some(c => c.contactName === manualContacts.otherContactName.trim())) {
        customers.push({ contactId: `manual-other-${Date.now()}`, contactName: manualContacts.otherContactName.trim(), companyName: manualContacts.otherContactCompany.trim() || undefined, role: 'other' });
      }

      await onCreate({
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
    } finally {
      setIsCreating(false);
    }
  };

  // Can proceed
  const canProceed = useMemo(() => {
    switch (step) {
      case 'select-quote': return selectedQuoteIds.size > 0;
      case 'select-recipients':
        return selectedRecipientIds.size > 0 || manualContacts.architectName.trim() || manualContacts.engineerName.trim() || manualContacts.otherContactName.trim();
      case 'select-items': return selectedItemIds.size > 0;
      case 'configure': return !!submittalName.trim();
      case 'review': return true;
      default: return false;
    }
  }, [step, selectedQuoteIds, selectedRecipientIds, selectedItemIds, submittalName, manualContacts]);

  // Step info
  const steps = preselectedQuoteId
    ? ['Recipients', 'Items', 'Configure', 'Review']
    : ['Quotes', 'Recipients', 'Items', 'Configure', 'Review'];

  const stepKeys = preselectedQuoteId
    ? ['select-recipients', 'select-items', 'configure', 'review']
    : ['select-quote', 'select-recipients', 'select-items', 'configure', 'review'];

  const currentStepIndex = stepKeys.indexOf(step);

  return {
    step, setStep, steps, currentStepIndex, canProceed,
    selectedQuoteIds, setSelectedQuoteIds, quoteSearch, setQuoteSearch,
    filteredQuotes, isSearchingQuotes, isLoadingQuoteDetails,
    selectedQuotes, selectedQuote,
    recipients, selectedRecipientIds, toggleRecipient, selectedRecipients,
    manualContacts, setManualContacts,
    lineItems, selectedItemIds, toggleItem, toggleAllItems,
    submittalName, setSubmittalName, transmittalPurpose, setTransmittalPurpose,
    notes, setNotes, config, updateConfig,
    handleNext, handleBack, handleCreate, isCreating,
  };
}
