import { Suspense } from 'react';
import ProductsContent from '@/components/products/list/ProductsContent';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>}>
      <ProductsContent />
    </Suspense>
  );
}
