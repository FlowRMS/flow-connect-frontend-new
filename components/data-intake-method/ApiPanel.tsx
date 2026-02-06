'use client';

import { Badge } from '@/components/ui/badge';
import type { DataIntakeApiConfig } from '@/lib/nemra-pos-data';

interface ApiPanelProps {
  config: DataIntakeApiConfig;
}

export function ApiPanel({ config }: ApiPanelProps) {
  return (
    <div className="mt-4 space-y-4">
      {/* Credentials */}
      <div className="p-4 bg-muted rounded-lg space-y-3">
        <p className="font-medium">Your API Credentials</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Base URL</p>
            <code className="text-sm bg-background px-3 py-2 rounded border block truncate">
              {config.credentials.baseUrl}
            </code>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">API Key</p>
            <code className="text-sm bg-background px-3 py-2 rounded border block truncate">
              {config.credentials.apiKey}
            </code>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your token is scoped to your organization. All requests are automatically associated with your account.
        </p>
      </div>

      {/* Endpoints */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2 border-b">
          <p className="font-medium text-sm">Endpoints</p>
        </div>
        <div className="p-4 space-y-2 text-sm">
          {config.endpoints.map((endpoint, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
              <Badge className="bg-blue-600 text-white text-xs font-mono">
                {endpoint.method}
              </Badge>
              <code className="text-xs">{endpoint.path}</code>
              <span className="text-muted-foreground text-xs">{endpoint.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2 border-b">
          <p className="font-medium text-sm">Quick Start</p>
        </div>
        <div className="p-4 space-y-4">
          {config.quickStartExamples.map((example, idx) => (
            <div key={idx}>
              <p className="text-sm font-medium mb-2">{example.title}</p>
              <pre className="text-xs bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
                {example.code}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limits */}
      <div className="p-4 bg-muted rounded-lg space-y-2">
        <p className="text-sm">
          <span className="font-medium">Rate limit:</span>{' '}
          <span className="text-muted-foreground">{config.rateLimit}</span>
        </p>
        <p className="text-sm">
          <span className="font-medium">Pagination:</span>{' '}
          <span className="text-muted-foreground">
            <code className="text-xs bg-background px-1 py-0.5 rounded">{config.pagination}</code>
          </span>
        </p>
      </div>
    </div>
  );
}

