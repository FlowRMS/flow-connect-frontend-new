import React from "react";
import { DataGrid } from "@/components/analytics/rv-grid/rv-grid";
import {
  customerColumns,
  manufacturerColumns,
  productColumns,
} from "./columns";
import { useSkeletonConfig } from "@/lib/analytics/hooks/useAdvancedLoading";

export const CustomerTable = ({ data, loading = false }) => {
  const skeletonConfig = useSkeletonConfig("order-dashboard");

  return (
    <div className="">
      <DataGrid
        title="Commission by Customer"
        columns={customerColumns}
        data={data}
        loading={loading}
        rowClass="hover:bg-blue-50 cursor-pointer border-b"
        skeletonPreset="orderDashboard"
        skeletonRows={skeletonConfig.grid.rows}
        skeletonProps={{
          columnWidths: [180, 120, 100, 140, 130],
          showStats: false,
        }}
      />
    </div>
  );
};

export const ManufacturerTable = ({ data, loading = false }) => {
  const skeletonConfig = useSkeletonConfig("order-dashboard");

  return (
    <div className="">
      <DataGrid
        title="Commission by Manufacturers"
        columns={manufacturerColumns}
        data={data}
        loading={loading}
        rowClass="hover:bg-purple-50 cursor-pointer border-b"
        skeletonPreset="orderDashboard"
        skeletonRows={skeletonConfig.grid.rows}
        skeletonProps={{
          columnWidths: [160, 140, 120, 110, 150],
          showStats: false,
        }}
      />
    </div>
  );
};

export const ProductTable = ({ data, loading = false }) => {
  const skeletonConfig = useSkeletonConfig("order-dashboard");

  return (
    <div className="">
      <DataGrid
        columns={productColumns}
        data={data}
        title="Commission by Product Name"
        loading={loading}
        rowClass="hover:bg-green-50 cursor-pointer border-b"
        skeletonPreset="orderDashboard"
        skeletonRows={skeletonConfig.grid.rows}
        skeletonProps={{
          columnWidths: [200, 120, 100, 130, 140],
          showStats: false,
        }}
      />
    </div>
  );
};


