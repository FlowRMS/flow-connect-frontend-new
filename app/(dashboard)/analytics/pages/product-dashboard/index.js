"use client";
import React from "react";
import { useQuery } from "@apollo/client/react";
import { ChevronDown, Search, Loader2, X } from "lucide-react";

import { AuthGuard } from "@/components/analytics/auth/AuthGuard";
import { ProductTrendsGrid } from "./ProductTrendsGrid";
import { ProductComparisonChart } from "./ProductComparisonChart";
import { CustomerProductSalesTable } from "./CustomerProductSalesTable";
import {
  FACTORY_SEARCH,
  GET_PRODUCT_TRENDS_BY_FACTORY,
} from "./queries";
// TEMPORARY: Import CRM client for factory search (CRM query needs CRM backend, not Report API)
// TO REVERT: Remove this import and change crmClient.query back to useQuery for FACTORY_SEARCH
import { crmClient } from "@/lib/analytics/apolloClient";

// Default factory to load on page open
const DEFAULT_FACTORY_NAME = "ERMCO";

const ProductAnalyticsDashboardContent = () => {
  const [selectedFactoryId, setSelectedFactoryId] = React.useState(null);
  const [selectedFactoryTitle, setSelectedFactoryTitle] = React.useState("");
  const [showFactoryDropdown, setShowFactoryDropdown] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [hasLoadedDefault, setHasLoadedDefault] = React.useState(false);
  const factoryDropdownRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

  // TEMPORARY: Using crmClient for factory search (CRM query needs CRM backend, not Report API)
  // TO REVERT: Change back to useQuery hook with default client
  const [factories, setFactories] = React.useState([]);
  const [factoriesLoading, setFactoriesLoading] = React.useState(false);

  // Fetch factories using CRM client
  React.useEffect(() => {
    const fetchFactories = async () => {
      // Skip if dropdown is closed and we've already loaded default
      if (!showFactoryDropdown && hasLoadedDefault) {
        return;
      }

      setFactoriesLoading(true);
      try {
        const { data } = await crmClient.query({
          query: FACTORY_SEARCH,
          variables: {
            searchTerm: showFactoryDropdown ? searchTerm : DEFAULT_FACTORY_NAME,
            limit: 1000,
            useCustomOrder: false,
            published: true,
          },
          fetchPolicy: "network-only",
        });
        setFactories(data?.factorySearch || []);
      } catch (error) {
        console.error("Error fetching factories:", error);
        setFactories([]);
      } finally {
        setFactoriesLoading(false);
      }
    };

    fetchFactories();
  }, [showFactoryDropdown, searchTerm, hasLoadedDefault]);

  // Auto-select default factory on initial load
  React.useEffect(() => {
    if (!hasLoadedDefault && factories.length > 0 && !showFactoryDropdown) {
      const defaultFactory = factories.find(
        (f) => f.title?.toUpperCase() === DEFAULT_FACTORY_NAME.toUpperCase()
      );
      if (defaultFactory) {
        setSelectedFactoryId(defaultFactory.id);
        setSelectedFactoryTitle(defaultFactory.title);
      }
      setHasLoadedDefault(true);
    }
  }, [factories, hasLoadedDefault, showFactoryDropdown]);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (showFactoryDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showFactoryDropdown]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (factoryDropdownRef.current && !factoryDropdownRef.current.contains(event.target)) {
        setShowFactoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch product trends (only when factory is selected)
  const {
    data: productTrendsData,
    loading: productTrendsLoading,
    error: productTrendsError,
  } = useQuery(GET_PRODUCT_TRENDS_BY_FACTORY, {
    variables: {
      factoryId: selectedFactoryId,
      topN: 50,
    },
    skip: !selectedFactoryId,
  });

  const handleSelectFactory = (factory) => {
    setSelectedFactoryId(factory.id);
    setSelectedFactoryTitle(factory.title);
    setShowFactoryDropdown(false);
    setSearchTerm("");
  };

  const handleClearSelection = (e) => {
    e.stopPropagation();
    setSelectedFactoryId(null);
    setSelectedFactoryTitle("");
  };

  const handleOpenDropdown = () => {
    setShowFactoryDropdown(true);
    setSearchTerm("");
  };

  return (
    <div className="px-2 py-6 md:px-8 md:py-10 bg-[#f7f9fb] min-h-screen">
      {/* Header with Factory Selector */}
      <div className="flex flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Product Dashboard
          </h1>
          <p className="text-sm text-blue-900/70 font-medium">
            Month over month sales analysis by product
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Factory Selector */}
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Factory
          </label>
          <div className="relative" ref={factoryDropdownRef}>
            <div
              onClick={handleOpenDropdown}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:border-blue-400 transition-colors text-sm text-left min-w-[250px] cursor-pointer"
            >
              <span className={`truncate ${selectedFactoryTitle ? "text-gray-700" : "text-gray-400"}`}>
                {selectedFactoryTitle || "Search for a factory..."}
              </span>
              <div className="flex items-center gap-1">
                {selectedFactoryId && (
                  <button
                    onClick={handleClearSelection}
                    className="p-0.5 hover:bg-gray-100 rounded"
                  >
                    <X size={14} className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
                <ChevronDown
                  size={16}
                  className={`text-gray-500 flex-shrink-0 transition-transform ${showFactoryDropdown ? "rotate-180" : ""}`}
                />
              </div>
            </div>

            {showFactoryDropdown && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[280px] overflow-hidden">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Type to search factories..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="max-h-[250px] overflow-y-auto">
                  {factoriesLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2">
                      <Loader2 size={18} className="animate-spin text-blue-500" />
                      <span className="text-sm text-gray-500">Searching...</span>
                    </div>
                  ) : factories.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                      {searchTerm
                        ? `No factories found for "${searchTerm}"`
                        : "Start typing to search for factories"}
                    </div>
                  ) : (
                    factories.map((factory) => (
                      <button
                        key={factory.id}
                        onClick={() => handleSelectFactory(factory)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          selectedFactoryId === factory.id
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {factory.title}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-8">
        {/* Product Trends Grid */}
        <ProductTrendsGrid
          data={productTrendsData?.getProductTrendsByFactory}
          loading={productTrendsLoading}
          error={productTrendsError}
          factoryId={selectedFactoryId}
          factoryTitle={selectedFactoryTitle}
        />

        {/* Only show these sections when a factory is selected */}
        {selectedFactoryId && (
          <>
            {/* Customer-Product Sales Table */}
            <CustomerProductSalesTable factoryId={selectedFactoryId} />

            {/* Product Comparison Chart */}
            <ProductComparisonChart
              products={productTrendsData?.getProductTrendsByFactory?.products || []}
              loading={productTrendsLoading}
            />
          </>
        )}
      </div>
    </div>
  );
};

const ProductAnalyticsDashboard = () => (
  <AuthGuard>
    <ProductAnalyticsDashboardContent />
  </AuthGuard>
);

export default ProductAnalyticsDashboard;

