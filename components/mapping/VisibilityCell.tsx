'use client';

import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VisibilityCellProps {
  /** Whether visibility can be toggled (false = always visible, like required fields) */
  canToggle: boolean;
  /** Current visibility state */
  isVisible: boolean;
  /** Callback when visibility is toggled */
  onToggle?: () => void;
  /** Who hid this field (for display purposes) */
  hiddenBy?: string;
  /** Whether the field is mapped at all */
  isMapped?: boolean;
  /** Display mode: 'switch' for toggle, 'status' for read-only display */
  mode?: 'switch' | 'status';
}

export function VisibilityCell({ 
  canToggle, 
  isVisible, 
  onToggle, 
  hiddenBy,
  isMapped = true,
  mode = 'switch'
}: VisibilityCellProps) {
  // For status mode (rep view - showing what they can see)
  if (mode === 'status') {
    if (!isMapped) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    
    if (isVisible) {
      return (
        <div className="flex items-center justify-center gap-1">
          <Eye className="w-4 h-4 text-green-600" />
          <span className="text-xs text-green-700">Visible</span>
        </div>
      );
    }
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center gap-1 cursor-help">
            <EyeOff className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-700">Hidden</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Hidden by {hiddenBy || 'administrator'}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // For switch mode (distributor/manufacturer view - controlling visibility)
  if (!canToggle) {
    // Required fields are always visible
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  }

  return (
    <Switch
      checked={isVisible}
      onCheckedChange={onToggle}
    />
  );
}
