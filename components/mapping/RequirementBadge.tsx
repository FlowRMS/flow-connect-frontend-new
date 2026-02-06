'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type RequirementLevel = 'required' | 'highly-suggested' | 'optional' | 'one-of-group';

interface RequirementBadgeProps {
  requirement: RequirementLevel;
  groupDescription?: string;
  tooltipContent?: string;
  /** For dynamic status like "Can Calculate" */
  customBadge?: {
    label: string;
    className: string;
    tooltip?: string;
  };
}

export function RequirementBadge({ 
  requirement, 
  groupDescription,
  tooltipContent,
  customBadge 
}: RequirementBadgeProps) {
  // Custom badge override (e.g., "Can Calculate" for net price fields)
  if (customBadge) {
    if (customBadge.tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className={`text-xs ${customBadge.className}`}>
              {customBadge.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-sm">{customBadge.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return (
      <Badge variant="secondary" className={`text-xs ${customBadge.className}`}>
        {customBadge.label}
      </Badge>
    );
  }

  if (requirement === 'required') {
    if (tooltipContent) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="default" className="text-xs">Required</Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-sm">{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <Badge variant="default" className="text-xs">Required</Badge>;
  }

  if (requirement === 'highly-suggested') {
    return (
      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
        Suggested
      </Badge>
    );
  }

  if (requirement === 'one-of-group') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="default" className="text-xs">One Required</Badge>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="text-sm">
            {groupDescription || 'One field in this group is required'}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Optional
  return <Badge variant="outline" className="text-xs">Optional</Badge>;
}
