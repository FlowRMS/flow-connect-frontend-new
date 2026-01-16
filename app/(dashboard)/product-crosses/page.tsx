import { Suspense } from 'react';
import { ProductCrossesContent } from '@/components/product-crosses/ProductCrossesContent';

export default function ProductCrossesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <ProductCrossesContent />
    </Suspense>
  );
}
