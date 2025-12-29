"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useCheckDetailSubscription } from "@/lib/analytics/hooks/useCheckDetailSubscription";
import { RevoGrid } from "@revolist/react-datagrid";
import NumberColumnType from "@revolist/revogrid-column-numeral";
import {
  PivotPlugin,
  AdvanceFilterPlugin,
  RowOddPlugin,
  RowSelectPlugin,
  SameValueMergePlugin,
  commonAggregators,
  ExportExcelPlugin,
} from "@revolist/revogrid-pro";
import {
  Card,
} from "@/components/analytics/ui/card";
import { TableConfigDialog } from "@/components/analytics/table-config/TableConfigDialog";
import { PivotConfigManager } from "@/components/analytics/table-config/PivotConfigManager";
import { useTableConfig } from "@/lib/analytics/hooks/useTableConfig";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/analytics/ui/dropdown-menu";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
import { FilterPane } from "@/components/analytics/filters/FilterPane";
import { ActiveFilters } from "@/components/analytics/filters/ActiveFilters";
import { PivotSortingModal } from "@/components/analytics/pivot-config/PivotSortingModal";
import "@/app/analytics-styles/pivot-table.css";
import {
  Loader2,
  Download,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
} from "lucide-react";
import { exportGridCsv, exportGridXlsxWithHeaders } from "@/lib/analytics/utils/exportGridCsv";
import { attachYtdFields } from "@/lib/analytics/lib/pivot/attachYtdFields";
import { FullScreenModal, ExpandButton } from "@/components/analytics/ui/FullScreenModal";
import { DateFormatDropdown, DATE_FORMATS, formatDateByType } from "@/components/analytics/ui/DateFormatDropdown";
import { RefreshButton } from "@/components/analytics/ui/RefreshButton";
import { DataDictionary } from "@/components/analytics/ui/DataDictionary";
import { sumSkipNulls, percentageDiffAggregator } from "@/lib/analytics/lib/pivot/aggregators";
import { normalizePivotConfig, pivotConfigsEqual, computePivotValueTotals } from "@/lib/analytics/lib/pivot/pivotUtils";
import { formatYTDHelperText, getYTDRanges } from "@/lib/analytics/lib/pivot/ytdUtils";
import { toNumericSortValue } from "@/lib/analytics/lib/pivot/sortHelpers";

const formatDate = (value, formatType = DATE_FORMATS.DEFAULT) => {
  return formatDateByType(value, formatType);
};

