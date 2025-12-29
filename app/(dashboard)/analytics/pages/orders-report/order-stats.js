"use client";

import { StatsCard } from "@/components/analytics/stats-card/stats-card";

export function OrderStatsCards({ kpis }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Orders"
        value={kpis.totalOrders.toLocaleString()}
        change={kpis.ordersChangePct}
        progress={Math.min(100, 40 + (kpis.totalOrders % 60))}
        progressColor="#3b82f6"
      />

      <StatsCard
        title="Total Revenue"
        value={`$${kpis.totalRevenue.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}`}
        change={((kpis.totalRevenue % 10000) / 100).toFixed(2)}
        progress={kpis.revenueUtilization}
        progressColor="#10b981"
      />

      <StatsCard
        title="Avg. Order"
        value={`$${kpis.avgOrder.toFixed(2)}`}
        change={-Math.abs(kpis.avgDiscount / 10)}
        progress={Math.min(100, Math.round((kpis.avgOrder / 2000) * 100))}
        progressColor="#f97316"
      />

      <StatsCard
        title="Avg. Discount"
        value={`${kpis.avgDiscount.toFixed(2)}%`}
        change={-((kpis.avgDiscount % 5) - 2)}
        progress={Math.min(100, Math.round(kpis.avgDiscount))}
        progressColor="#ef4444"
      />
    </div>
  );
}

