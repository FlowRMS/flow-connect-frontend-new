import { AnalyticsLayoutClient } from "@/components/analytics/AnalyticsLayoutClient";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AnalyticsLayoutClient>{children}</AnalyticsLayoutClient>;
}
