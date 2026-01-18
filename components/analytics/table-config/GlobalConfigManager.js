"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, Trash2, FolderOpen, Filter, BarChart3, Table2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { 
  fetchReportTemplates, 
  deleteReportTemplate as removeReportTemplate 
} from "@/lib/analytics/lib/reportTemplateManager";

// Map report types to display names and routes
const REPORT_TYPE_INFO = {
  "DASHBOARD_REPORT": {
    name: "Order Dashboard",
    icon: BarChart3,
    route: "/analytics/order-dashboard",
    color: "bg-purple-100 text-purple-700",
  },
  "PIVOT_ORDER_REPORT": {
    name: "Orders Pivot",
    icon: Table2,
    route: "/analytics/orders-pivot",
    color: "bg-blue-100 text-blue-700",
  },
  "COMMISSION_BY_STATE_REPORT": {
    name: "Commission by State Pivot",
    icon: Table2,
    route: "/analytics/commission-by-state-pivot",
    color: "bg-green-100 text-green-700",
  },
  "PIVOT_CHECK_REPORT": {
    name: "Check Pivot",
    icon: Table2,
    route: "/analytics/check-pivot",
    color: "bg-amber-100 text-amber-700",
  },
  "PIVOT_QUOTE_REPORT": {
    name: "Quote Pivot",
    icon: Table2,
    route: "/analytics/quote-pivot",
    color: "bg-indigo-100 text-indigo-700",
  },
  "PIVOT_INVOICE_REPORT": {
    name: "Invoice Pivot",
    icon: Table2,
    route: "/analytics/invoice-pivot",
    color: "bg-pink-100 text-pink-700",
  },
  "CHECK_DETAIL_REPORT": {
    name: "Check Detail",
    icon: FileText,
    route: "/analytics/check-detail",
    color: "bg-cyan-100 text-cyan-700",
  },
  "INVOICE_DETAIL_REPORT": {
    name: "Invoice Detail",
    icon: FileText,
    route: "/analytics/invoice-detail",
    color: "bg-rose-100 text-rose-700",
  },
  "ORDER_DETAIL_REPORT": {
    name: "Orders Detail",
    icon: FileText,
    route: "/analytics/orders-report",
    color: "bg-teal-100 text-teal-700",
  },
  "QUOTE_DETAIL_REPORT": {
    name: "Quote Detail",
    icon: FileText,
    route: "/analytics/quote-detail",
    color: "bg-violet-100 text-violet-700",
  },
  "ORDER_SPLIT_RATE_COMMISSION_REPORT": {
    name: "Order Split Rate Commission",
    icon: FileText,
    route: "/analytics/order-split-rate-commission-detail",
    color: "bg-orange-100 text-orange-700",
  },
};

/**
 * Global Config Manager Component
 * Shows all saved configurations across all pages from the database
 * Allows loading, deleting, and viewing configs
 */
