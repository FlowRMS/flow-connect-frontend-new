'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    // Redirect to the edit page for now
    router.replace(`/quotes/${id}/edit`);
  }, [id, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}
