'use client';

import { memo } from 'react';
import { MessageSquare, Plus, Trash2, Clock, Bot, MoreVertical } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { ScrollArea } from '@/components/flow-ai/ui/scroll-area';
import { cn } from '@/lib/flow-ai/cn';
import { Chat } from '@/components/flow-ai/types/chat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/flow-ai/ui/dropdown-menu';

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat?: (chatId: string) => void;
  isLoading?: boolean;
}

export const ChatSidebar = memo(function ChatSidebar({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isLoading = false,
}: ChatSidebarProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Handle invalid dates or future dates
    if (isNaN(diffInDays) || diffInDays < 0) {
      return 'Just now';
    }
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-sm border-r border-border/40">
      {/* Header */}
      <div className="flex-shrink-0 p-5 border-b border-border/40">
        <h2 className="text-base font-bold mb-3 text-foreground">
          Chat History
        </h2>
        <Button
          onClick={onNewChat}
          className="w-full justify-center gap-2 h-10 gradient-primary hover:shadow-md transition-all duration-200 font-medium rounded-lg"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {isLoading && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs font-medium">Loading...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs font-semibold mb-1">No chats yet</p>
              <p className="text-xs text-center px-4 opacity-75">
                Start a conversation
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group relative flex items-start gap-2.5 p-3 rounded-lg cursor-pointer transition-all duration-200',
                  'hover:bg-accent/50 hover:scale-[1.01]',
                  activeChat?.id === chat.id
                    ? 'bg-accent/60 border border-primary/20'
                    : 'bg-transparent border border-transparent hover:border-border/30'
                )}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200',
                  activeChat?.id === chat.id 
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                    : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                )}>
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1 pr-1">
                  <p className={cn(
                    'text-xs font-semibold truncate transition-colors leading-snug',
                    activeChat?.id === chat.id ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
                  )}>
                    {chat.title || 'New Chat'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{formatDate(chat.createdAt)}</span>
                  </div>
                </div>

                {onDeleteChat && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'flex-shrink-0 h-7 w-7 p-0 transition-all duration-200',
                          'hover:bg-accent rounded-md',
                          'opacity-0 group-hover:opacity-100'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="flex-shrink-0 p-3 border-t border-border/40 bg-muted/20">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Bot className="w-3.5 h-3.5" />
          <span>AI-powered insights</span>
        </div>
      </div>
    </div>
  );
});









