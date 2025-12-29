import React from "react";

const StatCard = ({ title, value, subtitle, color = "blue", loading = false }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">
        {title}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && (
        <p className="text-xs mt-1 opacity-70">{subtitle}</p>
      )}
    </div>
  );
};

export const DashboardCards = ({ data, loading = false }) => {
  const formatCurrency = (value) => {
    if (!value) return "$0";
    const num = parseFloat(value);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  // Extract summary data from metadata or calculate from data
  const totalSales = data?.metadata?.total_value || "0";
  const recordCount = data?.metadata?.record_count || 0;

  // Calculate stats from chart data
  const chartData = data?.data || [];
  const values = chartData.map((d) => parseFloat(d.value) || 0);
  
  const total = values.reduce((sum, v) => sum + v, 0);
  const average = values.length > 0 ? total / values.length : 0;
  const highest = values.length > 0 ? Math.max(...values) : 0;
  const lowest = values.length > 0 ? Math.min(...values) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total"
        value={formatCurrency(total)}
        subtitle={`${recordCount} months of data`}
        color="blue"
        loading={loading}
      />
      <StatCard
        title="Average"
        value={formatCurrency(average)}
        subtitle="Per month"
        color="green"
        loading={loading}
      />
      <StatCard
        title="Highest"
        value={formatCurrency(highest)}
        subtitle="Best month"
        color="purple"
        loading={loading}
      />
      <StatCard
        title="Lowest"
        value={formatCurrency(lowest)}
        subtitle="Lowest month"
        color="amber"
        loading={loading}
      />
    </div>
  );
};
