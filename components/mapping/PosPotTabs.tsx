'use client';

import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReactNode } from 'react';

interface PosPoTTabsProps {
  activeTab: 'pos' | 'pot';
  onTabChange: (tab: 'pos' | 'pot') => void;
  children?: ReactNode;
}

export function PosPotTabs({ activeTab, onTabChange, children }: PosPoTTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'pos' | 'pot')}>
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="pos" className="flex items-center gap-2">
          <span>POS</span>
          <Badge variant="outline" className="text-xs">Point of Sale</Badge>
        </TabsTrigger>
        <TabsTrigger value="pot" className="flex items-center gap-2">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>POT</span>
          <Badge variant="outline" className="text-xs">Point of Transfer</Badge>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
