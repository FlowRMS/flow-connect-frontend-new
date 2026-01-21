'use client';

import { useParams, useRouter } from 'next/navigation';
import { QuoteDetailV2Page } from '@/components/quotes-v2/QuoteDetailV2Page';
import { useUnsavedChangesContext } from '@/contexts/UnsavedChangesContext';

export default function QuoteV2DetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const { requestNavigation, hasUnsavedChanges } = useUnsavedChangesContext();

  const handleBack = () => {
    // Check for unsaved changes before allowing navigation
    if (hasUnsavedChanges) {
      const canNavigate = requestNavigation('/quotes-v2', 'back');
      if (!canNavigate) {
        return; // Navigation blocked, modal will be shown
      }
    }
    router.push('/quotes-v2');
  };

  return <QuoteDetailV2Page quoteId={quoteId} onBack={handleBack} />;
}
