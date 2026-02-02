/**
 * Link Selector Component
 * Category-based entity linking with clickable boxes and tag display
 * Uses lazy loading - only fetches data when a category is opened
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  useJobSearch,
  useCompanySearch,
  useContactSearch,
  useTaskSearch,
  usePreOpportunitySearch,
  useQuoteSearch,
  useOrderSearch,
  useInvoiceSearch,
  useCheckSearch,
  useFactorySearch,
  useCustomerSearch,
  useProductSearch,
  type EntityType,
  type JobSearchResult,
  type CompanySearchResult,
  type ContactSearchResult,
  type TaskSearchResult,
  type PreOpportunitySearchResult,
  type QuoteSearchResult,
  type OrderSearchResult,
  type InvoiceSearchResult,
  type CheckSearchResult,
  type FactorySearchResult,
  type CustomerSearchResult,
  type ProductSearchResult,
} from '../api';

export interface SelectedLink {
  id: string;
  type: EntityType;
  name: string;
}

interface LinkSelectorProps {
  selectedLinks: SelectedLink[];
  onLinksChange: (links: SelectedLink[]) => void;
  disabled?: boolean;
  className?: string;
}

type TabType = 'JOB' | 'COMPANY' | 'CONTACT' | 'TASK' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'FACTORY' | 'CUSTOMER' | 'PRODUCT';

const CATEGORIES: { id: TabType; label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string; activeBg: string }[] = [
  {
    id: 'JOB', label: 'Jobs', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', activeBg: 'bg-blue-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  {
    id: 'PRE_OPPORTUNITY', label: 'Pre-Opps', color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', activeBg: 'bg-teal-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    id: 'CONTACT', label: 'Contacts', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', activeBg: 'bg-green-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
  {
    id: 'COMPANY', label: 'Companies', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', activeBg: 'bg-purple-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    id: 'TASK', label: 'Tasks', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', activeBg: 'bg-orange-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    id: 'QUOTE', label: 'Quotes', color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', activeBg: 'bg-indigo-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    id: 'ORDER', label: 'Orders', color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', activeBg: 'bg-cyan-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  },
  {
    id: 'INVOICE', label: 'Invoices', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', activeBg: 'bg-amber-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    id: 'CHECK', label: 'Checks', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', activeBg: 'bg-emerald-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    id: 'FACTORY', label: 'Factories', color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', activeBg: 'bg-rose-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M12 7v.01M12 11v.01M12 15v.01" /></svg>,
  },
  {
    id: 'CUSTOMER', label: 'Customers', color: 'text-fuchsia-700', bgColor: 'bg-fuchsia-50', borderColor: 'border-fuchsia-200', activeBg: 'bg-fuchsia-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    id: 'PRODUCT', label: 'Products', color: 'text-sky-700', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', activeBg: 'bg-sky-100',
    icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  },
];

const TYPE_COLORS: Record<string, { tag: string; dot: string }> = {
  JOB: { tag: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  COMPANY: { tag: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  CONTACT: { tag: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  TASK: { tag: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  PRE_OPPORTUNITY: { tag: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
  QUOTE: { tag: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  ORDER: { tag: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500' },
  INVOICE: { tag: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  CHECK: { tag: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  FACTORY: { tag: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  CUSTOMER: { tag: 'bg-fuchsia-100 text-fuchsia-700', dot: 'bg-fuchsia-500' },
  PRODUCT: { tag: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
};

export function LinkSelector({
  selectedLinks,
  onLinksChange,
  disabled = false,
  className = '',
}: LinkSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<TabType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [openedCategories, setOpenedCategories] = useState<Set<TabType>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const DROPDOWN_HEIGHT = 280;

  // Lazy load: only fetch for categories that have been opened
  const shouldFetch = (type: TabType) => openedCategories.has(type);

  const { data: jobs = [], isLoading: isLoadingJobs } = useJobSearch(searchQuery, shouldFetch('JOB'));
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanySearch(searchQuery, shouldFetch('COMPANY'));
  const { data: contacts = [], isLoading: isLoadingContacts } = useContactSearch(searchQuery, shouldFetch('CONTACT'));
  const { data: tasks = [], isLoading: isLoadingTasks } = useTaskSearch(searchQuery, shouldFetch('TASK'));
  const { data: preOpportunities = [], isLoading: isLoadingPreOpportunities } = usePreOpportunitySearch(searchQuery, shouldFetch('PRE_OPPORTUNITY'));
  const { data: quotes = [], isLoading: isLoadingQuotes } = useQuoteSearch(searchQuery, shouldFetch('QUOTE'));
  const { data: orders = [], isLoading: isLoadingOrders } = useOrderSearch(searchQuery, shouldFetch('ORDER'));
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoiceSearch(searchQuery, shouldFetch('INVOICE'));
  const { data: checks = [], isLoading: isLoadingChecks } = useCheckSearch(searchQuery, shouldFetch('CHECK'));
  const { data: factories = [], isLoading: isLoadingFactories } = useFactorySearch(searchQuery, shouldFetch('FACTORY'));
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomerSearch(searchQuery, shouldFetch('CUSTOMER'));
  const { data: products = [], isLoading: isLoadingProducts } = useProductSearch(searchQuery, shouldFetch('PRODUCT'));

  useEffect(() => { setIsMounted(true); }, []);

  const updateDropdownPosition = () => {
    if (activeBtnRef.current) {
      const rect = activeBtnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow < DROPDOWN_HEIGHT && rect.top > spaceBelow
        ? rect.top - DROPDOWN_HEIGHT - 4
        : rect.bottom + 4;
      setDropdownPosition({ top, left: rect.left, width: Math.max(rect.width, 320) });
    }
  };

  useEffect(() => {
    if (activeCategory) {
      updateDropdownPosition();
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (!activeCategory) return;
    const handler = () => updateDropdownPosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [activeCategory]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setActiveCategory(null);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (catId: TabType, btnEl: HTMLButtonElement) => {
    if (activeCategory === catId) {
      setActiveCategory(null);
      setSearchQuery('');
    } else {
      activeBtnRef.current = btnEl;
      setActiveCategory(catId);
      setSearchQuery('');
      setOpenedCategories(prev => new Set(prev).add(catId));
    }
  };

  const getFilteredEntities = (): { id: string; name: string; subtitle?: string }[] => {
    if (!activeCategory) return [];
    const query = searchQuery.toLowerCase();
    const alreadySelectedIds = new Set(selectedLinks.filter(l => l.type === activeCategory).map(l => l.id));

    switch (activeCategory) {
      case 'JOB':
        return (jobs as JobSearchResult[])
          .filter((j) => (j.jobName?.toLowerCase() || '').includes(query) && !alreadySelectedIds.has(j.id))
          .slice(0, 10)
          .map((j) => ({ id: j.id, name: j.jobName || 'Unnamed Job', subtitle: j.jobType || undefined }));
      case 'COMPANY':
        return (companies as CompanySearchResult[])
          .filter((c) => (c.name?.toLowerCase() || '').includes(query) && !alreadySelectedIds.has(c.id))
          .slice(0, 10)
          .map((c) => ({ id: c.id, name: c.name || 'Unnamed Company' }));
      case 'CONTACT':
        return (contacts as ContactSearchResult[])
          .filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) && !alreadySelectedIds.has(c.id))
          .slice(0, 10)
          .map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, subtitle: c.email || undefined }));
      case 'TASK':
        return (tasks as TaskSearchResult[])
          .filter((t) => (t.title?.toLowerCase() || '').includes(query) && !alreadySelectedIds.has(t.id))
          .slice(0, 10)
          .map((t) => ({ id: t.id, name: t.title || 'Unnamed Task', subtitle: t.status }));
      case 'PRE_OPPORTUNITY':
        return (preOpportunities as PreOpportunitySearchResult[])
          .filter((p) => (p.entityNumber?.toLowerCase() || '').includes(query) && !alreadySelectedIds.has(p.id))
          .slice(0, 10)
          .map((p) => ({ id: p.id, name: p.entityNumber || 'Unknown Pre-Opportunity', subtitle: p.status || undefined }));
      case 'QUOTE':
        return (quotes as QuoteSearchResult[])
          .filter((q) => ((q.quoteNumber?.toLowerCase() || '').includes(query) || (q.jobName?.toLowerCase() || '').includes(query)) && !alreadySelectedIds.has(q.id))
          .slice(0, 10)
          .map((q) => ({ id: q.id, name: q.quoteNumber || 'Unknown Quote', subtitle: q.jobName || undefined }));
      case 'ORDER':
        return (orders as OrderSearchResult[])
          .filter((o) => ((o.orderNumber?.toLowerCase() || '').includes(query) || (o.jobName?.toLowerCase() || '').includes(query)) && !alreadySelectedIds.has(o.id))
          .slice(0, 10)
          .map((o) => ({ id: o.id, name: o.orderNumber || 'Unknown Order', subtitle: o.jobName || o.status || undefined }));
      case 'INVOICE':
        return (invoices as InvoiceSearchResult[])
          .filter((i) => (i.invoiceNumber?.toLowerCase() || '').includes(query) && !alreadySelectedIds.has(i.id))
          .slice(0, 10)
          .map((i) => ({ id: i.id, name: i.invoiceNumber || 'Unknown Invoice', subtitle: i.status || undefined }));
      case 'CHECK':
        return (checks as CheckSearchResult[])
          .filter((c) => (c.checkNumber?.toLowerCase() || '').includes(query) && !alreadySelectedIds.has(c.id))
          .slice(0, 10)
          .map((c) => ({ id: c.id, name: c.checkNumber || 'Unknown Check', subtitle: c.status || undefined }));
      case 'FACTORY':
        return (factories as FactorySearchResult[])
          .filter((f) => (f.title?.toLowerCase() || '').includes(query) && !alreadySelectedIds.has(f.id))
          .slice(0, 10)
          .map((f) => ({ id: f.id, name: f.title || 'Unknown Factory' }));
      case 'CUSTOMER':
        return (customers as CustomerSearchResult[])
          .filter((c) => (c.companyName?.toLowerCase() || '').includes(query) && !alreadySelectedIds.has(c.id))
          .slice(0, 10)
          .map((c) => ({ id: c.id, name: c.companyName || 'Unknown Customer' }));
      case 'PRODUCT':
        return (products as ProductSearchResult[])
          .filter((p) => (p.factoryPartNumber?.toLowerCase() || '').includes(query) && !alreadySelectedIds.has(p.id))
          .slice(0, 10)
          .map((p) => ({ id: p.id, name: p.factoryPartNumber || 'Unknown Product' }));
      default:
        return [];
    }
  };

  const handleSelectEntity = (entity: { id: string; name: string }) => {
    if (!activeCategory) return;
    const newLink: SelectedLink = { id: entity.id, type: activeCategory, name: entity.name };
    if (!selectedLinks.some(l => l.id === entity.id && l.type === activeCategory)) {
      onLinksChange([...selectedLinks, newLink]);
    }
    setSearchQuery('');
  };

  const handleRemoveLink = (linkToRemove: SelectedLink) => {
    onLinksChange(selectedLinks.filter(l => !(l.id === linkToRemove.id && l.type === linkToRemove.type)));
  };

  const isCurrentTabLoading = (): boolean => {
    if (!activeCategory) return false;
    const loadingMap: Record<TabType, boolean> = {
      JOB: isLoadingJobs, COMPANY: isLoadingCompanies, CONTACT: isLoadingContacts,
      TASK: isLoadingTasks, PRE_OPPORTUNITY: isLoadingPreOpportunities, QUOTE: isLoadingQuotes,
      ORDER: isLoadingOrders, INVOICE: isLoadingInvoices, CHECK: isLoadingChecks,
      FACTORY: isLoadingFactories, CUSTOMER: isLoadingCustomers, PRODUCT: isLoadingProducts,
    };
    return loadingMap[activeCategory] || false;
  };

  const getLinksForCategory = (catId: TabType) => selectedLinks.filter(l => l.type === catId);

  const filteredEntities = getFilteredEntities();
  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  const dropdownContent = activeCategory && !disabled && dropdownPosition && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        maxHeight: DROPDOWN_HEIGHT,
        zIndex: 9999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col"
    >
      {/* Search header */}
      <div className="flex-shrink-0 p-3 border-b border-gray-100 bg-gray-50/50">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeCat?.label?.toLowerCase() || ''}...`}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isCurrentTabLoading() ? (
          <div className="px-4 py-6 text-center">
            <svg className="animate-spin w-5 h-5 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-xs text-gray-500">Loading...</p>
          </div>
        ) : filteredEntities.length > 0 ? (
          filteredEntities.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => handleSelectEntity(entity)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activeCat?.activeBg || 'bg-gray-100'} ${activeCat?.color || 'text-gray-600'}`}>
                {activeCat?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{entity.name}</p>
                {entity.subtitle && <p className="text-xs text-gray-500 truncate">{entity.subtitle}</p>}
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ))
        ) : (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400">
              {searchQuery ? 'No results found' : `No ${activeCat?.label?.toLowerCase() || 'items'} available`}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`${className}`} ref={containerRef}>
      {/* Selected links as tags */}
      {selectedLinks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedLinks.map((link) => {
            const colors = TYPE_COLORS[link.type] || { tag: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };
            const cat = CATEGORIES.find(c => c.id === link.type);
            return (
              <span
                key={`${link.type}-${link.id}`}
                className={`inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-xs font-medium ${colors.tag} transition-all`}
              >
                {cat?.icon}
                <span className="max-w-[140px] truncate">{link.name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(link)}
                    className="p-0.5 rounded-md hover:bg-black/10 transition-colors ml-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Category boxes grid */}
      {!disabled && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const linkCount = getLinksForCategory(cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={(e) => handleCategoryClick(cat.id, e.currentTarget)}
                className={`relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                  isActive
                    ? `${cat.activeBg} ${cat.borderColor} ${cat.color} ring-2 ring-offset-1 ring-blue-400`
                    : `${cat.bgColor} ${cat.borderColor} ${cat.color} hover:shadow-sm hover:scale-[1.02]`
                }`}
              >
                {cat.icon}
                <span className="truncate w-full text-center leading-tight" style={{ fontSize: '0.65rem' }}>{cat.label}</span>
                {linkCount > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${TYPE_COLORS[cat.id]?.dot || 'bg-gray-500'}`}>
                    {linkCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Dropdown Portal */}
      {isMounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}
