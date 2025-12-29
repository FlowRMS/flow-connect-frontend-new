'use client';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/analytics/lib/format';

const COLORS = {
  primary: '#3b82f6', // blue-500
  hover: '#2563eb', // blue-600
  gradient1: '#60a5fa', // blue-400
  gradient2: '#3b82f6', // blue-500
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        <p className="text-sm text-blue-600 font-medium">
          {formatCurrency(parseFloat(payload[0].value))}
        </p>
      </div>
    );
  }
  return null;
};

const formatYAxis = (value) => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
};

const formatXAxis = (label) => {
  // Format "Jan 2020" style labels
  const parts = label.split(' ');
  if (parts.length === 2) {
    const [month, year] = parts;
    // Show full label for first month of each year, otherwise just month
    return label;
  }
  return label;
};

export const MonthlyBarChart = ({
  data = [],
  title = 'Monthly Data',
  loading = false,
  error = null,
  className = '',
  height = 400,
  activeFilters = null, // Pass global filter state to show active filters
}) => {
  // Transform data from string values to numbers
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((item) => ({
      label: item.label,
      value: parseFloat(item.value),
      displayValue: item.value,
    }));
  }, [data]);

  // Calculate some statistics
  const stats = React.useMemo(() => {
    if (chartData.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0 };
    }

    const values = chartData.map(d => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { total, average, max, min };
  }, [chartData]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-red-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="text-red-600 text-sm">
          Error loading chart data: {error.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        
        {/* Active Filters Display */}
        {activeFilters && (activeFilters.customers?.length > 0 || activeFilters.factories?.length > 0 || activeFilters.outsideReps?.length > 0) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-900 mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {activeFilters.customers?.map((customer, idx) => (
                <span key={`customer-${idx}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                  <span className="font-semibold mr-1">Customer:</span> {customer.label}
                </span>
              ))}
              {activeFilters.factories?.map((factory, idx) => (
                <span key={`factory-${idx}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                  <span className="font-semibold mr-1">Factory:</span> {factory.label}
                </span>
              ))}
              {activeFilters.outsideReps?.map((rep, idx) => (
                <span key={`rep-${idx}`} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                  <span className="font-semibold mr-1">Rep:</span> {rep.label}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700 font-medium mb-1">Total</p>
            <p className="text-sm font-bold text-blue-900">
              {formatCurrency(stats.total)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-700 font-medium mb-1">Average</p>
            <p className="text-sm font-bold text-green-900">
              {formatCurrency(stats.average)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-purple-700 font-medium mb-1">Highest</p>
            <p className="text-sm font-bold text-purple-900">
              {formatCurrency(stats.max)}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-xs text-orange-700 font-medium mb-1">Lowest</p>
            <p className="text-sm font-bold text-orange-900">
              {formatCurrency(stats.min)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.gradient1} stopOpacity={0.9} />
                <stop offset="100%" stopColor={COLORS.gradient2} stopOpacity={0.7} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            <XAxis
              dataKey="label"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={formatXAxis}
            />
            
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatYAxis}
            />
            
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            
            <Bar
              dataKey="value"
              fill="url(#barGradient)"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Showing {chartData.length} months of data
        </p>
      </div>
    </div>
  );
};

