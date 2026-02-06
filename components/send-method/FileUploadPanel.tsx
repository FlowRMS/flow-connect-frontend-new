'use client';

import { Button } from '@/components/ui/button';

interface FileUploadPanelProps {
  description?: string;
  buttonLabel?: string;
  onNavigate?: () => void;
}

export function FileUploadPanel({
  description = 'Upload CSV or Excel files directly. Go to the Upload page to submit your data.',
  buttonLabel = 'Go to Upload',
  onNavigate,
}: FileUploadPanelProps) {
  return (
    <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
      <p className="font-medium">Manual Upload</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" size="sm" onClick={onNavigate}>
        {buttonLabel}
      </Button>
    </div>
  );
}
