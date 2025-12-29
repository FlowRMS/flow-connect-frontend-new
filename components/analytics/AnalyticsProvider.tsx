"use client";

import React from "react";
import { ApolloProvider } from "@apollo/client/react";
import client from "@/lib/analytics/apolloClient";
import { ReportCacheProvider } from "@/contexts/analytics/ReportCacheContext";
import { Toaster } from "@/components/analytics/ui/toaster";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

/**
 * Analytics Provider
 * 
 * Wraps analytics pages with necessary providers:
 * - Apollo Client for GraphQL
 * - Report Cache for caching analytics data
 * - Toaster for notifications
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  return (
    <ApolloProvider client={client}>
      <ReportCacheProvider>
        {children}
        <Toaster />
      </ReportCacheProvider>
    </ApolloProvider>
  );
}

export default AnalyticsProvider;
