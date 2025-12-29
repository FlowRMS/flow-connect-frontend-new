"use client";

import React from "react";
import { Button } from "../ui/button.js";
import { Bell, Search, ArrowLeft, Columns2, FolderOpen, FileText } from "lucide-react";
import { useReportCacheActions } from "@/contexts/analytics/ReportCacheContext";
import { GlobalConfigManager } from "../table-config/GlobalConfigManager";
import { RequestReportModal } from "./RequestReportModal";
import { getUserInfoFromToken } from "@/lib/analytics/lib/auth";

export function Header({ onToggleSidebar }) {
  const { clearAllEntries } = useReportCacheActions();
  const [isConfigManagerOpen, setIsConfigManagerOpen] = React.useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(null);

  React.useEffect(() => {
    const info = getUserInfoFromToken();
    setUserInfo(info);
  }, []);

  const handleBackClick = React.useCallback(() => {
    clearAllEntries();
    window.location.href =
      process.env.NEXT_PUBLIC_LOGIN_URL || "https://app2.flowrms.com";
  }, [clearAllEntries]);

  return (
    <header className="flex h-16 bg-white shrink-0 items-center gap-4 border-b border-border px-4 md:px-6">
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-blue-600 hover:text-white rounded-md transition-colors"
          aria-label="Toggle sidebar"
        >
          <Columns2 />
        </button>

        <h1 className="text-lg md:text-xl font-semibold truncate">
         
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-9 bg-gray-50 w-9">
            <Search className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" className="h-9 bg-gray-50 w-9">
            <Bell className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={() => setIsRequestModalOpen(true)}
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-green-300 hover:bg-green-50 text-green-700 hover:text-green-800 flex"
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
          <span>Configs</span>
        </Button>

        <Button 
          onClick={handleBackClick}
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 border-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
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
    </header>
  );
}


