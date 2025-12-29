"use client";

import React from "react";
import { Button } from "@/components/analytics/ui/button";
import { FolderOpen, FileText, RefreshCw } from "lucide-react";
import { useReportCacheActions } from "@/contexts/analytics/ReportCacheContext";
import { GlobalConfigManager } from "@/components/analytics/table-config/GlobalConfigManager";
import { RequestReportModal } from "@/components/analytics/layout/RequestReportModal";
import { getUserInfoFromToken } from "@/lib/analytics/lib/auth";

/**
 * Analytics Toolbar Component
 * 
 * Provides analytics-specific actions like:
 * - Request Report button
 * - Manage Configs button
 * - Clear Cache button
 */
export function AnalyticsToolbar() {
  const { clearAllEntries } = useReportCacheActions();
  const [isConfigManagerOpen, setIsConfigManagerOpen] = React.useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState<{ name?: string; email?: string } | null>(null);

  React.useEffect(() => {
    const info = getUserInfoFromToken();
    setUserInfo(info);
  }, []);

  const handleClearCache = React.useCallback(() => {
    clearAllEntries();
    window.location.reload();
  }, [clearAllEntries]);

  return (
    <>
      <div className="flex items-center justify-end gap-3 px-6 py-3 bg-white border-b border-gray-200">
        <Button
          onClick={() => setIsRequestModalOpen(true)}
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-green-300 hover:bg-green-50 text-green-700 hover:text-green-800"
        >
          <FileText className="h-4 w-4" />
          <span>Request Report</span>
        </Button>

        <Button
          onClick={() => setIsConfigManagerOpen(true)}
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-blue-300 hover:bg-blue-50 text-blue-700 hover:text-blue-800"
        >
          <FolderOpen className="h-4 w-4" />
          <span>Manage Configs</span>
        </Button>

        <Button
          onClick={handleClearCache}
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-gray-300 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Clear Cache</span>
        </Button>
      </div>

      <GlobalConfigManager
        isOpen={isConfigManagerOpen}
        onClose={() => setIsConfigManagerOpen(false)}
      />

      <RequestReportModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        userInfo={userInfo}
      />
    </>
  );
}

export default AnalyticsToolbar;
