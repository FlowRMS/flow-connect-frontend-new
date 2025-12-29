import React from "react";
import { DataGrid } from "@/components/analytics/rv-grid/rv-grid";
import { productTrendsColumns, factorySummaryColumns } from "./columns";
import { useSkeletonConfig } from "@/lib/analytics/hooks/useAdvancedLoading";

/**
 * Table view of product trends (alternative to sparkline grid)
 */
export const ProductTrendsTable = ({ data, loading = false }) => {
  const skeletonConfig = useSkeletonConfig("product-analytics");

  // Transform product data for table display
  const tableData = React.useMemo(() => {
    if (!data?.products) return [];

    return data.products.map((product) => {
      const values = product.monthlyData.map((d) => parseFloat(d.value) || 0);
      const monthlyAverage =
        values.length > 0
          ? values.reduce((sum, v) => sum + v, 0) / values.length
          : 0;

      return {
        productId: product.productId,
        productName: product.productName,
        totalSales: parseFloat(product.totalSales),
        monthlyAverage,
        monthlyData: product.monthlyData,
      };
    });
  }, [data]);

  return (
    <div className="">
      <DataGrid
        title={`Product Sales - ${data?.factoryName || "Select a Factory"}`}
        columns={productTrendsColumns}
        data={tableData}
        loading={loading}
        rowClass="hover:bg-blue-50 cursor-pointer border-b"
        skeletonPreset="productAnalytics"
        skeletonRows={skeletonConfig?.grid?.rows || 10}
        skeletonProps={{
          columnWidths: [200, 140, 120, 150],
          showStats: false,
        }}
      />
    </div>
  );
};

/**
 * Summary table showing factory-level aggregations
 */
export const FactorySummaryTable = ({ data, loading = false }) => {
  const skeletonConfig = useSkeletonConfig("product-analytics");

  return (
    <div className="">
      <DataGrid
        title="Factory Summary"
        columns={factorySummaryColumns}
        data={data || []}
        loading={loading}
        rowClass="hover:bg-purple-50 cursor-pointer border-b"
        skeletonPreset="productAnalytics"
        skeletonRows={skeletonConfig?.grid?.rows || 5}
        skeletonProps={{
          columnWidths: [180, 140, 100, 120],
          showStats: false,
        }}
      />
    </div>
  );
};


