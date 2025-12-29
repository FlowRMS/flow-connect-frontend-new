"use client";
import React from "react";
import { useApolloClient } from "@apollo/client/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

import { KpiCards } from "@/lib/analytics/features/order-dashboard/KpiCards";
import { ComparisonTable } from "@/lib/analytics/features/order-dashboard/ComparisonTable";
import { ModeToggle } from "@/lib/analytics/features/order-dashboard/ModeToggle";
import { AuthGuard } from "@/components/analytics/auth/AuthGuard";
import { GlobalFilterPane } from "@/components/analytics/filters/GlobalFilterPane";
import { ActiveGlobalFilters } from "@/components/analytics/filters/ActiveGlobalFilters";
import {
  GlobalDashFilterProvider,
  useGlobalDashFilters,
} from "@/lib/analytics/features/order-dashboard/GlobalDashFilterContext";
import { buildBackendFilters } from "@/lib/analytics/features/order-dashboard/filters/buildFilters";
import { fetchAllComparisons } from "@/lib/analytics/features/order-dashboard/filters/fetchAllComparisons";
import { DashboardConfigManager } from "@/components/analytics/table-config/DashboardConfigManager";
import {
  fetchReportTemplates,
  upsertReportTemplate,
  deleteReportTemplate as removeReportTemplate,
} from "@/lib/analytics/lib/reportTemplateManager";
import { MonthlyBarChart } from "@/components/analytics/charts/MonthlyBarChart";
import { useChartData } from "@/lib/analytics/hooks/useChartData";

const createEmptyComparisonState = () => ({
  CUSTOMER: {},
  FACTORY: {},
  PRODUCT: {},
  OUTSIDE_SALES_REP: {},
  CUSTOMER_AND_FPN: {},
  CUSTOMER_AND_FACTORY: {},
});

const DASHBOARD_REPORT_TYPE = "DASHBOARD_REPORT";

const ensureTableSorting = (sorting = {}) => ({
  CUSTOMER: Array.isArray(sorting?.CUSTOMER) ? [...sorting.CUSTOMER] : [],
  FACTORY: Array.isArray(sorting?.FACTORY) ? [...sorting.FACTORY] : [],
  PRODUCT: Array.isArray(sorting?.PRODUCT) ? [...sorting.PRODUCT] : [],
  OUTSIDE_SALES_REP: Array.isArray(sorting?.OUTSIDE_SALES_REP) ? [...sorting.OUTSIDE_SALES_REP] : [],
  CUSTOMER_AND_FPN: Array.isArray(sorting?.CUSTOMER_AND_FPN) ? [...sorting.CUSTOMER_AND_FPN] : [],
  CUSTOMER_AND_FACTORY: Array.isArray(sorting?.CUSTOMER_AND_FACTORY) ? [...sorting.CUSTOMER_AND_FACTORY] : [],
});

const normalizeTemplateConfig = (template, fallbackConfig = {}) => {
  const parsed =
    template?.parsedConfig && typeof template.parsedConfig === "object"
      ? template.parsedConfig
      : {};

  const merged = {
    ...parsed,
    ...fallbackConfig,
  };

  const timestamp = typeof merged.timestamp === "number"
    ? merged.timestamp
    : template?.createdAt
    ? new Date(template.createdAt).getTime()
    : Date.now();

  return {
    ...merged,
    id: template?.id ?? merged.id,
    name: template?.reportTemplateName ?? merged.name ?? "",
    description: merged.description ?? "",
    timestamp,
    dashboard: merged.dashboard || {},
    tableSorting: ensureTableSorting(merged.tableSorting),
  };
};

