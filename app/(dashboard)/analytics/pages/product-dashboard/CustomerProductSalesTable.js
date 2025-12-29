"use client";

import React from "react";
import { useQuery } from "@apollo/client/react";
import { Loader2, Table } from "lucide-react";

import { ProductSparkline } from "./ProductSparkline";
import { GET_CUSTOMER_PRODUCT_SALES } from "./queries";

const formatCurrency = (value) => {
  const num = parseFloat(value);
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${num.toFixed(0)}`;
};

export const CustomerProductSalesTable = ({ factoryId }) => {
  // Fetch sales data
  const {
    data: salesData,
    loading: salesLoading,
    error: salesError,
  } = useQuery(GET_CUSTOMER_PRODUCT_SALES, {
    variables: {
      factoryId,
      topN: 50,
    },
    skip: !factoryId,
  });

  const salesItems = salesData?.getCustomerProductSales?.items || [];

  if (!factoryId) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Table className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Sales by Customer & FPN
          </h3>
        </div>
      </div>

      {/* Table */}
      {salesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : salesError ? (
        <div className="text-center py-12 text-red-500">
          Error loading data. Please try again.
        </div>
      ) : salesItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No sales data found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  FPN
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Total Sales
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 w-[200px]">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {salesItems.map((item, index) => (
                <tr
                  key={`${item.customerId}-${item.productId}`}
                  className={`border-b border-gray-100 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {item.customerName}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {item.productName}
                  </td>
                  <td className="py-3 px-4 text-sm text-blue-600 font-semibold text-right">
                    {formatCurrency(item.totalSales)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-[180px] h-[40px]">
                      <ProductSparkline data={item.monthlyData} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer with count */}
      {salesItems.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-right">
          Showing {salesItems.length} customer-product combinations
        </div>
      )}
    </div>
  );
};
