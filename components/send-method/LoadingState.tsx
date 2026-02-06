'use client';

import { Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading configuration...</p>
      </div>
    </div>
  );
}
