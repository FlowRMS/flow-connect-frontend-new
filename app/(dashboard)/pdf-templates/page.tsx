import { Suspense } from 'react';
import PdfTemplatesContent from '@/components/pdf-templates/PdfTemplatesContent';

export default function PdfTemplatesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PdfTemplatesContent />
    </Suspense>
  );
}