export function GlobalConfigManager({ isOpen, onClose }) {
  const router = useRouter();
  const client = useApolloClient();
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteConfirmReportType, setDeleteConfirmReportType] = useState(null);
  const [selectedPage, setSelectedPage] = useState("all");
  const [allConfigs, setAllConfigs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load all configs from database when modal opens
  useEffect(() => {
    if (!isOpen || !client) return;

    let isMounted = true;
    setLoading(true);

    const loadAllConfigs = async () => {
      try {
        const configList = [];
        
        // Fetch templates for each report type
        const reportTypes = Object.keys(REPORT_TYPE_INFO);
        const fetchPromises = reportTypes.map(async (reportType) => {
          try {
            const templates = await fetchReportTemplates(client, reportType);
            return templates.map(template => ({
              ...template,
              reportTypeInfo: REPORT_TYPE_INFO[reportType],
            }));
          } catch (error) {
            console.warn(`Failed to load configs for ${reportType}:`, error);
            return [];
          }
        });

        const results = await Promise.all(fetchPromises);
        results.forEach(configs => configList.push(...configs));

        if (isMounted) {
          // Sort by creation date (most recent first)
          configList.sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bDate - aDate;
          });
          
          setAllConfigs(configList);
        }
      } catch (error) {
        console.error("Failed to load configurations:", error);
        if (isMounted) {
          setAllConfigs([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAllConfigs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, client]);

  // Filter by selected page
  const filteredConfigs = useMemo(() => {
    if (selectedPage === "all") return allConfigs;
    return allConfigs.filter((config) => config.reportType === selectedPage);
  }, [allConfigs, selectedPage]);

  // Get unique pages
  const pages = useMemo(() => {
    const uniqueReportTypes = new Set(allConfigs.map((config) => config.reportType));
    return Array.from(uniqueReportTypes).map((reportType) => ({
      id: reportType,
      ...REPORT_TYPE_INFO[reportType],
    })).filter(page => page.name); // Filter out unknown report types
  }, [allConfigs]);

  const handleDelete = async () => {
    if (deleteConfirmId && deleteConfirmReportType) {
      try {
        await removeReportTemplate(client, deleteConfirmId);
        
        // Remove from local state
        setAllConfigs(prev => prev.filter(config => config.id !== deleteConfirmId));
        
        setDeleteConfirmId(null);
        setDeleteConfirmReportType(null);
      } catch (error) {
        console.error("Error deleting config:", error);
      }
    }
  };

  const handleLoadConfig = (config) => {
    // Navigate to the page and let it load the config
    const route = config.reportTypeInfo?.route;
    if (!route) {
      console.error("No route found for config:", config);
      return;
    }
    
    // Store the config ID to load in sessionStorage
    sessionStorage.setItem("pendingConfigLoad", JSON.stringify({
      reportType: config.reportType,
      configId: config.id,
    }));
    
    router.push(route);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen size={24} className="text-blue-600" />
              Configuration Manager
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              View and manage all saved configurations across all pages
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Page Filter */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedPage("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                selectedPage === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              All Pages ({allConfigs.length})
            </button>
            {pages.map((page) => {
              const PageIcon = page.icon || Filter;
              const count = allConfigs.filter((c) => c.reportType === page.id).length;
              return (
                <button
                  key={page.id}
                  onClick={() => setSelectedPage(page.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                    selectedPage === page.id
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <PageIcon size={14} />
                  {page.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Loading configurations...</p>
            </div>
          ) : filteredConfigs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">No configurations found</p>
              <p className="text-sm mt-1">
                {selectedPage === "all"
                  ? "Save configurations on any page to see them here."
                  : "No configurations saved for this page yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConfigs.map((config) => {
                const Icon = config.reportTypeInfo?.icon || FileText;
                return (
                  <div
                    key={config.id}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition group"
                  >
                    {/* Page Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${config.reportTypeInfo?.color || 'bg-gray-100 text-gray-700'}`}>
                        <Icon size={12} />
                        {config.reportTypeInfo?.name || config.reportType}
                      </span>
                    </div>

                    {/* Config Name */}
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      {config.reportTemplateName}
                    </h4>

                    {/* Metadata */}
                    <div className="text-xs text-gray-500 mb-3">
                      <div>Saved: {config.createdAt ? new Date(config.createdAt).toLocaleString() : 'Unknown'}</div>
                    </div>

                    {/* Config Details */}
                    <div className="mb-3 flex flex-wrap gap-1">
                      {config.parsedConfig && typeof config.parsedConfig === 'object' && (
                        <>
                          {config.parsedConfig.advancedFilters && Object.keys(config.parsedConfig.advancedFilters).length > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              Advanced Filters ({Object.keys(config.parsedConfig.advancedFilters).length})
                            </span>
                          )}
                          {config.parsedConfig.dateRange && (config.parsedConfig.dateRange.startDate || config.parsedConfig.dateRange.endDate) && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                              Date Range
                            </span>
                          )}
                          {config.parsedConfig.config && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                              Column Layout
                            </span>
                          )}
                          {config.parsedConfig.pivot && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                              Pivot Config
                            </span>
                          )}
                          {config.parsedConfig.dashboard && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                              Dashboard State
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadConfig(config)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md font-medium transition"
                      >
                        Load & Go
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmId(config.id);
                          setDeleteConfirmReportType(config.reportType);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredConfigs.length} configuration{filteredConfigs.length !== 1 ? "s" : ""} shown
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Configuration?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this configuration? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmReportType(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