const OrderDashboardContent = () => {
  const [valueType, setValueType] = React.useState("COMMISSION");
  const [hideSales, setHideSales] = React.useState(false);
  const [hideCommission, setHideCommission] = React.useState(false);

  // Sorting state for each table
  const [tableSorting, setTableSorting] = React.useState({
    CUSTOMER: [],
    FACTORY: [],
    PRODUCT: [],
    OUTSIDE_SALES_REP: [],
    CUSTOMER_AND_FPN: [],
    CUSTOMER_AND_FACTORY: [],
  });

  const client = useApolloClient();
  const { state: globalFilters, setState: setGlobalFilters } = useGlobalDashFilters();

  // Config management
  const [savedConfigs, setSavedConfigs] = React.useState([]);

  const backendFilters = React.useMemo(
    () => buildBackendFilters(globalFilters),
    [globalFilters]
  );

  const [comparisonData, setComparisonData] = React.useState(
    createEmptyComparisonState
  );
  const [loadingComparisons, setLoadingComparisons] = React.useState(false);
  const [comparisonError, setComparisonError] = React.useState(null);
  const chartsRef = React.useRef(null);

  const handleExportPDF = async () => {
    if (!chartsRef.current) return;

    try {
      const element = chartsRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Ensure white background
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      
      // Calculate dimensions to fit within the page with margins
      const margin = 10;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      let imgWidth = availableWidth;
      let imgHeight = (imgProps.height * availableWidth) / imgProps.width;

      // If height exceeds page, scale down
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = (imgProps.width * availableHeight) / imgProps.height;
      }

      // Center horizontally
      const x = (pdfWidth - imgWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', x, margin, imgWidth, imgHeight);
      pdf.save('dashboard-charts.pdf');
    } catch (error) {
      console.error("PDF Export failed", error);
      alert("Failed to export PDF");
    }
  };

  // Chart data hooks
  const {
    chartData: salesChartData,
    title: salesChartTitle,
    loading: salesChartLoading,
    error: salesChartError,
  } = useChartData({
    dataType: 'SALES_BY_MONTH',
    filters: backendFilters,
    skip: hideSales,
  });

  const {
    chartData: commissionChartData,
    title: commissionChartTitle,
    loading: commissionChartLoading,
    error: commissionChartError,
  } = useChartData({
    dataType: 'COMMISSIONS_BY_MONTH',
    filters: backendFilters,
    skip: hideCommission,
  });

  React.useEffect(() => {
    let isActive = true;
    setLoadingComparisons(true);
    setComparisonError(null);

    fetchAllComparisons(client, valueType, backendFilters)
      .then((result) => {
        if (!isActive) return;
        setComparisonData(result);
      })
      .catch((error) => {
        if (!isActive) return;
        console.warn("[OrderDashboard] comparison fetch failed", error);
        setComparisonData(createEmptyComparisonState());
        setComparisonError(error);
      })
      .finally(() => {
        if (!isActive) return;
        setLoadingComparisons(false);
      });

    return () => {
      isActive = false;
    };
  }, [client, valueType, backendFilters]);

  React.useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      try {
        const templates = await fetchReportTemplates(client, DASHBOARD_REPORT_TYPE);
        if (!isMounted) return;
        setSavedConfigs(
          templates
            .map((template) => normalizeTemplateConfig(template))
            .sort((a, b) => b.timestamp - a.timestamp)
        );
      } catch (error) {
        if (!isMounted) return;
        console.error("[OrderDashboard] Failed to load dashboard configs", error);
      }
    };

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, [client]);

  // Handle value type and sorting changes
  const handleValueTypeChange = (nextValueType) => {
    setValueType(nextValueType);
  };

  const handleSortingChange = (tableType, newSorting) => {
    setTableSorting((prev) => ({
      ...prev,
      [tableType]: newSorting,
    }));
  };

  // Config management functions
  const saveCurrentConfig = async (name, description = "") => {
    const timestamp = Date.now();
    const configPayload = {
      timestamp,
      name,
      description,
      dashboard: {
        valueType,
        hideSales,
        hideCommission,
        globalFilters: JSON.parse(JSON.stringify(globalFilters || {})),
      },
      tableSorting: {
        CUSTOMER: [...(tableSorting.CUSTOMER || [])],
        FACTORY: [...(tableSorting.FACTORY || [])],
        PRODUCT: [...(tableSorting.PRODUCT || [])],
        OUTSIDE_SALES_REP: [...(tableSorting.OUTSIDE_SALES_REP || [])],
        CUSTOMER_AND_FPN: [...(tableSorting.CUSTOMER_AND_FPN || [])],
      },
    };

    try {
      const template = await upsertReportTemplate(client, {
        name,
        config: configPayload,
        reportType: DASHBOARD_REPORT_TYPE,
      });

      const normalizedConfig = normalizeTemplateConfig(template, {
        ...configPayload,
        id: template.id,
      });

      setSavedConfigs((prev) => {
        const filtered = prev.filter((item) => item.id !== normalizedConfig.id);
        return [normalizedConfig, ...filtered].sort(
          (a, b) => b.timestamp - a.timestamp
        );
      });

      return normalizedConfig.id;
    } catch (error) {
      console.error("[OrderDashboard] Failed to save dashboard config", error);
      alert("Failed to save configuration. Please try again.");
      return null;
    }
  };

  const loadConfig = React.useCallback(async (configId) => {
    const config = savedConfigs.find((item) => item.id === configId);
    if (!config || !config.dashboard) return false;

    const { dashboard: dashboardConfig, tableSorting: loadedSorting } = config;
    
    if (dashboardConfig.valueType) {
      setValueType(dashboardConfig.valueType);
    }
    if (typeof dashboardConfig.hideSales === 'boolean') {
      setHideSales(dashboardConfig.hideSales);
    }
    if (typeof dashboardConfig.hideCommission === 'boolean') {
      setHideCommission(dashboardConfig.hideCommission);
    }
    if (dashboardConfig.globalFilters) {
      setGlobalFilters(JSON.parse(JSON.stringify(dashboardConfig.globalFilters)));
    }
    
    // Load sorting configuration
    if (loadedSorting) {
      setTableSorting(ensureTableSorting(loadedSorting));
    }

    return true;
  }, [savedConfigs, setGlobalFilters]);

  const deleteConfig = async (configId) => {
    try {
      await removeReportTemplate(client, configId);
      setSavedConfigs((prev) => prev.filter((config) => config.id !== configId));
      return true;
    } catch (error) {
      console.error("[OrderDashboard] Failed to delete dashboard config", error);
      alert("Failed to delete configuration. Please try again.");
      return false;
    }
  };

  // Check for pending config load from GlobalConfigManager
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const pendingLoad = sessionStorage.getItem("pendingConfigLoad");
      if (pendingLoad) {
        const pendingData = JSON.parse(pendingLoad);
        
        // Handle both old format (tableId) and new format (reportType)
        const isMatch = (pendingData.tableId === "order-dashboard") || (pendingData.reportType === DASHBOARD_REPORT_TYPE);
        if (isMatch) {
          let attempts = 0;
          const maxAttempts = 5;

          const attemptLoad = async () => {
            const loaded = await loadConfig(pendingData.configId);
            if (loaded || attempts >= maxAttempts) {
              sessionStorage.removeItem("pendingConfigLoad");
              return;
            }
            attempts += 1;
            setTimeout(attemptLoad, 500);
          };

          attemptLoad();
        }
      }
    } catch (error) {
      console.error("Error loading pending config:", error);
      sessionStorage.removeItem("pendingConfigLoad");
    }
  }, [loadConfig]);

  const tableTitleBase =
    valueType === "COMMISSION"
      ? "Commission"
      : valueType === "SALES"
      ? "Sales"
      : "Commission & Sales";

  const productLabel =
    valueType === "COMMISSION" || valueType === "BOTH"
      ? "Factory part number"
      : "Product Name";

  return (
    <div className="px-2 py-6 md:px-8 md:py-10 bg-[#f7f9fb] min-h-screen">
      <div className="flex flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Order Dashboard
          </h1>
          <p className="text-sm text-blue-900/70 font-medium">
            Dashboard overview with KPI cards and comparison tables
          </p>
        </div>
        <div className="flex gap-2">
          <DashboardConfigManager
            savedConfigs={savedConfigs}
            onSaveConfig={saveCurrentConfig}
            onLoadConfig={loadConfig}
            onDeleteConfig={deleteConfig}
          />
          <label className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition cursor-pointer">
            <input
              type="checkbox"
              checked={hideSales}
              onChange={(event) => setHideSales(event.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm">Hide Sales</span>
          </label>
          <label className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition cursor-pointer">
            <input
              type="checkbox"
              checked={hideCommission}
              onChange={(event) => setHideCommission(event.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm">Hide Commission</span>
          </label>
          
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition"
          >
            <Download size={16} />
            <span className="text-sm">Export PDF</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <KpiCards
          hideSales={hideSales}
          hideCommission={hideCommission}
        />
      </div>

      <div className="mb-4">
        <GlobalFilterPane
          valueType={valueType}
        />
      </div>

      <div className="mb-6">
        <ActiveGlobalFilters />
      </div>

      <div className="flex justify-center mb-8">
        <ModeToggle value={valueType} onChange={handleValueTypeChange} />
      </div>

      {/* Charts Section */}
      <div className="mb-8 space-y-8" ref={chartsRef}>
        {/* Commission Chart */}
        {!hideCommission && (valueType === "COMMISSION" || valueType === "BOTH") && (
          <div className="w-full">
            <MonthlyBarChart
              data={commissionChartData}
              title={commissionChartTitle || "Commission by Month"}
              loading={commissionChartLoading}
              error={commissionChartError}
              height={450}
              activeFilters={globalFilters}
            />
          </div>
        )}

        {/* Sales Chart */}
        {!hideSales && (valueType === "SALES" || valueType === "BOTH") && (
          <div className="w-full">
            <MonthlyBarChart
              data={salesChartData}
              title={salesChartTitle || "Sales by Month"}
              loading={salesChartLoading}
              error={salesChartError}
              height={450}
              activeFilters={globalFilters}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch auto-rows-fr">
        <ComparisonTable
          titleBase={tableTitleBase}
          entityLabel="Customer"
          groupingType="CUSTOMER"
          valueType={valueType}
          comparisonData={comparisonData.CUSTOMER}
          loading={loadingComparisons}
          error={comparisonError}
          className="h-full w-full"
          sortingConfig={tableSorting.CUSTOMER}
          onSortingChange={handleSortingChange}
        />

        <ComparisonTable
          titleBase={tableTitleBase}
          entityLabel="Manufacturers"
          groupingType="FACTORY"
          valueType={valueType}
          comparisonData={comparisonData.FACTORY}
          loading={loadingComparisons}
          error={comparisonError}
          className="h-full w-full"
          sortingConfig={tableSorting.FACTORY}
          onSortingChange={handleSortingChange}
        />

        <ComparisonTable
          titleBase={tableTitleBase}
          entityLabel={productLabel}
          groupingType="PRODUCT"
          valueType={valueType}
          comparisonData={comparisonData.PRODUCT}
          loading={loadingComparisons}
          error={comparisonError}
          className="h-full w-full"
          sortingConfig={tableSorting.PRODUCT}
          onSortingChange={handleSortingChange}
        />

        <ComparisonTable
          titleBase={tableTitleBase}
          entityLabel="Outside Sales Rep"
          groupingType="OUTSIDE_SALES_REP"
          valueType={valueType}
          comparisonData={comparisonData.OUTSIDE_SALES_REP}
          loading={loadingComparisons}
          error={comparisonError}
          className="h-full w-full"
          sortingConfig={tableSorting.OUTSIDE_SALES_REP}
          onSortingChange={handleSortingChange}
        />

        <ComparisonTable
          titleBase={tableTitleBase}
          entityLabel="Customer & FPN"
          groupingType="CUSTOMER_AND_FPN"
          valueType={valueType}
          comparisonData={comparisonData.CUSTOMER_AND_FPN}
          loading={loadingComparisons}
          error={comparisonError}
          className="h-full w-full"
          sortingConfig={tableSorting.CUSTOMER_AND_FPN}
          onSortingChange={handleSortingChange}
        />

        <ComparisonTable
          titleBase={tableTitleBase}
          entityLabel="Customer & Manufacturer"
          groupingType="CUSTOMER_AND_FACTORY"
          valueType={valueType}
          comparisonData={comparisonData.CUSTOMER_AND_FACTORY}
          loading={loadingComparisons}
          error={comparisonError}
          className="h-full w-full"
          sortingConfig={tableSorting.CUSTOMER_AND_FACTORY}
          onSortingChange={handleSortingChange}
        />
      </div>
    </div>
  );
};

const OrderDashboard = () => (
  <AuthGuard>
    <GlobalDashFilterProvider>
      <OrderDashboardContent />
    </GlobalDashFilterProvider>
  </AuthGuard>
);

export default OrderDashboard;




