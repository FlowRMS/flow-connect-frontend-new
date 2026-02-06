'use client';

type BatchStatus = {
  status: string;
  description: string;
};

interface BatchStatusesGridProps {
  statuses: BatchStatus[];
}

export function BatchStatusesGrid({ statuses }: BatchStatusesGridProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b">
        <p className="font-medium text-sm">Batch Statuses</p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {statuses.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <code className="text-xs">{item.status}</code>
              <span className="text-muted-foreground text-xs">{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
