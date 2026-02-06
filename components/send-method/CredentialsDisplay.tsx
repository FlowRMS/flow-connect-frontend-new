'use client';

interface CredentialsDisplayProps {
  baseUrl: string;
  apiKey: string;
  description?: string;
}

export function CredentialsDisplay({ baseUrl, apiKey, description }: CredentialsDisplayProps) {
  return (
    <div className="p-4 bg-muted rounded-lg space-y-3">
      <p className="font-medium">Your API Credentials</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Base URL</p>
          <code className="text-sm bg-background px-3 py-2 rounded border block truncate">
            {baseUrl}
          </code>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">API Key</p>
          <code className="text-sm bg-background px-3 py-2 rounded border block truncate">
            {apiKey}
          </code>
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
