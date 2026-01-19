"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useCommissionByStateSubscription } from "@/lib/analytics/hooks/useCommissionByStateSubscription";
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
import { UnauthorizedAccess } from "@/components/analytics/ui/UnauthorizedAccess";
import { isAuthorizationError } from "@/lib/analytics/utils/authErrors";
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
import { sumSkipNulls, percentageDiffAggregator } from "@/lib/analytics/lib/pivot/aggregators";
import { normalizePivotConfig, pivotConfigsEqual, computePivotValueTotals } from "@/lib/analytics/lib/pivot/pivotUtils";
import { formatYTDHelperText, getYTDRanges } from "@/lib/analytics/lib/pivot/ytdUtils";
import { applyPivotSorting } from "@/lib/analytics/lib/pivot/applyPivotSorting";
import { FullScreenModal, ExpandButton } from "@/components/analytics/ui/FullScreenModal";
import { DateFormatDropdown, DATE_FORMATS, formatDateByType } from "@/components/analytics/ui/DateFormatDropdown";
import { RefreshButton } from "@/components/analytics/ui/RefreshButton";
import { getDefault2YearRange } from "@/lib/analytics/utils/relativeDateUtils";

const formatDate = (value, formatType = DATE_FORMATS.DEFAULT) => {
  return formatDateByType(value, formatType);
};

