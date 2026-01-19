'use client';

import { memo, useState, useMemo, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Clock, Bot, MoreVertical, PanelLeftClose, PanelLeft, Folder, FolderPlus, ChevronDown, ChevronRight, FolderInput, CheckSquare, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { ScrollArea } from '@/components/flow-ai/ui/scroll-area';
import { cn } from '@/lib/flow-ai/cn';
import { Chat, ChatFolder } from '@/components/flow-ai/types/chat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/flow-ai/ui/dropdown-menu';
import { Input } from '@/components/flow-ai/ui/input';
import { Checkbox } from '@/components/flow-ai/ui/checkbox';

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat?: (chatId: string) => void;
  isLoading?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  folders?: ChatFolder[];
  onCreateFolder?: (name: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onMoveToFolder?: (chatId: string, folderId: string | null) => void;
  onBulkMoveToFolder?: (chatIds: string[], folderId: string | null) => Promise<void>;
  movingChatIds?: Set<string>;
}

export const ChatSidebar = memo(function ChatSidebar({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isLoading = false,
  isCollapsed = false,
  onToggleCollapse,
  folders = [],
  onCreateFolder,
  onDeleteFolder,
  onMoveToFolder,
  onBulkMoveToFolder,
  movingChatIds = new Set(),
}: ChatSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());

  const toggleChatSelection = (chatId: string) => {
    setSelectedChatIds(prev => {
      const next = new Set(prev);
      if (next.has(chatId)) {
        next.delete(chatId);
      } else {
        next.add(chatId);
      }
      return next;
    });
  };

  // Select all uncategorized chats
  const selectAllUncategorized = () => {
    const uncategorizedIds = chats.filter(c => !c.folderId).map(c => c.id);
    setSelectedChatIds(new Set(uncategorizedIds));
  };

  // Clear selection and exit select mode
  const cancelSelection = () => {
    setSelectedChatIds(new Set());
    setIsSelectMode(false);
  };

  // Handle bulk move
  const handleBulkMove = async (folderId: string | null) => {
    if (onBulkMoveToFolder && selectedChatIds.size > 0) {
      await onBulkMoveToFolder(Array.from(selectedChatIds), folderId);
      cancelSelection();
    }
  };

  // Get selected chats info for smart folder filtering
  const selectedChatsInfo = useMemo(() => {
    const selectedChats = chats.filter(c => selectedChatIds.has(c.id));
    const folderIds = new Set(selectedChats.map(c => c.folderId).filter(Boolean));
    const allInSameFolder = folderIds.size === 1 && selectedChats.every(c => c.folderId);
    const anyInFolder = selectedChats.some(c => c.folderId);
    const commonFolderId = allInSameFolder ? selectedChats[0]?.folderId : null;
    return { folderIds, allInSameFolder, anyInFolder, commonFolderId };
  }, [chats, selectedChatIds]);

  // Group chats by folder
  const groupedChats = useMemo(() => {
    const uncategorized = chats.filter(c => !c.folderId);
    const byFolder: Record<string, Chat[]> = {};
    folders.forEach(folder => {
      byFolder[folder.id] = chats.filter(c => c.folderId === folder.id);
    });
    return { uncategorized, byFolder };
  }, [chats, folders]);

  // Auto-expand folder when active chat is in a folder
  useEffect(() => {
    if (activeChat?.folderId) {
      setExpandedFolders(prev => {
        if (prev.has(activeChat.folderId!)) return prev;
        const next = new Set(prev);
        next.add(activeChat.folderId!);
        return next;
      });
    }
  }, [activeChat?.id, activeChat?.folderId]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

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

  // Collapsed state - show minimal sidebar
  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full bg-card/30 backdrop-blur-sm border-r border-border/40 w-16">
        {/* Expand Button */}
        <div className="flex-shrink-0 p-3 border-b border-border/40">
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="w-full h-10 p-0 hover:bg-accent/50"
              title="Expand sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* New Chat Button */}
        <div className="flex-shrink-0 p-3">
          <Button
            onClick={onNewChat}
            className="w-full h-10 p-0 gradient-primary hover:shadow-md transition-all duration-200 rounded-lg"
            disabled={isLoading}
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat Icons */}
        <ScrollArea className="flex-1" showScrollbar>
          <div className="p-2 space-y-2">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full h-10 p-0 transition-all duration-200',
                  activeChat?.id === chat.id
                    ? 'bg-accent/60 border border-primary/20'
                    : 'hover:bg-accent/50'
                )}
                onClick={() => onSelectChat(chat.id)}
                title={chat.title || 'New Chat'}
              >
                <MessageSquare className={cn(
                  'w-4 h-4',
                  activeChat?.id === chat.id ? 'text-primary' : 'text-muted-foreground'
                )} />
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t border-border/40 bg-muted/20">
          <div className="flex items-center justify-center">
            <Bot className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-sm border-r border-border/40">
      {/* Header */}
      <div className="flex-shrink-0 p-5 border-b border-border/40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">
            Chat History
          </h2>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0 hover:bg-accent/50"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          )}
        </div>
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
      <ScrollArea className="flex-1" showScrollbar>
        <div className="p-3 space-y-1.5">
          {isLoading && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs font-medium">Loading...</p>
            </div>
          ) : chats.length === 0 && folders.length === 0 ? (
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
            <>
              {/* Create Folder Input */}
              {isCreatingFolder && (
                <div className="flex items-center gap-2 p-2 mb-2 bg-muted/30 rounded-lg">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name..."
                    className="h-8 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') {
                        setIsCreatingFolder(false);
                        setNewFolderName('');
                      }
                    }}
                  />
                  <Button size="sm" variant="ghost" className="h-8 px-2" onClick={handleCreateFolder}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Create Folder Button & Select Mode Toggle */}
              {!isCreatingFolder && !isSelectMode && (
                <div className="flex items-center gap-1 mb-2">
                  {onCreateFolder && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setIsCreatingFolder(true)}
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      New Folder
                    </Button>
                  )}
                  {onBulkMoveToFolder && chats.length > 0 && folders.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setIsSelectMode(true)}
                      title="Select multiple chats"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}

              {/* Selection Mode Bar */}
              {isSelectMode && (
                <div className="flex items-center gap-2 p-2 mb-2 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-xs font-medium flex-1">
                    {selectedChatIds.size} selected
                  </span>
                  {selectedChatIds.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="secondary" className="h-7 text-xs gap-1">
                          <FolderInput className="w-3 h-3" />
                          Move
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {folders
                          .filter(folder => folder.id !== selectedChatsInfo.commonFolderId)
                          .map((folder) => (
                            <DropdownMenuItem
                              key={folder.id}
                              className="cursor-pointer text-xs"
                              onClick={() => handleBulkMove(folder.id)}
                            >
                              <Folder className="w-3.5 h-3.5 mr-2 text-primary/70" />
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                        {selectedChatsInfo.anyInFolder && (
                          <>
                            {folders.filter(f => f.id !== selectedChatsInfo.commonFolderId).length > 0 && (
                              <DropdownMenuSeparator />
                            )}
                            <DropdownMenuItem
                              className="cursor-pointer text-xs text-muted-foreground"
                              onClick={() => handleBulkMove(null)}
                            >
                              <FolderInput className="w-3.5 h-3.5 mr-2" />
                              Remove from Folder
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={cancelSelection}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {/* Folders */}
              {folders.map((folder) => (
                <div key={folder.id} className="mb-1">
                  {/* Folder Header */}
                  <div
                    className="group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-all"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <Folder className="w-3.5 h-3.5 text-primary/70" />
                    <span className="text-xs font-medium flex-1 truncate">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {groupedChats.byFolder[folder.id]?.length || 0}
                    </span>
                    {onDeleteFolder && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>

                  {/* Folder Chats */}
                  {expandedFolders.has(folder.id) && (
                    <div className="ml-4 space-y-1 mt-1">
                      {groupedChats.byFolder[folder.id]?.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={activeChat?.id === chat.id}
                          onSelect={onSelectChat}
                          onDelete={onDeleteChat}
                          onMoveToFolder={onMoveToFolder}
                          folders={folders}
                          formatDate={formatDate}
                          isSelectMode={isSelectMode}
                          isSelected={selectedChatIds.has(chat.id)}
                          onToggleSelect={toggleChatSelection}
                          isMoving={movingChatIds.has(chat.id)}
                        />
                      ))}
                      {(!groupedChats.byFolder[folder.id] || groupedChats.byFolder[folder.id].length === 0) && (
                        <p className="text-xs text-muted-foreground py-2 px-2">No chats in this folder</p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Uncategorized Chats Header */}
              {groupedChats.uncategorized.length > 0 && folders.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  <p className="text-xs text-muted-foreground px-2 mb-2">Uncategorized</p>
                </div>
              )}

              {/* Uncategorized Chats */}
              {groupedChats.uncategorized.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={activeChat?.id === chat.id}
                  onSelect={onSelectChat}
                  onDelete={onDeleteChat}
                  onMoveToFolder={onMoveToFolder}
                  folders={folders}
                  formatDate={formatDate}
                  isSelectMode={isSelectMode}
                  isSelected={selectedChatIds.has(chat.id)}
                  onToggleSelect={toggleChatSelection}
                  isMoving={movingChatIds.has(chat.id)}
                />
              ))}
            </>
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

// Chat Item Component
interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: (chatId: string) => void;
  onDelete?: (chatId: string) => void;
  onMoveToFolder?: (chatId: string, folderId: string | null) => void;
  folders: ChatFolder[];
  formatDate: (date: string) => string;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (chatId: string) => void;
  isMoving?: boolean;
}

const ChatItem = memo(function ChatItem({
  chat,
  isActive,
  onSelect,
  onDelete,
  onMoveToFolder,
  folders,
  formatDate,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  isMoving = false,
}: ChatItemProps) {
  const handleClick = () => {
    if (isSelectMode && onToggleSelect) {
      onToggleSelect(chat.id);
    } else {
      onSelect(chat.id);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex items-start gap-2.5 p-3 rounded-lg cursor-pointer transition-all duration-200',
        'hover:bg-accent/50 hover:scale-[1.01]',
        isActive && !isSelectMode
          ? 'bg-accent/60 border border-primary/20'
          : isSelected
          ? 'bg-primary/10 border border-primary/30'
          : 'bg-transparent border border-transparent hover:border-border/30',
        isMoving && 'opacity-60 pointer-events-none'
      )}
      onClick={handleClick}
    >
      {/* Checkbox for select mode */}
      {isSelectMode && (
        <div 
          className="flex-shrink-0 flex items-center justify-center w-5 h-8"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(chat.id);
          }}
        >
          <div className={cn(
            'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
            isSelected 
              ? 'bg-primary border-primary' 
              : 'border-muted-foreground/50 hover:border-primary'
          )}>
            {isSelected && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
          </div>
        </div>
      )}

      {/* Loading spinner when moving */}
      {isMoving ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-muted/50">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        </div>
      ) : (
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200',
          isActive && !isSelectMode
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
            : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
        )}>
          <MessageSquare className="w-3.5 h-3.5" />
        </div>
      )}
      
      <div className="flex-1 min-w-0 space-y-1 pr-1">
        <p className={cn(
          'text-xs font-semibold truncate transition-colors leading-snug',
          isActive && !isSelectMode ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
        )}>
          {chat.title || 'New Chat'}
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isMoving ? (
            <span className="text-primary">Moving...</span>
          ) : (
            <>
              <Clock className="w-3 h-3" />
              <span className="text-xs">{formatDate(chat.createdAt)}</span>
            </>
          )}
        </div>
      </div>

      {!isSelectMode && !isMoving && (onDelete || onMoveToFolder) && (
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
            {onMoveToFolder && folders.length > 0 && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <FolderInput className="w-4 h-4 mr-2" />
                    Move to Folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-40">
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToFolder(chat.id, folder.id);
                        }}
                      >
                        <Folder className="w-4 h-4 mr-2 text-primary/70" />
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                    {chat.folderId && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToFolder(chat.id, null);
                          }}
                        >
                          <FolderInput className="w-4 h-4 mr-2" />
                          Remove from Folder
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
              </>
            )}
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(chat.id);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});









