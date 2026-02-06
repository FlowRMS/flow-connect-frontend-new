import React from 'react';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'vertical', className = '' }: SeparatorProps) {
  if (orientation === 'vertical') {
    return <div role="separator" className={"w-px h-6 bg-muted/30 " + className} />;
  }
  return <div role="separator" className={"h-px w-full bg-muted/30 " + className} />;
}

export default Separator;
