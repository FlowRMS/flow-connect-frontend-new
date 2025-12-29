"use client";

import { useQuoteDetailSubscription } from "@/lib/analytics/hooks/useQuoteDetailSubscription";
import React from "react";
import { useApolloClient } from "@apollo/client/react";
import { quoteDetailReportColumns } from "./column";
import { DataGrid } from "@/components/analytics/rv-grid/rv-grid.js";
import { Loader2, ChevronDown, FileSpreadsheet, FileText, ArrowUpDown } from "lucide-react";
import { ColumnConfigPopover } from "@/components/analytics/table-config/ColumnConfigPopover";
import { DetailConfigManagerStandard } from "@/components/analytics/table-config/DetailConfigManagerStandard";
import { useColumnConfig } from "@/lib/analytics/hooks/useColumnConfig";
import { useSkeletonConfig } from "@/lib/analytics/hooks/useAdvancedLoading";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
import { FilterPane } from "@/components/analytics/filters/FilterPane";
import { ActiveFilters } from "@/components/analytics/filters/ActiveFilters";
import { exportGridCsv, exportGridXlsx, exportGridXlsxWithHeaders } from "@/lib/analytics/utils/exportGridCsv";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/analytics/ui/dropdown-menu";
import { SortingConfigModal } from "@/components/analytics/table-config/SortingConfigModal";
import {
  fetchReportTemplates,
  upsertReportTemplate,
  deleteReportTemplate as removeReportTemplate,
} from "@/lib/analytics/lib/reportTemplateManager";
import {
  normalizeDetailTemplate,
  buildDetailConfigPayload,
} from "@/lib/analytics/lib/detailReportTemplateUtils";
import { FullScreenModal, ExpandButton } from "@/components/analytics/ui/FullScreenModal";
import { RefreshButton } from "@/components/analytics/ui/RefreshButton";

// Percentage cell formatter
const percentageCell = (h, { value }) =>
  h(
    "span",
    {
      style: {
        textAlign: "right",
        display: "block",
        fontVariantNumeric: "tabular-nums",
      },
    },
    typeof value === "number" ? `${value.toFixed(2)}%` : value
  );

const percentageFormatter = (value) => typeof value === "number" ? `${value.toFixed(2)}%` : value;

const REPORT_TYPE = "QUOTE_DETAIL_REPORT";
const TABLE_ID = "quote-detail";

