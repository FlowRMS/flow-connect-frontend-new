'use client';

import { Button } from '@/components/ui/button';
import type { SftpConfig } from '@/lib/nemra-pos-data';

interface SftpConfigPanelProps {
  config: SftpConfig;
  description?: string;
  onDownloadKey?: () => void;
}

export function SftpConfigPanel({ config, description, onDownloadKey }: SftpConfigPanelProps) {
  return (
    <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
      <p className="font-medium">SFTP Connection Details</p>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Host</p>
          <code className="text-sm bg-background px-3 py-2 rounded border block">
            {config.host}
          </code>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Username</p>
          <code className="text-sm bg-background px-3 py-2 rounded border block">
            {config.username}
          </code>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Directory</p>
          <code className="text-sm bg-background px-3 py-2 rounded border block">
            {config.directory}
          </code>
        </div>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Button variant="outline" size="sm" onClick={onDownloadKey}>
        Download SSH Key
      </Button>
    </div>
  );
}
