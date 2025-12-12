import AnalyticsSidebar from '@/components/analytics/AnalyticsSidebar';
import AnalyticsTopBar from '@/components/analytics/AnalyticsTopBar';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Analytics Left Sidebar */}
      <AnalyticsSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnalyticsTopBar />
        {children}
      </div>
    </div>
  );
}