export function QuoteDetailReportGrid() {
  // Date range state
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [filterByDate, setFilterByDate] = React.useState("ENTITY_DATE");
  
  // Advanced filter state
  const [advancedFilters, setAdvancedFilters] = React.useState({});
  
  // Sorting state
  const [sorting, setSorting] = React.useState([]);
  const [isSortModalOpen, setIsSortModalOpen] = React.useState(false);

  // Full-screen modal state
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const {
    rows,
    error,
    isFetching,
    initialLoading,
    cacheKey,
    lastUpdated,
    resetCache,
    hasCachedData,
  } = useQuoteDetailSubscription(null, startDate, endDate, filterByDate);
  const [grouping] = React.useState(false);
  const [groupBy] = React.useState("");
  const {
    columns: configuredColumns,
    allColumns,
    config,
    applyConfig,
    setOrder,
    toggleHidden,
    setPin,
    resetToBase,
    saveNow,
    reloadFromStorage,
  } = useColumnConfig("columns.quote_detail.v1", quoteDetailReportColumns);
  const skeletonConfig = useSkeletonConfig("orders-report");
  const client = useApolloClient();
  const [savedConfigs, setSavedConfigs] = React.useState([]);
  const savedConfigsRef = React.useRef([]);
  const appliedDefaultIdRef = React.useRef(null);
  const [isHydrated, setIsHydrated] = React.useState(false);

  const columnsWithTemplates = React.useMemo(() => {
    return configuredColumns.map((col) => {
      if (col.prop === "outsideRepSplitRate") {
        return { ...col, cellTemplate: percentageCell, formatter: percentageFormatter };
      }
      return col;
    });
  }, [configuredColumns]);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      try {
        const templates = await fetchReportTemplates(client, REPORT_TYPE);
        if (!isMounted) return;

        const normalized = templates
          .map((template) => normalizeDetailTemplate(template))
          .filter(Boolean)
          .sort((a, b) => b.timestamp - a.timestamp);

        setSavedConfigs(normalized);
      } catch (error) {
        if (isMounted) {
          console.error("[QuoteDetailReportGrid] Failed to load saved configs", error);
        }
      }
    };

    if (client) {
      loadTemplates();
    }

    return () => {
      isMounted = false;
    };
  }, [client]);

  React.useEffect(() => {
    savedConfigsRef.current = savedConfigs;
  }, [savedConfigs]);

  const defaultConfigId = React.useMemo(() => {
    const defaultEntry = savedConfigs.find((entry) => entry.isDefault);
    return defaultEntry ? defaultEntry.id : null;
  }, [savedConfigs]);

  const getConfigs = React.useCallback(() => savedConfigs, [savedConfigs]);

  const saveConfig = React.useCallback(
    async (name, additionalState) => {
      const trimmed = typeof name === "string" ? name.trim() : "";
      if (!trimmed) return null;

      try {
        const payload = buildDetailConfigPayload({
          name: trimmed,
          config,
          advancedFilters: additionalState?.advancedFilters,
          dateRange: additionalState?.dateRange,
          sorting: additionalState?.sorting,
        });

        const template = await upsertReportTemplate(client, {
          name: trimmed,
          config: payload,
          reportType: REPORT_TYPE,
        });

        const normalized = template
          ? normalizeDetailTemplate(template)
          : null;

        if (!normalized) return null;

        setSavedConfigs((prev) => {
          const filtered = prev.filter((entry) => entry.id !== normalized.id);
          return [normalized, ...filtered].sort((a, b) => b.timestamp - a.timestamp);
        });

        return normalized.id;
      } catch (error) {
        console.error("[QuoteDetailReportGrid] Failed to save config", error);
        return null;
      }
    },
    [client, config]
  );

  const loadConfig = React.useCallback(
    async (id) => {
      const entry = savedConfigsRef.current.find((item) => item.id === id);
      if (!entry) return null;
      try {
        applyConfig(entry.config);
      } catch (error) {
        console.error("[QuoteDetailReportGrid] Failed to apply config", error);
        return null;
      }
      return entry;
    },
    [applyConfig]
  );

  const deleteConfig = React.useCallback(
    async (id) => {
      try {
        await removeReportTemplate(client, id);
        setSavedConfigs((prev) => prev.filter((entry) => entry.id !== id));
        return true;
      } catch (error) {
        console.error("[QuoteDetailReportGrid] Failed to delete config", error);
        return false;
      }
    },
    [client]
  );

  const setDefaultConfig = React.useCallback(
    async (nextId) => {
      const entries = savedConfigsRef.current;
      const currentDefault = entries.find((entry) => entry.isDefault);
      const nextDefault = nextId
        ? entries.find((entry) => entry.id === nextId)
        : null;

      const updates = [];

      if (currentDefault && (!nextId || currentDefault.id !== nextId)) {
        updates.push({ entry: currentDefault, makeDefault: false });
      }

      if (nextId) {
        if (!nextDefault) {
          console.warn("[QuoteDetailReportGrid] Unable to find template to mark as default", nextId);
          return;
        }
        if (!nextDefault.isDefault) {
          updates.push({ entry: nextDefault, makeDefault: true });
        }
      }

      if (updates.length === 0) {
        return;
      }

      try {
        const results = await Promise.all(
          updates.map(async ({ entry, makeDefault }) => {
            const payload = buildDetailConfigPayload({
              name: entry.name,
              config: entry.config,
              advancedFilters: entry.advancedFilters,
              dateRange: entry.dateRange,
              sorting: entry.sorting,
              isDefault: makeDefault,
              timestamp: entry.timestamp,
            });

            const template = await upsertReportTemplate(client, {
              id: entry.id,
              name: entry.name,
              config: payload,
              reportType: REPORT_TYPE,
            });

            return template ? normalizeDetailTemplate(template) : null;
          })
        );

        setSavedConfigs((prev) => {
          const updated = new Map(prev.map((entry) => [entry.id, entry]));
          results.forEach((result) => {
            if (result) {
              updated.set(result.id, result);
            }
          });
          return Array.from(updated.values()).sort((a, b) => b.timestamp - a.timestamp);
        });
      } catch (error) {
        console.error("[QuoteDetailReportGrid] Failed to update default config", error);
        throw error;
      }
    },
    [client]
  );

  const getDefaultConfigId = React.useCallback(() => defaultConfigId, [defaultConfigId]);

  const isDefaultConfig = React.useCallback(
    (id) => Boolean(defaultConfigId) && defaultConfigId === id,
    [defaultConfigId]
  );

  const gridRows = React.useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        detailTotalFmt:
          typeof r.detailTotal === "number"
            ? r.detailTotal.toFixed(2)
            : r.detailTotal,
        unitPriceFmt:
          typeof r.unitPrice === "number"
            ? r.unitPrice.toFixed(2)
            : r.unitPrice,
        quantityFmt:
          typeof r.quantity === "number"
            ? r.quantity.toString()
            : r.quantity,
        commissionFmt:
          typeof r.commission === "number"
            ? r.commission.toFixed(2)
            : r.commission,
        outsideRepCommissionFmt:
          typeof r.outsideRepCommission === "number"
            ? r.outsideRepCommission.toFixed(2)
            : r.outsideRepCommission,
        outsideRepSplitRateFmt:
          typeof r.outsideRepSplitRate === "number"
            ? `${r.outsideRepSplitRate.toFixed(2)}%`
            : r.outsideRepSplitRate,
        outsideRepTotalPortionFmt:
          typeof r.outsideRepTotalPortion === "number"
            ? r.outsideRepTotalPortion.toFixed(2)
            : r.outsideRepTotalPortion,
      })),
    [rows]
  );

  // Apply advanced filters to grid rows
  const filteredGridRows = React.useMemo(() => {
    let filtered = [...gridRows];

    // Apply year filter
    if (advancedFilters._year && advancedFilters._year !== "all") {
      const currentYear = new Date().getFullYear();
      let yearThreshold;

      switch (advancedFilters._year) {
        case "current":
          yearThreshold = currentYear;
          break;
        case "last":
          yearThreshold = currentYear - 1;
          break;
        case "last2":
          yearThreshold = currentYear - 2;
          break;
        case "last3":
          yearThreshold = currentYear - 3;
          break;
        default:
          yearThreshold = null;
      }

      if (yearThreshold) {
        filtered = filtered.filter((row) => {
          // Check entry date only
          const dateStr = row.entryDate;
          if (!dateStr) return false;
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return false;
          const year = date.getFullYear();
          if (advancedFilters._year === "current") {
            return year === currentYear;
          } else {
            return year >= yearThreshold;
          }
        });
      }
    }

    // Apply column filters
    Object.keys(advancedFilters).forEach((columnProp) => {
      if (columnProp === "_year") return;
      
      const selectedValues = advancedFilters[columnProp];
      if (selectedValues && selectedValues.length > 0) {
        filtered = filtered.filter((row) => {
          const value = row[columnProp];
          return selectedValues.includes(String(value));
        });
      }
    });

    return filtered;
  }, [gridRows, advancedFilters]);

  // Apply sorting to filtered data
  const sortedData = React.useMemo(() => {
    if (!sorting || sorting.length === 0) {
      return filteredGridRows;
    }

    const dataToSort = [...filteredGridRows];

    dataToSort.sort((a, b) => {
      for (const sort of sorting) {
        const { prop, order } = sort;
        const aVal = a[prop];
        const bVal = b[prop];

        let comparison = 0;

        // Handle null/undefined
        if (aVal == null && bVal == null) continue;
        if (aVal == null) return order === 'asc' ? 1 : -1;
        if (bVal == null) return order === 'asc' ? -1 : 1;

        // Handle numbers
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          // Handle strings
          const aStr = String(aVal).toLowerCase();
          const bStr = String(bVal).toLowerCase();
          comparison = aStr.localeCompare(bStr);
        }

        if (comparison !== 0) {
          return order === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });

    return dataToSort;
  }, [filteredGridRows, sorting]);

  const showFetching = isHydrated && isFetching && rows.length === 0;

  const handleExportCsv = React.useCallback(() => {
    exportGridCsv({
      filename: "quote-detail",
      columns: columnsWithTemplates,
      rows: sortedData,
    });
  }, [columnsWithTemplates, sortedData]);

  const handleExportXlsx = React.useCallback(() => {
    void exportGridXlsx({
      filename: "quote-detail",
      columns: columnsWithTemplates,
      rows: sortedData,
      sheetName: "Quote Detail",
    });
  }, [columnsWithTemplates, sortedData]);

  const handleExportXlsxWithHeaders = React.useCallback(() => {
    void exportGridXlsxWithHeaders({
      filename: "quote-detail-with-headers",
      columns: columnsWithTemplates,
      rows: sortedData,
      sheetName: "Quote Detail",
      filters: advancedFilters,
      dateRange: { startDate, endDate },
      sorting: sorting,
      reportTitle: "Quote Detail Report"
    });
  }, [columnsWithTemplates, sortedData, advancedFilters, startDate, endDate, sorting]);

  const handleClearDates = React.useCallback(() => {
    setStartDate("");
    setEndDate("");
    setFilterByDate("ENTITY_DATE");
  }, []);

  const handleClearFilters = React.useCallback(() => {
    setAdvancedFilters({});
  }, []);

  // Handle loading a config with filters
  const handleLoadConfig = React.useCallback((config) => {
    // Restore advanced filters if they exist
    if (config.advancedFilters) {
      setAdvancedFilters(config.advancedFilters);
    }
    // Restore date range if it exists
    if (config.dateRange) {
      if (config.dateRange.startDate !== undefined) {
        setStartDate(config.dateRange.startDate || "");
      }
      if (config.dateRange.endDate !== undefined) {
        setEndDate(config.dateRange.endDate || "");
      }
    }
    // Restore sorting if it exists
    if (config.sorting) {
      setSorting(config.sorting);
    }
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;

    const defaultEntry = savedConfigs.find((entry) => entry.isDefault);

    if (!defaultEntry) {
      appliedDefaultIdRef.current = null;
      return;
    }

    if (appliedDefaultIdRef.current === defaultEntry.id) {
      return;
    }

    const loadDefault = async () => {
      const entry = await loadConfig(defaultEntry.id);
      if (entry) {
        handleLoadConfig(entry);
        appliedDefaultIdRef.current = entry.id;
      }
    };

    void loadDefault();
  }, [isHydrated, savedConfigs, loadConfig, handleLoadConfig]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const pendingLoadRaw = sessionStorage.getItem("pendingConfigLoad");
      if (!pendingLoadRaw) return;

      const pendingLoad = JSON.parse(pendingLoadRaw);
      
      // Handle both old format (tableId) and new format (reportType)
      const isMatch = (pendingLoad.tableId === TABLE_ID) || (pendingLoad.reportType === REPORT_TYPE);
      if (!isMatch) return;

      const configId = pendingLoad.configId;
      const entry = savedConfigs.find((item) => item.id === configId);
      if (!entry) return;

      sessionStorage.removeItem("pendingConfigLoad");

      const loadPending = async () => {
        const loaded = await loadConfig(configId);
        if (loaded) {
          handleLoadConfig(loaded);
        }
      };

      void loadPending();
    } catch (error) {
      console.error("[QuoteDetailReportGrid] Error loading pending config:", error);
      sessionStorage.removeItem("pendingConfigLoad");
    }
  }, [savedConfigs, loadConfig, handleLoadConfig]);

  // Handle sorting changes from the modal
  const handleSortingApply = React.useCallback((newSorting) => {
    setSorting(newSorting);
  }, []);

  const handleApplyDateFilter = React.useCallback(({ startDate: newStart, endDate: newEnd, filterByDate: newFilterByDate }) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    setFilterByDate(newFilterByDate);
  }, []);

  return (
    <div className=" px-4 py-4 space-y-8">
      <div className="flex flex-wrap gap-4 items-start">
        <div className="flex-1 min-w-0">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={handleClearDates}
            pageKey="quote-detail"
            filterByDate={filterByDate}
            onFilterByDateChange={setFilterByDate}
            onApply={handleApplyDateFilter}
            appliedStartDate={startDate}
            appliedEndDate={endDate}
            appliedFilterByDate={filterByDate}
          />
        </div>
        <div className="flex items-start pt-4">
          <FilterPane
            columns={quoteDetailReportColumns}
            visibleColumns={configuredColumns}
            data={gridRows}
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            onClear={handleClearFilters}
            cacheKey={cacheKey}
            dataVersion={lastUpdated}
            showYearFilter={true}
            maxFiltersPerRow={4}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {(Object.keys(advancedFilters).length > 0 || startDate || endDate) && (
        <ActiveFilters
          filters={advancedFilters}
          onRemoveFilter={(key) => {
            const newFilters = { ...advancedFilters };
            delete newFilters[key];
            setAdvancedFilters(newFilters);
          }}
          onClearAll={() => {
            setAdvancedFilters({});
            setStartDate("");
            setEndDate("");
            setFilterByDate("ENTITY_DATE");
          }}
          dateRange={
            startDate || endDate ? { startDate, endDate } : null
          }
          onClearDateRange={() => {
            setStartDate("");
            setEndDate("");
            setFilterByDate("ENTITY_DATE");
          }}
          filterByDate={filterByDate}
        />
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-4 flex  justify-between gap-4 items-center border mb-2">
        <div className="w-full flex gap-4 items-center">
          {/* <h3 className="text-lg font-medium">Quote Detail </h3> */}
          {isHydrated && rows.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({filteredGridRows.length.toLocaleString()}{filteredGridRows.length !== rows.length ? ` of ${rows.length.toLocaleString()}` : ""}) records
            </span>
          )}
          {showFetching && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
              <Loader2 size={14} className="animate-spin" />
              Fetching...
            </div>
          )}
        </div>
        <div className="flex flex-nowrap justify-end w-full gap-2 sm:gap-4 items-center">
          <RefreshButton
            hasCachedData={hasCachedData}
            onRefresh={resetCache}
            isRefreshing={isFetching}
            disabled={Boolean(error) || initialLoading}
          />
          <ExpandButton
            onClick={() => setIsFullScreen(true)}
            disabled={sortedData.length === 0}
          />
          <DetailConfigManagerStandard
            getConfigs={getConfigs}
            saveConfig={saveConfig}
            loadConfig={loadConfig}
            deleteConfig={deleteConfig}
            setDefaultConfig={setDefaultConfig}
            getDefaultConfigId={getDefaultConfigId}
            isDefaultConfig={isDefaultConfig}
            advancedFilters={advancedFilters}
            dateRange={{ startDate, endDate }}
            sorting={sorting}
            onLoadConfig={handleLoadConfig}
          />
          <ColumnConfigPopover
            columns={allColumns}
            config={config}
            setOrder={setOrder}
            toggleHidden={toggleHidden}
            setPin={setPin}
            resetToBase={resetToBase}
            saveNow={saveNow}
            reloadFromStorage={reloadFromStorage}
          />
          <button
            onClick={() => setIsSortModalOpen(true)}
            className="px-3 sm:px-4 py-2 flex gap-1 sm:gap-2 items-center bg-white border border-gray-300 text-gray-700 rounded-lg font-medium shadow-sm hover:bg-gray-50 transition text-sm"
          >
            <ArrowUpDown size={16} />
            <span className="hidden sm:inline">Sort</span>
            {sorting && sorting.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {sorting.length}
              </span>
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="px-3 sm:px-4 py-2 flex gap-1 sm:gap-2 items-center bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition disabled:opacity-60 text-sm"
                disabled={Boolean(error) || initialLoading}
              >
                <span>Export</span>
                <ChevronDown size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onSelect={() => {
                  handleExportCsv();
                }}
                className="flex items-center gap-2"
              >
                <FileText size={14} />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  handleExportXlsx();
                }}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet size={14} />
                XLSX
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  handleExportXlsxWithHeaders();
                }}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet size={14} />
                XLSX with Headers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="">
        {error ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow border p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-red-500 text-lg font-medium">
                Unable to load report data
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                {error.message ||
                  "There was an error connecting to the server. Please check your connection and try again."}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <DataGrid
            title="Quote Detail Report"
            columns={columnsWithTemplates}
            searchable={false}
            data={sortedData}
            loading={initialLoading}
            height={500}
            theme="material"
            enableResize={true}
            enableRange={true}
            enableGrouping={grouping}
            groupBy={grouping && groupBy ? [groupBy] : []}
            enableEditing={false}
            enableFiltering={false}
            rowClass="hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer border-b"
            skeletonPreset="reportGrid"
            skeletonRows={skeletonConfig.grid.rows}
            skeletonProps={{
              columnWidths: skeletonConfig.grid.columnWidths,
              showStats: true,
            }}
            canMoveColumns={false}
          />
        )}
      </div>

      <SortingConfigModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        columns={configuredColumns}
        currentSorting={sorting || []}
        onApplySorting={handleSortingApply}
      />

      {/* Full Screen Modal */}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        title="Quote Detail Report - Full Screen View"
      >
        <div className="w-full h-full">
          <DataGrid
            key="fullscreen-grid"
            data={sortedData}
            columns={columnsWithTemplates}
            enablePagination={false}
            enableGrouping={grouping}
            groupBy={grouping && groupBy ? [groupBy] : []}
            enableEditing={false}
            enableFiltering={false}
            rowClass="hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer border-b"
            canMoveColumns={false}
             height="calc(100vh - 350px)"
          />
        </div>
      </FullScreenModal>
    </div>
  );
}




