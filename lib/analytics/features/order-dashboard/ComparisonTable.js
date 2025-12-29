'use client';
import React, { useState, useRef, useEffect } from 'react';
import { DataGrid } from '@/components/analytics/rv-grid/rv-grid';
import { formatCurrency } from '@/lib/analytics/lib/format';
import { AdvanceFilterPlugin } from '@revolist/revogrid-pro';
import { useSkeletonConfig } from '@/lib/analytics/hooks/useAdvancedLoading';
import { SortingConfigModal } from '@/components/analytics/table-config/SortingConfigModal';
import { ArrowUpDown } from 'lucide-react';

const formatVarianceValue = (val) => {
  if (val == null || val === "") return "-";
  if (typeof val === "string" && val.includes("%")) return val;
  const raw =
    typeof val === "number" ? val : parseFloat(String(val).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(raw)) {
    return String(val);
  }
  return `${raw.toFixed(2)}%`;
};
const toPercentNumber = (val) => {
  if (val == null || val === "") return NaN;
  let s = String(val).trim();

  // handle parentheses negatives like (3.2%)
  const parenNeg = /^\(.*\)$/.test(s);

  // normalize Unicode minus to ASCII minus
  s = s.replace(/\u2212/g, "-");

  // remove everything except digits, dot, minus
  s = s.replace(/[^\d.-]/g, "");

  const n = parseFloat(s);
  if (!Number.isFinite(n)) return NaN;
  return parenNeg ? -Math.abs(n) : n;
};

