'use client';

import { Button } from '@/components/ui/button';
import type { DataIntakeSftpConfig } from '@/lib/nemra-pos-data';

interface SftpPanelProps {
  config: DataIntakeSftpConfig;
  entityLabel: string;
}

export function SftpPanel({ config, entityLabel }: SftpPanelProps) {
  return (
    <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
      <p className="font-medium">SFTP Delivery Configuration</p>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Your SFTP Host</p>
          <code className="text-sm bg-background px-3 py-2 rounded border block">
            {config.host}
          </code>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Directory</p>
          <code className="text-sm bg-background px-3 py-2 rounded border block">
            {config.directory}
          </code>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Delivery Schedule</p>
          <code className="text-sm bg-background px-3 py-2 rounded border block">
            {config.schedule}
          </code>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Files are delivered automatically when new data is received from {entityLabel}.
      </p>
      <Button variant="outline" size="sm">Configure SFTP Settings</Button>
    </div>
  );
}

