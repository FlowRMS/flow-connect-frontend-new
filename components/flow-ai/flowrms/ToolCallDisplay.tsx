'use client';

import { memo, useState } from 'react';
import { ChevronDown, ChevronRight, Code, Database, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/flow-ai/cn';
import { ChatMessage as ChatMessageType } from '@/components/flow-ai/types/chat';

interface ToolCallDisplayProps {
  toolCallMessage: ChatMessageType;
  toolResultMessage?: ChatMessageType;
}

export const ToolCallDisplay = memo(function ToolCallDisplay({ 
  toolCallMessage, 
  toolResultMessage 
}: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Parse tool args if they exist
  let toolArgs: Record<string, unknown> | null = null;
  let toolDescription = '';
  
  try {
    if (toolCallMessage.toolArgs) {
      const parsed = typeof toolCallMessage.toolArgs === 'string' 
        ? JSON.parse(toolCallMessage.toolArgs) 
        : toolCallMessage.toolArgs;
      toolArgs = parsed as Record<string, unknown>;
      toolDescription = (toolArgs?.description as string) || (toolArgs?.query as string) || '';
    }
  } catch (e) {
    console.error('Failed to parse tool args:', e);
  }

  const toolName = toolCallMessage.toolName || 'Tool';
  const displayName = toolName.replace(/_/g, ' ').replace(/tool/gi, '').trim();
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
          'bg-muted/30 hover:bg-muted/50 backdrop-blur-sm',
          'border-border/30 hover:border-border/50',
          'group'
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          {toolResultMessage ? (
            <CheckCircle2 className="w-4 h-4 text-primary" />
          ) : (
            <Code className="w-4 h-4 text-primary" />
          )}
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground capitalize">
              {displayName}
            </span>
            {toolResultMessage && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                Completed
              </span>
            )}
          </div>
          {toolDescription && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {toolDescription}
            </p>
          )}
        </div>
        
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="mt-2 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {/* Tool Call Details */}
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tool Call
              </span>
            </div>
            {toolArgs && (
              <pre className="text-xs bg-background/50 p-2 rounded border border-border/30 overflow-x-auto">
                <code>{JSON.stringify(toolArgs, null, 2)}</code>
              </pre>
            )}
          </div>
          
          {/* Tool Result */}
          {toolResultMessage && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Result
                </span>
              </div>
              <div className="text-xs bg-background/50 p-3 rounded border border-border/30 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono leading-relaxed text-foreground/90">
                  {toolResultMessage.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});









