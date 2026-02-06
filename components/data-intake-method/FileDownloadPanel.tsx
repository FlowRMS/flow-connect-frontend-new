'use client';

import { Button } from '@/components/ui/button';
import type { DataIntakeFileConfig } from '@/lib/nemra-pos-data';

interface FileDownloadPanelProps {
  config: DataIntakeFileConfig;
}

export function FileDownloadPanel({ config }: FileDownloadPanelProps) {
  return (
    <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
      <p className="font-medium">Manual Download</p>
      <p className="text-sm text-muted-foreground">
        {config.description}
      </p>
      <Button variant="outline" size="sm" asChild>
        <a href={config.downloadPageUrl}>Go to Download</a>
      </Button>
    </div>
  );
}

