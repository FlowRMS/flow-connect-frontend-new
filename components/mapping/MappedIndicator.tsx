'use client';

import { CheckCircle } from 'lucide-react';

interface MappedIndicatorProps {
  isMapped: boolean;
}

export function MappedIndicator({ isMapped }: MappedIndicatorProps) {
  if (isMapped) {
    return <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />;
  }
  return <div className="w-4 h-4 rounded-full border-2 border-gray-300 mx-auto" />;
}
