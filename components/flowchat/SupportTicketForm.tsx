'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Loader2,
  HelpCircle,
  AlertTriangle,
  Paperclip,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/flow-ai/cn';
import { Button } from '@/components/flow-ai/ui/button';
import { Input } from '@/components/flow-ai/ui/input';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Label } from '@/components/flow-ai/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/flow-ai/ui/select';
import { toast } from 'sonner';
import { useUser } from '@/components/providers/user-provider';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import LogRocket from 'logrocket';

type TicketType = 'general' | 'technical';

interface SupportTicketFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileAttachment {
  file: File;
  preview?: string;
}

export function SupportTicketForm({ isOpen, onClose }: SupportTicketFormProps) {
  const user = useUser();
  const { organization } = useOrganizationContext();

  const [ticketType, setTicketType] = useState<TicketType>('general');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [includeLogRocket, setIncludeLogRocket] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get LogRocket session URL
  const getLogRocketSessionUrl = useCallback((): string | null => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return null;
    }
    try {
      const sessionUrl = LogRocket.sessionURL;
      return sessionUrl || null;
    } catch {
      return null;
    }
  }, []);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      // Reset after animation completes
      const timeout = setTimeout(() => {
        setTicketType('general');
        setTitle('');
        setMessage('');
        setDetails('');
        setAttachments([]);
        setIncludeLogRocket(true);
        setIsSuccess(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];

    const validFiles: FileAttachment[] = [];

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds 10MB limit`);
        continue;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type not allowed: ${file.type}`);
        continue;
      }

      const attachment: FileAttachment = { file };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        attachment.preview = URL.createObjectURL(file);
      }

      validFiles.push(attachment);
    }

    setAttachments(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      // Revoke object URL if it exists
      if (newAttachments[index].preview) {
        URL.revokeObjectURL(newAttachments[index].preview!);
      }
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (ticketType === 'general' && !message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (ticketType === 'technical' && !details.trim()) {
      toast.error('Please enter issue details');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build form data for file uploads
      const formData = new FormData();
      formData.append('ticketType', ticketType);
      formData.append('title', title.trim());
      formData.append('message', ticketType === 'general' ? message.trim() : details.trim());
      formData.append('userName', `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown User');
      formData.append('userEmail', user?.email || 'No email provided');
      formData.append('tenancyName', organization?.companyName || 'Unknown Organization');

      // Add LogRocket session URL if enabled
      if (includeLogRocket && ticketType === 'technical') {
        const sessionUrl = getLogRocketSessionUrl();
        if (sessionUrl) {
          formData.append('logRocketUrl', sessionUrl);
        }
      }

      // Add attachments
      attachments.forEach((attachment, index) => {
        formData.append(`attachment_${index}`, attachment.file);
      });

      const response = await fetch('/api/support-ticket', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit ticket');
      }

      setIsSuccess(true);
      toast.success('Support ticket submitted successfully!');

      // Close after showing success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Failed to submit support ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get icon and colors based on ticket type
  const getTicketTypeConfig = (type: TicketType) => {
    switch (type) {
      case 'technical':
        return {
          icon: AlertTriangle,
          gradient: 'from-amber-500 to-orange-500',
          bgLight: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
        };
      case 'general':
      default:
        return {
          icon: HelpCircle,
          gradient: 'from-primary to-secondary',
          bgLight: 'bg-primary/5',
          border: 'border-primary/20',
          text: 'text-primary',
        };
    }
  };

  const config = getTicketTypeConfig(ticketType);
  const TypeIcon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden"
          >
            <div className="bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
              {/* Header */}
              <div className="relative overflow-hidden">
                {/* Gradient Background */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-10',
                  config.gradient
                )} />

                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)"/>
                  </svg>
                </div>

                <div className="relative px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br',
                        config.gradient
                      )}>
                        <Ticket className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">
                          Submit Support Ticket
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          We'll get back to you soon
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg hover:bg-muted/80"
                      onClick={onClose}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Success State */}
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-6 py-12 text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Ticket Submitted!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Our support team will review your ticket and get back to you shortly.
                  </p>
                </motion.div>
              ) : (
                /* Form Content */
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* User Info (Read-only) */}
                  <div className={cn(
                    'rounded-lg p-3 space-y-1',
                    config.bgLight,
                    config.border,
                    'border'
                  )}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">From:</span>
                      <span className="font-medium text-foreground">
                        {user?.firstName} {user?.lastName}
                      </span>
                      {user?.email && (
                        <span className="text-muted-foreground">({user.email})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Organization:</span>
                      <span className="font-medium text-foreground">
                        {organization?.companyName || 'Not set'}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Type Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Issue Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTicketType('general')}
                        className={cn(
                          'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                          ticketType === 'general'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                          ticketType === 'general'
                            ? 'bg-gradient-to-br from-primary to-secondary text-white'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <p className={cn(
                            'text-sm font-medium',
                            ticketType === 'general' ? 'text-primary' : 'text-foreground'
                          )}>
                            General
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Questions & feedback
                          </p>
                        </div>
                        {ticketType === 'general' && (
                          <motion.div
                            layoutId="ticket-type-indicator"
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTicketType('technical')}
                        className={cn(
                          'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                          ticketType === 'technical'
                            ? 'border-amber-500 bg-amber-50 shadow-sm'
                            : 'border-border hover:border-amber-500/50 hover:bg-muted/50'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                          ticketType === 'technical'
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <p className={cn(
                            'text-sm font-medium',
                            ticketType === 'technical' ? 'text-amber-700' : 'text-foreground'
                          )}>
                            Technical Issue
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Bugs & errors
                          </p>
                        </div>
                        {ticketType === 'technical' && (
                          <motion.div
                            layoutId="ticket-type-indicator"
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title Field */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={ticketType === 'technical'
                        ? "e.g., Error when saving quote"
                        : "e.g., Question about pricing"
                      }
                      className="h-11"
                      maxLength={100}
                    />
                  </div>

                  {/* Dynamic Fields Based on Type */}
                  <AnimatePresence mode="wait">
                    {ticketType === 'general' ? (
                      <motion.div
                        key="general-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="message" className="text-sm font-medium">
                          Message <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Describe your question or feedback..."
                          className="min-h-[120px] resize-none"
                          maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {message.length}/2000
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="technical-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        {/* Details Field */}
                        <div className="space-y-2">
                          <Label htmlFor="details" className="text-sm font-medium">
                            Issue Details <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            id="details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Please describe the issue in detail. Include:&#10;- What you were trying to do&#10;- What happened instead&#10;- Any error messages you saw"
                            className="min-h-[140px] resize-none"
                            maxLength={3000}
                          />
                          <p className="text-xs text-muted-foreground text-right">
                            {details.length}/3000
                          </p>
                        </div>

                        {/* File Attachments */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Attachments
                            <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                          </Label>

                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                              'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                              'hover:border-primary/50 hover:bg-primary/5',
                              'border-border'
                            )}
                          >
                            <Paperclip className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to attach files
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PNG, JPG, GIF, PDF (max 10MB each, up to 5 files)
                            </p>
                          </div>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                          />

                          {/* Attachment Previews */}
                          {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {attachments.map((attachment, index) => (
                                <div
                                  key={index}
                                  className="relative group flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 pr-8"
                                >
                                  {attachment.preview ? (
                                    <img
                                      src={attachment.preview}
                                      alt={attachment.file.name}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span className="text-xs text-foreground truncate max-w-[100px]">
                                    {attachment.file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeAttachment(index)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* LogRocket Integration */}
                        {process.env.NODE_ENV === 'production' && (
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                            <input
                              type="checkbox"
                              id="logrocket"
                              checked={includeLogRocket}
                              onChange={(e) => setIncludeLogRocket(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <label htmlFor="logrocket" className="flex-1 cursor-pointer">
                              <p className="text-sm font-medium text-foreground">
                                Include session replay
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Automatically attach your LogRocket session to help us diagnose the issue faster
                              </p>
                            </label>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              )}

              {/* Footer */}
              {!isSuccess && (
                <div className="px-6 py-4 border-t border-border bg-muted/30">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Tickets are sent to our support team
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-10"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim() || (ticketType === 'general' ? !message.trim() : !details.trim())}
                        className={cn(
                          'h-10 min-w-[120px]',
                          ticketType === 'technical' && 'bg-amber-500 hover:bg-amber-600'
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Ticket
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
