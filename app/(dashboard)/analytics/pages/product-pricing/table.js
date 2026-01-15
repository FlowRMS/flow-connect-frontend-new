"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useQuery } from "@apollo/client/react";
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
import { Card } from "@/components/analytics/ui/card";
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
import { calculateRelativeDateRange, formatDateForInput } from "@/lib/analytics/utils/relativeDateUtils";
import "@/app/analytics-styles/pivot-table.css";
import {
  Loader2,
  Download,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
} from "lucide-react";
import { exportGridCsv, exportGridXlsxWithHeaders } from "@/lib/analytics/utils/exportGridCsv";
import { sumSkipNulls } from "@/lib/analytics/lib/pivot/aggregators";
import { normalizePivotConfig, pivotConfigsEqual, computePivotValueTotals } from "@/lib/analytics/lib/pivot/pivotUtils";
import { applyPivotSorting } from "@/lib/analytics/lib/pivot/applyPivotSorting";
import { FullScreenModal, ExpandButton } from "@/components/analytics/ui/FullScreenModal";
import { PRODUCT_PRICING_QUERY, FACTORIES_QUERY, CUSTOMERS_SEARCH_QUERY } from "./queries";

// Sparkline SVG component for inline price trend visualization
const SparklineSVG = ({ values, width = 80, height = 24, color = "#3b82f6" }) => {
  if (!values || values.length < 2) return null;
  
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((v - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Mini bar chart for price distribution
const PriceRangeBar = ({ low, high, avg, width = 100, height = 20 }) => {
  if (low === undefined || high === undefined) return null;
  
  const range = high - low;
  const avgPosition = range > 0 ? ((avg - low) / range) * 100 : 50;
  
  return (
    <div className="relative" style={{ width, height }}>
      {/* Background bar */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded"
        style={{ height: height - 4, top: 2 }}
      />
      {/* Average marker */}
      <div 
        className="absolute w-0.5 bg-blue-600 rounded"
        style={{ 
          left: `${avgPosition}%`, 
          height: height,
          top: 0,
        }}
      />
    </div>
  );
};

export function ProductPricingPivotGrid() {
  // Initialize with Last 30 Days date range
  const getDefaultDateRange = () => {
    const dateRange = calculateRelativeDateRange("last30days");
    return {
      start: formatDateForInput(dateRange.startDate),
      end: formatDateForInput(dateRange.endDate),
    };
  };

  // Date range state - auto-select Last 30 Days
  const defaultDates = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [appliedStartDate, setAppliedStartDate] = useState(defaultDates.start);
  const [appliedEndDate, setAppliedEndDate] = useState(defaultDates.end);

  // Filter state
  const [selectedFactoryId, setSelectedFactoryId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedParentCustomerId, setSelectedParentCustomerId] = useState(null);

  // Advanced filter state for pivot
  const [advancedFilters, setAdvancedFilters] = useState({});

  // Sorting state
  const [sortingConfig, setSortingConfig] = useState([]);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Column visibility state - default visible columns
  const [visibleColumns, setVisibleColumns] = useState([
    "factoryPartNumber",
    "productDescription", 
    "lowestPrice",
    "highestPrice",
    "averagePrice",
    "priceTrend", // Sparkline column
  ]);

  // Full-screen modal state
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Pivot config state - we'll compute this dynamically based on visible columns
  // For a flat table view, all visible columns go in rows
  const pivotConfig = useMemo(() => {
    // Put all visible columns in rows for a flat table view (not aggregated)
    return normalizePivotConfig({
      rows: visibleColumns,
      columns: [],
      values: [],
    });
  }, [visibleColumns]);

  // No-op since pivot config is computed from visible columns
  const setPivotConfig = useCallback(() => {
    // Pivot config is now computed from visibleColumns, so we don't need to update it
  }, []);

  // Handle apply button from DateRangeFilter
  const handleApplyFilters = useCallback(
    ({ startDate: appliedStart, endDate: appliedEnd }) => {
      if (appliedStart && appliedEnd) {
        setAppliedStartDate(appliedStart);
        setAppliedEndDate(appliedEnd);
      }
    },
    []
  );

  // GraphQL query for pricing data
  const { data, loading, error, refetch } = useQuery(PRODUCT_PRICING_QUERY, {
    variables: {
      startDate: appliedStartDate || null,
      endDate: appliedEndDate || null,
      factoryId: selectedFactoryId,
      customerId: selectedCustomerId,
      parentCustomerId: selectedParentCustomerId,
    },
    skip: !appliedStartDate || !appliedEndDate,
    fetchPolicy: "cache-and-network",
  });

  // Fetch factories for filter
  const { data: factoriesData } = useQuery(FACTORIES_QUERY);

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Transform API data to rows
  const transformedRows = useMemo(() => {
    if (!data?.productPricing || data.productPricing.length === 0) {
      return [];
    }

    return data.productPricing.map((item, index) => {
      const lowestPrice = parseFloat(item.lowestPrice) || 0;
      const highestPrice = parseFloat(item.highestPrice) || 0;
      const averagePrice = parseFloat(item.averagePrice) || 0;
      const priceRange = highestPrice - lowestPrice;
      const priceVariance = averagePrice > 0 ? ((highestPrice - lowestPrice) / averagePrice * 100) : 0;

      return {
        id: `pricing_${index}`,
        factoryPartNumber: item.factoryPartNumber || "N/A",
        productDescription: item.productDescription || "N/A",
        lowestPrice,
        highestPrice,
        averagePrice,
        priceRange,
        priceVariance,
        orderCount: item.orderCount || 0,
        customerCount: item.customerCount || 0,
        factory: item.factory || "All",
        factoryId: item.factoryId,
        // For sparkline visualization (mock trend data based on prices)
        priceTrend: [lowestPrice, averagePrice * 0.95, averagePrice, averagePrice * 1.02, highestPrice].filter(Boolean),
      };
    });
  }, [data]);

  // Apply advanced filters
  const filteredRows = useMemo(() => {
    let filtered = [...transformedRows];

    Object.keys(advancedFilters).forEach((columnProp) => {
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

  // Apply sorting
  const sortedRows = useMemo(() => {
    return applyPivotSorting({
      rows: filteredRows,
      sortingConfig,
      // pivotConfig: pivotConfigState,
    });
  }, [filteredRows, sortingConfig]);

  // Calculate min/max for data bars (Excel-style visualization)
  const columnRanges = useMemo(() => {
    if (!sortedRows || sortedRows.length === 0) return {};
    
    const ranges = {};
    const priceColumns = ['lowestPrice', 'highestPrice', 'averagePrice', 'priceRange'];
    
    priceColumns.forEach(col => {
      const values = sortedRows.map(r => r[col]).filter(v => v != null && !isNaN(v));
      if (values.length > 0) {
        ranges[col] = {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    });
    
    return ranges;
  }, [sortedRows]);

  // Bar chart renderer function for price comparison (lowest, highest, average)
  const createPriceBarChartCell = useCallback((h, props) => {
    const lowestPrice = props.model.lowestPrice || 0;
    const highestPrice = props.model.highestPrice || 0;
    const averagePrice = props.model.averagePrice || 0;
    
    if (lowestPrice === 0 && highestPrice === 0) {
      return h('span', { class: 'text-gray-400 text-xs' }, 'N/A');
    }
    
    // Store price data in data attributes, JavaScript will render the bar chart
    // Include a non-breaking space to ensure the element renders
    return h('div', {
      class: 'revo-price-bar-chart-container',
      'data-lowest-price': String(lowestPrice),
      'data-highest-price': String(highestPrice),
      'data-average-price': String(averagePrice)
    }, '\u00A0'); // Non-breaking space as placeholder
  }, []);

  // Data bar renderer function (Excel-style) - useCallback to capture latest columnRanges
  const createDataBarCell = useCallback((h, props, columnProp, color = '#3b82f6') => {
    const value = props.model[columnProp] || 0;
    const range = columnRanges[columnProp];
    
    // Use neutral gray text - let the data bars provide the visualization
    const textColor = 'text-gray-700';
    
    if (!range || range.max === range.min) {
      // No range or all values same, just show value
      return h('span', { 
        class: `${textColor} font-semibold text-sm`
      }, `$${value.toFixed(2)}`);
    }
    
    const percentage = ((value - range.min) / (range.max - range.min)) * 100;
    const barWidth = Math.max(2, Math.min(100, percentage)); // Clamp between 2% and 100%
    
    // Return a simple div with data attributes - CSS will handle the bar via ::before
    return h('div', {
      class: `revo-data-bar-container ${textColor} font-semibold text-sm`,
      'data-bar-width': barWidth,
      'data-bar-color': color
    }, `$${value.toFixed(2)}`);
  }, [columnRanges]);

  // Grid dimensions
  const [gridDimensions, setGridDimensions] = useState({
    width: 0,
    height: 800,
  });
  const internalGridRef = useRef(null);
  const gridRef = useRef(null);
  const containerRef = useRef(null);

  // Handle resize
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setGridDimensions({
        width: rect.width,
        height: Math.max(600, window.innerHeight - 350),
      });
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Column types
  const columnTypes = useMemo(
    () => ({
      currency: new NumberColumnType("$0,0.00"),
      integer: new NumberColumnType("0,0"),
      percentage: new NumberColumnType("0.00%"),
    }),
    []
  );

  // Plugins
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

  // Grid key for forcing re-render
  const [gridKey, setGridKey] = useState(0);

  // All available columns configuration
  const allColumns = useMemo(
    () => [
      {
        prop: "factoryPartNumber",
        name: "Factory Part Number",
        sortable: true,
        size: 180,
        minSize: 150,
      },
      {
        prop: "productDescription",
        name: "Product Description",
        sortable: true,
        size: 280,
        minSize: 200,
      },
      {
        prop: "lowestPrice",
        name: "Lowest Price",
        columnType: "currency",
        size: 150,
        minSize: 130,
        sortable: true,
        aggregators: {
          min: commonAggregators.min,
          sum: commonAggregators.sum,
          avg: commonAggregators.avg,
        },
        columnTemplate: (h, props) => h('div', { class: 'flex items-center gap-2' }, [
          h('span', { 
            style: { 
              width: '10px', 
              height: '10px', 
              backgroundColor: '#008B00',
              display: 'inline-block',
              flexShrink: '0'
            } 
          }),
          h('span', {}, props.name)
        ]),
      },
      {
        prop: "highestPrice",
        name: "Highest Price",
        columnType: "currency",
        size: 150,
        minSize: 130,
        sortable: true,
        aggregators: {
          max: commonAggregators.max,
          sum: commonAggregators.sum,
          avg: commonAggregators.avg,
        },
        columnTemplate: (h, props) => h('div', { class: 'flex items-center gap-2' }, [
          h('span', { 
            style: { 
              width: '10px', 
              height: '10px', 
              backgroundColor: '#8B0000',
              display: 'inline-block',
              flexShrink: '0'
            } 
          }),
          h('span', {}, props.name)
        ]),
      },
      {
        prop: "averagePrice",
        name: "Average Price",
        columnType: "currency",
        size: 150,
        minSize: 130,
        sortable: true,
        aggregators: {
          avg: commonAggregators.avg,
          sum: commonAggregators.sum,
        },
        columnTemplate: (h, props) => h('div', { class: 'flex items-center gap-2' }, [
          h('span', { 
            style: { 
              width: '10px', 
              height: '10px', 
              backgroundColor: '#00008B',
              display: 'inline-block',
              flexShrink: '0'
            } 
          }),
          h('span', {}, props.name)
        ]),
      },
      {
        prop: "priceTrend",
        name: "Price Trend",
        size: 100,
        minSize: 80,
        sortable: false,
        cellTemplate: (h, props) => createPriceBarChartCell(h, props),
      },
      
      {
        prop: "priceRange",
        name: "Price Spread",
        columnType: "currency",
        size: 120,
        minSize: 100,
        sortable: true,
        aggregators: {
          avg: commonAggregators.avg,
          max: commonAggregators.max,
        },
        cellTemplate: (h, props) => {
          const value = props.model[props.prop];
          const variance = props.model.priceVariance || 0;
          const color = variance > 50 ? 'text-red-500' : variance > 20 ? 'text-yellow-600' : 'text-green-500';
          return h('span', { class: color }, `$${value?.toFixed(2) || '0.00'}`);
        },
      },
      {
        prop: "priceVariance",
        name: "Variance %",
        columnType: "percentage",
        size: 110,
        minSize: 90,
        sortable: true,
        aggregators: {
          avg: commonAggregators.avg,
        },
        cellTemplate: (h, props) => {
          const value = props.model[props.prop];
          const color = value > 50 ? 'text-red-500' : value > 20 ? 'text-yellow-600' : 'text-green-500';
          return h('span', { class: color }, `${value?.toFixed(1) || '0'}%`);
        },
      },
      {
        prop: "orderCount",
        name: "Orders",
        columnType: "integer",
        size: 90,
        minSize: 70,
        sortable: true,
        aggregators: {
          sum: commonAggregators.sum,
          avg: commonAggregators.avg,
        },
      },
      {
        prop: "customerCount",
        name: "Customers",
        columnType: "integer",
        size: 100,
        minSize: 80,
        sortable: true,
        aggregators: {
          sum: commonAggregators.sum,
          avg: commonAggregators.avg,
        },
      },
      {
        prop: "factory",
        name: "Factory",
        sortable: true,
        size: 140,
        minSize: 100,
      },
    ],
    [createPriceBarChartCell]
  );

  // Filtered columns based on visibility
  const columns = useMemo(
    () => allColumns.filter(col => visibleColumns.includes(col.prop)),
    [allColumns, visibleColumns]
  );

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((prop) => {
    setVisibleColumns(prev => {
      if (prev.includes(prop)) {
        return prev.filter(p => p !== prop);
      } else {
        return [...prev, prop];
      }
    });
    // Force grid re-render when columns change
    setGridKey(prev => prev + 1);
  }, []);

  const config = useMemo(
    () => ({
      dimensions: columns,
      rows: pivotConfig.rows,
      columns: pivotConfig.columns,
      values: pivotConfig.values,
      hasConfigurator: false,
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
    [pivotConfig, columns]
  );

  const additionalData = useMemo(() => ({ pivot: { ...config } }), [config]);

  // Calculate totals row
  const totalsRow = useMemo(() => {
    if (!sortedRows || sortedRows.length === 0) return null;

    const totals = {
      id: "TOTAL_ROW",
      factoryPartNumber: "TOTAL",
      productDescription: `${sortedRows.length} products`,
      lowestPrice: Math.min(...sortedRows.map(r => r.lowestPrice).filter(Boolean)),
      highestPrice: Math.max(...sortedRows.map(r => r.highestPrice).filter(Boolean)),
      averagePrice: sortedRows.reduce((sum, r) => sum + (r.averagePrice || 0), 0) / sortedRows.length,
      priceRange: 0,
      priceVariance: 0,
      orderCount: sortedRows.reduce((sum, r) => sum + (r.orderCount || 0), 0),
      customerCount: new Set(sortedRows.flatMap(r => r.customerId || [])).size || sortedRows.reduce((sum, r) => sum + (r.customerCount || 0), 0),
      factory: "",
    };

    totals.priceRange = totals.highestPrice - totals.lowestPrice;
    totals.priceVariance = totals.averagePrice > 0 ? ((totals.priceRange / totals.averagePrice) * 100) : 0;

    const pivotValueTotals = computePivotValueTotals(sortedRows, pivotConfig);
    Object.assign(totals, pivotValueTotals);

    return totals;
  }, [sortedRows, pivotConfig]);

  const pinnedBottomRows = useMemo(
    () => (totalsRow ? [totalsRow] : []),
    [totalsRow]
  );

  // Export functionality
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = useCallback(async () => {
    if (!sortedRows || sortedRows.length === 0) return;

    setIsExporting(true);
    try {
      const dateStamp = new Date().toISOString().split("T")[0];
      const filename = `product-pricing-${dateStamp}`;

      await exportGridCsv({
        filename,
        columns: columns,
        rows: [...sortedRows, ...(totalsRow ? [totalsRow] : [])],
      });
    } catch (error) {
      console.error("CSV export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [columns, sortedRows, totalsRow]);

  const exportToExcel = useCallback(async () => {
    if (!sortedRows || sortedRows.length === 0) return;

    setIsExporting(true);
    try {
      const dateStamp = new Date().toISOString().split("T")[0];
      const filename = `product-pricing-${dateStamp}`;

      await exportGridXlsxWithHeaders({
        filename,
        columns: columns,
        rows: [...sortedRows, ...(totalsRow ? [totalsRow] : [])],
        sheetName: "Product Pricing",
        filters: advancedFilters,
        dateRange: { startDate: appliedStartDate, endDate: appliedEndDate },
        sorting: sortingConfig,
        reportTitle: "Product Pricing Analysis",
        includeHeaderInfo: true,
      });
    } catch (error) {
      console.error("Excel export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [columns, sortedRows, totalsRow, advancedFilters, appliedStartDate, appliedEndDate, sortingConfig]);

  // Expose methods to get/set pivot configuration
  useEffect(() => {
    if (!gridRef.current) {
      gridRef.current = {};
    }

    gridRef.current.getPivotConfig = async () => pivotConfig;
    gridRef.current.setPivotConfig = (newConfig) => {
      if (newConfig && typeof newConfig === 'object') {
        setPivotConfig(newConfig);
        setGridKey(prev => prev + 1);
        return true;
      }
      return false;
    };
    gridRef.current.getColumns = () => columns;
    gridRef.current.setColumns = () => true;
  }, [pivotConfig, columns, setPivotConfig]);

  // Pivot config is now controlled by visibleColumns via checkboxes
  // No need to listen to grid pivot config updates

  // Set CSS custom properties for data bars and render price bar charts after grid renders
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDataBars = () => {
      const containers = containerRef.current?.querySelectorAll?.('.revo-data-bar-container');
      if (containers) {
        containers.forEach(container => {
          const barWidth = container.getAttribute('data-bar-width');
          const barColor = container.getAttribute('data-bar-color');
          if (barWidth && barColor) {
            container.style.setProperty('--bar-width', barWidth);
            container.style.setProperty('--bar-color', barColor);
          }
        });
      }
    };
    
    const renderPriceBarCharts = () => {
      // Use document.querySelectorAll as fallback
      const containers = containerRef.current?.querySelectorAll?.('.revo-price-bar-chart-container') 
        || document.querySelectorAll('.revo-price-bar-chart-container');
      if (containers && containers.length > 0) {
        containers.forEach(container => {
          // Skip if already has SVG rendered
          if (container.querySelector('svg')) return;
          
          const lowestPrice = parseFloat(container.getAttribute('data-lowest-price')) || 0;
          const highestPrice = parseFloat(container.getAttribute('data-highest-price')) || 0;
          const averagePrice = parseFloat(container.getAttribute('data-average-price')) || 0;
          
          if (lowestPrice === 0 && highestPrice === 0) return;
          
          // 3-bar chart showing Low, Avg, High with actual proportional heights
          const width = 50;
          const height = 24;
          const padding = 2;
          const barWidth = 6; // Slightly wider bars for 3 bars
          const barGap = 4; // Gap between bars
          const chartHeight = height - padding * 2;
          
          // Use highest price as the scale (100%)
          const maxPrice = highestPrice;
          
          // Just 3 bars: Low, Avg, High (actual values, no interpolation)
          const prices = [lowestPrice, averagePrice, highestPrice];
          // 3 distinct colors: Green (Low), Blue (Avg), Red (High)
          const colors = ['#008B00', '#00008B', '#8B0000'];
          
          const totalBarsWidth = prices.length * barWidth + (prices.length - 1) * barGap;
          const startX = (width - totalBarsWidth) / 2;
          
          // Create SVG element
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', String(width));
          svg.setAttribute('height', String(height));
          svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
          svg.style.display = 'block';
          
          // Create vertical bars for Low, Avg, High
          prices.forEach((price, index) => {
            // Calculate height as percentage of max price
            const percent = maxPrice > 0 ? (price / maxPrice) * 100 : 100;
            const bHeight = Math.max(3, (percent / 100) * chartHeight);
            const x = startX + index * (barWidth + barGap);
            const y = padding + chartHeight - bHeight;
            
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('x', String(x));
            bar.setAttribute('y', String(y));
            bar.setAttribute('width', String(barWidth));
            bar.setAttribute('height', String(bHeight));
            bar.setAttribute('fill', colors[index]);
            // Square corners (no rx)
            svg.appendChild(bar);
          });
          
          // Clear and append
          container.innerHTML = '';
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
          container.style.height = '100%';
          container.style.width = '100%';
          container.appendChild(svg);
        });
      }
    };
    
    // Update after delays to ensure RevoGrid cells are rendered
    const runRenders = () => {
      updateDataBars();
      renderPriceBarCharts();
    };
    
    // Multiple attempts with increasing delays
    const timeout1 = setTimeout(runRenders, 50);
    const timeout2 = setTimeout(runRenders, 150);
    const timeout3 = setTimeout(runRenders, 300);
    const timeout4 = setTimeout(runRenders, 600);
    const timeout5 = setTimeout(runRenders, 1000);
    
    // Also use requestAnimationFrame
    const raf = requestAnimationFrame(() => {
      runRenders();
    });
    
    // MutationObserver to detect when RevoGrid renders new cells
    let observer = null;
    if (containerRef.current) {
      observer = new MutationObserver(() => {
        runRenders();
      });
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true
      });
    }
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      clearTimeout(timeout5);
      cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
    };
  }, [sortedRows, gridKey, columnRanges]);

  const handleClearDates = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setAppliedStartDate("");
    setAppliedEndDate("");
  }, []);

  const handleClearFilters = useCallback(() => {
    setAdvancedFilters({});
    setSelectedFactoryId(null);
    setSelectedCustomerId(null);
    setSelectedParentCustomerId(null);
  }, []);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!sortedRows || sortedRows.length === 0) return null;

    const totalProducts = sortedRows.length;
    const avgPrice = sortedRows.reduce((sum, r) => sum + (r.averagePrice || 0), 0) / totalProducts;
    const maxSpread = Math.max(...sortedRows.map(r => r.priceRange || 0));
    const totalOrders = sortedRows.reduce((sum, r) => sum + (r.orderCount || 0), 0);

    return { totalProducts, avgPrice, maxSpread, totalOrders };
  }, [sortedRows]);

  return (
    <div className="min-h-screen w-full p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Product Pricing Analysis
            </h1>
            <p className="text-sm text-blue-900/70 font-medium">
              SKU price ranges across all orders with pivot table analysis
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 items-start">
          <div className="flex-1 min-w-0 space-y-3">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={handleClearDates}
              pageKey="product-pricing"
              onApply={handleApplyFilters}
              appliedStartDate={appliedStartDate}
              appliedEndDate={appliedEndDate}
              appliedFilterByDate="ENTITY_DATE"
            />

            {/* Factory Filter */}
            {factoriesData?.factories && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Factory:</label>
                <select
                  value={selectedFactoryId || ""}
                  onChange={(e) => setSelectedFactoryId(e.target.value || null)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Factories</option>
                  {factoriesData.factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
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
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryStats && appliedStartDate && appliedEndDate && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Products</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {summaryStats.totalProducts.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Avg Price</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ${summaryStats.avgPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Max Spread</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              ${summaryStats.maxSpread.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Total Orders</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {summaryStats.totalOrders.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(Object.keys(advancedFilters).length > 0 || appliedStartDate || appliedEndDate) && (
        <ActiveFilters
          filters={advancedFilters}
          onRemoveFilter={(key) => {
            const newFilters = { ...advancedFilters };
            delete newFilters[key];
            setAdvancedFilters(newFilters);
          }}
          onClearAll={handleClearFilters}
          dateRange={
            appliedStartDate || appliedEndDate
              ? { startDate: appliedStartDate, endDate: appliedEndDate }
              : null
          }
          onClearDateRange={handleClearDates}
        />
      )}

      {/* Main Grid Card */}
      <Card className="shadow-xl border-0 p-0 bg-white/95 backdrop-blur-sm overflow-hidden w-full">
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Price Analysis Grid
                </h2>
                {isHydrated && sortedRows.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({sortedRows.length.toLocaleString()} products)
                  </span>
                )}
                {loading && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExpandButton
                onClick={() => setIsFullScreen(true)}
                disabled={sortedRows.length === 0}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={isExporting || sortedRows.length === 0}
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Grid with Column Visibility Panel */}
        <div className="flex">
          {/* Column Visibility Panel */}
          <div className="w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-3 overflow-y-auto" style={{ maxHeight: `${gridDimensions.height}px` }}>
            <div className="space-y-1">
              {allColumns.map((col) => (
                <label
                  key={col.prop}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.prop)}
                    onChange={() => toggleColumnVisibility(col.prop)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 truncate">{col.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Main Grid Container */}
          <div
            ref={containerRef}
            className="pivot-grid-container bg-white rounded-none relative flex-1"
            style={{
              height: `${gridDimensions.height}px`,
              overflowX: "auto",
              overflowY: "auto",
            }}
          >
          {!appliedStartDate || !appliedEndDate ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 p-8">
                <DollarSign className="h-16 w-16 text-gray-300 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Select a Date Range
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Choose a date range and click "Apply Filters" to view product pricing data across all orders.
                  </p>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
                <p className="text-lg font-medium text-gray-700">Loading pricing data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 p-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <DollarSign className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-700 mb-2">
                    Error Loading Data
                  </h3>
                  <p className="text-red-600 max-w-md">
                    {error.message}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 p-8">
                <DollarSign className="h-16 w-16 text-gray-300 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Pricing Data Found
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    No product pricing data found for the selected filters. Try adjusting your date range or filters.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <RevoGrid
              key={`${gridKey}-${visibleColumns.join('-')}`}
              ref={internalGridRef}
              hide-attribution
              range
              resize
              canMoveColumns={false}
              exporting={true}
              autoSizeColumn={false}
              colSize={140}
              source={sortedRows}
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
        </div>
      </Card>

      {/* Sorting Modal */}
      <PivotSortingModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        sortingConfig={sortingConfig}
        onSortingChange={setSortingConfig}
        pivotConfig={pivotConfig}
        dimensions={allColumns}
        getPivotConfig={gridRef.current?.getPivotConfig}
      />

      {/* Full Screen Modal */}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        title="Product Pricing Analysis - Full Screen"
      >
        <div
          className="pivot-grid-container bg-white rounded-lg relative w-full h-full"
          style={{ height: "100%", width: "100%" }}
        >
          {isHydrated && sortedRows.length > 0 && (
            <RevoGrid
              key={`fullscreen-${gridKey}`}
              hide-attribution
              range
              resize
              canMoveColumns={false}
              exporting={true}
              autoSizeColumn={false}
              colSize={140}
              source={sortedRows}
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
