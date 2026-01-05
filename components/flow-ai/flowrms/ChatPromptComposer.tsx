'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Card } from '@/components/flow-ai/ui/card';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';

interface ChatPromptComposerProps {
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  quickPrompts?: string[];
  statusMessage?: string | null;
}

export function ChatPromptComposer({
  onSubmit,
  isLoading = false,
  value: externalValue,
  onChange,
  quickPrompts = [],
  statusMessage,
}: ChatPromptComposerProps) {
  const [internalValue, setInternalValue] = useState('');

  const currentValue = externalValue !== undefined ? externalValue : internalValue;
  const setValue = onChange || setInternalValue;

  const handleSubmit = useCallback(() => {
    if (currentValue.trim() && !isLoading) {
      onSubmit(currentValue);
      setValue('');
    }
  }, [currentValue, onSubmit, isLoading, setValue]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <Card className="flow-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Describe Corrections</h3>
      </div>

      <Textarea
        value={currentValue}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe corrections or mapping rules, e.g. 'The shipping fee extracted is actually the tax amount'."
        className="min-h-[100px] focus-ring resize-none rounded-lg"
        disabled={isLoading}
      />

      {quickPrompts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick prompts:</span>
          {quickPrompts.map((prompt, index) => (
            <Badge
              key={`${prompt}-${index}`}
              variant="outline"
              className="cursor-pointer hover:bg-muted transition-colors"
              onClick={() => setValue(prompt)}
            >
              {prompt}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Cmd/Ctrl</kbd> +{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to submit
        </p>

        <div className="flex items-center gap-3">
          {statusMessage && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
              <span>{statusMessage}</span>
            </div>
          )}
          <Button onClick={handleSubmit} disabled={!currentValue.trim() || isLoading} className="gap-2 rounded-lg">
            <Send className="w-4 h-4" />
            Apply Changes
          </Button>
        </div>
      </div>
    </Card>
  );
}









