'use client';

import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function SectionHeader({ title, description, children }: SectionHeaderProps) {
  return (
    <div className="bg-muted px-4 py-3 flex items-center justify-between">
      <div>
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
