'use client';

import { useMemo } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { Card } from '@/components/flow-ai/ui/card';

interface InstructionsPaneProps {
  instructions: string[];
  className?: string;
}

export function InstructionsPane({ instructions, className }: InstructionsPaneProps) {
  // Show latest instructions first
  const reversedInstructions = useMemo(
    () => [...instructions].reverse(),
    [instructions]
  );

  if (instructions.length === 0) {
    return (
      <Card className={className}>
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Instructions</h3>
          <p className="text-muted-foreground">
            No additional instructions were executed on this document.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">Executed Instructions</h3>
          <p className="text-sm text-muted-foreground">
            The following instructions were applied to this document during processing
          </p>
        </div>
        
        <div className="space-y-3">
          {reversedInstructions.map((instruction, index) => {
            // Original index (1-based) for display numbering
            const originalIndex = instructions.length - index;
            return (
              <div
                key={originalIndex}
                className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{instruction}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {originalIndex}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}









