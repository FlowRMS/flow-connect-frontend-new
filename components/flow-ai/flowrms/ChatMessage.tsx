'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { Bot, User, Volume2, VolumeX, FileText, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/flow-ai/cn';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ChatMessage as ChatMessageType, DocumentReference } from '@/components/flow-ai/types/chat';
import { Button } from '@/components/flow-ai/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/flow-ai/ui/dialog';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/flow-ai/ui/tooltip';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onSpeak?: (text: string, messageId: string) => Promise<void>;
  isSpeaking?: boolean;
  documentReferences?: DocumentReference[];
  onOpenCitations?: (documentReferences: DocumentReference[]) => void;
  onFeedback?: (messageId: string, isPositive: boolean, feedbackMessage?: string) => void;
  isLastAIMessage?: boolean;
}

export const ChatMessage = memo(function ChatMessage({ 
  message, 
  isStreaming = false,
  onSpeak,
  isSpeaking = false,
  documentReferences = [],
  onOpenCitations,
  onFeedback,
  isLastAIMessage = false,
}: ChatMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const fullContentRef = useRef(message.content);
  const currentIndexRef = useRef(0);
  
  const isUser = message.role === 'USER';
  const isSystem = message.role === 'SYSTEM';
  const isToolCall = message.messageType === 'TOOL_CALL';
  const isToolResult = message.messageType === 'TOOL_RESULT';
  
  // Debug logging
  useEffect(() => {
    if (!isUser && message.role === 'ASSISTANT' && message.messageType === 'TEXT') {
      console.log('ChatMessage - ASSISTANT TEXT:', {
        messageId: message.id,
        hasDocRefs: !!documentReferences,
        docRefsLength: documentReferences?.length || 0,
        documentReferences,
        isStreaming,
      });
    }
  }, [documentReferences, isStreaming, message, isUser]);
  
  useEffect(() => {
    // Update full content when message changes
    fullContentRef.current = message.content;
    
    // For user messages or non-streaming, show immediately
    if (isUser || !isStreaming) {
      setDisplayedContent(message.content);
      setIsTyping(false);
      currentIndexRef.current = message.content.length;
      return;
    }
    
    // For AI streaming messages, animate smoothly
    setIsTyping(true);
    
    // If content is growing, continue from where we left off
    const currentLength = displayedContent.length;
    const newContent = message.content;
    
    if (newContent.length > currentLength) {
      // Content has grown, stream the new characters
      currentIndexRef.current = currentLength;
      
      const streamInterval = setInterval(() => {
        const fullContent = fullContentRef.current;
        const nextIndex = currentIndexRef.current + 1;
        
        if (nextIndex <= fullContent.length) {
          setDisplayedContent(fullContent.substring(0, nextIndex));
          currentIndexRef.current = nextIndex;
        } else {
          clearInterval(streamInterval);
          setIsTyping(false);
        }
      }, 1); // Fast 1ms per character for quick streaming
      
      return () => clearInterval(streamInterval);
    } else {
      // Content is the same, just update
      setDisplayedContent(newContent);
    }
  }, [message.content, isStreaming, isUser, displayedContent.length]);
  
  // Skip system messages, tool calls, and tool results from rendering
  // They will be displayed as part of the TEXT message
  if (isSystem || isToolCall || isToolResult) {
    return null;
  }

  const handleFeedback = (isPositive: boolean) => {
    if (isPositive) {
      // For positive feedback, submit immediately
      setFeedbackGiven('positive');
      onFeedback?.(message.id, true);
    } else {
      // For negative feedback, show dialog to collect more info
      setShowFeedbackDialog(true);
    }
  };

  const handleSubmitNegativeFeedback = () => {
    setFeedbackGiven('negative');
    onFeedback?.(message.id, false, feedbackText);
    setShowFeedbackDialog(false);
    setFeedbackText('');
  };

  return (
    <div
      className={cn(
        'flex gap-2 md:gap-4 mb-4 md:mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-7 h-7 md:w-9 md:h-9 rounded-full shadow-md transition-all duration-300',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
            : 'bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground'
        )}
      >
        {isUser ? (
          <User className="w-3 h-3 md:w-4 md:h-4" />
        ) : (
          <Bot className="w-3 h-3 md:w-4 md:h-4" />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 min-w-0 max-w-[85%] md:max-w-[80%] space-y-1 md:space-y-2',
        isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
      )}>
        <div className={cn(
          'flex items-center gap-1.5 md:gap-2',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          <span className="text-xs font-semibold text-foreground/80">
            {isUser ? 'You' : 'FlowChat'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {/* Speaker button for AI messages */}
          {!isUser && onSpeak && !isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSpeak(message.content, message.id)}
              className="h-5 w-5 md:h-6 md:w-6 p-0 hover:bg-accent/50 rounded-full transition-all"
              title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
            >
              {isSpeaking ? (
                <VolumeX className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary animate-pulse" />
              ) : (
                <Volume2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-muted-foreground hover:text-foreground" />
              )}
            </Button>
          )}
        </div>
        
        <div
          className={cn(
            'rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 shadow-sm border transition-all duration-200',
            isUser 
              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-primary/20 rounded-tr-sm' 
              : 'bg-card/50 backdrop-blur-sm text-foreground border-border/50 rounded-tl-sm hover:shadow-md'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayedContent}</p>
          ) : (
            <div
              className={cn(
                'prose prose-sm max-w-none dark:prose-invert',
                'prose-p:leading-relaxed prose-p:my-1.5 prose-p:text-foreground prose-p:text-sm',
                'prose-headings:font-semibold prose-headings:mt-3 md:prose-headings:mt-4 prose-headings:mb-2 prose-headings:text-foreground',
                'prose-h1:text-base md:prose-h1:text-lg prose-h2:text-sm md:prose-h2:text-base prose-h3:text-xs md:prose-h3:text-sm',
                'prose-code:bg-muted/80 prose-code:px-1 md:prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:text-foreground prose-code:font-mono prose-code:border prose-code:border-border/30',
                'prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:shadow-sm prose-pre:my-2 md:prose-pre:my-3 prose-pre:text-xs',
                'prose-table:border-collapse prose-table:w-full prose-table:my-2 md:prose-table:my-3',
                'prose-th:border prose-th:border-border prose-th:bg-muted/50 prose-th:px-2 md:prose-th:px-3 prose-th:py-1.5 md:prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-xs',
                'prose-td:border prose-td:border-border prose-td:px-2 md:prose-td:px-3 prose-td:py-1.5 md:prose-td:py-2 prose-td:text-xs md:prose-td:text-sm',
                'prose-ul:my-1.5 md:prose-ul:my-2 prose-ol:my-1.5 md:prose-ol:my-2 prose-li:my-0.5 prose-li:text-sm',
                'prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:text-sm',
                'prose-strong:font-semibold prose-strong:text-foreground'
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  table: ({ ...props }) => (
                    <div className="overflow-x-auto my-3 rounded-lg border border-border">
                      <table className="min-w-full" {...props} />
                    </div>
                  ),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code: ({ className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    
                    if (isInline) {
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <pre className="overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                }}
              >
                {displayedContent}
              </ReactMarkdown>
              
              {isTyping && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Citations - Display after message content for AI messages */}
        {!isUser && documentReferences && documentReferences.length > 0 && !isStreaming && (
          <div className="flex items-center gap-2 mt-1 md:mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenCitations?.(documentReferences)}
              className="h-6 md:h-7 px-2 md:px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all"
            >
              <FileText className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" />
              {documentReferences.length} {documentReferences.length === 1 ? 'source' : 'sources'}
            </Button>
          </div>
        )}

        {/* Feedback Buttons - Only show for last AI message when not streaming */}
        {!isUser && isLastAIMessage && !isStreaming && onFeedback && (
          <div className="flex items-center gap-2 mt-1 md:mt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(true)}
                    disabled={feedbackGiven !== null}
                    className={cn(
                      "h-6 md:h-7 px-2 md:px-3 text-xs font-medium rounded-md transition-all",
                      feedbackGiven === 'positive' 
                        ? "text-green-600 bg-green-100 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/30" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <ThumbsUp className={cn(
                      "w-3 h-3 md:w-3.5 md:h-3.5",
                      feedbackGiven === 'positive' && "fill-current"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Good response</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFeedback(false)}
                    disabled={feedbackGiven !== null}
                    className={cn(
                      "h-6 md:h-7 px-2 md:px-3 text-xs font-medium rounded-md transition-all",
                      feedbackGiven === 'negative' 
                        ? "text-red-600 bg-red-100 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <ThumbsDown className={cn(
                      "w-3 h-3 md:w-3.5 md:h-3.5",
                      feedbackGiven === 'negative' && "fill-current"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bad response</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Help us improve</DialogTitle>
            <DialogDescription>
              Please let us know what went wrong or how we can improve this response.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="What could be better? (optional)"
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFeedbackDialog(false);
                setFeedbackText('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitNegativeFeedback}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});









