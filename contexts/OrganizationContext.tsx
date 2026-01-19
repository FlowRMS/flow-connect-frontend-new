'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchOrganization, type Organization } from '@/components/lib/graphql/organization';
import { getFilePresignedUrl } from '@/components/lib/graphql/files';

interface OrganizationContextType {
  organization: Organization | null;
  logoUrl: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const loadOrganization = useCallback(async () => {
    // Prevent duplicate fetches
    if (hasFetched && !error) return;

    setIsLoading(true);
    setError(null);

    try {
      const org = await fetchOrganization();
      setOrganization(org);

      // If organization has a logo, fetch the presigned URL
      if (org?.logoFileId) {
        try {
          const url = await getFilePresignedUrl(org.logoFileId);
          setLogoUrl(url);
        } catch (logoError) {
          console.error("Failed to load logo URL:", logoError);
          setLogoUrl(null);
        }
      } else {
        setLogoUrl(null);
      }
      setHasFetched(true);
    } catch (err) {
      console.error("Failed to load organization:", err);
      setError(err instanceof Error ? err.message : "Failed to load organization");
      setOrganization(null);
      setLogoUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [hasFetched, error]);

  // Force refetch function (bypasses hasFetched check)
  const refetch = useCallback(async () => {
    setHasFetched(false);
    setIsLoading(true);
    setError(null);

    try {
      const org = await fetchOrganization();
      setOrganization(org);

      if (org?.logoFileId) {
        try {
          const url = await getFilePresignedUrl(org.logoFileId);
          setLogoUrl(url);
        } catch (logoError) {
          console.error("Failed to load logo URL:", logoError);
          setLogoUrl(null);
        }
      } else {
        setLogoUrl(null);
      }
      setHasFetched(true);
    } catch (err) {
      console.error("Failed to load organization:", err);
      setError(err instanceof Error ? err.message : "Failed to load organization");
      setOrganization(null);
      setLogoUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  return (
    <OrganizationContext.Provider value={{
      organization,
      logoUrl,
      isLoading,
      error,
      refetch,
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}
