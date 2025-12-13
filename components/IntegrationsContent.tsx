'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import {
  useO365ConnectionStatus,
  useO365StartAuth,
  useO365Connect,
  useO365Disconnect,
  useO365SendEmail,
  parseO365CallbackParams,
  hasO365CallbackParams,
  cleanO365CallbackUrl,
} from './hooks/useO365Api';
import {
  useGmailConnectionStatus,
  useGmailStartAuth,
  useGmailConnect,
  useGmailDisconnect,
  useGmailSendEmail,
  hasGmailCallbackParams,
  cleanGmailCallbackUrl,
} from './hooks/useGmailApi';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a date string to a human-readable format
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } catch {
    return 'Unknown';
  }
}

/**
 * Parse Gmail callback params from URL
 */
function parseGmailCallbackParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  };
}

// ============================================================================
// Icon Components
// ============================================================================

function Microsoft365Icon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}

function GmailIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 5.457V18.514C24 19.884 22.884 21 21.514 21H21V7.658L12 13.886L3 7.658V21H2.486C1.116 21 0 19.884 0 18.514V5.457C0 4.686 0.333 3.978 0.874 3.479C1.416 2.981 2.106 2.734 2.829 2.781C3.187 2.805 3.538 2.893 3.861 3.044L12 8.729L20.139 3.044C20.462 2.893 20.813 2.805 21.171 2.781C21.894 2.734 22.584 2.981 23.126 3.479C23.667 3.978 24 4.686 24 5.457Z" fill="#EA4335"/>
      <path d="M3 7.658V21H2.486C1.116 21 0 19.884 0 18.514V5.457C0 4.686 0.333 3.978 0.874 3.479L3 5.5V7.658Z" fill="#FBBC05"/>
      <path d="M24 5.457V18.514C24 19.884 22.884 21 21.514 21H21V7.658L23.126 3.479C23.667 3.978 24 4.686 24 5.457Z" fill="#34A853"/>
      <path d="M21 7.658V21H3V7.658L12 13.886L21 7.658Z" fill="#C5221F"/>
      <path d="M24 5.457L21 7.658L12 13.886L3 7.658L0 5.457C0 4.686 0.333 3.978 0.874 3.479C1.416 2.981 2.106 2.734 2.829 2.781C3.187 2.805 3.538 2.893 3.861 3.044L12 8.729L20.139 3.044C20.462 2.893 20.813 2.805 21.171 2.781C21.894 2.734 22.584 2.981 23.126 3.479C23.667 3.978 24 4.686 24 5.457Z" fill="#EA4335"/>
    </svg>
  );
}

// ============================================================================
// Status Badge Component
// ============================================================================

interface StatusBadgeProps {
  isConnected: boolean;
}

function StatusBadge({ isConnected }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isConnected
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {isConnected ? 'Connected' : 'Not connected'}
    </span>
  );
}

// ============================================================================
// Send Test Email Form Component (O365)
// ============================================================================

interface SendTestEmailFormProps {
  provider: 'o365' | 'gmail';
  onSuccess?: () => void;
}

