/**
 * ProductsStatsCards Component
 * Container component that displays all product statistics cards
 * Each card fetches its data independently with specific filters
 */

import { ProductStatCard } from './ProductStatCard';
import { useProductStat } from './useProductStat';
import type { ProductLandingPageFilter } from '../../../api/useProductsApi';

export function ProductsStatsCards() {
  // Total Products - no filter
  const totalProducts = useProductStat(undefined);

  // Published Products - filter: published = true
  const publishedProducts = useProductStat([
    {
      columnName: 'published',
      operator: 'EQ',
      value: 'true',
    },
  ]);

  // Draft Products - filter: published = false
  const draftProducts = useProductStat([
    {
      columnName: 'published',
      operator: 'EQ',
      value: 'false',
    },
  ]);

  // Needs Approval - filter: approvalNeeded = true
  const needsApproval = useProductStat([
    {
      columnName: 'approvalNeeded',
      operator: 'EQ',
      value: 'true',
    },
  ]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <ProductStatCard
        label="Total Products"
        subtitle="In catalog"
        value={totalProducts.total}
        isLoading={totalProducts.isLoading}
        color="foreground"
      />
      <ProductStatCard
        label="Published"
        subtitle="Available for use"
        value={publishedProducts.total}
        isLoading={publishedProducts.isLoading}
        color="green-600"
      />
      <ProductStatCard
        label="Draft"
        subtitle="Not published"
        value={draftProducts.total}
        isLoading={draftProducts.isLoading}
        color="amber-600"
      />
      <ProductStatCard
        label="Needs Approval"
        subtitle="Pending review"
        value={needsApproval.total}
        isLoading={needsApproval.isLoading}
        color="purple-600"
      />
    </div>
  );
}
