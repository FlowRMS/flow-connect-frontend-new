'use client';

interface RateLimitInfoProps {
  requestsPerMinute: number;
  maxRecordsPerBatch: number;
}

export function RateLimitInfo({ requestsPerMinute, maxRecordsPerBatch }: RateLimitInfoProps) {
  return (
    <div className="p-4 bg-muted rounded-lg space-y-2">
      <p className="text-sm">
        <span className="font-medium">Rate limit:</span>{' '}
        <span className="text-muted-foreground">
          {requestsPerMinute.toLocaleString()} requests/min, {maxRecordsPerBatch.toLocaleString()} records/batch
        </span>
      </p>
      <p className="text-sm">
        <span className="font-medium">Idempotency:</span>{' '}
        <span className="text-muted-foreground">
          Include <code className="text-xs bg-background px-1 py-0.5 rounded">Idempotency-Key</code> header to safely retry requests
        </span>
      </p>
    </div>
  );
}