function SendTestEmailForm({ provider, onSuccess }: SendTestEmailFormProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [bodyType, setBodyType] = useState<'HTML' | 'Text'>('HTML');
  const [isExpanded, setIsExpanded] = useState(false);

  const o365SendEmailMutation = useO365SendEmail();
  const gmailSendEmailMutation = useGmailSendEmail();

  const sendEmailMutation = provider === 'o365' ? o365SendEmailMutation : gmailSendEmailMutation;
  const providerName = provider === 'o365' ? 'Microsoft 365' : 'Gmail';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const result = await sendEmailMutation.mutateAsync({
        to: [to.trim()],
        subject: subject.trim(),
        body: body.trim(),
        bodyType,
      });

      if (result.success) {
        toast.success(`Test email sent via ${providerName}`);
        setTo('');
        setSubject('');
        setBody('');
        setIsExpanded(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--primary)] bg-[var(--secondary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 7L2 7" />
        </svg>
        Send test email
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-[var(--foreground)]">Send Test Email</h4>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div>
        <label htmlFor={`${provider}-email-to`} className="block text-sm font-medium text-[var(--foreground)] mb-1">
          To <span className="text-red-500">*</span>
        </label>
        <input
          id={`${provider}-email-to`}
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="recipient@example.com"
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white"
          required
        />
      </div>

      <div>
        <label htmlFor={`${provider}-email-subject`} className="block text-sm font-medium text-[var(--foreground)] mb-1">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          id={`${provider}-email-subject`}
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Test email from Flow CRM"
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white"
          required
        />
      </div>

      <div>
        <label htmlFor={`${provider}-email-body`} className="block text-sm font-medium text-[var(--foreground)] mb-1">
          Body <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`${provider}-email-body`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={bodyType === 'HTML' ? '<h1>Hello!</h1><p>This is a test email.</p>' : 'Hello! This is a test email.'}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white resize-none"
          required
        />
      </div>

      <div>
        <label htmlFor={`${provider}-body-type`} className="block text-sm font-medium text-[var(--foreground)] mb-1">
          Body Type
        </label>
        <select
          id={`${provider}-body-type`}
          value={bodyType}
          onChange={(e) => setBodyType(e.target.value as 'HTML' | 'Text')}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white"
        >
          <option value="HTML">HTML</option>
          <option value="Text">Plain Text</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--muted-foreground)] bg-[var(--muted)] rounded-lg hover:bg-[var(--border)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={sendEmailMutation.isPending}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sendEmailMutation.isPending ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Send email
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Disconnect Confirmation Modal
// ============================================================================

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  providerName: string;
}

function DisconnectModal({ isOpen, onClose, onConfirm, isLoading, providerName }: DisconnectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Disconnect {providerName}?
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Are you sure you want to disconnect {providerName}? You won&apos;t be able to send emails from
          your {providerName} account until you reconnect.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--muted-foreground)] bg-[var(--muted)] rounded-lg hover:bg-[var(--border)] disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Disconnecting...
              </>
            ) : (
              'Disconnect'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Microsoft 365 Integration Card Component
// ============================================================================

function Microsoft365Card() {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [callbackProcessed, setCallbackProcessed] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  const {
    data: connectionStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useO365ConnectionStatus();

  const startAuthMutation = useO365StartAuth();
  const connectMutation = useO365Connect();
  const disconnectMutation = useO365Disconnect();

  const handleOAuthCallback = useCallback(async () => {
    if (callbackProcessed) return;
    if (!hasO365CallbackParams()) return;

    const params = parseO365CallbackParams();
    setCallbackProcessed(true);

    if (params.error) {
      let errorMessage = 'Microsoft sign-in was canceled or failed.';
      if (params.error === 'access_denied') {
        errorMessage = 'You cancelled the Microsoft sign-in. No changes were made.';
      } else if (params.errorDescription) {
        errorMessage = params.errorDescription;
      }
      setCallbackError(errorMessage);
      toast.error(errorMessage);
      cleanO365CallbackUrl('/integrations');
      return;
    }

    if (params.code && params.state) {
      try {
        const result = await connectMutation.mutateAsync({
          code: params.code,
          state: params.state,
        });

        if (result.success) {
          toast.success(`Connected to Microsoft 365 as ${result.microsoftEmail}`);
        } else {
          let errorMessage = result.error || 'Failed to connect to Microsoft 365';
          if (result.error?.includes('expired')) {
            errorMessage = 'Microsoft authorization expired. Please try connecting again.';
          }
          setCallbackError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Microsoft 365';
        setCallbackError(errorMessage);
        toast.error(errorMessage);
      }

      cleanO365CallbackUrl('/integrations');
    }
  }, [callbackProcessed, connectMutation]);

  useEffect(() => {
    handleOAuthCallback();
  }, [handleOAuthCallback]);

  const handleConnect = async () => {
    setCallbackError(null);
    try {
      await startAuthMutation.mutateAsync();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start authentication');
    }
  };

  const handleDisconnect = async () => {
    try {
      const success = await disconnectMutation.mutateAsync();
      if (success) {
        toast.success('Disconnected from Microsoft 365');
        setShowDisconnectModal(false);
      } else {
        toast.error('Failed to disconnect from Microsoft 365');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect');
    }
  };

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle icon={<Microsoft365Icon size={28} />} iconClassName="flex-shrink-0" subtitle="Connect your Microsoft 365 account to send emails">
            Microsoft 365
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading connection status...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (statusError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle icon={<Microsoft365Icon size={28} />} iconClassName="flex-shrink-0" subtitle="Connect your Microsoft 365 account to send emails">
            Microsoft 365
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {statusError.message || 'Failed to load connection status'}
            </p>
            <button
              onClick={() => refetchStatus()}
              className="px-4 py-2 text-sm font-medium text-[var(--primary)] bg-[var(--secondary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = connectionStatus?.isConnected ?? false;

  return (
    <>
      <Card>
        <CardHeader action={<StatusBadge isConnected={isConnected} />}>
          <CardTitle
            icon={<Microsoft365Icon size={28} />}
            iconClassName="flex-shrink-0"
            subtitle="Connect your Microsoft 365 account to send emails directly from your own mailbox"
          >
            Microsoft 365
          </CardTitle>
        </CardHeader>

        <CardContent>
          {callbackError && !isConnected && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <p className="text-sm text-red-700">{callbackError}</p>
              </div>
            </div>
          )}

          {connectMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Completing Microsoft connection...</span>
              </div>
            </div>
          )}

          {!isConnected && !connectMutation.isPending && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Connect your Microsoft 365 account to send emails through the CRM using your own email address.
              </p>

              <div className="bg-[var(--muted)]/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">What you&apos;ll get:</h4>
                <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  <li className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 flex-shrink-0 mt-0.5">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Send emails from your Microsoft 365 account
                  </li>
                  <li className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 flex-shrink-0 mt-0.5">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Recipients see your real email address
                  </li>
                  <li className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 flex-shrink-0 mt-0.5">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Emails appear in your Sent folder
                  </li>
                </ul>
              </div>

              <button
                onClick={handleConnect}
                disabled={startAuthMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {startAuthMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Redirecting to Microsoft...
                  </>
                ) : (
                  <>
                    <Microsoft365Icon />
                    Connect Microsoft 365
                  </>
                )}
              </button>
            </div>
          )}

          {isConnected && !connectMutation.isPending && (
            <div className="space-y-4">
              <div className="bg-[var(--muted)]/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                    <Microsoft365Icon size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {connectionStatus?.microsoftEmail || 'Unknown account'}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">Microsoft 365 account</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Token expires</p>
                    <p className="text-sm text-[var(--foreground)]">
                      {formatDate(connectionStatus?.expiresAt ?? null)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Last used</p>
                    <p className="text-sm text-[var(--foreground)]">
                      {formatRelativeTime(connectionStatus?.lastUsedAt ?? null)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <SendTestEmailForm provider="o365" />
              </div>
            </div>
          )}
        </CardContent>

        {isConnected && !connectMutation.isPending && (
          <CardFooter className="flex justify-between items-center">
            <p className="text-xs text-[var(--muted-foreground)]">
              Manage your Microsoft 365 connection
            </p>
            <button
              onClick={() => setShowDisconnectModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </CardFooter>
        )}
      </Card>

      <DisconnectModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        isLoading={disconnectMutation.isPending}
        providerName="Microsoft 365"
      />
    </>
  );
}

// ============================================================================
// Gmail Integration Card Component
// ============================================================================

function GmailCard() {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [callbackProcessed, setCallbackProcessed] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  const {
    data: connectionStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useGmailConnectionStatus();

  const startAuthMutation = useGmailStartAuth();
  const connectMutation = useGmailConnect();
  const disconnectMutation = useGmailDisconnect();

  const handleOAuthCallback = useCallback(async () => {
    if (callbackProcessed) return;
    if (!hasGmailCallbackParams()) return;

    const params = parseGmailCallbackParams();
    setCallbackProcessed(true);

    if (params.error) {
      let errorMessage = 'Google sign-in was canceled or failed.';
      if (params.error === 'access_denied') {
        errorMessage = 'You cancelled the Google sign-in. No changes were made.';
      } else if (params.errorDescription) {
        errorMessage = params.errorDescription;
      }
      setCallbackError(errorMessage);
      toast.error(errorMessage);
      cleanGmailCallbackUrl('/integrations');
      return;
    }

    if (params.code && params.state) {
      try {
        const result = await connectMutation.mutateAsync({
          code: params.code,
          state: params.state,
        });

        if (result.success) {
          toast.success(`Connected to Gmail as ${result.googleEmail}`);
        } else {
          let errorMessage = result.error || 'Failed to connect to Gmail';
          if (result.error?.includes('expired')) {
            errorMessage = 'Google authorization expired. Please try connecting again.';
          }
          setCallbackError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Gmail';
        setCallbackError(errorMessage);
        toast.error(errorMessage);
      }

      cleanGmailCallbackUrl('/integrations');
    }
  }, [callbackProcessed, connectMutation]);

  useEffect(() => {
    handleOAuthCallback();
  }, [handleOAuthCallback]);

  const handleConnect = async () => {
    setCallbackError(null);
    try {
      await startAuthMutation.mutateAsync();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start authentication');
    }
  };

  const handleDisconnect = async () => {
    try {
      const success = await disconnectMutation.mutateAsync();
      if (success) {
        toast.success('Disconnected from Gmail');
        setShowDisconnectModal(false);
      } else {
        toast.error('Failed to disconnect from Gmail');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect');
    }
  };

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle icon={<GmailIcon size={28} />} iconClassName="flex-shrink-0" subtitle="Connect your Gmail account to send emails">
            Gmail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading connection status...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (statusError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle icon={<GmailIcon size={28} />} iconClassName="flex-shrink-0" subtitle="Connect your Gmail account to send emails">
            Gmail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {statusError.message || 'Failed to load connection status'}
            </p>
            <button
              onClick={() => refetchStatus()}
              className="px-4 py-2 text-sm font-medium text-[var(--primary)] bg-[var(--secondary)] rounded-lg hover:bg-[var(--primary)]/10 transition-colors"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = connectionStatus?.isConnected ?? false;

  return (
    <>
      <Card>
        <CardHeader action={<StatusBadge isConnected={isConnected} />}>
          <CardTitle
            icon={<GmailIcon size={28} />}
            iconClassName="flex-shrink-0"
            subtitle="Connect your Gmail account to send emails directly from your own mailbox"
          >
            Gmail
          </CardTitle>
        </CardHeader>

        <CardContent>
          {callbackError && !isConnected && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <p className="text-sm text-red-700">{callbackError}</p>
              </div>
            </div>
          )}

          {connectMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Completing Gmail connection...</span>
              </div>
            </div>
          )}

          {!isConnected && !connectMutation.isPending && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Connect your Gmail account to send emails through the CRM using your own email address.
              </p>

              <div className="bg-[var(--muted)]/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">What you&apos;ll get:</h4>
                <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  <li className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 flex-shrink-0 mt-0.5">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Send emails from your Gmail account
                  </li>
                  <li className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 flex-shrink-0 mt-0.5">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Recipients see your real email address
                  </li>
                  <li className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 flex-shrink-0 mt-0.5">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Emails appear in your Sent folder
                  </li>
                </ul>
              </div>

              <button
                onClick={handleConnect}
                disabled={startAuthMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {startAuthMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Redirecting to Google...
                  </>
                ) : (
                  <>
                    <GmailIcon />
                    Connect Gmail
                  </>
                )}
              </button>
            </div>
          )}

          {isConnected && !connectMutation.isPending && (
            <div className="space-y-4">
              <div className="bg-[var(--muted)]/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                    <GmailIcon size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {connectionStatus?.googleEmail || 'Unknown account'}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">Gmail account</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Token expires</p>
                    <p className="text-sm text-[var(--foreground)]">
                      {formatDate(connectionStatus?.expiresAt ?? null)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Last used</p>
                    <p className="text-sm text-[var(--foreground)]">
                      {formatRelativeTime(connectionStatus?.lastUsedAt ?? null)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <SendTestEmailForm provider="gmail" />
              </div>
            </div>
          )}
        </CardContent>

        {isConnected && !connectMutation.isPending && (
          <CardFooter className="flex justify-between items-center">
            <p className="text-xs text-[var(--muted-foreground)]">
              Manage your Gmail connection
            </p>
            <button
              onClick={() => setShowDisconnectModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </CardFooter>
        )}
      </Card>

      <DisconnectModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        isLoading={disconnectMutation.isPending}
        providerName="Gmail"
      />
    </>
  );
}

// ============================================================================
// Manufacturer Integration Types and Data
// ============================================================================

interface ManufacturerIntegration {
  id: string;
  name: string;
  logo?: string;
  description: string;
  status: 'available' | 'activated' | 'requested';
  requestCount?: number;
  connectedDate?: string;
  dataTypes: string[];
}

const initialManufacturerIntegrations: ManufacturerIntegration[] = [
  {
    id: 'signify',
    name: 'Signify',
    description: 'Stream quotes, orders, invoices, and commission data from Signify (formerly Philips Lighting)',
    status: 'available',
    dataTypes: ['Quotes', 'Orders', 'Invoices', 'Commissions'],
  },
  {
    id: 'rab',
    name: 'RAB Lighting',
    description: 'Stream quotes, orders, and commission data from RAB Lighting',
    status: 'requested',
    requestCount: 6,
    dataTypes: ['Quotes', 'Orders', 'Commissions'],
  },
];

// ============================================================================
// Manufacturer Integration Card Component
// ============================================================================

interface ManufacturerIntegrationCardProps {
  integration: ManufacturerIntegration;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onUpvote?: () => void;
  isActivating?: boolean;
}

function ManufacturerIntegrationCard({ integration, onActivate, onDeactivate, onUpvote, isActivating }: ManufacturerIntegrationCardProps) {
  const isRequested = integration.status === 'requested';
  const isActivated = integration.status === 'activated';
  const isAvailable = integration.status === 'available';

  return (
    <div
      className={`border rounded-xl p-5 transition-all ${
        isRequested
          ? 'border-[var(--border)] bg-[var(--muted)]/30 opacity-70'
          : isActivated
          ? 'border-green-200 bg-green-50/50'
          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isActivated ? 'bg-green-100' : isRequested ? 'bg-gray-100' : 'bg-[var(--primary)]/10'
          }`}>
            {integration.logo ? (
              <img src={integration.logo} alt={integration.name} className="w-8 h-8" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={
                isActivated ? 'text-green-600' : isRequested ? 'text-gray-400' : 'text-[var(--primary)]'
              }>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${isRequested ? 'text-gray-500' : 'text-[var(--foreground)]'}`}>
                {integration.name}
              </h3>
              {isActivated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Active
                </span>
              )}
              {isRequested && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Requested
                </span>
              )}
            </div>
            <p className={`text-sm mb-3 ${isRequested ? 'text-gray-400' : 'text-[var(--muted-foreground)]'}`}>
              {integration.description}
            </p>
            {integration.dataTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {integration.dataTypes.map(type => (
                  <span
                    key={type}
                    className={`px-2 py-0.5 text-xs rounded-md ${
                      isRequested
                        ? 'bg-gray-100 text-gray-400'
                        : isActivated
                        ? 'bg-green-100 text-green-700'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}
            {isActivated && integration.connectedDate && (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Connected since {integration.connectedDate}
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {isAvailable && onActivate && (
            <button
              onClick={onActivate}
              disabled={isActivating}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Activating...
                </>
              ) : (
                'Activate'
              )}
            </button>
          )}
          {isActivated && onDeactivate && (
            <button
              onClick={onDeactivate}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Deactivate
            </button>
          )}
          {isRequested && onUpvote && (
            <button
              onClick={onUpvote}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{integration.requestCount || 0}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Manufacturer Integrations Section Component
// ============================================================================

function ManufacturerIntegrationsSection() {
  const [integrations, setIntegrations] = useState<ManufacturerIntegration[]>(initialManufacturerIntegrations);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [showActivateModal, setShowActivateModal] = useState<string | null>(null);

  const handleActivate = async (integrationId: string) => {
    setIsActivating(integrationId);
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, status: 'activated', connectedDate: new Date().toISOString().split('T')[0] }
          : integration
      )
    );
    setIsActivating(null);
    setShowActivateModal(null);
  };

  const handleDeactivate = (integrationId: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, status: 'available', connectedDate: undefined }
          : integration
      )
    );
  };

  const handleRequestIntegration = () => {
    if (!newIntegrationName.trim()) return;

    const newIntegration: ManufacturerIntegration = {
      id: newIntegrationName.toLowerCase().replace(/\s+/g, '-'),
      name: newIntegrationName.trim(),
      description: `Requested integration for ${newIntegrationName.trim()}`,
      status: 'requested',
      requestCount: 1,
      dataTypes: [],
    };

    setIntegrations(prev => [...prev, newIntegration]);
    setNewIntegrationName('');
    setShowRequestModal(false);
  };

  const handleUpvote = (integrationId: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId && integration.status === 'requested'
          ? { ...integration, requestCount: (integration.requestCount || 0) + 1 }
          : integration
      )
    );
  };

  const availableIntegrations = integrations.filter(i => i.status === 'available');
  const activatedIntegrations = integrations.filter(i => i.status === 'activated');
  const requestedIntegrations = integrations.filter(i => i.status === 'requested');

  return (
    <>
      <div className="max-w-3xl">
        {/* Header with Request button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Manufacturer Integrations</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Connect to manufacturers to automatically stream quotes, orders, invoices, and commission data
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--primary)] border border-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
            </svg>
            Request Integration
          </button>
        </div>

        <div className="space-y-8">
          {/* Activated Integrations */}
          {activatedIntegrations.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Activated ({activatedIntegrations.length})
              </h3>
              <div className="space-y-3">
                {activatedIntegrations.map(integration => (
                  <ManufacturerIntegrationCard
                    key={integration.id}
                    integration={integration}
                    onDeactivate={() => handleDeactivate(integration.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Available Integrations */}
          {availableIntegrations.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Available ({availableIntegrations.length})
              </h3>
              <div className="space-y-3">
                {availableIntegrations.map(integration => (
                  <ManufacturerIntegrationCard
                    key={integration.id}
                    integration={integration}
                    onActivate={() => setShowActivateModal(integration.id)}
                    isActivating={isActivating === integration.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Requested Integrations */}
          {requestedIntegrations.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                Requested ({requestedIntegrations.length})
              </h3>
              <div className="space-y-3">
                {requestedIntegrations.map(integration => (
                  <ManufacturerIntegrationCard
                    key={integration.id}
                    integration={integration}
                    onUpvote={() => handleUpvote(integration.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Request Integration Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Request Integration</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Manufacturer Name
                </label>
                <input
                  type="text"
                  value={newIntegrationName}
                  onChange={(e) => setNewIntegrationName(e.target.value)}
                  placeholder="Enter manufacturer name..."
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                We&apos;ll add this manufacturer to our integration roadmap. The more requests an integration receives, the higher priority it becomes.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestIntegration}
                disabled={!newIntegrationName.trim()}
                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Integration Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Activate Integration</h3>
              <button
                onClick={() => setShowActivateModal(null)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const integration = integrations.find(i => i.id === showActivateModal);
                return integration ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                          <circle cx="12" cy="12" r="4"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-[var(--foreground)]">{integration.name}</h4>
                        <p className="text-sm text-[var(--muted-foreground)]">{integration.description}</p>
                      </div>
                    </div>
                    <div className="bg-[var(--muted)]/50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-[var(--foreground)] mb-2">Data types available:</h5>
                      <div className="flex flex-wrap gap-2">
                        {integration.dataTypes.map(type => (
                          <span key={type} className="px-2 py-1 text-xs bg-[var(--background)] text-[var(--foreground)] rounded-md">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Once activated, data from {integration.name} will automatically sync to your account. You can deactivate at any time.
                    </p>
                  </>
                ) : null;
              })()}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <button
                onClick={() => setShowActivateModal(null)}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleActivate(showActivateModal)}
                disabled={isActivating === showActivateModal}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActivating === showActivateModal ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Activating...
                  </>
                ) : (
                  'Activate Integration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Main Integrations Content Component
// ============================================================================

export default function IntegrationsContent() {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Email Integrations Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Email Integration</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Connect external services such as Microsoft 365 or Gmail to send emails from your own mailbox
        </p>
      </div>

      <div className="grid gap-6 max-w-3xl mb-12">
        <Microsoft365Card />
        <GmailCard />
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border)] mb-8"></div>

      {/* Manufacturer Integrations Section */}
      <ManufacturerIntegrationsSection />
    </main>
  );
}
