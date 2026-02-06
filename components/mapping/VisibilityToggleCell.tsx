'use client';

import { Switch } from '@/components/ui/switch';
import { MappedIndicator } from './MappedIndicator';

interface VisibilityToggleCellProps {
  /** Whether to show the toggle (false shows always-visible indicator) */
  showToggle: boolean;
  /** Whether visibility is currently enabled */
  isVisible: boolean;
  /** Handler called when visibility is toggled */
  onToggle: () => void;
}

/**
 * Table cell containing a visibility toggle switch.
 * Shows a Switch when toggleable, or a MappedIndicator when the field is always visible (required).
 */
export function VisibilityToggleCell({
  showToggle,
  isVisible,
  onToggle,
}: VisibilityToggleCellProps) {
  return (
    <td className="px-4 py-3">
      <div className="flex justify-center">
        {showToggle ? (
          <Switch checked={isVisible} onCheckedChange={onToggle} />
        ) : (
          <MappedIndicator isMapped />
        )}
      </div>
    </td>
  );
}
