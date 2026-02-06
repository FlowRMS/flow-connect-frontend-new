'use client';

import { Badge } from '@/components/ui/badge';

type Endpoint = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
};

interface EndpointsPanelProps {
  endpoints: Endpoint[];
}

const methodColors: Record<string, string> = {
  GET: 'bg-blue-600 text-white',
  POST: 'bg-green-600 text-white',
  PUT: 'bg-yellow-600 text-white',
  DELETE: 'bg-red-600 text-white',
};

export function EndpointsPanel({ endpoints }: EndpointsPanelProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b">
        <p className="font-medium text-sm">Endpoints</p>
      </div>
      <div className="p-4 space-y-2 text-sm">
        {endpoints.map((endpoint, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
            <Badge className={`${methodColors[endpoint.method] || 'bg-gray-600 text-white'} text-xs font-mono`}>
              {endpoint.method}
            </Badge>
            <code className="text-xs">{endpoint.path}</code>
            <span className="text-muted-foreground text-xs">{endpoint.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
