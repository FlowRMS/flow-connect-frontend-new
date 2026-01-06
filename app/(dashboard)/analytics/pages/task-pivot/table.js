"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useTaskDetailSubscription } from "@/lib/analytics/hooks/useTaskDetailSubscription";
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
import { normalizePivotConfig, pivotConfigsEqual } from "@/lib/analytics/lib/pivot/pivotUtils";
import { FullScreenModal, ExpandButton } from "@/components/analytics/ui/FullScreenModal";
import { DateFormatDropdown, DATE_FORMATS, formatDateByType } from "@/components/analytics/ui/DateFormatDropdown";
import { RefreshButton } from "@/components/analytics/ui/RefreshButton";
import { toNumericSortValue } from "@/lib/analytics/lib/pivot/sortHelpers";

const formatDate = (value, formatType = DATE_FORMATS.DEFAULT) => {
  return formatDateByType(value, formatType);
};

export function TaskPivotGrid() {
  // Date range state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterByDate, setFilterByDate] = useState("ENTITY_DATE");

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
      rows: ["status", "priority"],
      columns: [],
      values: [{ prop: "title", aggregator: "count" }],
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
  } = useTaskDetailSubscription(null, startDate, endDate, filterByDate);

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

    console.log("[TaskPivotGrid] Subscription data updated:");
    console.log(JSON.stringify(logData, null, 2));

    if (subscriptionData?.getReport?.length) {
      console.log("[TaskPivotGrid] Sample of first item:", subscriptionData.getReport[0]);
    }
  }, [subscriptionData, cachedRows, apiError]);

  const sourceRows = cachedRows;
  const filterCacheKey = cacheKey;
  const filterDataVersion = lastUpdated;
  const displayFetching =
    isHydrated && (isFetching || initialLoading) && sourceRows.length === 0;

  const [gridDimensions, setGridDimensions] = useState({
    width: 0,
    height: 1200,
  });
  const internalGridRef = useRef(null);
  const gridRef = useRef(null);
  const containerRef = useRef(null);

  // Table configuration management
  const getAdditionalState = useCallback(() => {
    console.log('[TaskPivotGrid] getAdditionalState called - advancedFilters:', advancedFilters);
    console.log('[TaskPivotGrid] getAdditionalState called - dateRange:', { startDate, endDate });
    console.log('[TaskPivotGrid] getAdditionalState called - sorting:', sortingConfig);
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
    closeConfigDialog,
    handleConfigApplied,
    scheduleAutoSave,
    refreshTrigger,
  } = useTableConfig(
    gridRef,
    "task-pivot",
    getAdditionalState
  );

  // Check for pending config load from GlobalConfigManager
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const pendingLoad = sessionStorage.getItem("pendingConfigLoad");
      if (pendingLoad) {
        const pendingData = JSON.parse(pendingLoad);

        const isMatch = (pendingData.tableId === "task-pivot") || (pendingData.reportType === "PIVOT_TASK_REPORT");
        if (isMatch) {
          sessionStorage.removeItem("pendingConfigLoad");
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
            "[TaskPivotGrid] Failed to retrieve grid data for CSV:",
            error
          );
        }
      }

      if (exportColumns.length === 0) {
        exportColumns = await resolveColumnsForExport();
      }

      if (exportRows.length === 0) {
        console.warn("[TaskPivotGrid] No data to export");
        return;
      }

      const dateStamp = new Date().toISOString().split("T")[0];
      const filename = `task-pivot-${dateStamp}`;

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
  }, []);

  // Transform API data with robust error handling
  const transformedRows = useMemo(() => {
    if (!sourceRows || sourceRows.length === 0) {
      console.log("[TaskPivotGrid] No data available - returning empty array");
      return [];
    }

    const rawRecords = sourceRows;

    try {
      const validRecords = rawRecords.filter((record) => {
        const isValid =
          record &&
          typeof record === "object" &&
          record.title !== null &&
          record.title !== undefined &&
          record.title !== "";

        return isValid;
      });

      const transformedData = validRecords.map((record, index) => {
        const dueDateValue =
          record.dueDate && !Number.isNaN(new Date(record.dueDate).getTime())
            ? new Date(record.dueDate)
            : null;
        const dueDateIso = dueDateValue
          ? dueDateValue.toISOString()
          : typeof record.dueDate === "string"
          ? record.dueDate
          : null;
        const dueDateDisplay = formatDate(dueDateValue ?? record.dueDate, dateFormat);

        const reminderDateValue =
          record.reminderDate && !Number.isNaN(new Date(record.reminderDate).getTime())
            ? new Date(record.reminderDate)
            : null;
        const reminderDateDisplay = formatDate(reminderDateValue ?? record.reminderDate, dateFormat);

        return {
          id: record.id || `task_${index}`,
          title: String(record.title || "Unknown Task"),
          status: record.status || "Unknown",
          priority: record.priority || "Normal",
          description: record.description || "N/A",

          // Dates
          dueDate: dueDateDisplay,
          dueDateRaw: dueDateIso,
          reminderDate: reminderDateDisplay,
          createdAt: formatDate(record.createdAt, dateFormat),

          // People
          assignedTo: record.assignedTo || "Unassigned",
          createdBy: record.createdBy || "N/A",
        };
      });

      return transformedData;
    } catch (error) {
      console.error("[TaskPivotGrid] Error transforming data:", error);
      console.error("[TaskPivotGrid] Error stack:", error.stack);
      return [];
    }
  }, [sourceRows, dateFormat]);

  // Apply advanced filters to transformed rows
  const filteredRows = useMemo(() => {
    let filtered = [...transformedRows];

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
          const dateStr = row.dueDateRaw;
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

  // Performance metrics
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
        uniqueStatuses: new Set(
          sortedRows.map((row) => row.status).filter(Boolean)
        ).size,
        uniquePriorities: new Set(
          sortedRows.map((row) => row.priority).filter(Boolean)
        ).size,
      };

      return metrics;
    } catch (error) {
      console.error("[TaskPivotGrid] Error calculating metrics:", error);
      return null;
    }
  }, [filteredRows, sourceRows, transformedRows]);

  // Loading state
  const isLoading =
    isHydrated &&
    (initialLoading || isFetching) &&
    !apiError &&
    sourceRows.length === 0;

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
              "[TaskPivotGrid] Failed to retrieve grid data, falling back to sortedRows:",
              error
            );
          }
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
          sheetName: "Task Pivot Data",
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
      sortedRows,
      sortingConfig,
      startDate,
    ]
  );

  const exportToExcel = useCallback(async () => {
    await runPivotExcelExport({
      includeHeaderInfo: false,
      filenamePrefix: "task-pivot",
    });
  }, [runPivotExcelExport]);

  const exportToExcelWithHeaders = useCallback(async () => {
    await runPivotExcelExport({
      includeHeaderInfo: true,
      filenamePrefix: "task-pivot-with-headers",
      reportTitle: "Task Pivot Report",
    });
  }, [runPivotExcelExport]);

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
      integer: new NumberColumnType("0,0"),
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
        console.log('[TaskPivotGrid] Cleaning up sorting config - removed columns no longer in pivot');
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
        // Dimensional Data - for grouping and filtering
        {
          prop: "title",
          name: "Task Title",
          sortable: true,
          size: 200,
          minSize: 150,
          aggregators: {
            count: commonAggregators.count,
          },
        },
        {
          prop: "status",
          name: "Status",
          sortable: true,
          size: 140,
          minSize: 100,
        },
        {
          prop: "priority",
          name: "Priority",
          sortable: true,
          size: 120,
          minSize: 90,
        },
        {
          prop: "assignedTo",
          name: "Assigned To",
          sortable: true,
          size: 160,
          minSize: 120,
        },
        {
          prop: "createdBy",
          name: "Created By",
          sortable: true,
          size: 150,
          minSize: 120,
        },
        {
          prop: "dueDate",
          name: "Due Date",
          sortable: true,
          size: 140,
          minSize: 110,
        },
        {
          prop: "reminderDate",
          name: "Reminder Date",
          sortable: true,
          size: 140,
          minSize: 110,
        },
        {
          prop: "createdAt",
          name: "Created At",
          sortable: true,
          size: 140,
          minSize: 110,
        },
        {
          prop: "description",
          name: "Description",
          sortable: true,
          size: 200,
          minSize: 150,
        },
      ],
      rows: pivotConfig.rows,
      columns: pivotConfig.columns,
      values: pivotConfig.values,
      hasConfigurator: true,
      flatHeaders: true,
      aggregatorNames: {
        count: "Count",
      },
    }),
    [pivotConfig]
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
          "[TaskPivotGrid] Failed to retrieve columns from grid for export:",
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

  // Expose methods for TableConfigManager
  useEffect(() => {
    if (!gridRef.current) {
      gridRef.current = {};
    }

    gridRef.current.getPivotConfig = async () => {
      console.log("[TaskPivotGrid] Getting pivot config from React state:", pivotConfig);

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
            };

            return {
              ...actualConfig,
              pluginState: {
                dimensions: columns,
              }
            };
          }
        } catch (error) {
          console.warn("[TaskPivotGrid] Could not get pivot plugin state:", error);
        }
      }

      return {
        ...pivotConfig,
        pluginState: {
          dimensions: columns,
        }
      };
    };

    gridRef.current.setPivotConfig = (newConfig) => {
      console.log("[TaskPivotGrid] Setting pivot config:", newConfig);
      if (newConfig && typeof newConfig === 'object') {
        setPivotConfig({
          rows: newConfig.rows || pivotConfig.rows,
          columns: newConfig.columns || pivotConfig.columns,
          values: newConfig.values || pivotConfig.values,
        });
        setGridKey(prev => prev + 1);
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
        setGridKey(prev => prev + 1);
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
      gridElement.removeEventListener("beforeheaderclick", preventHeaderSort);
      gridElement.removeEventListener("beforeedit", preventCellEditing);
    };
  }, [gridKey, isHydrated]);

  useEffect(() => {
    if (apiError) {
      console.error("[TaskPivotGrid] API Error:", apiError);
    }
  }, [apiError]);

  useEffect(() => {
    if (dataMetrics) {
      console.info("[TaskPivotGrid] Data Metrics:", dataMetrics);
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
              Task Pivot
            </h1>
            <p className="text-sm text-blue-900/70 font-medium">
              Task analysis by status, priority, and assignee
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
              pageKey="task-pivot"
              filterByDate={filterByDate}
              onFilterByDateChange={setFilterByDate}
              onApply={handleApplyDateFilter}
              appliedStartDate={startDate}
              appliedEndDate={endDate}
              appliedFilterByDate={filterByDate}
            />
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

          {/* Error overlay */}
          {apiError && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-30">
              <div className="bg-white p-8 w-full mx-4">
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

      {/* Sorting Configuration Modal */}
      <PivotSortingModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        sortingConfig={sortingConfig || []}
        onSortingChange={(newSorting) => {
          console.log('[TaskPivotGrid] Applying sorting:', newSorting);
          setSortingConfig(newSorting);
        }}
        pivotConfig={pivotConfig}
        dimensions={columns}
        getPivotConfig={gridRef.current?.getPivotConfig}
      />

      {/* Full Screen Modal */}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        title="Task Pivot - Full Screen View"
      >
        <div
          ref={containerRef}
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
