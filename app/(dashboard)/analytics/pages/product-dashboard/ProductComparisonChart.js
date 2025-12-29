"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { X, ChevronDown, Check, TrendingUp } from "lucide-react";

// Color palette for the lines
const LINE_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
];

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const ProductSelector = ({
  products,
  selectedProducts,
  onToggleProduct,
  maxProducts = 5,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSelected = (productId) =>
    selectedProducts.some((p) => p.productId === productId);

  const canSelectMore = selectedProducts.length < maxProducts;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-400 transition-colors text-sm min-w-[200px]"
      >
        <span className="text-gray-700">
          {selectedProducts.length} of {maxProducts} products selected
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 ml-auto transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[280px] max-h-[300px] overflow-y-auto">
          {products.map((product, index) => {
            const selected = isSelected(product.productId);
            const disabled = !selected && !canSelectMore;

            return (
              <button
                key={product.productId}
                onClick={() => {
                  if (!disabled) {
                    onToggleProduct(product);
                  }
                }}
                disabled={disabled}
                className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                  selected
                    ? "bg-blue-50 text-blue-700"
                    : disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    selected
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selected && <Check size={12} className="text-white" />}
                </div>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: selected
                      ? LINE_COLORS[selectedProducts.findIndex(
                          (p) => p.productId === product.productId
                        )]
                      : "#E5E7EB",
                  }}
                />
                <span className="truncate flex-1">{product.productName}</span>
                <span className="text-xs text-gray-500">
                  {formatCurrency(parseFloat(product.totalSales))}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SelectedProductTags = ({ selectedProducts, onRemove }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {selectedProducts.map((product, index) => (
        <div
          key={product.productId}
          className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full text-sm"
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: LINE_COLORS[index] }}
          />
          <span className="text-gray-700 max-w-[150px] truncate">
            {product.productName}
          </span>
          <button
            onClick={() => onRemove(product)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export const ProductComparisonChart = ({ products = [], loading = false }) => {
  const [selectedProducts, setSelectedProducts] = React.useState([]);

  // Auto-select top 5 products when data loads or changes (e.g., factory change)
  React.useEffect(() => {
    if (products.length > 0) {
      // Products are already sorted by totalSales desc from the API
      setSelectedProducts(products.slice(0, 5));
    } else {
      setSelectedProducts([]);
    }
  }, [products]);

  const handleToggleProduct = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.productId === product.productId);
      if (exists) {
        return prev.filter((p) => p.productId !== product.productId);
      } else if (prev.length < 5) {
        return [...prev, product];
      }
      return prev;
    });
  };

  const handleRemoveProduct = (product) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p.productId !== product.productId)
    );
  };

  // Build chart data from selected products
  const chartData = React.useMemo(() => {
    if (selectedProducts.length === 0) return [];

    // Collect all unique months across selected products
    const monthsMap = new Map();

    selectedProducts.forEach((product) => {
      product.monthlyData.forEach((dataPoint) => {
        if (!monthsMap.has(dataPoint.label)) {
          monthsMap.set(dataPoint.label, { month: dataPoint.label });
        }
        monthsMap.get(dataPoint.label)[product.productId] = parseFloat(
          dataPoint.value
        );
      });
    });

    // Convert to array and sort by date
    const data = Array.from(monthsMap.values());

    // Sort by date (parse "Mon YYYY" format)
    data.sort((a, b) => {
      const parseDate = (str) => {
        const [mon, year] = str.split(" ");
        const monthIndex = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ].indexOf(mon);
        const yearNum = parseInt(year);
        if (monthIndex === -1 || isNaN(yearNum)) {
          // Invalid format, sort to end
          // Optionally, log a warning: console.warn(`Invalid month label: ${str}`);
          return Number.POSITIVE_INFINITY;
        }
        return new Date(yearNum, monthIndex);
      };
      return parseDate(a.month) - parseDate(b.month);
    });

    return data;
  }, [selectedProducts]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-[300px] bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Product Comparison
          </h3>
        </div>

        <ProductSelector
          products={products}
          selectedProducts={selectedProducts}
          onToggleProduct={handleToggleProduct}
          maxProducts={5}
        />
      </div>

      {/* Selected Product Tags */}
      {selectedProducts.length > 0 && (
        <div className="mb-4">
          <SelectedProductTags
            selectedProducts={selectedProducts}
            onRemove={handleRemoveProduct}
          />
        </div>
      )}

      {/* Chart */}
      {selectedProducts.length > 0 && chartData.length > 0 ? (
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={{ stroke: "#E5E7EB" }}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={{ stroke: "#E5E7EB" }}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <Tooltip
                formatter={(value, name) => {
                  const product = selectedProducts.find(
                    (p) => p.productId === name
                  );
                  return [
                    formatCurrency(value),
                    product?.productName || name,
                  ];
                }}
                labelStyle={{ color: "#374151", fontWeight: 600 }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend
                formatter={(value) => {
                  const product = selectedProducts.find(
                    (p) => p.productId === value
                  );
                  const name = product?.productName || value;
                  // Truncate long names
                  return name.length > 20 ? name.substring(0, 20) + "..." : name;
                }}
                wrapperStyle={{ fontSize: "12px" }}
              />
              {selectedProducts.map((product, index) => (
                <Line
                  key={product.productId}
                  type="monotone"
                  dataKey={product.productId}
                  name={product.productId}
                  stroke={LINE_COLORS[index]}
                  strokeWidth={2}
                  dot={{ fill: LINE_COLORS[index], strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          Select products to compare their sales trends
        </div>
      )}
    </div>
  );
};