"use client";

import React from "react";
import { useQuery } from "@apollo/client/react";
import { GET_TABLE_DATA } from "@/lib/analytics/graphql/queries/commissionGapReports";
import { DataGrid } from "@/components/analytics/rv-grid/rv-grid.js";
import { Loader2 } from "lucide-react";
import { useSkeletonConfig } from "@/lib/analytics/hooks/useAdvancedLoading";

// Currency cell formatter
const currencyCell = (h, { value }) =>
  h(
    "span",
    {
      style: {
        textAlign: "right",
        display: "block",
        fontVariantNumeric: "tabular-nums",
      },
    },
    value != null ? `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"
  );

// Balance cell formatter with color coding
const balanceCell = (h, { value }) => {
  const isNegative = value < 0;
  return h(
    "span",
    {
      style: {
        textAlign: "right",
        display: "block",
        fontVariantNumeric: "tabular-nums",
        color: isNegative ? "#dc2626" : "#16a34a",
        fontWeight: "500",
      },
    },
    value != null ? `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"
  );
};

// Column definitions for Commission Balance Over Time
const commissionBalanceOverTimeColumns = [
  {
    prop: "timeFrame",
    name: "Time Frame",
    size: 200,
  },
  {
    prop: "expectedCommission",
    name: "Expected Commission",
    size: 180,
    cellTemplate: currencyCell,
    columnTemplate: (h, column) => h("div", { title: "Commission earned as shown by your orders" }, column.name),
  },
  {
    prop: "paidCommission",
    name: "Paid Commission",
    size: 180,
    cellTemplate: currencyCell,
    columnTemplate: (h, column) => h("div", { title: "Commission collected as shown by your posted checks" }, column.name),
  },
  {
    prop: "commissionBalance",
    name: "Commission Balance",
    size: 180,
    cellTemplate: balanceCell,
  },
];

// Column definitions for Factory Balance
const factoryBalanceColumns = [
  {
    prop: "factoryName",
    name: "Factory Name",
    size: 280,
  },
  {
    prop: "expectedCommission",
    name: "Expected Commission",
    size: 180,
    cellTemplate: currencyCell,
    columnTemplate: (h, column) => h("div", { title: "Commission earned as shown by your orders" }, column.name),
  },
  {
    prop: "paidCommission",
    name: "Paid Commission",
    size: 180,
    cellTemplate: currencyCell,
    columnTemplate: (h, column) => h("div", { title: "Commission collected as shown by your posted checks" }, column.name),
  },
  {
    prop: "commissionBalance",
    name: "Commission Balance",
    size: 180,
    cellTemplate: balanceCell,
  },
];

export function CommissionGapReportsGrid() {
  const skeletonConfig = useSkeletonConfig("orders-report");
  const [activeTab, setActiveTab] = React.useState("balance-over-time");

  // Fetch Commission Balance Over Time data
  const {
    data: balanceOverTimeData,
    loading: balanceOverTimeLoading,
    error: balanceOverTimeError,
  } = useQuery(GET_TABLE_DATA, {
    variables: {
      dataType: "COMMISSION_BALANCE_OVER_TIME",
      startDate: null,
      endDate: null,
    },
  });

  // Fetch Factory Balance data
  const {
    data: factoryBalanceData,
    loading: factoryBalanceLoading,
    error: factoryBalanceError,
  } = useQuery(GET_TABLE_DATA, {
    variables: {
      dataType: "FACTORY_BALANCE",
      startDate: null,
      endDate: null,
    },
  });

  const balanceOverTimeRows = React.useMemo(() => {
    return balanceOverTimeData?.getTableData?.rows || [];
  }, [balanceOverTimeData]);

  const factoryBalanceRows = React.useMemo(() => {
    return factoryBalanceData?.getTableData?.rows || [];
  }, [factoryBalanceData]);

  const isLoading = activeTab === "balance-over-time" ? balanceOverTimeLoading : factoryBalanceLoading;
  const error = activeTab === "balance-over-time" ? balanceOverTimeError : factoryBalanceError;
  const rowCount = activeTab === "balance-over-time" ? balanceOverTimeRows.length : factoryBalanceRows.length;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Commission Gap Reports
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Track commission balances over time and by factory
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{isLoading ? "Loading..." : `${rowCount} records`}</span>
          </div>
        </div>
      </div>

      {/* Content Area with Tabs */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex px-6">
                <button
                  onClick={() => setActiveTab("balance-over-time")}
                  className={`relative px-6 py-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === "balance-over-time"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
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
                    <span>Balance Over Time</span>
                    {!balanceOverTimeLoading && (
                      <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {balanceOverTimeRows.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("factory-balance")}
                  className={`relative px-6 py-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === "factory-balance"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>Factory Balance</span>
                    {!factoryBalanceLoading && (
                      <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {factoryBalanceRows.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-0">
              {error ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                      <Loader2 className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Error loading data
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {error.message}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Commission Balance Over Time Table */}
                  {activeTab === "balance-over-time" && (
                    <div className="animate-fadeIn">
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-transparent border-b border-gray-100">
                        <h2 className="text-base font-semibold text-gray-900">
                          Commission Balance Over Time
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                          View commission balances across different time periods
                        </p>
                      </div>
                      <DataGrid
                        columns={commissionBalanceOverTimeColumns}
                        data={balanceOverTimeRows}
                        loading={balanceOverTimeLoading}
                        height={600}
                        emptyMessage="No commission balance data available"
                        skeletonPreset="orderDashboard"
                        skeletonRows={skeletonConfig.grid.rows}
                        skeletonProps={{
                          columnWidths: [200, 180, 180, 180],
                          showStats: false,
                        }}
                      />
                    </div>
                  )}

                  {/* Factory Balance Table */}
                  {activeTab === "factory-balance" && (
                    <div className="animate-fadeIn">
                      <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-transparent border-b border-gray-100">
                        <h2 className="text-base font-semibold text-gray-900">
                          Factory Balance
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                          View commission balances by factory
                        </p>
                      </div>
                      <DataGrid
                        columns={factoryBalanceColumns}
                        data={factoryBalanceRows}
                        loading={factoryBalanceLoading}
                        height={600}
                        emptyMessage="No factory balance data available"
                        skeletonPreset="orderDashboard"
                        skeletonRows={skeletonConfig.grid.rows}
                        skeletonProps={{
                          columnWidths: [280, 180, 180, 180],
                          showStats: false,
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



