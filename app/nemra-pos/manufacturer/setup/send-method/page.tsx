'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiCredentials } from '@/lib/nemra-pos-data';
import { MethodPreferencePanel, type ApiCodeExamples } from '@/components/method-preference';

const getManufacturerApiExamples = (api: ApiCredentials): ApiCodeExamples => ({
  submitBatch: `curl -X POST ${api.baseUrl}/pos/rep-sends \\
  -H "Authorization: Bearer ${api.apiKey}" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \\
  -d '{
    "repFirmId": "rep-001",
    "dataMonth": "2024-12",
    "records": [
      {
        "transactionDate": "2024-12-15",
        "distributorName": "Pacific Supply Co",
        "sellingBranchZip": "98101",
        "customerZip": "98105",
        "catalogNumber": "FT-VAL-2024",
        "quantity": 50,
        "unitCost": 49.00,
        "extendedPrice": 2450.00
      }
    ]
  }'`,
  response: `{
  "batchId": "batch_abc123",
  "status": "received",
  "recordsReceived": 1,
  "repFirmId": "rep-001",
  "createdAt": "2024-12-15T10:30:00Z"
}`,
  checkStatus: `curl ${api.baseUrl}/pos/rep-sends/batch_abc123 \\
  -H "Authorization: Bearer ${api.apiKey}"

{
  "batchId": "batch_abc123",
  "status": "delivered",
  "recordsReceived": 1,
  "recordsValid": 1,
  "recordsRejected": 0,
  "repFirmId": "rep-001",
  "deliveredAt": "2024-12-15T10:31:00Z"
}`,
  csvUpload: `curl -X POST ${api.baseUrl}/pos/rep-sends \\
  -H "Authorization: Bearer ${api.apiKey}" \\
  -H "Content-Type: text/csv" \\
  -H "X-Rep-Firm-Id: rep-001" \\
  -H "X-Data-Month: 2024-12" \\
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \\
  --data-binary @pos_for_reps.csv`,
});

export default function ManufacturerSendMethodPage() {
  const router = useRouter();

  const handleNavigateToSendData = useCallback(() => {
    router.push('/nemra-pos/manufacturer/send');
  }, [router]);

  return (
    <MethodPreferencePanel
      mode="send"
      role="manufacturer"
      onNavigateToUpload={handleNavigateToSendData}
      getApiCodeExamples={getManufacturerApiExamples}
    />
  );
}
