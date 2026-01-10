/**
 * useAutoPopulateReps Hook
 * Shared utility for auto-populating inside/outside reps from customer and factory data
 * Used in both Orders and Quotes
 */

import { useState, useCallback } from 'react';
import { fetchCustomerById } from '@/components/customers/api/customersApi';
import { fetchFactoryById } from '@/components/warehouse/api/factoriesApi';

// Types for split rates
export interface RepSplitRate {
  id: string;
  userId: string;
  userName: string;
  splitRate: string;
  position: number;
}

// Unified type for order/quote split rates that can be sent to API
export interface ApiSplitRate {
  id?: string;
  userId: string;
  splitRate: string;
  position: number;
}

interface UseAutoPopulateRepsReturn {
  // Loading states
  isLoadingCustomerReps: boolean;
  isLoadingFactoryReps: boolean;

  // Fetch functions
  fetchOutsideRepsFromCustomer: (customerId: string) => Promise<RepSplitRate[]>;
  fetchInsideRepsFromFactory: (factoryId: string) => Promise<RepSplitRate[]>;

  // Helper to convert to API format
  toApiSplitRates: (reps: RepSplitRate[]) => ApiSplitRate[];
}

/**
 * Hook for auto-populating inside/outside reps from customer and factory data
 */
export function useAutoPopulateReps(): UseAutoPopulateRepsReturn {
  const [isLoadingCustomerReps, setIsLoadingCustomerReps] = useState(false);
  const [isLoadingFactoryReps, setIsLoadingFactoryReps] = useState(false);

  /**
   * Fetch outside reps from a customer
   * Customer -> outsideReps[]
   */
  const fetchOutsideRepsFromCustomer = useCallback(async (customerId: string): Promise<RepSplitRate[]> => {
    if (!customerId) return [];

    setIsLoadingCustomerReps(true);
    try {
      const customer = await fetchCustomerById(customerId);
      if (!customer || !customer.outsideReps || customer.outsideReps.length === 0) {
        return [];
      }

      // Map customer outside reps to our format
      const reps: RepSplitRate[] = customer.outsideReps.map((rep, idx) => ({
        id: rep.id || crypto.randomUUID(),
        userId: rep.userId,
        userName: rep.user?.fullName || `${rep.user?.firstName || ''} ${rep.user?.lastName || ''}`.trim() || '',
        splitRate: rep.splitRate || '100',
        position: rep.position || idx + 1,
      }));

      // If only one rep, ensure split rate is 100
      if (reps.length === 1) {
        reps[0].splitRate = '100';
      }

      return reps;
    } catch (error) {
      console.error('Failed to fetch customer outside reps:', error);
      return [];
    } finally {
      setIsLoadingCustomerReps(false);
    }
  }, []);

  /**
   * Fetch inside reps from a factory
   * Factory -> splitRates[] (these are inside reps)
   */
  const fetchInsideRepsFromFactory = useCallback(async (factoryId: string): Promise<RepSplitRate[]> => {
    if (!factoryId) return [];

    setIsLoadingFactoryReps(true);
    try {
      const factory = await fetchFactoryById(factoryId);
      if (!factory || !factory.splitRates || factory.splitRates.length === 0) {
        return [];
      }

      // Map factory split rates to our format
      const reps: RepSplitRate[] = factory.splitRates.map((rep, idx) => ({
        id: rep.id || crypto.randomUUID(),
        userId: rep.user?.id || '',
        userName: rep.user?.fullName || `${rep.user?.firstName || ''} ${rep.user?.lastName || ''}`.trim() || '',
        splitRate: rep.splitRate || '100',
        position: rep.position || idx + 1,
      }));

      // If only one rep, ensure split rate is 100
      if (reps.length === 1) {
        reps[0].splitRate = '100';
      }

      return reps;
    } catch (error) {
      console.error('Failed to fetch factory inside reps:', error);
      return [];
    } finally {
      setIsLoadingFactoryReps(false);
    }
  }, []);

  /**
   * Convert RepSplitRate[] to API format
   */
  const toApiSplitRates = useCallback((reps: RepSplitRate[]): ApiSplitRate[] => {
    return reps.map((rep, idx) => ({
      id: rep.id.includes('-') ? undefined : rep.id, // Only include id if it's not a UUID we generated
      userId: rep.userId,
      splitRate: rep.splitRate,
      position: idx + 1,
    }));
  }, []);

  return {
    isLoadingCustomerReps,
    isLoadingFactoryReps,
    fetchOutsideRepsFromCustomer,
    fetchInsideRepsFromFactory,
    toApiSplitRates,
  };
}

export default useAutoPopulateReps;
