'use client';

interface EmailForwardingPanelProps {
  forwardingAddress: string;
  description?: string;
}

export function EmailForwardingPanel({
  forwardingAddress,
  description = "Forward your reports to this address. We'll automatically process and validate them.",
}: EmailForwardingPanelProps) {
  return (
    <div className="mt-4 p-4 bg-muted rounded-lg">
      <p className="font-medium mb-2">Your forwarding address:</p>
      <code className="text-sm bg-background px-3 py-2 rounded border block">
        {forwardingAddress}
      </code>
      {description && (
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
