'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useSubscription, useLazyQuery, useMutation } from '@apollo/client/react';
import { Send, Loader2, Bot, Mic, Square, Menu, Sparkles } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { ScrollArea } from '@/components/flow-ai/ui/scroll-area';
import { ChatSidebar } from '@/components/flow-ai/flowrms/ChatSidebar';
import { ChatMessage } from '@/components/flow-ai/flowrms/ChatMessage';
import { FollowUpSuggestions } from '@/components/flow-ai/flowrms/FollowUpSuggestions';
import { useVoiceRecording } from '@/components/flow-ai/hooks/useVoiceRecording';
import { useTextToSpeech } from '@/components/flow-ai/hooks/useTextToSpeech';
import {
  Q_GET_USER_CHATS,
  Q_GET_CURRENT_SESSION_ACTIVE_CHAT,
  Q_GET_CHAT,
  SUB_CHAT_WITH_AGENT,
  M_CREATE_CHAT,
  M_DELETE_CHAT,
  M_SUBMIT_MESSAGE_FEEDBACK,
} from '@/lib/flow-ai/gql';
import {
  Chat,
  ChatMessage as ChatMessageType,
  ChatStreamResponse,
  DocumentReference,
  MessageRole,
  MessageType,
} from '@/components/flow-ai/types/chat';
import { toast } from 'sonner';
import { cn } from '@/lib/flow-ai/cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/flow-ai/ui/dialog';
import { CitationsPane } from '@/components/flow-ai/flowrms/CitationsPane';
import { AdminSettingsDialog } from '@/components/flow-ai/flowrms/AdminSettingsDialog';
import { VoiceSettingsDialog, VoiceSettings, DEFAULT_VOICE_SETTINGS } from '@/components/flow-ai/flowrms/VoiceSettingsDialog';
import { ApprovalPrompt } from '@/components/flow-ai/flowrms/ApprovalPrompt';

const ROLE_PRIORITY: Record<MessageRole, number> = {
  USER: 0,
  ASSISTANT: 1,
  SYSTEM: 2,
};

const MESSAGE_TYPE_PRIORITY: Record<MessageType, number> = {
  TEXT: 0,
  TOOL_CALL: 1,
  TOOL_RESULT: 2,
};

const MESSAGE_TIME_TOLERANCE_MS = 1500;

