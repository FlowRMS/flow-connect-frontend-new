"use client";

import { useState, useEffect } from "react";
import { fetchOrganization, type Organization } from "../lib/graphql/organization";
import { getFilePresignedUrl } from "../lib/graphql/files";

interface OrganizationInfo {
  organization: Organization | null;
  logoUrl: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch organization data including logo URL
 */
export function useOrganization(): OrganizationInfo {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganization = async () => {
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
    } catch (err) {
      console.error("Failed to load organization:", err);
      setError(err instanceof Error ? err.message : "Failed to load organization");
      setOrganization(null);
      setLogoUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrganization();
  }, []);

  return {
    organization,
    logoUrl,
    isLoading,
    error,
    refetch: loadOrganization,
  };
}
