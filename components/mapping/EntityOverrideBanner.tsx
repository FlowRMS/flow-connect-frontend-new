'use client';

import { Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EntityOverrideBannerProps {
  entityName: string;
  hasOverride: boolean;
  onResetOverride: () => void;
}

export function EntityOverrideBanner({
  entityName,
  hasOverride,
  onResetOverride,
}: EntityOverrideBannerProps) {
  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            {hasOverride ? (
              <>Viewing custom configuration for <strong>{entityName}</strong></>
            ) : (
              <>Inheriting default configuration. Make changes to create an override for <strong>{entityName}</strong></>
            )}
          </span>
        </div>
        {hasOverride && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetOverride}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Reset to Default
          </Button>
        )}
      </div>
    </div>
  );
}
