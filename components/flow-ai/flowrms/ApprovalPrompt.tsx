'use client';

import { Button } from '@/components/flow-ai/ui/button';
import { cn } from '@/lib/flow-ai/cn';

interface ApprovalPromptProps {
  onApprove: () => void;
  onReject: () => void;
  isDisabled?: boolean;
}

export function ApprovalPrompt({
  onApprove,
  onReject,
  isDisabled = false,
}: ApprovalPromptProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-3 p-2 pr-3 rounded-full',
      'bg-background/95 backdrop-blur-md border border-primary/20 shadow-xl',
      'animate-in fade-in-0 slide-in-from-bottom-3 duration-300'
    )}>
      <div className="flex items-center gap-2 pl-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium text-foreground">Action Required</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={isDisabled}
          className="h-7 px-3 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          Reject
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          disabled={isDisabled}
          className="h-7 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        >
          Approve
        </Button>
      </div>
    </div>
  );
}









