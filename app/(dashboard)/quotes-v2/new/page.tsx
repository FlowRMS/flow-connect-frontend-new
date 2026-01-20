'use client';

import { useRouter } from 'next/navigation';
import { QuoteDetailV2Page } from '@/components/quotes-v2/QuoteDetailV2Page';
import { useUnsavedChangesContext } from '@/contexts/UnsavedChangesContext';

export default function NewQuoteV2Page() {
  const router = useRouter();
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

  // Pass null to indicate this is a new quote
  return <QuoteDetailV2Page quoteId={null} onBack={handleBack} isNew />;
}
