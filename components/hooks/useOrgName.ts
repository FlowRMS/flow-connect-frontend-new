"use client";

import { useState, useEffect } from "react";

/**
 * Decode JWT token payload without verification
 * We only need to read the org_name claim
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    // Handle URL-safe base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

interface OrgInfo {
  orgName: string | null;
  orgId: string | null;
  role: string | null;
  isLoading: boolean;
}

/**
 * Hook to extract organization info from the WorkOS JWT token
 */
export function useOrgName(): OrgInfo {
  const [orgInfo, setOrgInfo] = useState<OrgInfo>({
    orgName: null,
    orgId: null,
    role: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchOrgInfo() {
      try {
        const response = await fetch("/api/auth/token");
        if (!response.ok) {
          if (isMounted) {
            setOrgInfo((prev) => ({ ...prev, isLoading: false }));
          }
          return;
        }

        const data = await response.json();
        const accessToken = data.accessToken;

        if (!accessToken) {
          if (isMounted) {
            setOrgInfo((prev) => ({ ...prev, isLoading: false }));
          }
          return;
        }

        const payload = decodeJwtPayload(accessToken);

        if (isMounted) {
          setOrgInfo({
            orgName: (payload?.org_name as string) || null,
            orgId: (payload?.org_id as string) || null,
            role: (payload?.role as string) || null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("[useOrgName] Failed to fetch org info:", error);
        if (isMounted) {
          setOrgInfo((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }

    fetchOrgInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  return orgInfo;
}
