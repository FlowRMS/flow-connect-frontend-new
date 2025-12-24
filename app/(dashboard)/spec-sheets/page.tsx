'use client';

import dynamic from 'next/dynamic';

const SpecSheetsContent = dynamic(
  () => import('@/components/submittals/SpecSheetsContent'),
  {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>
  }
);

export default function SpecSheetsPage() {
  return <SpecSheetsContent />;
}
