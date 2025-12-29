"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { ProductSparkline } from "./ProductSparkline";

const ProductTrendCard = ({ product }) => {
  const { productName, totalSales, monthlyData } = product;

  // Format total sales
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseFloat(totalSales));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col h-full">
        {/* Product Name */}
        <h4
          className="text-sm font-semibold text-gray-800 mb-1 truncate"
          title={productName}
        >
          {productName}
        </h4>

        {/* Total Sales */}
        <p className="text-lg font-bold text-blue-600 mb-3">{formattedTotal}</p>

        {/* Sparkline */}
        <div className="flex-1 min-h-[60px]">
          <ProductSparkline data={monthlyData} />
        </div>

        {/* Data range indicator */}
        <p className="text-xs text-gray-400 mt-2">
          {monthlyData.length} months of data
        </p>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
    {Array.from({ length: 10 }).map((_, idx) => (
      <div
        key={idx}
        className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
      >
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-[60px] bg-gray-100 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
      </div>
    ))}
  </div>
);

export const ProductTrendsGrid = ({
  data,
  loading = false,
  error = null,
  factoryId,
  factoryTitle = "",
}) => {
  // Header
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {data
              ? `Top ${data.products?.length || 0} Products${factoryTitle ? ` - ${factoryTitle}` : ""}`
              : "Product Trends"}
          </h3>
          <p className="text-sm text-gray-500">Month over month sales trends</p>
        </div>
      </div>
    </div>
  );

  // No factory selected state
  if (!factoryId) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Product Trends</h3>
            <p className="text-sm text-gray-500">Month over month sales trends</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            Select a Factory
          </h3>
          <p className="text-sm text-gray-500">
            Choose a factory from the dropdown above to view product-level sales
            trends
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {renderHeader()}
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {renderHeader()}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Error Loading Product Trends
          </h3>
          <p className="text-sm text-red-600">
            {error.message || "An error occurred while fetching product data."}
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.products || data.products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {renderHeader()}
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            No Products Found
          </h3>
          <p className="text-sm text-gray-500">
            No product sales data available for this factory in the selected
            time period.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {renderHeader()}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {data.products.map((product) => (
          <ProductTrendCard key={product.productId} product={product} />
        ))}
      </div>
    </div>
  );
};