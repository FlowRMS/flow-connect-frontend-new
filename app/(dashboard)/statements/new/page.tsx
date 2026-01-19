'use client';

import { useRouter } from 'next/navigation';
import { StatementDetailPage } from '@/components/statements/detail/StatementDetailPage';

export default function NewStatementPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/statements');
  };

  return <StatementDetailPage statementId={null} onBack={handleBack} isNew />;
}
