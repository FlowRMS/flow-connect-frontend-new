'use client';

import { useQuery } from '@tanstack/react-query';
import type { FactorySearchResult, CustomerSearchResult } from '../api';
import { searchFactories, searchCustomers } from '../api';
import { productQueryKeys } from './queryKeys';

export function useFactorySearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<FactorySearchResult[], Error>({
    queryKey: productQueryKeys.factorySearch(searchTerm || ''),
    queryFn: () => searchFactories(searchTerm || '', true),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}

export function useCustomerSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery<CustomerSearchResult[], Error>({
    queryKey: productQueryKeys.customerSearch(searchTerm || ''),
    queryFn: () => searchCustomers(searchTerm || '', true),
    enabled: enabled,
    staleTime: 30 * 1000,
  });
}
