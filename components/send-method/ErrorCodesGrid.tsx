'use client';

type ErrorCode = {
  code: string;
  description: string;
};

interface ErrorCodesGridProps {
  codes: ErrorCode[];
  errorExample?: string;
}

export function ErrorCodesGrid({ codes, errorExample }: ErrorCodesGridProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b">
        <p className="font-medium text-sm">Error Handling</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {codes.map((error, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <code className="text-xs">{error.code}</code>
              <span className="text-muted-foreground text-xs">{error.description}</span>
            </div>
          ))}
        </div>
        {errorExample && (
          <pre className="text-xs bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
            {errorExample}
          </pre>
        )}
      </div>
    </div>
  );
}