// Helper function to parse currency strings like "$23,315.00" to numbers
const parseCurrency = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Remove dollar signs, commas, and any other non-numeric characters except decimal point and minus sign
    const cleaned = value.replace(/[$,]/g, "").trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export function CommissionByStatePivotGrid() {
  // Date range state - defaults to last 2 years
  const [startDate, setStartDate] = useState(() => getDefault2YearRange().startDate);
  const [endDate, setEndDate] = useState(() => getDefault2YearRange().endDate);
  const [filterByDate, setFilterByDate] = useState("ENTITY_DATE");

  // YTD Mode state
  const [ytdModeEnabled, setYtdModeEnabled] = useState(false);

  // Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState({});

  // Sorting state for pivot table
  const [sortingConfig, setSortingConfig] = useState([]);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Full-screen modal state
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Date format state
  const [dateFormat, setDateFormat] = useState(DATE_FORMATS.DEFAULT);

  const [pivotConfigState, setPivotConfigState] = useState(() =>
    normalizePivotConfig({
      rows: ["state"],
      columns: [],
      values: [{ prop: "commissions", aggregator: "sumSkipNulls" }],
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
  } = useCommissionByStateSubscription(null, startDate, endDate, filterByDate);

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

    console.log("[CommissionByStatePivotGrid] Subscription data updated:");
    console.log(JSON.stringify(logData, null, 2));

    if (subscriptionData?.getReport?.length) {
      console.log("[CommissionByStatePivotGrid] Sample of first item:", subscriptionData.getReport[0]);
    }
  }, [subscriptionData, cachedRows, apiError]);

  const sourceRows = cachedRows;
  const filterCacheKey = cacheKey;
  const filterDataVersion = lastUpdated;
  const displayFetching = isHydrated && (isFetching || initialLoading) && sourceRows.length === 0;

  const [gridDimensions, setGridDimensions] = useState({
    width: 0,
    height: 1200,
  });
  const internalGridRef = useRef(null);
  const gridRef = useRef(null);
  const containerRef = useRef(null);

  // Table configuration management
  // Use useCallback to ensure the callback always has the latest state values
  const getAdditionalState = useCallback(() => {
    console.log('[CommissionByStatePivotGrid] getAdditionalState called - advancedFilters:', advancedFilters);
    console.log('[CommissionByStatePivotGrid] getAdditionalState called - dateRange:', { startDate, endDate });
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
    "commission-by-state-pivot",
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
        const isMatch = (pendingData.tableId === "commission-by-state-pivot") || (pendingData.reportType === "COMMISSION_BY_STATE_REPORT");
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

  // Transform API data with robust error handling to prevent layout issues
  const transformedRows = useMemo(() => {
    if (!sourceRows || sourceRows.length === 0) {
      console.log("[CommissionByStatePivotGrid] No data available - returning empty array");
      return [];
    }

    const rawRecords = sourceRows;

    try {
      const validRecords = rawRecords.filter((record) => {
        const isValid =
          record &&
          typeof record === "object" &&
          record.state !== null &&
          record.state !== undefined;

        return isValid;
      });

      const transformedData = validRecords.map((record, index) => {
        const checkDateValue =
          record.checkDate || record.check_date
            ? !Number.isNaN(new Date(record.checkDate || record.check_date).getTime())
              ? new Date(record.checkDate || record.check_date)
              : null
            : null;
        const checkDateDisplay = formatDate(checkDateValue ?? (record.checkDate || record.check_date), dateFormat);

        const baseRow = {
          id: record.id || `commission_${index}`,

          // Commission period information
          commissionMonth: record.commissionMonth || record.commission_month || "N/A",
          commissionYear: record.commissionYear || record.commission_year || "N/A",

          // Order and Check IDs
          orderId: record.orderId || record.order_id || "N/A",
          checkId: record.checkId || record.check_id || "N/A",
          checkNumber: record.checkNumber || record.check_number || "N/A",

          // State and Location Information
          state: String(record.state || "Unknown State"),
          city: record.city || "N/A",
          zip: record.zip || "N/A",
          addressType: record.addressType || record.address_type || "N/A",

          // Customer/Company Information
          companyName: String(record.companyName || record.company_name || "Unknown Company"),
          parentCustomerId: record.parentCustomerId || record.parent_customer_id || "",
          parentCustomer: String(record.parentCustomer || record.parent_customer || ""),
          customerId: record.customerId || record.customer_id || "N/A",
          parentCustomerId: record.parentCustomerId || record.parent_customer_id || "",
          parentCustomer: record.parentCustomer || record.parent_customer || "",
          addressId: record.addressId || record.address_id || "N/A",
          entityId: record.entityId || record.entity_id || "N/A",
          entityNumber: record.entityNumber || record.entity_number || "N/A",
          entityType: record.entityType || record.entity_type || "N/A",
          entityDate: formatDate(record.entityDate || record.entity_date, dateFormat),

          // Factory Information
          factory: String(record.factory || "Unknown Factory"),

          // Order and Item Details
          orderDetailId: record.orderDetailId || record.order_detail_id || "N/A",
          itemNumber: record.itemNumber || record.item_number || "N/A",

          // Financial metrics - use parseCurrency helper to handle formatted strings
          sales: parseCurrency(record.sales),
          commissions: parseCurrency(record.commissions),

          // Dates (checkDate kept raw for YTD calculations)
          checkDate: checkDateDisplay,
          checkDateRaw: checkDateValue ? checkDateValue.toISOString() : null,

          // Status
          checkStatus: record.checkStatus || record.check_status || "N/A",

          // Address details
          addressLineOne: record.addressLineOne || record.address_line_one || "N/A",
          addressLineTwo: record.addressLineTwo || record.address_line_two || "N/A",
        };

        // attachYtdFields now adds commissionStateDiffPct and salesStateDiffPct as objects
        // containing { ytd, prevYtd } for correct percentage aggregation
        const rowWithYtd = attachYtdFields(baseRow, "checkDateRaw");

        return {
          ...rowWithYtd,
          checkDate: checkDateDisplay,
        };
      });

      // Calculate totals for verification
      const totalCommissions = transformedData.reduce(
        (sum, row) => sum + (row.commissions || 0),
        0
      );
      const totalSales = transformedData.reduce(
        (sum, row) => sum + (row.sales || 0),
        0
      );

      console.log("[CommissionByStatePivotGrid] Transformed", transformedData.length, "records");
      console.log("[CommissionByStatePivotGrid] Total commissions:", totalCommissions.toFixed(2));
      console.log("[CommissionByStatePivotGrid] Total sales:", totalSales.toFixed(2));
      console.log("[CommissionByStatePivotGrid] Sample record:", transformedData[0]);

      return transformedData;
    } catch (error) {
      console.error("[CommissionByStatePivotGrid] Error transforming data:", error);
      console.error("[CommissionByStatePivotGrid] Error stack:", error.stack);
      // Return empty array on error to prevent layout breaking
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
          // Use commission year if available
          if (row.commissionYear && row.commissionYear !== "N/A") {
            const year = parseInt(row.commissionYear, 10);
            if (!isNaN(year)) {
              if (advancedFilters._year === "current") {
                return year === currentYear;
              } else {
                return year >= yearThreshold;
              }
            }
          }
          // Fallback to check date
          const dateStr = row.checkDateRaw || row.checkDate;
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
      if (columnProp === "_year") return; // Skip year filter as it's already applied

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

  // Apply sorting with pivot awareness so value columns use aggregated totals
  const sortedRows = useMemo(() => {
    return applyPivotSorting({
      rows: filteredRows,
      sortingConfig,
      pivotConfig: pivotConfigState,
    });
  }, [filteredRows, sortingConfig, pivotConfigState]);

  // Performance metrics for monitoring with filtered record tracking
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
        totalCommissions: sortedRows.reduce(
          (sum, row) => sum + (row.commissions || 0),
          0
        ),
        totalSales: sortedRows.reduce(
          (sum, row) => sum + (row.sales || 0),
          0
        ),
        avgCommission:
          sortedRows.length > 0
            ? sortedRows.reduce(
              (sum, row) => sum + (row.commissions || 0),
              0
            ) / sortedRows.length
            : 0,
        uniqueStates: new Set(
          sortedRows.map((row) => row.state).filter(Boolean)
        ).size,
        uniqueCustomers: new Set(
          sortedRows.map((row) => row.customerId).filter(Boolean)
        ).size,
      };

      return metrics;
    } catch (error) {
      console.error("[CommissionByStatePivotGrid] Error calculating metrics:", error);
      return null;
    }
  }, [sortedRows, filteredRows, sourceRows, transformedRows]);

  // Loading state - only show loading if actually loading and no error
  const isLoading =
    isHydrated &&
    (initialLoading || isFetching) &&
    !apiError &&
    sourceRows.length === 0;

  // Calculate totals row for pinned bottom
  const totalsRow = useMemo(() => {
    if (!sortedRows || sortedRows.length === 0) return null;

    const currencyFields = ["commissions", "sales"];

    const totals = {
      id: "TOTAL_ROW",
      state: "TOTAL",
      companyName: "",
      city: "",
      zip: "",
      addressType: "",
      commissionMonth: "",
      commissionYear: "",
      orderId: "",
      checkId: "",
      checkNumber: "",
      checkDate: "",
      checkStatus: "",
      parentCustomerId: "",
      parentCustomer: "",
      customerId: "",
      addressId: "",
      entityId: "",
      entityNumber: "",
      entityType: "",
      entityDate: "",
      factory: "",
      orderDetailId: "",
      itemNumber: "",
      addressLineOne: "",
      addressLineTwo: "",
    };

    const accumulate = (field) => {
      totals[field] = sumSkipNulls(sortedRows.map((row) => row?.[field]));
    };

    currencyFields.forEach(accumulate);

    const pivotValueTotals = computePivotValueTotals(sortedRows, pivotConfigState);
    Object.assign(totals, pivotValueTotals);

    return totals;
  }, [sortedRows, pivotConfigState]);

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
              "[CommissionByStatePivotGrid] Failed to retrieve grid data, falling back to sortedRows:",
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
          sheetName: "Commission by State Pivot Data",
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
      filenamePrefix: "commission-by-state-pivot",
    });
  }, [runPivotExcelExport]);

  const exportToExcelWithHeaders = useCallback(async () => {
    await runPivotExcelExport({
      includeHeaderInfo: true,
      filenamePrefix: "commission-by-state-pivot-with-headers",
      reportTitle: "Commission by State Pivot Report",
    });
  }, [runPivotExcelExport]);

  const exportToCSV = useCallback(async () => {
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
            "[CommissionByStatePivotGrid] Failed to retrieve grid data for CSV, falling back to sortedRows:",
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
      const filename = `commission-by-state-pivot-${dateStamp}`;

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
  }, [sortedRows, totalsRow, resolveColumnsForExport]);

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

  // Clean up sorting config when pivot configuration changes and force grid remount
  useEffect(() => {
    if (!pivotConfig) return;

    // Get all currently visible column props from pivot config
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

    // Remove any sorting columns that are no longer visible in the pivot
    setSortingConfig(currentSorting => {
      if (!currentSorting || currentSorting.length === 0) return currentSorting;

      const cleanedSorting = currentSorting.filter(sortCol => visibleProps.has(sortCol.prop));

      // Only update if something changed to avoid infinite loops
      if (cleanedSorting.length !== currentSorting.length) {
        console.log('[CommissionByStatePivotGrid] Cleaning up sorting config - removed columns no longer in pivot');
        return cleanedSorting;
      }

      return currentSorting;
    });

    // Force grid remount when pivot config changes to ensure totals and sorting are properly applied
    setGridKey(prev => prev + 1);
    console.log('[CommissionByStatePivotGrid] Pivot config changed, incrementing gridKey to force remount');
  }, [pivotConfig]);

  useEffect(() => {
    const gridElement = internalGridRef.current;
    if (!gridElement) return;

    const handlePivotUpdate = (event) => {
      const detail = event?.detail;
      if (!detail || typeof detail !== "object") return;

      console.log('[CommissionByStatePivotGrid] Pivot config updated via grid:', detail);

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
            prop: "commissions",
            name: "Commissions",
            columnType: "currency",
            size: 160,
            minSize: 130,
            sortable: true,
            aggregators: {
              sum: commonAggregators.sum,
              sumSkipNulls: sumSkipNulls,
              avg: commonAggregators.avg,
              count: commonAggregators.count,
              max: commonAggregators.max,
              min: commonAggregators.min,
            },
          },
          {
            prop: "sales",
            name: "Sales",
            columnType: "currency",
            size: 160,
            minSize: 130,
            sortable: true,
            aggregators: {
              sum: commonAggregators.sum,
              sumSkipNulls: sumSkipNulls,
              avg: commonAggregators.avg,
              max: commonAggregators.max,
              min: commonAggregators.min,
            },
          },
        ] : []),
        // Show YTD measures only in YTD Mode
        ...(ytdModeEnabled ? [
          {
            prop: "commissionsYTD",
            name: "Commissions YTD",
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
            prop: "commissionsPrevYTD",
            name: "Commissions Previous YTD",
            columnType: "currency",
            size: 220,
            minSize: 190,
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
            prop: "commissionStateDiff",
            name: "Commission Difference",
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
            prop: "commissionStateDiffPct",
            name: "Commission Difference %",
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
            prop: "salesYTD",
            name: "Sales YTD",
            columnType: "currency",
            size: 160,
            minSize: 130,
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
            prop: "salesPrevYTD",
            name: "Sales Previous YTD",
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
            prop: "salesStateDiff",
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
            prop: "salesStateDiffPct",
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

        // Dimensional Data - for grouping and filtering
        {
          prop: "orderId",
          name: "Order ID",
          sortable: true,
          size: 130,
          minSize: 100,
        },
        {
          prop: "checkId",
          name: "Check ID",
          sortable: true,
          size: 130,
          minSize: 100,
        },
        {
          prop: "checkNumber",
          name: "Check Number",
          sortable: true,
          size: 140,
          minSize: 110,
        },
        {
          prop: "state",
          name: "State",
          sortable: true,
          size: 150,
          minSize: 100,
        },
        {
          prop: "companyName",
          name: "Company Name",
          sortable: true,
          size: 200,
          minSize: 150,
        },
        {
          prop: "parentCustomerId",
          name: "Parent Customer ID",
          sortable: true,
          size: 160,
          minSize: 130,
        },
        {
          prop: "parentCustomer",
          name: "Parent Customer",
          sortable: true,
          size: 180,
          minSize: 150,
        },
        {
          prop: "factory",
          name: "Factory",
          sortable: true,
          size: 140,
          minSize: 100,
        },
        {
          prop: "city",
          name: "City",
          sortable: true,
          size: 130,
          minSize: 100,
        },
        {
          prop: "entityType",
          name: "Entity Type",
          sortable: true,
          size: 140,
          minSize: 100,
        },
        {
          prop: "checkStatus",
          name: "Check Status",
          sortable: true,
          size: 140,
          minSize: 100,
        },
        {
          prop: "commissionMonth",
          name: "Commission Month",
          sortable: true,
          size: 150,
          minSize: 120,
        },
        {
          prop: "commissionYear",
          name: "Commission Year",
          sortable: true,
          size: 140,
          minSize: 110,
        },
        {
          prop: "checkDate",
          name: "Check Date",
          sortable: true,
          size: 120,
          minSize: 100,
        },
        {
          prop: "entityNumber",
          name: "Entity Number",
          sortable: true,
          size: 140,
          minSize: 110,
        },
        {
          prop: "itemNumber",
          name: "Item Number",
          sortable: true,
          size: 130,
          minSize: 100,
        },
        {
          prop: "zip",
          name: "ZIP Code",
          sortable: true,
          size: 110,
          minSize: 80,
        },
        {
          prop: "addressType",
          name: "Address Type",
          sortable: true,
          size: 130,
          minSize: 100,
        },
      ],
      // Use pivot configuration from state
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

  // Use dimensions from config as columns to avoid duplication
  const columns = useMemo(() => config.dimensions, [config]);

  // Effect to ensure totals are refreshed when grid is ready
  useEffect(() => {
    const gridElement = internalGridRef.current;
    if (!gridElement || !totalsRow) return;

    const timeoutId = setTimeout(() => {
      // Ensure pinned bottom is set
      gridElement.pinnedBottomSource = pinnedBottomRows;

      // Force a refresh to show totals
      if (gridElement.refresh) {
        gridElement.refresh();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [totalsRow, pinnedBottomRows]);

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
          "[CommissionByStatePivotGrid] Failed to retrieve columns from grid for export:",
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

  // Expose methods to get/set pivot configuration for TableConfigManager
  useEffect(() => {
    if (!gridRef.current) {
      gridRef.current = {};
    }

    // Add custom pivot configuration methods
    gridRef.current.getPivotConfig = async () => {
      console.log("[CommissionByStatePivotGrid] Getting pivot config from React state:", pivotConfig);

      // Try to get the ACTUAL pivot state from the plugin
      if (internalGridRef.current) {
        try {
          const plugins = await internalGridRef.current.getPlugins();
          const pivotPlugin = plugins.find(p => p.pivotRows || p.pivotColumns || p.pivotValues);

          if (pivotPlugin) {
            console.log("[CommissionByStatePivotGrid] Found pivot plugin with state:", pivotPlugin);
            console.log("[CommissionByStatePivotGrid] Plugin keys:", Object.keys(pivotPlugin));
            console.log("[CommissionByStatePivotGrid] Plugin.pivotConfig:", pivotPlugin.pivotConfig);

            // The PivotPlugin stores configuration in pivotConfig property
            const pluginConfig = pivotPlugin.pivotConfig || {};
            console.log("[CommissionByStatePivotGrid] Plugin.pivotConfig.rows:", pluginConfig.rows);
            console.log("[CommissionByStatePivotGrid] Plugin.pivotConfig.columns:", pluginConfig.columns);
            console.log("[CommissionByStatePivotGrid] Plugin.pivotConfig.values:", pluginConfig.values);

            // Helper to normalize fields to strings (extract prop from objects)
            const normalizeFieldArray = (fields) => {
              if (!Array.isArray(fields)) return [];
              return fields.map(field => {
                if (typeof field === 'string') return field;
                if (field && typeof field === 'object' && field.prop) return field.prop;
                return null;
              }).filter(Boolean);
            };

            // Extract the actual configuration from the plugin and normalize to strings only
            // IMPORTANT: Preserve the user's configuration exactly as they set it
            const actualConfig = {
              rows: normalizeFieldArray(pluginConfig.rows),
              columns: normalizeFieldArray(pluginConfig.columns),
              values: normalizeFieldArray(pluginConfig.values),
            };

            console.log("[CommissionByStatePivotGrid] Actual pivot config from plugin (preserved as-is):", actualConfig);

            return {
              ...actualConfig,
              pluginState: {
                dimensions: columns,
              }
            };
          }
        } catch (error) {
          console.warn("[CommissionByStatePivotGrid] Could not get pivot plugin state:", error);
        }
      }

      // Fallback to React state if plugin not available
      console.warn("[CommissionByStatePivotGrid] Using fallback React state (may be outdated)");
      return {
        ...pivotConfig,
        pluginState: {
          dimensions: columns,
        }
      };
    };

    gridRef.current.setPivotConfig = (newConfig) => {
      console.log("[CommissionByStatePivotGrid] Setting pivot config:", newConfig);
      if (newConfig && typeof newConfig === 'object') {
        setPivotConfig({
          rows: newConfig.rows || pivotConfig.rows,
          columns: newConfig.columns || pivotConfig.columns,
          values: newConfig.values || pivotConfig.values,
        });
        // Force grid remount to apply new pivot configuration
        setGridKey(prev => prev + 1);
        console.log("[CommissionByStatePivotGrid] Forcing grid re-render with new key");
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
        // Force grid remount to apply new pivot configuration
        setGridKey(prev => prev + 1);
        console.log("[CommissionByStatePivotGrid] Forcing grid re-render with new key (setPivotState)");
        return true;
      }
      return false;
    };
    gridRef.current.getSelectedRows = () => [];
    gridRef.current.setSelectedRows = () => true;
    gridRef.current.getSelectedCells = () => [];

    // Also expose grid element methods if available
    if (internalGridRef.current) {
      const gridElement = internalGridRef.current;
      gridRef.current.getPlugins = gridElement.getPlugins?.bind(gridElement);
    }
  }, [pivotConfig, columns, setPivotConfig]);

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
      console.error("[CommissionByStatePivotGrid] API Error:", apiError);
    }
  }, [apiError]);

  useEffect(() => {
    if (dataMetrics) {
      console.info("[CommissionByStatePivotGrid] Data Metrics:", dataMetrics);
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
              Commission by State Pivot
            </h1>
            <p className="text-sm text-blue-900/70 font-medium">
              State-based commission analysis and insights
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap gap-4 items-start">
          <div className="flex-1 min-w-0 space-y-3">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={handleClearDates}
              disabled={ytdModeEnabled}
              pageKey="commission-pivot"
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
              filterMessages={{
                checkStatus: "Enabling this filter will show ONLY posted checks"
              }}
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
            startDate || endDate
              ? { startDate, endDate }
              : null
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
                {/* <h2 className="text-2xl font-semibold text-gray-900">
                  Commission by State Pivot
                </h2> */}
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
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
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
          {isHydrated && (
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
          )}

          {/* Authorization Error - shows when user doesn't have permission */}
          {apiError && isAuthorizationError(apiError) && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-30 p-4">
              <UnauthorizedAccess
                error={apiError}
                resourceName="Commission by State Pivot"
                variant="card"
              />
            </div>
          )}

          {/* Error overlay - shows over the grid without breaking layout */}
          {apiError && !isAuthorizationError(apiError) && (
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

          {/* Loading overlay - shows over the grid without breaking layout */}
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

      {/* <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 rounded-full p-2 mt-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">
                  Drag & Drop
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Reorganize dimensions by dragging fields between Rows,
                  Columns, and Values areas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-emerald-500 rounded-full p-2 mt-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">
                  Advanced Filtering
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Use column headers to filter data and refine your analysis
                  with precision
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-500 rounded-full p-2 mt-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">
                  Smart Aggregation
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Change aggregation methods (Sum, Average, Count, Min, Max) for
                  numerical fields
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Full Screen Modal */}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        title="Commission by State Pivot - Full Screen View"
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