// Helper function to parse currency strings (e.g., "$15048.0800" -> 15048.08)
const parseCurrency = (value) => {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  // Remove $, commas, and any whitespace, then parse
  const cleaned = String(value).replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export function CheckPivotGrid() {
  // Date range state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterByDate, setFilterByDate] = useState("ENTITY_DATE");

  // YTD Mode state
  const [ytdModeEnabled, setYtdModeEnabled] = useState(false);

  // Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState({});

  // Sorting state
  const [sortingConfig, setSortingConfig] = useState([]);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Full-screen modal state
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Date format state
  const [dateFormat, setDateFormat] = useState(DATE_FORMATS.DEFAULT);

  const [pivotConfigState, setPivotConfigState] = useState(() =>
    normalizePivotConfig({
      rows: ["customer", "factory"],
      columns: ["outsideRep"],
      values: [],
    })
  );
  const pivotConfig = pivotConfigState;

  const setPivotConfig = useCallback((nextConfig) => {
    setPivotConfigState((prev) => {
      const candidate = typeof nextConfig === "function" ? nextConfig(prev) : nextConfig;
      const normalized = normalizePivotConfig(candidate);
      return pivotConfigsEqual(prev, normalized) ? prev : normalized;
    });
  }, []);

  // Use real API data
  const {
    data: subscriptionData,
    error: apiError,
    rows: cachedRows,
    isFetching,
    initialLoading,
    cacheKey,
    lastUpdated,
    resetCache,
    hasCachedData,
  } = useCheckDetailSubscription(null, startDate, endDate, filterByDate);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const logData = {
      hasData: !!subscriptionData,
      hasGetReport: !!subscriptionData?.getReport,
      cachedRowCount: cachedRows.length,
      hasError: !!apiError,
      errorMessage: apiError?.message,
      dataKeys: subscriptionData ? Object.keys(subscriptionData) : [],
      reportLength: subscriptionData?.getReport?.length,
    };

    console.log("[CheckPivotGrid] Subscription data updated:");
    console.log(JSON.stringify(logData, null, 2));

    if (subscriptionData?.getReport?.length) {
      console.log("[CheckPivotGrid] Sample of first item:", subscriptionData.getReport[0]);
    }
  }, [subscriptionData, cachedRows, apiError]);

  const sourceRows = cachedRows;
  const filterCacheKey = cacheKey;
  const filterDataVersion = lastUpdated;
  const displayFetching =
    isHydrated && (isFetching || initialLoading) && sourceRows.length === 0;

  // YTD Mode: Automatically set date range to cover both current and previous YTD
  useEffect(() => {
    if (ytdModeEnabled) {
      const ranges = getYTDRanges();
      // Set date filter to cover from Jan 1 of previous year to today
      const prevYearStart = ranges.previous.start;
      const today = ranges.current.end;
      
      setStartDate(prevYearStart.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
    
    // Force grid re-render when YTD mode changes to clear old columns
    setGridKey(prev => prev + 1);
  }, [ytdModeEnabled]);

  const [gridDimensions, setGridDimensions] = useState({
    width: 0,
    height: 1200,
  });
  const internalGridRef = useRef(null);
  const gridRef = useRef(null);
  const containerRef = useRef(null);

  // Table configuration management
  const getAdditionalState = useCallback(() => {
    console.log('[CheckPivotGrid] getAdditionalState called - advancedFilters:', advancedFilters);
    console.log('[CheckPivotGrid] getAdditionalState called - dateRange:', { startDate, endDate });
    console.log('[CheckPivotGrid] getAdditionalState called - sorting:', sortingConfig);
    return {
      advancedFilters,
      setAdvancedFilters,
      dateRange: { startDate, endDate },
      setDateRange: ({ startDate: start, endDate: end }) => {
        if (start !== undefined) setStartDate(start);
        if (end !== undefined) setEndDate(end);
      },
      sorting: sortingConfig,
      setSorting: setSortingConfig,
    };
  }, [advancedFilters, startDate, endDate, sortingConfig]);

  const {
    configManager,
    saveCurrentConfig,
    loadConfig,
    getSavedConfigs,
    deleteConfig,
    exportConfig,
    importConfig,
    isConfigDialogOpen,
    openConfigDialog,
    closeConfigDialog,
    handleConfigApplied,
    hasUnsavedChanges,
    lastSavedConfig,
    autoSaveEnabled,
    toggleAutoSave,
    scheduleAutoSave,
    refreshTrigger,
  } = useTableConfig(
    gridRef,
    "check-pivot",
    getAdditionalState
  );

  // Check for pending config load from GlobalConfigManager
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const pendingLoad = sessionStorage.getItem("pendingConfigLoad");
      if (pendingLoad) {
        const pendingData = JSON.parse(pendingLoad);
        
        // Handle both old format (tableId) and new format (reportType)
        const isMatch = (pendingData.tableId === "check-pivot") || (pendingData.reportType === "PIVOT_CHECK_REPORT");
        if (isMatch) {
          // Clear the pending load
          sessionStorage.removeItem("pendingConfigLoad");
          // Load the config
          setTimeout(() => {
            loadConfig(pendingData.configId);
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error loading pending config:", error);
    }
  }, [loadConfig]);

  // Export functionality
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = useCallback(async () => {
    if (!internalGridRef.current) return;

    setIsExporting(true);
    try {
      const grid = internalGridRef.current;
      let exportColumns = [];
      let exportRows = [];

      if (grid?.getColumns && grid?.getSource) {
        try {
          const gridColumns = await grid.getColumns();
          const gridSource = await grid.getSource();

          if (
            Array.isArray(gridColumns) &&
            gridColumns.length &&
            Array.isArray(gridSource)
          ) {
            exportColumns = gridColumns;
            exportRows = gridSource;
          }
        } catch (error) {
          console.warn(
            "[CheckPivotGrid] Failed to retrieve grid data for CSV:",
            error
          );
        }
      }

      if (exportColumns.length === 0) {
        exportColumns = await resolveColumnsForExport();
      }

      if (exportRows.length === 0) {
        console.warn("[CheckPivotGrid] No data to export");
        return;
      }

      // Add totals row if present
      if (grid.pinnedBottomSource && Array.isArray(grid.pinnedBottomSource) && grid.pinnedBottomSource.length > 0) {
        exportRows = [...exportRows, ...grid.pinnedBottomSource];
      }

      const dateStamp = new Date().toISOString().split("T")[0];
      const filename = `check-pivot-${dateStamp}`;

      await exportGridCsv({
        filename,
        columns: exportColumns,
        rows: exportRows,
      });
    } catch (error) {
      console.error("CSV export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [resolveColumnsForExport]);

  // Transform API data with robust error handling
  const transformedRows = useMemo(() => {
    if (!sourceRows || sourceRows.length === 0) {
      console.log("[CheckPivotGrid] No data available - returning empty array");
      return [];
    }

    const rawRecords = sourceRows;

    try {
      const validRecords = rawRecords.filter(
        (record) => 
          record &&
          typeof record === "object" &&
          record.companyName !== null &&
          record.companyName !== undefined &&
          record.companyName !== ""
      );

      const transformedData = validRecords.map((record, index) => {
        const entityDateValue =
          record.entityDate && !Number.isNaN(new Date(record.entityDate).getTime())
            ? new Date(record.entityDate)
            : null;
        const entityDateIso = entityDateValue
          ? entityDateValue.toISOString()
          : typeof record.entityDate === "string"
          ? record.entityDate
          : null;
        const entityDateDisplay = formatDate(entityDateValue ?? record.entityDate, dateFormat);

        const entryDateValue =
          record.entryDate && !Number.isNaN(new Date(record.entryDate).getTime())
            ? new Date(record.entryDate)
            : null;
        const entryDateDisplay = formatDate(entryDateValue ?? record.entryDate, dateFormat);

        const postDateValue =
          record.postDate && !Number.isNaN(new Date(record.postDate).getTime())
            ? new Date(record.postDate)
            : null;
        const postDateDisplay = formatDate(postDateValue ?? record.postDate, dateFormat);

        const checkDateValue =
          record.checkDate && !Number.isNaN(new Date(record.checkDate).getTime())
            ? new Date(record.checkDate)
            : null;
        const checkDateDisplay = formatDate(checkDateValue ?? record.checkDate, dateFormat);

        const baseRow = {
          id: record.id || `check_${index}`,
          checkNumber: record.checkNumber || record.checkId || "N/A",
          checkId: record.checkId || "N/A",
          customer: String(record.companyName || "Unknown Customer"),
          parentCustomer: String(record.parentCustomer || record.parent_customer || ""),
          customerId: record.customerId || "N/A",
          factory: String(record.factory || "Unknown Factory"),
          outsideRep: record.outsideSalesRep || record.outsideRep || "N/A",
          
          // Financial metrics - parse currency strings (strip $ and commas)
          commission: parseCurrency(record.outsideRepCommission),
          paidCommission: parseCurrency(record.paidCommission),
          outsideRepCommission: parseCurrency(record.outsideRepCommission),
          outsideRepTotalPortion: parseCurrency(record.outsideRepTotalPortion),

          // IDs and Numbers
          entityId: record.entityId || "N/A",
          entityNumber: record.entityNumber || "N/A",
          entityType: record.entityType || "N/A",
          orderId: record.orderId || "N/A",
          orderNumber: record.orderNumber || "N/A",

          // Dates (entityDate kept raw for YTD calculations; display restored later)
          entityDate: entityDateIso,
          entryDate: entryDateDisplay,
          entryDateRaw: entryDateValue ? entryDateValue.toISOString() : null,
          postDate: postDateDisplay,
          postDateRaw: postDateValue ? postDateValue.toISOString() : null,
          checkDate: checkDateDisplay,
          checkDateRaw: checkDateValue ? checkDateValue.toISOString() : null,

          // Additional fields
          status: record.entityType || "N/A",
        };

        // attachYtdFields now adds commissionDiffPct and salesDiffPct as objects
        // containing { ytd, prevYtd } for correct percentage aggregation
        const rowWithYtd = attachYtdFields(baseRow, "entityDate");

        // Debug logging for first row
        if (index === 0) {
          console.log("[CheckPivotGrid] First row RAW values from API:", {
            outsideRepTotalPortion: record.outsideRepTotalPortion,
            outsideRepCommission: record.outsideRepCommission,
            paidCommission: record.paidCommission,
          });
          console.log("[CheckPivotGrid] First row PARSED values:", {
            commission: baseRow.commission,
            paidCommission: baseRow.paidCommission,
            outsideRepCommission: baseRow.outsideRepCommission,
            outsideRepTotalPortion: baseRow.outsideRepTotalPortion,
            entityDate: baseRow.entityDate,
          });
          console.log("[CheckPivotGrid] First row after YTD attachment:", {
            commission: rowWithYtd.commission,
            paidCommission: rowWithYtd.paidCommission,
            outsideRepCommissionYTD: rowWithYtd.outsideRepCommissionYTD,
            outsideRepTotalPortionYTD: rowWithYtd.outsideRepTotalPortionYTD,
            outsideRepCommissionPrevYTD: rowWithYtd.outsideRepCommissionPrevYTD,
            outsideRepTotalPortionPrevYTD: rowWithYtd.outsideRepTotalPortionPrevYTD,
          });
        }

        return {
          ...rowWithYtd,
          entityDate: entityDateDisplay,
          entityDateRaw: entityDateIso,
        };
      });

      console.log("[CheckPivotGrid] Total transformed rows:", transformedData.length);
      if (transformedData.length > 0) {
        const sampleRow = transformedData[0];
        console.log("[CheckPivotGrid] Sample transformed row:", {
          commission: sampleRow.commission,
          paidCommission: sampleRow.paidCommission,
          outsideRepCommissionYTD: sampleRow.outsideRepCommissionYTD,
          outsideRepTotalPortionYTD: sampleRow.outsideRepTotalPortionYTD,
        });
      }

      return transformedData;
    } catch (error) {
      console.error("[CheckPivotGrid] Error transforming data:", error);
      console.error("[CheckPivotGrid] Error stack:", error);
      return [];
    }
  }, [sourceRows, dateFormat]);

  // Apply advanced filters to transformed rows
  const filteredRows = useMemo(() => {
    let filtered = [...transformedRows];

    // Apply year 
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
          const dateStr = row.entryDate;
          if (!dateStr || dateStr === "N/A") return false;
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
  }, [transformedRows, advancedFilters]);

  // Apply sorting to filtered rows
  const sortedRows = useMemo(() => {
    if (!sortingConfig || sortingConfig.length === 0) {
      return filteredRows;
    }

    const dataToSort = [...filteredRows];

    dataToSort.sort((a, b) => {
      for (const sortCol of sortingConfig) {
        const { prop, order } = sortCol;
        const aVal = a[prop];
        const bVal = b[prop];

        if (aVal == null && bVal == null) continue;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const aNumeric = toNumericSortValue(aVal);
        const bNumeric = toNumericSortValue(bVal);

        let comparison = 0;

        if (aNumeric !== null && bNumeric !== null) {
          comparison = aNumeric - bNumeric;
        } else {
          const aStr = String(aVal).toLowerCase();
          const bStr = String(bVal).toLowerCase();
          comparison = aStr.localeCompare(bStr);
        }

        if (comparison !== 0) {
          return order === "asc" ? comparison : -comparison;
        }
      }
      return 0;
    });

    return dataToSort;
  }, [filteredRows, sortingConfig]);

  // Performance metrics for monitoring
  const dataMetrics = useMemo(() => {
    if (!sortedRows || !sortedRows.length) {
      return null;
    }

    try {
      const rawRecordCount = sourceRows?.length || 0;
      const transformedCount = transformedRows?.length || 0;
      const filteredCount = transformedCount - sortedRows.length;

      const metrics = {
        totalRecords: sortedRows.length,
        rawRecords: rawRecordCount,
        transformedRecords: transformedCount,
        filteredRecords: filteredCount,
        totalRevenue: sortedRows.reduce(
          (sum, row) => sum + (row.revenue || 0),
          0
        ),
        totalCommission: sortedRows.reduce(
          (sum, row) => sum + (row.commission || 0),
          0
        ),
        avgCheckValue:
          sortedRows.length > 0
            ? sortedRows.reduce(
                (sum, row) => sum + (row.revenue || 0),
                0
              ) / sortedRows.length
            : 0,
        uniqueCustomers: new Set(
          sortedRows.map((row) => row.customerId).filter(Boolean)
        ).size,
        uniqueFactories: new Set(
          sortedRows.map((row) => row.factory).filter(Boolean)
        ).size,
      };

      return metrics;
    } catch (error) {
      console.error("[CheckPivotGrid] Error calculating metrics:", error);
      return null;
    }
  }, [sortedRows, sourceRows, transformedRows]);

  // Export function for XLSX with headers
  // Loading state
  const isLoading =
    isHydrated &&
    (initialLoading || isFetching) &&
    !apiError &&
    sourceRows.length === 0;

  // Calculate totals row for pinned bottom
  const totalsRow = useMemo(() => {
    if (!sortedRows || sortedRows.length === 0) return null;

    const currencyFields = ["commission", "paidCommission"];

    if (ytdModeEnabled) {
      currencyFields.push(
        "outsideRepCommissionYTD",
        "outsideRepCommissionPrevYTD",
        "outsideRepTotalPortionYTD",
        "outsideRepTotalPortionPrevYTD"
      );
    } else {
      currencyFields.push("outsideRepCommission", "outsideRepTotalPortion");
    }

    const integerFields = [];

    const totals = {
      id: "TOTAL_ROW",
      checkNumber: "TOTAL",
      customer: "TOTAL",
      parentCustomer: "",
      factory: "",
      outsideRep: "",
      status: "",
      entityDate: "",
      entryDate: "",
      postDate: "",
      checkDate: "",
    };

    const accumulate = (field) => {
      totals[field] = sumSkipNulls(sortedRows.map((row) => row?.[field]));
    };

    currencyFields.forEach(accumulate);
    integerFields.forEach(accumulate);

    const pivotValueTotals = computePivotValueTotals(sortedRows, pivotConfig);
    Object.assign(totals, pivotValueTotals);

    return totals;
  }, [sortedRows, ytdModeEnabled, pivotConfig]);


  const runPivotExcelExport = useCallback(
    async ({ includeHeaderInfo, filenamePrefix, reportTitle }) => {
      if (!sortedRows || sortedRows.length === 0) {
        return;
      }

      setIsExporting(true);
      try {
        const grid = internalGridRef.current;
        let exportColumns = [];
        let exportRows = sortedRows;

        if (grid?.getColumns && grid?.getSource) {
          try {
            const gridColumns = await grid.getColumns();
            const gridSource = await grid.getSource();

            if (
              Array.isArray(gridColumns) &&
              gridColumns.length &&
              Array.isArray(gridSource)
            ) {
              exportColumns = gridColumns;
              exportRows = gridSource;
            }
          } catch (error) {
            console.warn(
              "[CheckPivotGrid] Failed to retrieve grid data, falling back to sortedRows:",
              error
            );
          }
        }

        if (totalsRow) {
          exportRows = [...exportRows, totalsRow];
        }

        if (exportColumns.length === 0) {
          exportColumns = await resolveColumnsForExport();
        }

        const dateStamp = new Date().toISOString().split("T")[0];
        const filename = `${filenamePrefix}-${dateStamp}`;
        const filtersPayload = includeHeaderInfo ? advancedFilters : {};
        const sortingPayload = includeHeaderInfo ? sortingConfig : [];
        const dateRangePayload = includeHeaderInfo
          ? { startDate, endDate }
          : undefined;
        const titlePayload = includeHeaderInfo ? reportTitle : undefined;

        await exportGridXlsxWithHeaders({
          filename,
          columns: exportColumns,
          rows: exportRows,
          sheetName: "Check Pivot Data",
          filters: filtersPayload,
          dateRange: dateRangePayload,
          sorting: sortingPayload,
          reportTitle: titlePayload,
          includeHeaderInfo,
        });
      } catch (error) {
        console.error("Excel export failed:", error);
      } finally {
        setIsExporting(false);
      }
    },
    [
      advancedFilters,
      endDate,
      resolveColumnsForExport,
      sortedRows,
      sortingConfig,
      startDate,
      totalsRow,
    ]
  );

  const exportToExcel = useCallback(async () => {
    await runPivotExcelExport({
      includeHeaderInfo: false,
      filenamePrefix: "check-pivot",
    });
  }, [runPivotExcelExport]);

  const exportToExcelWithHeaders = useCallback(async () => {
    await runPivotExcelExport({
      includeHeaderInfo: true,
      filenamePrefix: "check-pivot-with-headers",
      reportTitle: "Check Pivot Report",
    });
  }, [runPivotExcelExport]);

  const pinnedBottomRows = useMemo(
    () => (totalsRow ? [totalsRow] : []),
    [totalsRow]
  );

  useEffect(() => {
    const gridElement = internalGridRef.current;
    if (!gridElement) return;

    gridElement.pinnedBottomSource = pinnedBottomRows;
    gridElement.refresh?.();
  }, [pinnedBottomRows]);

  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setGridDimensions({
        width: rect.width,
        height: Math.max(600, window.innerHeight - 300),
      });
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const columnTypes = useMemo(
    () => ({
      currency: new NumberColumnType("$0,0.00"),
      integer: new NumberColumnType("0,0"),
      percentage: new NumberColumnType("0.00%"),
    }),
    []
  );

  const plugins = useMemo(
    () => [
      RowSelectPlugin,
      SameValueMergePlugin,
      PivotPlugin,
      AdvanceFilterPlugin,
      RowOddPlugin,
      ExportExcelPlugin,
    ],
    []
  );

  // Key to force re-render when pivot config changes
  const [gridKey, setGridKey] = useState(0);

  // Clean up sorting config when pivot configuration changes
  useEffect(() => {
    if (!pivotConfig) return;
    
    const visibleProps = new Set();
    
    if (Array.isArray(pivotConfig.rows)) {
      pivotConfig.rows.forEach(prop => visibleProps.add(prop));
    }
    
    if (Array.isArray(pivotConfig.columns)) {
      pivotConfig.columns.forEach(prop => visibleProps.add(prop));
    }
    
    if (Array.isArray(pivotConfig.values)) {
      pivotConfig.values.forEach(value => {
        if (typeof value === 'string') {
          visibleProps.add(value);
        } else if (value && typeof value === 'object' && value.prop) {
          visibleProps.add(value.prop);
        }
      });
    }
    
    setSortingConfig(currentSorting => {
      if (!currentSorting || currentSorting.length === 0) return currentSorting;
      
      const cleanedSorting = currentSorting.filter(sortCol => visibleProps.has(sortCol.prop));
      
      if (cleanedSorting.length !== currentSorting.length) {
        console.log('[CheckPivotGrid] Cleaning up sorting config - removed columns no longer in pivot');
        return cleanedSorting;
      }
      
      return currentSorting;
    });
  }, [pivotConfig]);

  useEffect(() => {
    const gridElement = internalGridRef.current;
    if (!gridElement) return;

    const handlePivotUpdate = (event) => {
      const detail = event?.detail;
      if (!detail || typeof detail !== "object") return;

      setPivotConfig((prev) => ({
        rows: detail.rows ?? prev.rows,
        columns: detail.columns ?? prev.columns,
        values: detail.values ?? prev.values,
      }));
    };

    gridElement.addEventListener("pivot-config-update", handlePivotUpdate);
    return () => {
      gridElement.removeEventListener("pivot-config-update", handlePivotUpdate);
    };
  }, [setPivotConfig, gridKey]);

  const config = useMemo(
    () => ({
      dimensions: [
        // Hide base measures in YTD Mode, show only in normal mode
        ...(!ytdModeEnabled ? [
          {
            prop: "outsideRepCommission",
            name: "Expected Commissions",
            columnType: "currency",
            size: 180,
            minSize: 150,
            sortable: true,
            aggregators: {
              sum: commonAggregators.sum,
              sumSkipNulls: sumSkipNulls,
              avg: commonAggregators.avg,
              count: commonAggregators.count,
            },
          },
          {
            prop: "outsideRepTotalPortion",
            name: "Sales",
            columnType: "currency",
            size: 200,
            minSize: 170,
            sortable: true,
            aggregators: {
              sum: commonAggregators.sum,
              sumSkipNulls: sumSkipNulls,
              avg: commonAggregators.avg,
              count: commonAggregators.count,
            },
          },
        ] : []),
        // Show YTD measures only in YTD Mode
        ...(ytdModeEnabled ? [
          {
            prop: "outsideRepCommissionYTD",
            name: "Expected Commissions YTD",
            columnType: "currency",
            size: 210,
            minSize: 180,
            sortable: true,
            aggregators: {
              sumSkipNulls: sumSkipNulls,
              sum: commonAggregators.sum,
              avg: commonAggregators.avg,
              count: commonAggregators.count,
            },
            source: "derived",
          },
          {
            prop: "outsideRepCommissionPrevYTD",
            name: "Expected Commissions Previous YTD",
            columnType: "currency",
            size: 250,
            minSize: 220,
            sortable: true,
            aggregators: {
              sumSkipNulls: sumSkipNulls,
              sum: commonAggregators.sum,
              avg: commonAggregators.avg,
              count: commonAggregators.count,
            },
            source: "derived",
          },
          {
            prop: "commissionDiff",
            name: "Expected Commission Difference",
            columnType: "currency",
            size: 200,
            minSize: 170,
            sortable: true,
            aggregators: {
              sumSkipNulls: sumSkipNulls,
              sum: commonAggregators.sum,
              avg: commonAggregators.avg,
              count: commonAggregators.count,
            },
            source: "derived",
          },
          {
            prop: "commissionDiffPct",
            name: "Expected Commission Difference %",
            columnType: "percentage",
            size: 220,
            minSize: 190,
            sortable: true,
            aggregators: {
              // Custom aggregator that calculates percentage from aggregated YTD values
              percentageDiff: percentageDiffAggregator,
            },
            source: "derived",
          },
          {
            prop: "outsideRepTotalPortionYTD",
            name: "Sales YTD",
            columnType: "currency",
            size: 230,
            minSize: 200,
            sortable: true,
            aggregators: {
              sumSkipNulls: sumSkipNulls,
              sum: commonAggregators.sum,
              avg: commonAggregators.avg,
              count: commonAggregators.count,
            },
            source: "derived",
          },
          {
            prop: "outsideRepTotalPortionPrevYTD",
            name: "Sales Previous YTD",
            columnType: "currency",
            size: 270,
            minSize: 240,
            sortable: true,
            aggregators: {
              sumSkipNulls: sumSkipNulls,
              sum: commonAggregators.sum,
              avg: commonAggregators.avg,
              count: commonAggregators.count,
            },
            source: "derived",
          },
          {
            prop: "salesDiff",
            name: "Sales Difference",
            columnType: "currency",
            size: 180,
            minSize: 150,
            sortable: true,
            aggregators: {
              sumSkipNulls: sumSkipNulls,
              sum: commonAggregators.sum,
              avg: commonAggregators.avg,
              count: commonAggregators.count,
            },
            source: "derived",
          },
          {
            prop: "salesDiffPct",
            name: "Sales Difference %",
            columnType: "percentage",
            size: 200,
            minSize: 170,
            sortable: true,
            aggregators: {
              // Custom aggregator that calculates percentage from aggregated YTD values
              percentageDiff: percentageDiffAggregator,
            },
            source: "derived",
          },
        ] : []),
        {
          prop: "paidCommission",
          name: "Paid Commissions",
          columnType: "currency",
          size: 150,
          minSize: 130,
          sortable: true,
          aggregators: {
            sum: commonAggregators.sum,
            sumSkipNulls: sumSkipNulls,
            avg: commonAggregators.avg,
            count: commonAggregators.count,
          },
        },

        // Dimensional Data - for grouping and filtering
        {
          prop: "customer",
          name: "Customer",
          sortable: true,
          size: 200,
          minSize: 150,
        },
        {
          prop: "parentCustomer",
          name: "Parent Customer",
          sortable: true,
          size: 200,
          minSize: 150,
        },
        {
          prop: "outsideRep",
          name: "Outside Rep",
          sortable: true,
          size: 160,
          minSize: 120,
        },
        {
          prop: "factory",
          name: "Factory",
          sortable: true,
          size: 140,
          minSize: 100,
        },
        {
          prop: "status",
          name: "Entity Type",
          sortable: true,
          size: 120,
          minSize: 80,
        },
        {
          prop: "entityDate",
          name: "Entity Date",
          sortable: true,
          size: 120,
          minSize: 100,
        },
        {
          prop: "entryDate",
          name: "Entry Date",
          sortable: true,
          size: 120,
          minSize: 100,
        },
        {
          prop: "postDate",
          name: "Post Date",
          sortable: true,
          size: 120,
          minSize: 100,
        },
        {
          prop: "checkDate",
          name: "Check Date",
          sortable: true,
          size: 120,
          minSize: 100,
        },
        {
          prop: "checkNumber",
          name: "Check Number",
          sortable: true,
          size: 130,
          minSize: 100,
        },
        {
          prop: "orderNumber",
          name: "Order Number",
          sortable: true,
          size: 130,
          minSize: 100,
        },
        {
          prop: "entityNumber",
          name: "Entity Number",
          sortable: true,
          size: 130,
          minSize: 100,
        },
      ],
      rows: pivotConfig.rows,
      columns: pivotConfig.columns,
      values: pivotConfig.values,
      hasConfigurator: true,
      flatHeaders: true,
      aggregatorNames: {
        sum: "Sum",
        sumSkipNulls: "Sum (skip blanks)",
        avg: "Average",
        count: "Count",
        max: "Maximum",
        min: "Minimum",
      },
    }),
    [pivotConfig, ytdModeEnabled]
  );

  const additionalData = useMemo(() => ({ pivot: { ...config } }), [config]);
  const columns = useMemo(() => config.dimensions, [config]);

  async function resolveColumnsForExport() {
    const grid = internalGridRef.current;
    if (grid?.getColumns) {
      try {
        const gridColumns = await grid.getColumns();
        if (Array.isArray(gridColumns) && gridColumns.length) {
          return gridColumns;
        }
      } catch (error) {
        console.warn(
          "[CheckPivotGrid] Failed to retrieve columns from grid for export:",
          error
        );
      }
    }

    if (Array.isArray(columns) && columns.length) {
      return columns;
    }

    if (transformedRows.length > 0) {
      const keys = Object.keys(transformedRows[0] || {});
      return keys.map((prop) => ({ prop, name: prop }));
    }

    return [];
  }

  async function fallbackCSVExport() {
    const exportColumns = await resolveColumnsForExport();
    if (!exportColumns.length || !sortedRows.length) {
      console.warn("[CheckPivotGrid] CSV fallback skipped: nothing to export.");
      return;
    }
    await exportGridCsv({
      filename: `check-pivot-${new Date().toISOString().split("T")[0]}`,
      columns: exportColumns,
      rows: sortedRows,
    });
  }

  // Expose methods to get/set pivot configuration for TableConfigManager
  useEffect(() => {
    if (!gridRef.current) {
      gridRef.current = {};
    }

    gridRef.current.getPivotConfig = async () => {
      console.log("[CheckPivotGrid] Getting pivot config from React state:", pivotConfig);

      if (internalGridRef.current) {
        try {
          const plugins = await internalGridRef.current.getPlugins();
          const pivotPlugin = plugins.find(p => p.pivotRows || p.pivotColumns || p.pivotValues);

          if (pivotPlugin) {
            const pluginConfig = pivotPlugin.pivotConfig || {};

            const normalizeFieldArray = (fields) => {
              if (!Array.isArray(fields)) return [];
              return fields.map(field => {
                if (typeof field === 'string') return field;
                if (field && typeof field === 'object' && field.prop) return field.prop;
                return null;
              }).filter(Boolean);
            };

            const actualConfig = {
              rows: normalizeFieldArray(pluginConfig.rows),
              columns: normalizeFieldArray(pluginConfig.columns),
              values: normalizeFieldArray(pluginConfig.values),
              ytdMode: ytdModeEnabled, // Include YTD mode state
            };

            console.log("[CheckPivotGrid] Actual pivot config from plugin (preserved as-is):", actualConfig);

            return {
              ...actualConfig,
              pluginState: {
                dimensions: columns,
              }
            };
          }
        } catch (error) {
          console.warn("[CheckPivotGrid] Could not get pivot plugin state:", error);
        }
      }

      return {
        ...pivotConfig,
        ytdMode: ytdModeEnabled,
        pluginState: {
          dimensions: columns,
        }
      };
    };

    gridRef.current.setPivotConfig = (newConfig) => {
      console.log("[CheckPivotGrid] Setting pivot config:", newConfig);
      if (newConfig && typeof newConfig === 'object') {
        setPivotConfig({
          rows: newConfig.rows || pivotConfig.rows,
          columns: newConfig.columns || pivotConfig.columns,
          values: newConfig.values || pivotConfig.values,
        });
        // Restore YTD mode if present
        if (typeof newConfig.ytdMode === 'boolean') {
          setYtdModeEnabled(newConfig.ytdMode);
        }
        setGridKey(prev => prev + 1);
        console.log("[CheckPivotGrid] Forcing grid re-render with new key");
        return true;
      }
      return false;
    };

    gridRef.current.getColumns = () => columns;
    gridRef.current.setColumns = () => true;
    gridRef.current.getSortingState = () => [];
    gridRef.current.setSortingState = () => true;
    gridRef.current.getFilterState = () => ({});
    gridRef.current.setFilterState = () => true;
    gridRef.current.getPivotState = () => pivotConfig;
    gridRef.current.setPivotState = (newConfig) => {
      if (newConfig) {
        setPivotConfig(newConfig);
        // Restore YTD mode if present
        if (typeof newConfig.ytdMode === 'boolean') {
          setYtdModeEnabled(newConfig.ytdMode);
        }
        setGridKey(prev => prev + 1);
        console.log("[CheckPivotGrid] Forcing grid re-render with new key (setPivotState)");
        return true;
      }
      return false;
    };
    gridRef.current.getSelectedRows = () => [];
    gridRef.current.setSelectedRows = () => true;
    gridRef.current.getSelectedCells = () => [];

    if (internalGridRef.current) {
      const gridElement = internalGridRef.current;
      gridRef.current.getPlugins = gridElement.getPlugins?.bind(gridElement);
    }
  }, [pivotConfig, columns, ytdModeEnabled, setPivotConfig]);

  useEffect(() => {
    if (!internalGridRef.current) return;

    const grid = internalGridRef.current;

    if (typeof grid.addEventListener !== 'function') {
      return;
    }

    const handleTableChange = () => {
      scheduleAutoSave();
    };

    const events = [
      "aftercolumnresize",
      "aftersort",
      "afterfilter",
      "beforeedit",
      "afteredit",
    ];

    events.forEach((eventName) => {
      try {
        grid.addEventListener(eventName, handleTableChange);
      } catch (error) {
        console.warn(`Could not add listener for ${eventName}:`, error);
      }
    });

    return () => {
      events.forEach((eventName) => {
        try {
          if (grid.removeEventListener) {
            grid.removeEventListener(eventName, handleTableChange);
          }
        } catch (error) {
          console.warn(`Could not remove listener for ${eventName}:`, error);
        }
      });
    };
  }, [scheduleAutoSave]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    const gridElement = internalGridRef.current;
    if (!gridElement || typeof gridElement.addEventListener !== "function") {
      return;
    }

    const preventHeaderSort = (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
    };

    const preventCellEditing = (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
    };

    gridElement.addEventListener("beforeheaderclick", preventHeaderSort);
    gridElement.addEventListener("beforeedit", preventCellEditing);

    return () => {
      gridElement.removeEventListener(
        "beforeheaderclick",
        preventHeaderSort
      );
      gridElement.removeEventListener("beforeedit", preventCellEditing);
    };
  }, [gridKey, isHydrated]);

  useEffect(() => {
    if (apiError) {
      console.error("[CheckPivotGrid] API Error:", apiError);
    }
  }, [apiError]);

  useEffect(() => {
    if (dataMetrics) {
      console.info("[CheckPivotGrid] Data Metrics:", dataMetrics);
    }
  }, [dataMetrics]);

  const handleClearDates = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setFilterByDate("ENTITY_DATE");
  }, []);

  const handleClearFilters = useCallback(() => {
    setAdvancedFilters({});
  }, []);

  const handleApplyDateFilter = useCallback(({ startDate: newStart, endDate: newEnd, filterByDate: newFilterByDate }) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    setFilterByDate(newFilterByDate);
  }, []);

  return (
    <div className="min-h-screen w-full p-4 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Check Pivoting
            </h1>
            <p className="text-sm text-blue-900/70 font-medium">
              Detailed check analysis and commissions
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

        <div className="flex flex-wrap gap-4 items-start">
          <div className="flex-1 min-w-0 space-y-3">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={handleClearDates}
              disabled={ytdModeEnabled}
              pageKey="check-pivot"
              filterByDate={filterByDate}
              onFilterByDateChange={setFilterByDate}
              onApply={handleApplyDateFilter}
              appliedStartDate={startDate}
              appliedEndDate={endDate}
              appliedFilterByDate={filterByDate}
            />
            
            {/* YTD Mode Toggle */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border border-purple-100 dark:border-zinc-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ytdModeEnabled}
                  onChange={(e) => setYtdModeEnabled(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  Enable YTD Mode
                </span>
              </label>
              {ytdModeEnabled && (
                <div className="ml-auto text-xs text-purple-700 dark:text-purple-300 font-medium">
                  Date filter locked
                </div>
              )}
            </div>
            
            {/* YTD Helper Text */}
            {ytdModeEnabled && (
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  YTD ranges in effect:
                </p>
                <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <div>
                    <span className="font-medium">Current YTD:</span> {formatYTDHelperText().current}
                  </div>
                  <div>
                    <span className="font-medium">Previous YTD:</span> {formatYTDHelperText().previous}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-start pt-3">
            <FilterPane
              columns={columns}
              visibleColumns={columns}
              data={transformedRows}
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              onClear={handleClearFilters}
              cacheKey={filterCacheKey}
              dataVersion={filterDataVersion}
              showYearFilter={true}
              maxFiltersPerRow={4}
            />
          </div>
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

      <Card className="shadow-xl border-0 p-0 bg-white/95 backdrop-blur-sm overflow-hidden w-full">
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {/* Check Pivoting */}
                </h2>
                {isHydrated && sourceRows.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({sortedRows.length.toLocaleString()}{sortedRows.length !== sourceRows.length ? ` of ${sourceRows.length.toLocaleString()}` : ""} records)
                  </span>
                )}
                {displayFetching && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    Fetching...
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DataDictionary />
              <RefreshButton
                hasCachedData={hasCachedData}
                onRefresh={resetCache}
                isRefreshing={isFetching}
                disabled={initialLoading}
                showStaticMessage={true}
              />
              <ExpandButton
                onClick={() => setIsFullScreen(true)}
                disabled={transformedRows.length === 0}
              />
              <DateFormatDropdown
                selectedFormat={dateFormat}
                onFormatChange={setDateFormat}
                disabled={transformedRows.length === 0}
              />
              <PivotConfigManager
                configManager={configManager}
                gridRef={gridRef}
                onConfigApplied={handleConfigApplied}
                deleteConfig={deleteConfig}
                loadConfig={loadConfig}
                saveConfig={saveCurrentConfig}
                getSavedConfigs={getSavedConfigs}
                refreshTrigger={refreshTrigger}
              />
              <button
                onClick={() => setIsSortModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                title="Configure Sorting"
              >
                <ArrowUpDown size={16} />
                <span>Sort</span>
                {sortingConfig && sortingConfig.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-purple-100 bg-opacity-30 text-white rounded-full text-xs font-semibold">
                    {sortingConfig.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setPivotConfig({
                    rows: [],
                    columns: [],
                    values: [],
                  });
                  setGridKey(prev => prev + 1);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                <span>Clean</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={isExporting || transformedRows.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                  >
                    {isExporting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    <span>Export</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onSelect={() => void exportToCSV()}
                    disabled={isExporting}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileText size={16} />
                    <span>Export CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => void exportToExcel()}
                    disabled={isExporting}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet size={16} />
                    <span>Export XLSX</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => void exportToExcelWithHeaders()}
                    disabled={isExporting}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet size={16} />
                    <span>XLSX with Headers</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="pivot-grid-container bg-white rounded-none relative w-full"
          style={{
            height: `${gridDimensions.height}px`,
            width: "100%",
            overflowX: "auto",
            overflowY: "auto",
          }}
        >
          <RevoGrid
            key={gridKey}
            ref={internalGridRef}
            hide-attribution
            range
            resize
            canMoveColumns={false}
            
            exporting={true}
            autoSizeColumn={false}
            colSize={140}
            source={
              sortedRows && Array.isArray(sortedRows)
                ? sortedRows
                : []
            }
            pinnedBottomSource={pinnedBottomRows}
            columns={columns}
            additionalData={additionalData}
            plugins={plugins}
            columnTypes={columnTypes}
            readonly={true}
            theme="compact"
            useClipboard={true}
            style={{
              "--rgRow-height": "42px",
              "--rgHeaderRow-height": "48px",
              "--rg-color-primary": "rgb(51, 65, 85)",
              "--rg-color-border": "rgb(226, 232, 240)",
              "--rg-color-header-bg": "rgb(248, 250, 252)",
              "--rg-color-header-text": "rgb(51, 65, 85)",
              "--rg-color-row-even": "rgb(255, 255, 255)",
              "--rg-color-row-odd": "rgb(248, 250, 252)",
              width: "100%",
              height: "100%",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "14px",
              fontWeight: "500",
            }}
          />

          {/* Error overlay */}
          {apiError && (
            <div className="absolute  inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-30">
              <div className="bg-white  p-8 w-full mx-4">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-red-500">
                    Data Loading Error
                  </h3>
                  <p className="text-sm text-red-500">
                    {apiError.message ||
                      "Unable to load pivot data. This often occurs with incomplete API responses."}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-700 mx-auto"></div>
                  <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-slate-300 opacity-20 mx-auto"></div>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-700 font-medium">
                    Loading pivot data from API
                  </p>
                  <p className="text-slate-500 text-sm">
                    Fetching {sourceRows?.length || "..."} records and
                    preparing analysis workspace...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Configuration Dialog */}
      <TableConfigDialog
        isOpen={isConfigDialogOpen}
        onClose={closeConfigDialog}
        configManager={configManager}
        gridRef={gridRef}
        onConfigApplied={handleConfigApplied}
        deleteConfig={deleteConfig}
        loadConfig={loadConfig}
        saveConfig={saveCurrentConfig}
        getSavedConfigs={getSavedConfigs}
        refreshTrigger={refreshTrigger}
      />

      {/* Pivot Sorting Modal */}
      <PivotSortingModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        sortingConfig={sortingConfig}
        onSortingChange={setSortingConfig}
        pivotConfig={pivotConfig}
        dimensions={columns}
        getPivotConfig={gridRef.current?.getPivotConfig}
      />

      {/* Full Screen Modal */}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        title="Check Pivot - Full Screen View"
      >
        <div
          className="pivot-grid-container bg-white rounded-lg relative w-full h-full"
          style={{
            height: "100%",
            width: "100%",
            overflowX: "auto",
            overflowY: "auto",
          }}
        >
          {isHydrated && (
            <RevoGrid
              key={`fullscreen-${gridKey}`}
              hide-attribution
              range
              resize
              canMoveColumns={false}
              
              exporting={true}
              autoSizeColumn={false}
              colSize={140}
              source={
                sortedRows && Array.isArray(sortedRows)
                  ? sortedRows
                  : []
              }
              pinnedBottomSource={pinnedBottomRows}
              columns={columns}
              additionalData={additionalData}
              plugins={plugins}
              columnTypes={columnTypes}
              readonly={true}
              theme="compact"
              useClipboard={true}
              style={{
                "--rgRow-height": "42px",
                "--rgHeaderRow-height": "48px",
                "--rg-color-primary": "rgb(51, 65, 85)",
                "--rg-color-border": "rgb(226, 232, 240)",
                "--rg-color-header-bg": "rgb(248, 250, 252)",
                "--rg-color-header-text": "rgb(51, 65, 85)",
                "--rg-color-row-even": "rgb(255, 255, 255)",
                "--rg-color-row-odd": "rgb(248, 250, 252)",
                width: "100%",
                height: "100%",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "14px",
                fontWeight: "500",
              }}
            />
          )}
        </div>
      </FullScreenModal>
    </div>
  );
}





