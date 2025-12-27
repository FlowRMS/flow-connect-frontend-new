'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  useCustomerSearch,
  useUserSearch,
  useFactorySearch,
  useProductSearch,
  type CustomerSearchResult,
  type UserSearchResult,
  type FactorySearchResult,
  type ProductSearchResult,
} from '../api';

interface DropdownOption {
  id: string;
  label: string;
  sublabel?: string;
}

/**
 * Hook for customer search dropdown
 * Used for Sold To, Bill To, and End User fields
 */
export function useCustomerSearchDropdown() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: customers, isLoading, error } = useCustomerSearch(searchTerm, true);

  const options: DropdownOption[] = useMemo(() => {
    if (!customers) return [];
    return customers.map((customer: CustomerSearchResult) => ({
      id: customer.id,
      label: customer.companyName || '',
      sublabel: customer.isParent ? 'Parent Company' : undefined,
    }));
  }, [customers]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return {
    options,
    isLoading,
    error,
    onSearch: handleSearch,
    searchTerm,
  };
}

/**
 * Hook for user search dropdown (inside/outside reps)
 */
export function useRepSearchDropdown(isInside?: boolean) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: users, isLoading, error } = useUserSearch(searchTerm, isInside, true);

  const options: DropdownOption[] = useMemo(() => {
    if (!users) return [];
    return users.map((user: UserSearchResult) => ({
      id: user.id,
      label: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '',
      sublabel: user.email || undefined,
    }));
  }, [users]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return {
    options,
    isLoading,
    error,
    onSearch: handleSearch,
    searchTerm,
  };
}

/**
 * Hook for factory/manufacturer search dropdown
 */
export function useFactorySearchDropdown() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: factories, isLoading, error } = useFactorySearch(searchTerm, true);

  const options: DropdownOption[] = useMemo(() => {
    if (!factories) return [];
    return factories.map((factory: FactorySearchResult) => ({
      id: factory.id,
      label: factory.title || '',
      sublabel: factory.accountNumber || undefined,
    }));
  }, [factories]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return {
    options,
    isLoading,
    error,
    onSearch: handleSearch,
    searchTerm,
  };
}

/**
 * Hook for product search dropdown
 */
export function useProductSearchDropdown(factoryId?: string) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: products, isLoading, error } = useProductSearch(searchTerm, factoryId, true);

  const options: DropdownOption[] = useMemo(() => {
    if (!products) return [];
    return products.map((product: ProductSearchResult) => ({
      id: product.id,
      label: product.factoryPartNumber || product.description || '',
      sublabel: product.description || undefined,
    }));
  }, [products]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return {
    options,
    isLoading,
    error,
    onSearch: handleSearch,
    searchTerm,
  };
}
