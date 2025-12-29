import { DashboardCardsSkeleton } from "@/components/analytics/stats-card/StatsCardSkeleton";

export const DashboardCards = ({ StatsCard, data = [], loading = false }) => {
  if (loading) {
    return <DashboardCardsSkeleton count={data?.length || 4} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {data.map((kpi, idx) => (
        <StatsCard
          key={idx}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
          progress={kpi.progress}
          progressColor={kpi.progressColor}
          loading={false} // Individual cards are not loading since we handle it at container level
        />
      ))}
    </div>
  );
};

