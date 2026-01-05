'use client'

import { FileText, History, ListOrdered, GitBranch } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/flow-ai/ui/tabs';

interface LayoutToggleProps {
  activeLayout: 'preview' | 'instructions' | 'changes' | 'versioning';
  onChange: (layout: 'preview' | 'instructions' | 'changes' | 'versioning') => void;
}

export function LayoutToggle({ activeLayout, onChange }: LayoutToggleProps) {
  return (
    <div className="flex items-center justify-center py-6">
      <Tabs value={activeLayout} onValueChange={(v) => onChange(v as LayoutToggleProps['activeLayout'])} className="w-full flex justify-center">
        <TabsList className="inline-flex">
          <TabsTrigger value="preview" className="gap-2">
            <FileText className="w-4 h-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="instructions" className="gap-2">
            <ListOrdered className="w-4 h-4" />
            Instructions
          </TabsTrigger>
          <TabsTrigger value="changes" className="gap-2">
            <History className="w-4 h-4" />
            Changes Made
          </TabsTrigger>
          <TabsTrigger value="versioning" className="gap-2">
            <GitBranch className="w-4 h-4" />
            Versioning History
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}









