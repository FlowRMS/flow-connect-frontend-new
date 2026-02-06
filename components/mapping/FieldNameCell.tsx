'use client';

import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FieldNameCellProps {
  name: string;
  description: string;
  isPreferred?: boolean;
  isCustom?: boolean;
}

export function FieldNameCell({ 
  name, 
  description, 
  isPreferred, 
  isCustom 
}: FieldNameCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="flex items-center gap-1.5 text-left group">
            <span className="text-sm font-medium">{name}</span>
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm p-3">
          <p className="text-sm whitespace-pre-line">{description}</p>
        </TooltipContent>
      </Tooltip>
      {isPreferred && (
        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
          Preferred
        </Badge>
      )}
      {isCustom && (
        <Badge variant="secondary" className="text-xs">Custom</Badge>
      )}
    </div>
  );
}
