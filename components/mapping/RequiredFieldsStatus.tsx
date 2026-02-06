'use client';

import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusItem {
  id: string;
  label: string;
  isSatisfied: boolean;
  isGroup?: boolean;
}

interface RequiredFieldsStatusProps {
  items: StatusItem[];
  title?: string;
}

export function RequiredFieldsStatus({ 
  items, 
  title = 'Required Fields Status' 
}: RequiredFieldsStatusProps) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg border">
      <p className="text-sm font-medium mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
              item.isSatisfied ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}
          >
            {item.isSatisfied ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {item.label}
            {item.isGroup && ' (one of)'}
          </div>
        ))}
      </div>
    </div>
  );
}
