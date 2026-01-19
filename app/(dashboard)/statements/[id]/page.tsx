'use client';

import { useParams, useRouter } from 'next/navigation';
import { StatementDetailPage } from '@/components/statements/detail/StatementDetailPage';

export default function StatementDetailPageRoute() {
  const params = useParams();
  const router = useRouter();
  const statementId = params.id as string;

  const handleBack = () => {
    router.push('/statements');
  };

  return <StatementDetailPage statementId={statementId} onBack={handleBack} />;
}
