import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';

/**
 * Next.js App Router loading boundary.
 * This component is shown INSTANTLY when navigating between pages,
 * eliminating the perceived delay during navigation.
 */
export default function DashboardLoading() {
  return <PageLoadingSkeleton />;
}