export default function AIChatPage() {
  const [inputMessage, setInputMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessageType | null>(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [citationsPaneOpen, setCitationsPaneOpen] = useState(false);
  const [currentDocumentReferences, setCurrentDocumentReferences] = useState<DocumentReference[]>([]);
  const [streamingDocumentReferences, setStreamingDocumentReferences] = useState<DocumentReference[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  
  // Chat config state
  const [disableSuggestions, setDisableSuggestions] = useState(false);
  const [enableVectorSearch, setEnableVectorSearch] = useState(false);

  // Approval state
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [approvalCallback, setApprovalCallback] = useState<(approved: boolean) => void>(() => {});

  // Load voice settings from local storage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('flowchat-voice-settings');
    if (savedSettings) {
      try {
        setVoiceSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse voice settings', e);
      }
    }
    
    // Load chat config settings
    const savedChatConfig = localStorage.getItem('flowchat-config');
    if (savedChatConfig) {
      try {
        const config = JSON.parse(savedChatConfig);
        setDisableSuggestions(config.disableSuggestions ?? false);
        setEnableVectorSearch(config.enableVectorSearch ?? false);
      } catch (e) {
        console.error('Failed to parse chat config', e);
      }
    }
  }, []);

  // Save voice settings when changed
  const handleVoiceSettingsChange = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    localStorage.setItem('flowchat-voice-settings', JSON.stringify(newSettings));
  };
  
  // Save chat config when changed
  const handleDisableSuggestionsChange = (value: boolean) => {
    setDisableSuggestions(value);
    const config = { disableSuggestions: value, enableVectorSearch };
    localStorage.setItem('flowchat-config', JSON.stringify(config));
  };
  
  const handleEnableVectorSearchChange = (value: boolean) => {
    setEnableVectorSearch(value);
    const config = { disableSuggestions, enableVectorSearch: value };
    localStorage.setItem('flowchat-config', JSON.stringify(config));
  };
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice recording hook
  const { 
    isRecording, 
    isProcessing, 
    transcript, 
    startRecording, 
    stopRecording,
  } = useVoiceRecording();

  // Text-to-speech hook
  const textToSpeech = useTextToSpeech();

  // Mutation to create a new chat
  const [createChatMutation] = useMutation<{ createChat: string }>(M_CREATE_CHAT);
  
  // Mutation to delete a chat
  const [deleteChatMutation, { loading: isDeleting }] = useMutation<{ deleteChat: boolean }>(M_DELETE_CHAT);
  
  // Mutation for message feedback
  const [submitFeedbackMutation] = useMutation(M_SUBMIT_MESSAGE_FEEDBACK);

  // Fetch user's chat history
  const { data: userChatsData, loading: chatsLoading, refetch: refetchChats } = useQuery<{ getUserChats: Chat[] }>(Q_GET_USER_CHATS, {
    fetchPolicy: 'network-only',
  });

  // Fetch current session's active chat
  const { data: activeSessionData } = useQuery<{ getCurrentSessionActiveChat: Chat | null }>(
    Q_GET_CURRENT_SESSION_ACTIVE_CHAT,
    {
      fetchPolicy: 'network-only',
    }
  );

  // Set active chat when data is loaded
  useEffect(() => {
    if (activeSessionData?.getCurrentSessionActiveChat) {
      console.log('🔄 Setting active chat from session:', activeSessionData.getCurrentSessionActiveChat.id);
      setActiveChat(activeSessionData.getCurrentSessionActiveChat);
      setFollowUpSuggestions(activeSessionData.getCurrentSessionActiveChat.followUpSuggestions || []);
    }
  }, [activeSessionData]);

  // Lazy query to fetch individual chat
  const [fetchChat, { data: fetchedChatData }] = useLazyQuery<{ getChat: Chat }>(Q_GET_CHAT, {
    fetchPolicy: 'network-only',
  });

  // Handle fetched chat data
  useEffect(() => {
    if (fetchedChatData?.getChat) {
      setActiveChat(fetchedChatData.getChat);
      setFollowUpSuggestions(fetchedChatData.getChat.followUpSuggestions || []);
    }
  }, [fetchedChatData]);

  // Chat subscription
  const subscriptionChatId = activeChat?.id || null;
  
  const { data: subscriptionData } = useSubscription<{ chatWithAgent: ChatStreamResponse }>(
    SUB_CHAT_WITH_AGENT,
    {
      variables: {
        userMessage: inputMessage,
        chatId: subscriptionChatId,
        config: {
          disableSuggestions,
          enableVectorSearch,
        },
      },
      skip: !isSubmitting,
      onData: ({ data }) => {
        const response = data.data?.chatWithAgent;
        if (!response) return;

        // Create or update streaming message
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

        // Store document references if available for streaming message
        if (response.documentReferences && response.documentReferences.length > 0) {
          setStreamingDocumentReferences(response.documentReferences);
        }

        // If final, update follow-up suggestions and reset state
        if (response.isFinal) {
          console.log('[FlowAI] Chat response completed. Chat ID:', response.chatId);
          
          // Check if approval is required
          if (response.approvalRequired) {
            setApprovalRequired(true);
            
            // The callback will be handled by sending a new message with the approval status
            setApprovalCallback(() => (approved: boolean) => {
              const approvalMessage = approved ? "Approved" : "Rejected";
              setInputMessage(approvalMessage);
              // We'll submit this automatically in the handleApproval function
            });
          }

          // Only refetch if we were creating a new chat (to get the generated title)
          const wasCreatingNew = isCreatingNewChat;
          if (isCreatingNewChat) {
            console.log('[FlowAI] New chat complete - refetching sidebar to get generated title');
            setIsCreatingNewChat(false);
          }
          
          // Only update suggestions if not disabled by config
          const newSuggestions = disableSuggestions ? [] : (response.followUpSuggestions || []);
          setFollowUpSuggestions(newSuggestions);
          // Keep suggestions hidden by default - user can click "Show Suggestions" to view them
          
          // Add messages to active chat with the correct chatId, including document references
          setActiveChat((prev) => {
            if (!prev) return null;
            
            // Add document references to the message
            const messageWithReferences: ChatMessageType = {
              ...newMessage,
              documentReferences: streamingDocumentReferences.length > 0 ? streamingDocumentReferences : undefined,
            };
            
            return {
              ...prev,
              id: response.chatId,
              messages: [...(prev.messages || []), messageWithReferences],
              followUpSuggestions: response.followUpSuggestions || [],
            };
          });

          setStreamingMessage(null);
          setStreamingDocumentReferences([]);
          setIsSubmitting(false);
          setInputMessage('');

          // Always sync with the server to capture tool/tool_result messages with citations
          if (response.chatId) {
            fetchChat({ variables: { chatId: response.chatId } }).catch((error) => {
              console.error('Failed to refresh chat data:', error);
            });
          }
          
          // Only refetch chats if this was a new chat (to get the auto-generated title)
          if (wasCreatingNew) {
            // Single delayed refetch to get the generated title
            setTimeout(() => {
              refetchChats();
            }, 500);
          }
        }
      },
      onError: (error) => {
        toast.error('Failed to send message');
        console.error('Subscription error:', error);
        setIsSubmitting(false);
        setStreamingMessage(null);
      },
    }
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [activeChat?.messages, streamingMessage]);

  // Handle chat selection
  const handleSelectChat = useCallback((chatId: string) => {
    // Clear current state first to ensure clean transition
    setStreamingMessage(null);
    setIsSubmitting(false);
    setInputMessage('');
    setIsCreatingNewChat(false); // Not creating a new chat, selecting existing
    
    // Fetch the selected chat
    fetchChat({ variables: { chatId } });
  }, [fetchChat]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    console.log('🆕 Starting new chat - ready to create on first message');
    
    // Just clear the active chat - we'll create it when they send the first message
    setActiveChat(null);
    setFollowUpSuggestions([]);
    setInputMessage('');
    setStreamingMessage(null);
    setIsSubmitting(false);
    setIsCreatingNewChat(true);
  }, []);

  // Handle delete chat
  const handleDeleteChat = useCallback((chatId: string) => {
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!chatToDelete) return;

    try {
      await deleteChatMutation({
        variables: { chatId: chatToDelete },
      });

      toast.success('Chat deleted successfully');

      // If the deleted chat was active, clear it
      if (activeChat?.id === chatToDelete) {
        setActiveChat(null);
        setFollowUpSuggestions([]);
        setInputMessage('');
        setStreamingMessage(null);
      }

      // Refetch chats
      refetchChats();
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    } finally {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  }, [chatToDelete, deleteChatMutation, activeChat, refetchChats]);

  // Handle approval response
  const handleApproval = useCallback((approved: boolean) => {
    setApprovalRequired(false);
    
    // Create a user message for the approval/rejection
    const approvalText = approved ? "Proceed with the action." : "Cancel the action.";
    
    // Add user message to chat immediately for UI responsiveness
    const userMessage: ChatMessageType = {
      chatId: activeChat?.id || '',
      content: approvalText,
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
        messages: [...(prev.messages || []), userMessage],
      };
    });

    // Set input and submit
    setInputMessage(approvalText);
    // We need to wait a tick for the state to update before submitting
    setTimeout(() => {
      // This will trigger the handleSubmit logic with the input message we just set
      // But since handleSubmit uses the state value which might not be updated yet in the closure,
      // we'll call a modified version or rely on the effect
      
      // Actually, let's just manually trigger the subscription with the approval text
      // But we need to reuse the existing logic.
      // The cleanest way is to set the input message and let the user click send, 
      // OR call a function that takes the message as an argument.
      
      // Let's modify handleSubmit to accept an optional message argument
      // For now, we'll just set the state and call handleSubmit
      // But handleSubmit reads from inputMessage state.
      
      // Better approach: directly call the mutation/subscription logic here
      // But we want to reuse the handleSubmit logic.
      
      // Let's just set the input message and simulate a submit
      // We can't easily simulate the submit because handleSubmit depends on the current state of inputMessage
      
      // Let's refactor handleSubmit to take an argument? 
      // Or just duplicate the submission logic for approval?
      
      // Let's try to use the existing handleSubmit by setting state and waiting
      // But that's flaky.
      
      // Let's just manually do what handleSubmit does but with the specific text
      setIsSubmitting(true);
      setFollowUpSuggestions([]);
    }, 0);
  }, [activeChat, setIsSubmitting, setFollowUpSuggestions]);

  // Effect to trigger submission when approval sets isSubmitting
  useEffect(() => {
    if (isSubmitting && !streamingMessage && inputMessage && approvalRequired === false) {
      // This is a bit of a hack to trigger the subscription when we set isSubmitting from handleApproval
      // The subscription hook depends on isSubmitting and inputMessage
    }
  }, [isSubmitting, streamingMessage, inputMessage, approvalRequired]);

  // Handle message submission
  const handleSubmit = useCallback(async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || inputMessage;
    if (!messageToSend.trim() || isSubmitting) return;

    const trimmedMessage = messageToSend.trim();
    
    // If no active chat, create one first
    if (!activeChat?.id) {
      console.log('🆕 Creating new chat with first message...');
      
      try {
        // Call createChat mutation to get a new chat ID
        const result = await createChatMutation();
        const newChatId = result.data?.createChat;
        
        if (!newChatId) {
          toast.error('Failed to create new chat');
          return;
        }
        
        console.log('✅ New chat created with ID:', newChatId);
        
        // Create user message
        const userMessage: ChatMessageType = {
          chatId: newChatId,
          content: trimmedMessage,
          createdAt: new Date().toISOString(),
          id: `temp-user-${Date.now()}`,
          messageType: 'TEXT',
          role: 'USER',
          metaData: null,
          toolArgs: null,
          toolName: null,
        };
        
        // Set the new chat as active with the first message
        setActiveChat({
          id: newChatId,
          createdAt: new Date().toISOString(),
          followUpSuggestions: [],
          messages: [userMessage],
          sessionId: '',
          status: 'ACTIVE',
          title: '',
          userId: '',
        });
        
        setIsSubmitting(true);
        setFollowUpSuggestions([]);
        return;
        
      } catch (error) {
        console.error('Failed to create chat:', error);
        toast.error('Failed to create new chat');
        return;
      }
    }
    
    // Create user message for existing chat
    const userMessage: ChatMessageType = {
      chatId: activeChat.id,
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
      id: `temp-user-${Date.now()}`,
      messageType: 'TEXT',
      role: 'USER',
      metaData: null,
      toolArgs: null,
      toolName: null,
    };

    // Add user message to chat
    setActiveChat((prev) => {
      if (!prev) return null;
      console.log('💬 Adding message to chat:', prev.id);
      return {
        ...prev,
        messages: [...(prev.messages || []), userMessage],
      };
    });

    setIsSubmitting(true);
    setFollowUpSuggestions([]);
  }, [inputMessage, isSubmitting, activeChat, createChatMutation]);

  // Refined handleApproval that uses the updated handleSubmit
  const handleApprovalAction = useCallback((approved: boolean) => {
    setApprovalRequired(false);
    const approvalText = approved ? "Proceed with the action." : "Cancel the action.";
    setInputMessage(approvalText);
    handleSubmit(approvalText);
  }, [handleSubmit]);

  // Handle suggestion click
  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setInputMessage(suggestion);
    textareaRef.current?.focus();
  }, []);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Handle voice recording toggle
  const handleVoiceToggle = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Handle opening citations pane
  const handleOpenCitations = useCallback((documentReferences: DocumentReference[]) => {
    setCurrentDocumentReferences(documentReferences);
    setCitationsPaneOpen(true);
  }, []);

  // Handle message feedback
  const handleMessageFeedback = useCallback(async (messageId: string, isPositive: boolean, feedbackMessage?: string) => {
    if (!activeChat?.id) return;
    
    try {
      await submitFeedbackMutation({
        variables: {
          input: {
            chatId: activeChat.id,
            isPositive,
            feedbackMessage: feedbackMessage || '',
          },
        },
      });
      
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    }
  }, [activeChat, submitFeedbackMutation]);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
      textareaRef.current?.focus();
    }
  }, [transcript]);

  const userChats = userChatsData?.getUserChats || [];
  // Sort messages with tolerance to handle backend timestamp jitter
  const displayMessages = useMemo(() => {
    if (!activeChat?.messages) return [];

    const messagesWithIndex = activeChat.messages
      .filter((message) => message.role !== 'SYSTEM')
      .map((message, index) => ({ message, index }));

    return messagesWithIndex
      .sort((a, b) => {
        const dateA = new Date(a.message.createdAt).getTime();
        const dateB = new Date(b.message.createdAt).getTime();
        const diff = Number.isFinite(dateA - dateB) ? dateA - dateB : 0;

        if (Math.abs(diff) <= MESSAGE_TIME_TOLERANCE_MS) {
          if (a.message.role !== b.message.role) {
            return ROLE_PRIORITY[a.message.role] - ROLE_PRIORITY[b.message.role];
          }

          if (a.message.messageType !== b.message.messageType) {
            return MESSAGE_TYPE_PRIORITY[a.message.messageType] - MESSAGE_TYPE_PRIORITY[b.message.messageType];
          }

          return a.index - b.index;
        }

        if (diff !== 0) {
          return diff;
        }

        if (a.message.role !== b.message.role) {
          return ROLE_PRIORITY[a.message.role] - ROLE_PRIORITY[b.message.role];
        }

        return a.index - b.index;
      })
      .map(({ message }) => message);
  }, [activeChat?.messages]);
  
  // Group messages: associate tool calls and results with TEXT messages
  // IMPORTANT: Tool results come AFTER the assistant text message, so we need to look ahead
  const groupedMessages: ChatMessageType[] = useMemo(() => {
    const grouped: ChatMessageType[] = [];
    
    for (let i = 0; i < displayMessages.length; i++) {
      const msg = displayMessages[i];
      
      if (msg.messageType === 'TEXT') {
        // Look forward for TOOL_RESULT messages to gather document references
        const toolResults: ChatMessageType[] = [];
        for (let j = i + 1; j < displayMessages.length; j++) {
          if (displayMessages[j].messageType === 'TOOL_RESULT' && displayMessages[j].role === 'ASSISTANT') {
            toolResults.push(displayMessages[j]);
          } else if (displayMessages[j].messageType === 'TEXT') {
            break;
          }
        }
        
        const documentReferencesFromTools: DocumentReference[] = [];
        toolResults.forEach((toolResult) => {
          if (toolResult.documentReferences && toolResult.documentReferences.length > 0) {
            documentReferencesFromTools.push(...toolResult.documentReferences);
          }
        });
        
        const allDocumentReferences = [
          ...(msg.documentReferences || []),
          ...documentReferencesFromTools,
        ];
        
        grouped.push({
          ...msg,
          documentReferences: allDocumentReferences.length > 0 ? allDocumentReferences : undefined,
        });
      }
    }
    
    return grouped;
  }, [displayMessages]);
  
  // Also add document references from the streaming message if available
  useEffect(() => {
    if (streamingMessage && streamingDocumentReferences.length > 0) {
      setStreamingMessage(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          documentReferences: streamingDocumentReferences
        };
      });
    }
  }, [streamingDocumentReferences]);

  return (
    <div className="flex flex-1 h-full bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 z-50 transition-all duration-300 ease-in-out h-full",
        "md:block md:relative md:translate-x-0",
        "fixed inset-y-0 left-0 bg-background",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        isSidebarCollapsed ? "w-16" : "w-96"
      )}>
        <ChatSidebar
          chats={userChats}
          activeChat={activeChat}
          onSelectChat={(chatId) => {
            handleSelectChat(chatId);
            setIsMobileSidebarOpen(false);
          }}
          onNewChat={() => {
            handleNewChat();
            setIsMobileSidebarOpen(false);
          }}
          onDeleteChat={handleDeleteChat}
          isLoading={chatsLoading}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header - minimal version with mobile sidebar toggle and settings */}
        <header className="flex-shrink-0 border-b border-border/40 backdrop-blur-sm bg-background/80 z-10">
          <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-base md:text-lg font-bold text-foreground">FlowChat</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Intelligent business insights</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <VoiceSettingsDialog
                settings={voiceSettings}
                onSettingsChange={handleVoiceSettingsChange}
                disableSuggestions={disableSuggestions}
                enableVectorSearch={enableVectorSearch}
                onDisableSuggestionsChange={handleDisableSuggestionsChange}
                onEnableVectorSearchChange={handleEnableVectorSearchChange}
              />
              <AdminSettingsDialog />
            </div>
          </div>
        </header>

        {/* Messages Area - Takes remaining height after header */}
        <div className="flex-1 relative min-h-0">
          <ScrollArea ref={scrollAreaRef} className="h-full" showScrollbar>
            <div className="max-w-6xl mx-auto px-3 sm:px-6 pb-48 md:pb-72">
            {displayMessages.length === 0 && !streamingMessage ? (
              <div className="flex flex-col items-center justify-center h-full py-16 md:py-32 px-4 md:px-6">
                <div className="relative mb-6 md:mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-3xl blur-2xl opacity-20 animate-pulse" />
                  <div className="relative w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-primary/20">
                    <Bot className="w-8 h-8 md:w-12 md:h-12 text-primary-foreground" />
                  </div>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2 text-foreground text-center">Welcome to FlowChat</h2>
                <p className="text-muted-foreground text-center max-w-md mb-6 md:mb-8 text-sm md:text-base px-4">
                  Ask me anything about your sales data, commissions, customers, or business insights.
                </p>
                
                {!disableSuggestions && followUpSuggestions.length > 0 && (
                  <div className="w-full max-w-2xl px-2">
                    <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                      <div className="h-px flex-1 bg-border/50" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 md:px-3">Try asking</span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>
                    <div className="grid gap-2">
                      {followUpSuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-auto py-3 md:py-4 px-4 md:px-5 text-left justify-start text-xs md:text-sm font-medium bg-background/40 hover:bg-background/70 backdrop-blur-md border-border/30 hover:border-primary/40 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300 rounded-lg"
                          onClick={() => handleSelectSuggestion(suggestion)}
                        >
                          <span className="line-clamp-2">{suggestion}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2 md:py-4 space-y-1">
                {groupedMessages.map((message, index) => {
                  const isLastAIMessage = message.role === 'ASSISTANT' && index === groupedMessages.length - 1;
                  return (
                    <ChatMessage 
                      key={message.id} 
                      message={message}
                      onSpeak={(text, id) => textToSpeech.speak(text, id, voiceSettings)}
                      isSpeaking={textToSpeech.isSpeaking(message.id)}
                      documentReferences={message.documentReferences}
                      onOpenCitations={handleOpenCitations}
                      onFeedback={handleMessageFeedback}
                      isLastAIMessage={isLastAIMessage}
                    />
                  );
                })}
                
                {/* Loading animation when waiting for AI response */}
                {isSubmitting && !streamingMessage && (
                  <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 md:w-9 md:h-9 rounded-full shadow-md bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground">
                      <Bot className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                    <div className="flex-1 min-w-0 max-w-[85%] md:max-w-[80%] space-y-1 md:space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground/80">FlowChat</span>
                      </div>
                      <div className="rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3 shadow-sm border bg-card/50 backdrop-blur-sm text-foreground border-border/50 rounded-tl-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs md:text-sm text-muted-foreground">thinking</span>
                          <div className="flex items-center gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.6s' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {streamingMessage && (
                  <ChatMessage 
                    message={streamingMessage} 
                    isStreaming={!subscriptionData?.chatWithAgent?.isFinal}
                    onSpeak={(text, id) => textToSpeech.speak(text, id, voiceSettings)}
                    isSpeaking={textToSpeech.isSpeaking(streamingMessage.id)}
                    documentReferences={streamingDocumentReferences}
                    onOpenCitations={handleOpenCitations}
                  />
                )}
              </div>
            )}
          </div>
        </ScrollArea>

          {/* Input Area - Floating over chat */}
          <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-6 py-3 md:py-4 pointer-events-none">
          <div className="max-w-6xl mx-auto space-y-2 md:space-y-3 pointer-events-auto">
            {/* Approval Prompt */}
            {approvalRequired && (
              <div className="flex justify-center pb-2">
                <ApprovalPrompt 
                  onApprove={() => handleApprovalAction(true)} 
                  onReject={() => handleApprovalAction(false)} 
                />
              </div>
            )}

            {followUpSuggestions.length > 0 && groupedMessages.length > 0 && !isSubmitting && showSuggestions && !disableSuggestions && (
              <div className="flex justify-start w-full max-w-2xl">
                <FollowUpSuggestions
                  suggestions={followUpSuggestions}
                  onSelectSuggestion={handleSelectSuggestion}
                  isDisabled={isSubmitting}
                  onHide={() => setShowSuggestions(false)}
                />
              </div>
            )}

            {/* Show Suggestions Button - appears when suggestions are hidden */}
            {followUpSuggestions.length > 0 && groupedMessages.length > 0 && !isSubmitting && !showSuggestions && !disableSuggestions && (
              <div className="flex justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSuggestions(true)}
                  className="bg-background/60 backdrop-blur-md border-border/30 hover:border-primary/40 shadow-lg transition-all duration-200"
                >
                  <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5" />
                  Show Suggestions ({followUpSuggestions.length})
                </Button>
              </div>
            )}

            <div className="flex gap-2 md:gap-3 items-center bg-background/60 backdrop-blur-md rounded-xl p-1.5 border border-border/30 focus-within:border-primary/50 focus-within:bg-background/70 transition-all duration-200 shadow-lg">
              <Button
                onClick={handleVoiceToggle}
                disabled={isSubmitting || isProcessing}
                className={cn(
                  'h-9 w-9 md:h-11 md:w-11 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0',
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-secondary hover:bg-secondary/80'
                )}
                type="button"
              >
                {isRecording ? (
                  <Square className="w-3 h-3 md:w-4 md:h-4" />
                ) : isProcessing ? (
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <Mic className="w-3 h-3 md:w-4 md:h-4" />
                )}
              </Button>
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Ask about your sales, commissions, customers...'}
                className={cn(
                  'flex-1 min-h-[40px] md:min-h-[48px] max-h-[150px] md:max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/60 px-3 md:px-5 py-2 md:py-3',
                  'transition-all duration-200 outline-none shadow-none focus:outline-none focus:shadow-none'
                )}
                disabled={isSubmitting || isRecording || isProcessing}
              />
              <Button
                onClick={() => handleSubmit()}
                disabled={!inputMessage.trim() || isSubmitting || isRecording || isProcessing}
                className={cn(
                  'h-9 w-9 md:h-11 md:w-11 rounded-lg gradient-primary shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0',
                  isSubmitting && 'animate-pulse'
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <Send className="w-3 h-3 md:w-4 md:h-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center px-2">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone and all messages will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Chat'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Citations Pane */}
      <CitationsPane
        documentReferences={currentDocumentReferences}
        isOpen={citationsPaneOpen}
        onClose={() => setCitationsPaneOpen(false)}
      />
    </div>
  );
}








