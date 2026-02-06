'use client';

import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaveConfigurationButtonProps {
  onClick: () => void;
  isSaving: boolean;
  isLoading: boolean;
}

export function SaveConfigurationButton({
  onClick,
  isSaving,
  isLoading,
}: SaveConfigurationButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isSaving || isLoading}
      className="bg-blue-600 hover:bg-blue-700"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Save Configuration
        </>
      )}
    </Button>
  );
}