export const ComparisonTable = ({
  titleBase,
  entityLabel,
  groupingType,
  valueType,
  comparisonData = {},
  loading = false,
  error = null,
  className = '',
  sortingConfig = [], // Array of { prop, order } from parent
  onSortingChange, // Callback to update parent state
}) => {
  const skeletonConfig = useSkeletonConfig("order-dashboard");
  const gridRef = useRef(null);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  const comparisonByValueType = comparisonData || {};
  const commissionComparison = comparisonByValueType.COMMISSION;
  const salesComparison = comparisonByValueType.SALES;

  const currentComparison =
    valueType === 'COMMISSION'
      ? commissionComparison
      : valueType === 'SALES'
      ? salesComparison
      : null;

  // Define columns based on the entity type and value type
  const columns = React.useMemo(() => {
    const entityColumnName = groupingType === 'FACTORY' ? 'factory' : 
                           groupingType === 'CUSTOMER' ? 'customer' :
                           groupingType === 'OUTSIDE_SALES_REP' ? 'outsideSalesRep' :
                           groupingType === 'CUSTOMER_AND_FPN' ? 'customerAndFpn' :
                           groupingType === 'CUSTOMER_AND_FACTORY' ? 'customerAndFactory' : 'category';
    
    // Cell template functions similar to the existing ones
    // Render entity name without the colored dot
    const nameCell = (h, { value }) =>
      h(
        "div",
        {
          style: { display: "flex", alignItems: "center" },
        },
        [
          value || "",
        ]
      );

    const amountCell = (h, { value }) =>
      h(
        "span",
        {
          style: {
            textAlign: "right",
            display: "block",
            fontVariantNumeric: "tabular-nums",
          },
        },
        value != null ? formatCurrency(value) : "-"
      );

const varianceCell = (h, { value }) => {
  const num = toPercentNumber(value);
  const displayValue = formatVarianceValue(value);

  let color = "#6b7280"; // gray default
  if (Number.isFinite(num)) {
    if (num > 10) color = "#15803d";
    else if (num > 0) color = "#16a34a";
    else if (num < -10) color = "#991b1b";
    else if (num < 0) color = "#dc2626";
    else color = "#6b7280"; // 0 -> gray
  }

  const arrow = !Number.isFinite(num) || num === 0 ? "•" : (num < 0 ? "▼" : "▲");

  // Wrapper: NO color here so the number stays default
  const wrapperStyle = {
    cssText: "font-weight: 600; display: inline-flex; align-items: center;"
  };

  // Arrow only gets the color (with !important to beat RevoGrid styles)
  const arrowStyle = {
    cssText: `color: ${color} !important; margin-right: 4px; display:inline-block; width:0.9em; text-align:center;`
  };

  return h(
    "span",
    { style: wrapperStyle },
    [
      h("span", { style: arrowStyle }, arrow),
      // value keeps default color; no color styles applied
      h("span", {}, displayValue)
    ]
  );
};




    
    if (valueType === 'BOTH') {
      // For BOTH mode, show commission AND sales columns
      const baseColumns = [
        { 
          prop: entityColumnName, 
          name: groupingType === 'CUSTOMER_AND_FPN' ? 'Customer' : (groupingType === 'CUSTOMER_AND_FACTORY' ? 'Customer' : entityLabel),
          cellTemplate: nameCell,
          size: 140,
          sortable: true
        }
      ];

      // Add subEntityName column for CUSTOMER_AND_FPN and CUSTOMER_AND_FACTORY
      if (groupingType === 'CUSTOMER_AND_FPN') {
        baseColumns.push({
          prop: 'subEntityName',
          name: 'FPN',
          cellTemplate: nameCell,
          size: 140,
          sortable: true
        });
      }
      
      if (groupingType === 'CUSTOMER_AND_FACTORY') {
        baseColumns.push({
          prop: 'subEntityName',
          name: 'Manufacturer',
          cellTemplate: nameCell,
          size: 140,
          sortable: true
        });
      }

      return [
        ...baseColumns,
        { 
          prop: 'commissionLastYear', 
          name: 'Commission (LY)',
          cellTemplate: amountCell,
          size: 110,
          sortable: true
        },
        { 
          prop: 'commissionThisYear', 
          name: 'Commission (TY)',
          cellTemplate: amountCell,
          size: 110,
          sortable: true
        },
        { 
          prop: 'commissionVariance', 
          name: 'Comm. Var.',
          cellTemplate: varianceCell,
          size: 100,
          sortable: true
        },
        { 
          prop: 'salesLastYear', 
          name: 'Sales (LY)',
          cellTemplate: amountCell,
          size: 110,
          sortable: true
        },
        { 
          prop: 'salesThisYear', 
          name: 'Sales (TY)',
          cellTemplate: amountCell,
          size: 110,
          sortable: true
        },
        { 
          prop: 'salesVariance', 
          name: 'Sales Var.',
          cellTemplate: varianceCell,
          size: 100,
          sortable: true
        }
      ];
    } else {
      // Standard single-type columns
      const baseColumns = [
        { 
          prop: entityColumnName, 
          name: groupingType === 'CUSTOMER_AND_FPN' ? 'Customer' : (groupingType === 'CUSTOMER_AND_FACTORY' ? 'Customer' : entityLabel),
          cellTemplate: nameCell,
          size: 180,
          sortable: true
        }
      ];

      // Add subEntityName column for CUSTOMER_AND_FPN and CUSTOMER_AND_FACTORY
      if (groupingType === 'CUSTOMER_AND_FPN') {
        baseColumns.push({
          prop: 'subEntityName',
          name: 'FPN',
          cellTemplate: nameCell,
          size: 180,
          sortable: true
        });
      }
      
      if (groupingType === 'CUSTOMER_AND_FACTORY') {
        baseColumns.push({
          prop: 'subEntityName',
          name: 'Manufacturer',
          cellTemplate: nameCell,
          size: 180,
          sortable: true
        });
      }

      return [
        ...baseColumns,
        { 
          prop: 'lastYear', 
          name: 'Last Year',
          cellTemplate: amountCell,
          size: 120,
          sortable: true
        },
        { 
          prop: 'thisYear', 
          name: 'This Year',
          cellTemplate: amountCell,
          size: 120,
          sortable: true
        },
        { 
          prop: 'variance', 
          name: 'Variance',
          cellTemplate: varianceCell,
          size: 120,
          sortable: true
        }
      ];
    }
  }, [groupingType, entityLabel, valueType]);

  // Transform the data to match the expected format
  const transformedData = React.useMemo(() => {
    const entityColumnName =
      groupingType === 'FACTORY'
        ? 'factory'
        : groupingType === 'CUSTOMER'
        ? 'customer'
        : groupingType === 'OUTSIDE_SALES_REP'
        ? 'outsideSalesRep'
        : groupingType === 'CUSTOMER_AND_FPN'
        ? 'customerAndFpn'
        : groupingType === 'CUSTOMER_AND_FACTORY'
        ? 'customerAndFactory'
        : 'category';

    if (valueType === 'BOTH') {
      const commissionItems = commissionComparison?.items || [];
      const salesItems = salesComparison?.items || [];

      if (!commissionItems.length && !salesItems.length) {
        return [];
      }

      const salesMap = salesItems.reduce((acc, item) => {
        acc[item.entityName] = item;
        return acc;
      }, {});

      return commissionItems.map((commissionItem) => {
        const salesItem = salesMap[commissionItem.entityName] || {};

        const baseData = {
          [entityColumnName]: commissionItem.entityName,
          commissionLastYear: commissionItem.lastYear,
          commissionThisYear: commissionItem.thisYear,
          commissionVariance: formatVarianceValue(
            commissionItem.variancePercentage
          ),
          salesLastYear: salesItem.lastYear,
          salesThisYear: salesItem.thisYear,
          salesVariance: formatVarianceValue(salesItem.variancePercentage),
        };

        // Add subEntityName for CUSTOMER_AND_FPN and CUSTOMER_AND_FACTORY
        if ((groupingType === 'CUSTOMER_AND_FPN' || groupingType === 'CUSTOMER_AND_FACTORY') && commissionItem.subEntityName) {
          baseData.subEntityName = commissionItem.subEntityName;
        }

        return baseData;
      });
    }

    const items = currentComparison?.items || [];

    return items.map((item) => {
      const varianceStr = formatVarianceValue(item.variancePercentage);

      const baseData = {
        [entityColumnName]: item.entityName,
        lastYear: item.lastYear,
        thisYear: item.thisYear,
        variance: varianceStr,
      };

      // Add subEntityName for CUSTOMER_AND_FPN and CUSTOMER_AND_FACTORY
      if ((groupingType === 'CUSTOMER_AND_FPN' || groupingType === 'CUSTOMER_AND_FACTORY') && item.subEntityName) {
        baseData.subEntityName = item.subEntityName;
      }

      return baseData;
    });
  }, [commissionComparison, currentComparison, groupingType, salesComparison, valueType]);

  // Apply sorting to data
  const sortedData = React.useMemo(() => {
    if (!sortingConfig || sortingConfig.length === 0) {
      return transformedData;
    }

    const dataToSort = [...transformedData];
    
    dataToSort.sort((a, b) => {
      for (const sortCol of sortingConfig) {
        const { prop, order } = sortCol;
        const aVal = a[prop];
        const bVal = b[prop];

        // Handle null/undefined values
        if (aVal == null && bVal == null) continue;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Parse numeric values (for amounts and percentages)
        const aNum = typeof aVal === 'number' ? aVal : parseFloat(String(aVal).replace(/[$,%]/g, ''));
        const bNum = typeof bVal === 'number' ? bVal : parseFloat(String(bVal).replace(/[$,%]/g, ''));

        let comparison = 0;
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          // Numeric comparison
          comparison = aNum - bNum;
        } else {
          // String comparison
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
  }, [transformedData, sortingConfig]);

  const title = `${titleBase} by ${entityLabel}`;
  const shouldShowError =
    Boolean(error) && !loading && sortedData.length === 0;

  // Get appropriate hover color based on entity type
  const getHoverColor = () => {
    switch (groupingType) {
      case 'CUSTOMER': return 'hover:bg-blue-50 cursor-pointer border-b';
      case 'FACTORY': return 'hover:bg-purple-50 cursor-pointer border-b';
      case 'PRODUCT': return 'hover:bg-green-50 cursor-pointer border-b';
      case 'OUTSIDE_SALES_REP': return 'hover:bg-orange-50 cursor-pointer border-b';
      case 'CUSTOMER_AND_FPN': return 'hover:bg-teal-50 cursor-pointer border-b';
      case 'CUSTOMER_AND_FACTORY': return 'hover:bg-indigo-50 cursor-pointer border-b';
      default: return 'hover:bg-gray-50 cursor-pointer border-b';
    }
  };

  // Handle sorting changes from the modal
  const handleSortingApply = (newSorting) => {
    if (onSortingChange) {
      onSortingChange(groupingType, newSorting);
    }
  };

  if (shouldShowError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <h3 className="font-semibold text-red-800 mb-2">{title}</h3>
        <p className="text-red-600 text-sm">
          Error loading data: {error.message || 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <div className="relative">
          {/* Sorting Button */}
          <button
            onClick={() => setIsSortModalOpen(true)}
            className="absolute right-4 top-4 z-10 flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm"
            title="Configure Sorting"
          >
            <ArrowUpDown size={16} />
            <span>Sort</span>
            {sortingConfig && sortingConfig.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {sortingConfig.length}
              </span>
            )}
          </button>

          <DataGrid
            ref={gridRef}
            title={title}
            columns={columns}
            data={sortedData}
            loading={loading}
            rowClass={getHoverColor()}
            skeletonPreset="orderDashboard"
            skeletonRows={skeletonConfig.grid.rows}
            skeletonProps={{
              columnWidths: [180, 120, 100, 140],
              showStats: false,
            }}
            searchable={false}
            additionalProps={{
              plugins: [AdvanceFilterPlugin]
            }}
          />
        </div>
      </div>

      <SortingConfigModal
        isOpen={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        columns={columns}
        currentSorting={sortingConfig || []}
        onApplySorting={handleSortingApply}
      />
    </>
  );
};






