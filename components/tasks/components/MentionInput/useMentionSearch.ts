/**
 * Hook for parallel mention searches across Customer, Contact, Company, Factory
 */

import { useQuery } from '@tanstack/react-query';
import {
  searchCustomers,
  searchContacts,
  searchCompanies,
  searchFactories,
} from '../../../lib/api/search';
import type { MentionSearchResult, MentionType } from './types';

interface UseMentionSearchResult {
  results: MentionSearchResult[];
  isLoading: boolean;
}

export function useMentionSearch(
  searchTerm: string,
  enabled: boolean = true
): UseMentionSearchResult {
  // Run all 4 searches in parallel
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['mention-search', 'customers', searchTerm],
    queryFn: () => searchCustomers(searchTerm, true, 10),
    enabled: enabled && searchTerm.length >= 1,
    staleTime: 30000,
  });

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['mention-search', 'contacts', searchTerm],
    queryFn: () => searchContacts(searchTerm, 10),
    enabled: enabled && searchTerm.length >= 1,
    staleTime: 30000,
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['mention-search', 'companies', searchTerm],
    queryFn: () => searchCompanies(searchTerm, 10),
    enabled: enabled && searchTerm.length >= 1,
    staleTime: 30000,
  });

  const { data: factories = [], isLoading: loadingFactories } = useQuery({
    queryKey: ['mention-search', 'factories', searchTerm],
    queryFn: () => searchFactories(searchTerm, true, 10),
    enabled: enabled && searchTerm.length >= 1,
    staleTime: 30000,
  });

  // Transform and combine results
  const results: MentionSearchResult[] = [];

  // Add customers
  customers.slice(0, 5).forEach(c => {
    results.push({
      id: c.id,
      type: 'CUSTOMER' as MentionType,
      name: c.companyName || 'Unknown Customer',
      subtitle: c.isParent ? 'Parent Account' : undefined,
    });
  });

  // Add contacts
  contacts.slice(0, 5).forEach(c => {
    const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown Contact';
    results.push({
      id: c.id,
      type: 'CONTACT' as MentionType,
      name,
      subtitle: c.email || c.role || undefined,
    });
  });

  // Add companies
  companies.slice(0, 5).forEach(c => {
    results.push({
      id: c.id,
      type: 'COMPANY' as MentionType,
      name: c.name || 'Unknown Company',
      subtitle: c.companyType?.name || undefined,
    });
  });

  // Add factories
  factories.slice(0, 5).forEach(f => {
    results.push({
      id: f.id,
      type: 'FACTORY' as MentionType,
      name: f.title || 'Unknown Factory',
      subtitle: f.accountNumber || undefined,
    });
  });

  return {
    results,
    isLoading: loadingCustomers || loadingContacts || loadingCompanies || loadingFactories,
  };
}
