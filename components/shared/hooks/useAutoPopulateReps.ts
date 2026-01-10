/**
 * useAutoPopulateReps Hook
 * Shared utility for auto-populating inside/outside reps from customer and factory data
 * Used in both Orders and Quotes
 */

import { useState, useCallback } from 'react';
import { fetchCustomerById } from '@/components/customers/api/customersApi';
import { fetchFactoryById } from '@/components/warehouse/api/factoriesApi';
import { fetchUser } from '@/components/lib/graphql/users';

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
      // Fetch user details for each rep if not already populated
      const reps: RepSplitRate[] = await Promise.all(
        customer.outsideReps.map(async (rep, idx) => {
          let userName = rep.user?.fullName || `${rep.user?.firstName || ''} ${rep.user?.lastName || ''}`.trim();

          // If userName is empty and we have userId, fetch user details
          if (!userName && rep.userId) {
            try {
              const user = await fetchUser(rep.userId);
              if (user) {
                userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
              }
            } catch (err) {
              console.warn('Failed to fetch user details for rep:', rep.userId, err);
            }
          }

          return {
            id: rep.id || crypto.randomUUID(),
            userId: rep.userId,
            userName: userName || '',
            splitRate: rep.splitRate || '100',
            position: rep.position || idx + 1,
          };
        })
      );

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
      // Fetch user details for each rep if not already populated
      const reps: RepSplitRate[] = await Promise.all(
        factory.splitRates.map(async (rep, idx) => {
          const userId = rep.user?.id || '';
          let userName = rep.user?.fullName || `${rep.user?.firstName || ''} ${rep.user?.lastName || ''}`.trim();

          // If userName is empty and we have userId, fetch user details
          if (!userName && userId) {
            try {
              const user = await fetchUser(userId);
              if (user) {
                userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
              }
            } catch (err) {
              console.warn('Failed to fetch user details for rep:', userId, err);
            }
          }

          return {
            id: rep.id || crypto.randomUUID(),
            userId,
            userName: userName || '',
            splitRate: rep.splitRate || '100',
            position: rep.position || idx + 1,
          };
        })
      );

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
