'use client';

import { useParams } from 'next/navigation';
import StatementDetailContent from '@/components/statements/detail/StatementDetailContent';

export default function StatementDetailPageRoute() {
  const params = useParams();
  const statementId = params.id as string;

  return <StatementDetailContent statementId={statementId} />;
}
