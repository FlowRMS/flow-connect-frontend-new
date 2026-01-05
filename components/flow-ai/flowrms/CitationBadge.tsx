'use client';

import { memo } from 'react';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/flow-ai/ui/badge';
import { cn } from '@/lib/flow-ai/cn';

interface CitationBadgeProps {
  number: number;
  onClick?: () => void;
  className?: string;
}

export const CitationBadge = memo(function CitationBadge({ 
  number, 
  onClick,
  className 
}: CitationBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium cursor-pointer',
        'hover:bg-primary/20 hover:text-primary transition-all duration-200',
        'border border-border/50 hover:border-primary/50',
        'rounded-md', // Less rounded
        className
      )}
      onClick={onClick}
    >
      <FileText className="w-3 h-3" />
      <span>{number}</span>
    </Badge>
  );
});









