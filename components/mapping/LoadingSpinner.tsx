'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  minHeight?: string;
}

export function LoadingSpinner({ 
  message = 'Loading...', 
  minHeight = 'min-h-[400px]' 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${minHeight}`}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
