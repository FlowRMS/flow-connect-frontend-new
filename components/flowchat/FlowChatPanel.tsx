'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useSubscription, useLazyQuery, useMutation } from '@apollo/client/react';
import {
  X,
  Send,
  Loader2,
  Bot,
  User,
  Mic,
  Square,
  ChevronRight,
  MessageSquarePlus,
  History,
  ExternalLink,
  Zap,
  Eye,
  EyeOff,
  Target,
  Search,
  TrendingUp,
  HelpCircle,
  FileText,
  PlusCircle,
  BarChart3,
  ArrowRight,
  Info,
  GripVertical,
} from 'lucide-react';
import { useFlowChat, getEntityDisplayName, QuickAction } from '@/contexts/FlowChatContext';
import { useChatSettings } from '@/contexts/UserSettingsContext';
import { cn } from '@/lib/flow-ai/cn';
import { Button } from '@/components/flow-ai/ui/button';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { ScrollArea } from '@/components/flow-ai/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Q_GET_USER_CHATS,
  Q_GET_CURRENT_SESSION_ACTIVE_CHAT,
  Q_GET_CHAT,
  SUB_CHAT_WITH_AGENT,
  M_CREATE_CHAT,
} from '@/lib/flow-ai/gql';
import {
  Chat,
  ChatMessage as ChatMessageType,
  ChatStreamResponse,
  MessageRole,
  MessageType,
} from '@/components/flow-ai/types/chat';
import { toast } from 'sonner';
import { useVoiceRecording } from '@/components/flow-ai/hooks/useVoiceRecording';
import Link from 'next/link';

// Icon mapping for quick actions
const QUICK_ACTION_ICONS: Record<QuickAction['icon'], React.ComponentType<{ className?: string }>> = {
  analyze: BarChart3,
  compare: TrendingUp,
  summarize: FileText,
  action: Zap,
  insight: Target,
  help: HelpCircle,
  create: PlusCircle,
  search: Search,
  info: Info,
};

