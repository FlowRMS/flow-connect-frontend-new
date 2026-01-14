import { MinimalPageLoading } from '@/components/ui/PageTransition';

/**
 * Next.js App Router loading boundary.
 * Uses smooth morph-style fade transition instead of skeleton lines.
 */
export default function DashboardLoading() {
  return <MinimalPageLoading />;
}
