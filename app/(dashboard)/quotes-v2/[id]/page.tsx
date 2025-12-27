'use client';

import { useParams, useRouter } from 'next/navigation';
import { QuoteDetailV2Page } from '@/components/quotes-v2/QuoteDetailV2Page';

export default function QuoteV2DetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const handleBack = () => {
    router.push('/quotes-v2');
  };

  return <QuoteDetailV2Page quoteId={quoteId} onBack={handleBack} />;
}
