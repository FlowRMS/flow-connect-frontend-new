import { Suspense } from 'react';
import BuySellContent from '@/components/financial/BuySellContent';

function UnderConstructionModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Under Construction
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          This page is currently being built. Please check back soon!
        </p>
      </div>
    </div>
  );
}

export default function BuySellPage() {
  return (
    <>
      <UnderConstructionModal />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
        <BuySellContent />
      </Suspense>
    </>
  );
}
