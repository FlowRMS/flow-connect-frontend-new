import DiscAnalyticsSidebar from '@/components/disc-analytics/DiscAnalyticsSidebar';
import DiscAnalyticsTopBar from '@/components/disc-analytics/DiscAnalyticsTopBar';

export default function DiscAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* DISC Analytics Left Sidebar */}
      <DiscAnalyticsSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DiscAnalyticsTopBar />
        {children}
      </div>
    </div>
  );
}
