'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiCredentials } from '@/lib/nemra-pos-data';
import { MethodPreferencePanel, type ApiCodeExamples } from '@/components/method-preference';

const getDistributorApiExamples = (api: ApiCredentials): ApiCodeExamples => ({
  submitBatch: `curl -X POST ${api.baseUrl}/pos/upload \\
  -H "Authorization: Bearer ${api.apiKey}" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \\
  -d '{
    "dataMonth": "2024-12",
    "records": [
      {
        "transactionDate": "2024-12-15",
        "sellingBranchZip": "98101",
        "customerZip": "98105",
        "catalogNumber": "FT-VAL-2024",
        "quantity": 50,
        "unitCost": 49.00,
        "extendedPrice": 2450.00,
        "unitOfMeasure": "EA"
      }
    ]
  }'`,
  response: `{
  "batchId": "batch_xyz789",
  "status": "received",
  "recordsReceived": 1,
  "createdAt": "2024-12-15T10:30:00Z"
}`,
  checkStatus: `curl ${api.baseUrl}/pos/batches/batch_xyz789 \\
  -H "Authorization: Bearer ${api.apiKey}"

{
  "batchId": "batch_xyz789",
  "status": "accepted",
  "recordsReceived": 1,
  "recordsValid": 1,
  "recordsRejected": 0,
  "processedAt": "2024-12-15T10:31:00Z"
}`,
  csvUpload: `curl -X POST ${api.baseUrl}/pos/upload \\
  -H "Authorization: Bearer ${api.apiKey}" \\
  -H "Content-Type: text/csv" \\
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \\
  --data-binary @pos_export.csv`,
});

export default function DistributorSendMethodPage() {
  const router = useRouter();

  const handleNavigateToUpload = useCallback(() => {
    router.push('/nemra-pos/distributor/send');
  }, [router]);

  return (
    <MethodPreferencePanel
      mode="send"
      role="distributor"
      onNavigateToUpload={handleNavigateToUpload}
      getApiCodeExamples={getDistributorApiExamples}
    />
  );
}
