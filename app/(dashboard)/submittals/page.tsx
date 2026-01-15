'use client';

import dynamic from 'next/dynamic';

const SubmittalsContent = dynamic(
  () => import('@/components/SubmittalsContent'),
  {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center"><div className="text-[var(--muted-foreground)]">Loading...</div></div>
  }
);

export default function SubmittalsPage() {
  return <SubmittalsContent />;
}
