'use client';

import { memo } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { cn } from '@/lib/flow-ai/cn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/flow-ai/ui/tooltip";

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  isDisabled?: boolean;
  onHide?: () => void;
}

export const FollowUpSuggestions = memo(function FollowUpSuggestions({
  suggestions,
  onSelectSuggestion,
  isDisabled = false,
  onHide,
}: FollowUpSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-background/40 backdrop-blur-md rounded-xl px-3 md:px-6 py-2 md:py-2.5 border border-border/30 shadow-lg">
      <div className="flex flex-col gap-1.5 md:gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between gap-1.5 md:gap-2 pl-0.5 md:pl-1">
          <div className="flex items-center gap-1.5 md:gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="flex items-center justify-center w-3.5 h-3.5 md:w-4 md:h-4 rounded bg-primary/10 flex-shrink-0">
              <Sparkles className="w-2 h-2 md:w-2.5 md:h-2.5 text-primary" />
            </div>
            <span className="text-xs">Suggestions</span>
          </div>
          {onHide && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onHide}
              className="h-6 w-6 p-0 hover:bg-muted/50 rounded-md transition-all"
              title="Hide suggestions"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
          <TooltipProvider>
            {suggestions.map((suggestion, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'h-auto py-1.5 md:py-2 px-2 md:px-2.5 text-left justify-start text-xs font-medium',
                      'bg-transparent hover:bg-background/70 backdrop-blur-md',
                      'border-border/30 hover:border-primary/40',
                      'hover:shadow-md transition-all duration-200 ease-out',
                      'rounded-lg',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{ animationDelay: `${index * 75}ms` }}
                    onClick={() => !isDisabled && onSelectSuggestion(suggestion)}
                    disabled={isDisabled}
                  >
                    <span className="line-clamp-2 leading-tight">
                      {suggestion}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px] text-xs">
                  <p>{suggestion}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
});









