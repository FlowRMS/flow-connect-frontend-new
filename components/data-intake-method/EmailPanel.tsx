'use client';

import { Button } from '@/components/ui/button';
import type { DataIntakeEmailConfig } from '@/lib/nemra-pos-data';

interface EmailPanelProps {
  config: DataIntakeEmailConfig;
}

export function EmailPanel({ config }: EmailPanelProps) {
  return (
    <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
      <p className="font-medium">Email Delivery</p>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Delivery Address</p>
          <code className="text-sm bg-background px-3 py-2 rounded border block">
            {config.deliveryAddress}
          </code>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Schedule</p>
          <code className="text-sm bg-background px-3 py-2 rounded border block">
            {config.schedule}
          </code>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        You&apos;ll receive an email with attached CSV files whenever new data is available.
      </p>
      <Button variant="outline" size="sm">Configure Email Settings</Button>
    </div>
  );
}

