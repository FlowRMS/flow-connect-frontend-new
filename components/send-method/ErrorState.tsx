'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3 text-center max-w-md">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-destructive font-medium">Failed to load configuration</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    </div>
  );
}