interface MessageBubbleProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'USER';

  if (message.role === 'SYSTEM' || message.messageType !== 'TEXT') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2 mb-3', isUser ? 'flex-row-reverse' : 'flex-row')}
      style={{ maxWidth: '100%' }}
    >
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
            : 'bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground'
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      <div
        className={cn(
          'rounded-2xl px-3.5 py-2.5 text-sm flex-1 min-w-0',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-md'
            : 'bg-muted/50 text-foreground rounded-tl-md border border-border/50'
        )}
        style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:my-1" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', maxWidth: '100%' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-flex gap-0.5 ml-1">
                <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function FlowChatPanel() {
  const {
    isOpen,
    closeChat,
    pageContext,
    quickActions,
    contextHints,
    dismissHint,
    initialMessage,
    setInitialMessage,
    entityContext,
    shouldStartNewChat,
    acknowledgeChatReset,
  } = useFlowChat();

  // Get chat settings from UserSettingsContext (saved via Settings page)
  const { settings: savedChatSettings } = useChatSettings();

  // Derive config values from saved settings with defaults
  const disableSuggestions = !(savedChatSettings?.followUpSuggestions ?? true);
  const enableVectorSearch = savedChatSettings?.vectorSearch ?? false;

  const [inputMessage, setInputMessage] = useState('');
  const [messageToSend, setMessageToSend] = useState(''); // The actual message sent to AI (may include context)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessageType | null>(null);
  const [panelWidth, setPanelWidth] = useState(600); // Default expanded width
  const [isResizing, setIsResizing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [hasManuallyReset, setHasManuallyReset] = useState(false); // Prevent session restore after manual reset
  const [isBackdropBlurred, setIsBackdropBlurred] = useState(true); // Toggle backdrop blur

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Voice recording
  const { isRecording, isProcessing, transcript, startRecording, stopRecording } = useVoiceRecording();

  // Apollo mutations and queries
  const [createChatMutation] = useMutation<{ createChat: string }>(M_CREATE_CHAT);
  const { data: userChatsData, loading: chatsLoading, refetch: refetchChats } = useQuery<{ getUserChats: Chat[] }>(
    Q_GET_USER_CHATS,
    { fetchPolicy: 'network-only', skip: !isOpen }
  );
  const { data: activeSessionData } = useQuery<{ getCurrentSessionActiveChat: Chat | null }>(
    Q_GET_CURRENT_SESSION_ACTIVE_CHAT,
    { fetchPolicy: 'network-only', skip: !isOpen }
  );
  const [fetchChat] = useLazyQuery<{ getChat: Chat }>(Q_GET_CHAT, { fetchPolicy: 'network-only' });

  // Set active chat when session data loads (only if we haven't manually reset)
  useEffect(() => {
    if (activeSessionData?.getCurrentSessionActiveChat && !activeChat && !hasManuallyReset) {
      setActiveChat(activeSessionData.getCurrentSessionActiveChat);
    }
  }, [activeSessionData, activeChat, hasManuallyReset]);

  // Handle new chat when page changes
  useEffect(() => {
    if (shouldStartNewChat) {
      // Reset to new chat state
      setActiveChat(null);
      setInputMessage('');
      setStreamingMessage(null);
      setShowHistory(false);
      setIsCreatingNewChat(false);
      setHasManuallyReset(true); // Prevent session from restoring old chat
      acknowledgeChatReset();
    }
  }, [shouldStartNewChat, acknowledgeChatReset]);

  // Handle initial message from context
  useEffect(() => {
    if (initialMessage && isOpen) {
      setInputMessage(initialMessage);
      setInitialMessage(null);
      // Auto-submit after a brief delay
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [initialMessage, isOpen, setInitialMessage]);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
      textareaRef.current?.focus();
    }
  }, [transcript]);

  // Subscription for chat
  const subscriptionChatId = activeChat?.id || null;
  useSubscription<{ chatWithAgent: ChatStreamResponse }>(SUB_CHAT_WITH_AGENT, {
    variables: {
      userMessage: messageToSend, // Use the contextual message (includes entity context if applicable)
      chatId: subscriptionChatId,
      config: { disableSuggestions, enableVectorSearch },
    },
    skip: !isSubmitting,
    onData: ({ data }) => {
      const response = data.data?.chatWithAgent;
      if (!response) return;

      const newMessage: ChatMessageType = {
        chatId: response.chatId,
        content: response.message,
        createdAt: new Date().toISOString(),
        id: `temp-${Date.now()}`,
        messageType: 'TEXT',
        role: 'ASSISTANT',
        metaData: null,
        toolArgs: null,
        toolName: null,
      };

      setStreamingMessage(newMessage);

      if (response.isFinal) {
        setActiveChat((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            id: response.chatId,
            messages: [...(prev.messages || []), newMessage],
          };
        });

        setStreamingMessage(null);
        setIsSubmitting(false);
        setInputMessage('');

        if (response.chatId) {
          fetchChat({ variables: { chatId: response.chatId } }).catch(console.error);
        }

        if (isCreatingNewChat) {
          setIsCreatingNewChat(false);
          setHasManuallyReset(false); // Allow session restore again now that we have a new chat
          setTimeout(() => refetchChats(), 500);
        }
      }
    },
    onError: (error) => {
      toast.error('Failed to send message');
      console.error('Subscription error:', error);
      setIsSubmitting(false);
      setStreamingMessage(null);
    },
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [activeChat?.messages, streamingMessage]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!inputMessage.trim() || isSubmitting) return;

    const trimmedMessage = inputMessage.trim();

    // Debug: Log what entityContext contains
    console.log('[FlowChat] entityContext at submit:', JSON.stringify(entityContext, null, 2));

    // Build contextual message (context is only sent to AI, not displayed)
    let contextualMessage = trimmedMessage;
    if (entityContext?.includeInChat && entityContext.type && entityContext.number) {
      const entityName = getEntityDisplayName(entityContext.type);
      // Only include the entity number (human-readable identifier), not the database ID
      contextualMessage = `[Context: Currently viewing ${entityName} Number: ${entityContext.number}]\n\n${trimmedMessage}`;
      // Debug log to verify context is being sent
      console.log('[FlowChat] Sending message with context:', contextualMessage);
    } else {
      console.log('[FlowChat] No context added. includeInChat:', entityContext?.includeInChat, 'type:', entityContext?.type, 'number:', entityContext?.number);
    }

    // Set the message to send (with context) for the subscription
    setMessageToSend(contextualMessage);

    if (!activeChat?.id) {
      try {
        const result = await createChatMutation();
        const newChatId = result.data?.createChat;

        if (!newChatId) {
          toast.error('Failed to create chat');
          return;
        }

        // Display message shows only user's text (no context prefix)
        const userMessageForDisplay: ChatMessageType = {
          chatId: newChatId,
          content: trimmedMessage, // Display without context
          createdAt: new Date().toISOString(),
          id: `temp-user-${Date.now()}`,
          messageType: 'TEXT',
          role: 'USER',
          metaData: null,
          toolArgs: null,
          toolName: null,
        };

        setActiveChat({
          id: newChatId,
          createdAt: new Date().toISOString(),
          followUpSuggestions: [],
          messages: [userMessageForDisplay],
          sessionId: '',
          status: 'ACTIVE',
          title: '',
          userId: '',
        });

        setIsCreatingNewChat(true);
        setIsSubmitting(true);
        return;
      } catch (error) {
        console.error('Failed to create chat:', error);
        toast.error('Failed to create chat');
        return;
      }
    }

    // Display message shows only user's text (no context prefix)
    const userMessageForDisplay: ChatMessageType = {
      chatId: activeChat.id,
      content: trimmedMessage, // Display without context
      createdAt: new Date().toISOString(),
      id: `temp-user-${Date.now()}`,
      messageType: 'TEXT',
      role: 'USER',
      metaData: null,
      toolArgs: null,
      toolName: null,
    };

    setActiveChat((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...(prev.messages || []), userMessageForDisplay],
      };
    });

    setIsSubmitting(true);
  }, [inputMessage, isSubmitting, activeChat, createChatMutation, entityContext]);

  // Handle quick action click
  const handleQuickAction = useCallback((action: QuickAction) => {
    setInputMessage(action.prompt);
    textareaRef.current?.focus();
  }, []);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    setActiveChat(null);
    setInputMessage('');
    setStreamingMessage(null);
    setShowHistory(false);
    setIsCreatingNewChat(true);
    setHasManuallyReset(true); // Prevent session from restoring old chat
  }, []);

  // Handle select chat from history
  const handleSelectChat = useCallback((chatId: string) => {
    fetchChat({ variables: { chatId } }).then((result) => {
      if (result.data?.getChat) {
        setActiveChat(result.data.getChat);
        setShowHistory(false);
      }
    });
  }, [fetchChat]);

  // Handle keypress
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Handle voice toggle
  const handleVoiceToggle = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      // Clamp between 350px and 900px
      setPanelWidth(Math.min(900, Math.max(350, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const displayMessages = useMemo(() => {
    return (activeChat?.messages || []).filter((m) => m.role !== 'SYSTEM' && m.messageType === 'TEXT');
  }, [activeChat?.messages]);

  const userChats = userChatsData?.getUserChats || [];
  const entityName = pageContext.entityType ? getEntityDisplayName(pageContext.entityType) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'fixed inset-0 z-[90] transition-all duration-300',
              isBackdropBlurred ? 'bg-black/20 backdrop-blur-sm' : 'bg-transparent'
            )}
            onClick={closeChat}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={isResizing ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full bg-background border-l border-border shadow-2xl z-[95] flex flex-col overflow-hidden rounded-l-2xl"
            style={{ width: `${panelWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              onMouseDown={handleResizeStart}
              className={cn(
                'absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize group z-10 flex items-center hover:bg-primary/10',
                isResizing && 'bg-primary/20'
              )}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-14 bg-primary/90 hover:bg-primary border border-primary/50 rounded-r-lg flex items-center justify-center cursor-ew-resize shadow-lg">
                <GripVertical className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>

            {/* Header */}
            <div className="flex-shrink-0 border-b border-border/50 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">FlowChat</h2>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-8 w-8', !isBackdropBlurred && 'bg-muted')}
                    onClick={() => setIsBackdropBlurred(!isBackdropBlurred)}
                    title={isBackdropBlurred ? 'Show background' : 'Blur background'}
                  >
                    {isBackdropBlurred ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleNewChat}
                    title="New chat"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-8 w-8', showHistory && 'bg-muted')}
                    onClick={() => setShowHistory(!showHistory)}
                    title="Chat history"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  <Link href="/flow-ai/ai-chat" target="_blank">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Open full chat">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeChat}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Context is sent to AI but not visually displayed - check console for debug logs */}
            </div>

            {/* History Sidebar */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border/50 bg-muted/30 overflow-hidden"
                >
                  <div className="p-3 max-h-48 overflow-y-auto">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recent Chats</p>
                    {chatsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : userChats.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No chat history</p>
                    ) : (
                      <div className="space-y-1">
                        {userChats.slice(0, 5).map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => handleSelectChat(chat.id)}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                              'hover:bg-muted/80',
                              activeChat?.id === chat.id && 'bg-muted'
                            )}
                          >
                            <p className="font-medium text-foreground truncate">
                              {chat.title || 'New Chat'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(chat.createdAt).toLocaleDateString()}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 w-full">
              <div className="px-4 py-4" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
                {displayMessages.length === 0 && !streamingMessage ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    {/* Welcome */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-xl opacity-20 animate-pulse" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-xl">
                        <Bot className="w-8 h-8 text-primary-foreground" />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-1">
                      {pageContext.isDetailPage && entityName
                        ? `Ask about this ${entityName}`
                        : 'How can I help?'}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-6 max-w-[280px]">
                      {pageContext.isDetailPage
                        ? `I have context about this ${entityName?.toLowerCase()}. Ask me anything!`
                        : 'Ask me about your sales, customers, orders, or anything else.'}
                    </p>

                    {/* Quick Actions */}
                    <div className="w-full space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                        Quick Actions
                      </p>
                      <div className="grid gap-2">
                        {quickActions.slice(0, 4).map((action) => {
                          const Icon = QUICK_ACTION_ICONS[action.icon];
                          return (
                            <button
                              key={action.id}
                              onClick={() => handleQuickAction(action)}
                              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/50 hover:border-primary/30 transition-all text-left group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{action.label}</p>
                                <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {displayMessages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}

                    {isSubmitting && !streamingMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 mb-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <div className="bg-muted/50 rounded-2xl rounded-tl-md px-3.5 py-2.5 border border-border/50">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Thinking</span>
                            <span className="flex gap-0.5">
                              <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {streamingMessage && (
                      <MessageBubble message={streamingMessage} isStreaming={true} />
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-border/50 p-3 bg-background/95 backdrop-blur-sm">
              <div className="flex gap-2 items-end">
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    'h-10 w-10 flex-shrink-0',
                    isRecording && 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  )}
                  onClick={handleVoiceToggle}
                  disabled={isSubmitting || isProcessing}
                >
                  {isRecording ? (
                    <Square className="w-4 h-4" />
                  ) : isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>

                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={
                      isRecording
                        ? 'Recording...'
                        : isProcessing
                          ? 'Processing...'
                          : pageContext.isDetailPage && entityName
                            ? `Ask about this ${entityName.toLowerCase()}...`
                            : 'Ask anything...'
                    }
                    className="min-h-[40px] max-h-[120px] resize-none pr-12"
                    disabled={isSubmitting || isRecording || isProcessing}
                  />
                </div>

                <Button
                  className="h-10 w-10 flex-shrink-0"
                  onClick={handleSubmit}
                  disabled={!inputMessage.trim() || isSubmitting || isRecording || isProcessing}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-2">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
