"use client";

import React from "react";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { AnalyticsToolbar } from "@/components/analytics/AnalyticsToolbar";
import "@/app/analytics-styles/pivot-table.css";
import "@/app/analytics-styles/revogrid-scoped.css";

interface AnalyticsLayoutClientProps {
  children: React.ReactNode;
}

/**
 * Analytics Layout Client Component
 * 
 * This component wraps analytics pages with the necessary providers
 * and styling. It integrates seamlessly with the main CRM layout,
 * using the CRM's sidebar and topbar instead of the standalone analytics ones.
 */
export function AnalyticsLayoutClient({ children }: AnalyticsLayoutClientProps) {
  return (
    <AnalyticsProvider>
      <div className="analytics-content flex-1 min-h-0 overflow-auto bg-[var(--background)]">
        <AnalyticsToolbar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </AnalyticsProvider>
  );
}

export default AnalyticsLayoutClient;
