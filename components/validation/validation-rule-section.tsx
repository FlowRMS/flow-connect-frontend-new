import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface ValidationRuleSectionProps {
  title: string;
  badgeText: string;
  children: React.ReactNode;
  footerTip?: string;
}

export function ValidationRuleSection({ title, badgeText, children, footerTip }: ValidationRuleSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Badge variant="secondary" className="text-xs">
          {badgeText}
        </Badge>
      </div>

      <div className="space-y-2">{children}</div>

      {footerTip && (
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Tip:</span> {footerTip}
          </p>
        </div>
      )}
    </div>
  );
}
