'use client';

import { useRouter } from 'next/navigation';
import { QuoteDetailV2Page } from '@/components/quotes-v2/QuoteDetailV2Page';

export default function NewQuoteV2Page() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/quotes-v2');
  };

  // Pass null to indicate this is a new quote
  return <QuoteDetailV2Page quoteId={null} onBack={handleBack} isNew />;
}
