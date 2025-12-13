import { Suspense } from 'react';
import BuySellContent from '@/components/financial/BuySellContent';

export default function BuySellPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
      <BuySellContent />
    </Suspense>
  );
}
