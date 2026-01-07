/**
 * Toast Utility Module
 * Centralized toast notification functions using Sonner
 */

import { toast } from 'sonner';

// ============================================================================
// Toast Configuration Types
// ============================================================================

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Success Toasts
// ============================================================================

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  });
};

// ============================================================================
// Error Toasts
// ============================================================================

export const showErrorToast = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    description: options?.description,
    duration: options?.duration || 5000,
    action: options?.action,
  });
};

// ============================================================================
// Warning Toasts
// ============================================================================

export const showWarningToast = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    description: options?.description,
    duration: options?.duration || 4500,
    action: options?.action,
  });
};

// ============================================================================
// Info Toasts
// ============================================================================

export const showInfoToast = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  });
};

// ============================================================================
// Loading Toasts (Promise-based)
// ============================================================================

export const showLoadingToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
};

// ============================================================================
// Specific Operation Toasts
// ============================================================================

// Pre-Opportunity Toasts
export const preOpportunityToasts = {
  createSuccess: (entityNumber: string) =>
    showSuccessToast('Pre-Opportunity Created', {
      description: `${entityNumber} has been created successfully`,
    }),
  
  createError: (error?: string) =>
    showErrorToast('Failed to Create Pre-Opportunity', {
      description: error || 'Please try again or contact support',
    }),
  
  updateSuccess: (entityNumber: string) =>
    showSuccessToast('Pre-Opportunity Updated', {
      description: `${entityNumber} has been updated successfully`,
    }),
  
  updateError: (error?: string) =>
    showErrorToast('Failed to Update Pre-Opportunity', {
      description: error || 'Please try again or contact support',
    }),
  
  deleteSuccess: (entityNumber: string) =>
    showSuccessToast('Pre-Opportunity Deleted', {
      description: `${entityNumber} has been removed`,
    }),
  
  deleteError: (error?: string) =>
    showErrorToast('Failed to Delete Pre-Opportunity', {
      description: error || 'Please try again or contact support',
    }),
  
  statusChanged: (entityNumber: string, newStatus: string) =>
    showSuccessToast('Status Updated', {
      description: `${entityNumber} moved to ${newStatus}`,
    }),
};

// Contact Toasts
export const contactToasts = {
  createSuccess: (name: string) =>
    showSuccessToast('Contact Created', {
      description: `${name} has been added to your contacts`,
    }),
  
  createError: (error?: string) =>
    showErrorToast('Failed to Create Contact', {
      description: error || 'Please try again or contact support',
    }),
  
  updateSuccess: (name: string) =>
    showSuccessToast('Contact Updated', {
      description: `${name}'s information has been updated`,
    }),
  
  updateError: (error?: string) =>
    showErrorToast('Failed to Update Contact', {
      description: error || 'Please try again or contact support',
    }),
  
  deleteSuccess: (name: string) =>
    showSuccessToast('Contact Deleted', {
      description: `${name} has been removed from your contacts`,
    }),
  
  deleteError: (error?: string) =>
    showErrorToast('Failed to Delete Contact', {
      description: error || 'Please try again or contact support',
    }),
};

// Company Toasts
export const companyToasts = {
  createSuccess: (name: string) =>
    showSuccessToast('Company Created', {
      description: `${name} has been added successfully`,
    }),
  
  createError: (error?: string) =>
    showErrorToast('Failed to Create Company', {
      description: error || 'Please try again or contact support',
    }),
  
  updateSuccess: (name: string) =>
    showSuccessToast('Company Updated', {
      description: `${name}'s information has been updated`,
    }),
  
  updateError: (error?: string) =>
    showErrorToast('Failed to Update Company', {
      description: error || 'Please try again or contact support',
    }),
  
  deleteSuccess: (name: string) =>
    showSuccessToast('Company Deleted', {
      description: `${name} has been removed`,
    }),
  
  deleteError: (error?: string) =>
    showErrorToast('Failed to Delete Company', {
      description: error || 'Please try again or contact support',
    }),
};

// Job Toasts
export const jobToasts = {
  createSuccess: (name: string) =>
    showSuccessToast('Job Created', {
      description: `${name} has been created successfully`,
    }),
  
  createError: (error?: string) =>
    showErrorToast('Failed to Create Job', {
      description: error || 'Please try again or contact support',
    }),
  
  updateSuccess: (name: string) =>
    showSuccessToast('Job Updated', {
      description: `${name} has been updated successfully`,
    }),
  
  updateError: (error?: string) =>
    showErrorToast('Failed to Update Job', {
      description: error || 'Please try again or contact support',
    }),
  
  deleteSuccess: (name: string) =>
    showSuccessToast('Job Deleted', {
      description: `${name} has been removed`,
    }),
  
  deleteError: (error?: string) =>
    showErrorToast('Failed to Delete Job', {
      description: error || 'Please try again or contact support',
    }),
};

// Task Toasts
export const taskToasts = {
  createSuccess: (title: string) =>
    showSuccessToast('Task Created', {
      description: `"${title}" has been added to your tasks`,
    }),
  
  createError: (error?: string) =>
    showErrorToast('Failed to Create Task', {
      description: error || 'Please try again or contact support',
    }),
  
  updateSuccess: (title: string) =>
    showSuccessToast('Task Updated', {
      description: `"${title}" has been updated`,
    }),
  
  updateError: (error?: string) =>
    showErrorToast('Failed to Update Task', {
      description: error || 'Please try again or contact support',
    }),
  
  deleteSuccess: () =>
    showSuccessToast('Task Deleted', {
      description: 'Task has been removed from your list',
    }),
  
  deleteError: (error?: string) =>
    showErrorToast('Failed to Delete Task', {
      description: error || 'Please try again or contact support',
    }),
  
  completedSuccess: (title: string) =>
    showSuccessToast('Task Completed', {
      description: `"${title}" marked as complete`,
    }),
  
  commentAdded: () =>
    showSuccessToast('Comment Added', {
      description: 'Your comment has been posted',
    }),
  
  commentError: (error?: string) =>
    showErrorToast('Failed to Add Comment', {
      description: error || 'Please try again or contact support',
    }),
};

// Note Toasts
export const noteToasts = {
  createSuccess: () =>
    showSuccessToast('Note Created', {
      description: 'Your note has been saved',
    }),
  
  createError: (error?: string) =>
    showErrorToast('Failed to Create Note', {
      description: error || 'Please try again or contact support',
    }),
  
  updateSuccess: () =>
    showSuccessToast('Note Updated', {
      description: 'Your note has been saved',
    }),
  
  updateError: (error?: string) =>
    showErrorToast('Failed to Update Note', {
      description: error || 'Please try again or contact support',
    }),
  
  deleteSuccess: () =>
    showSuccessToast('Note Deleted', {
      description: 'Note has been removed',
    }),
  
  deleteError: (error?: string) =>
    showErrorToast('Failed to Delete Note', {
      description: error || 'Please try again or contact support',
    }),
};

// Link Operation Toasts
export const linkToasts = {
  createSuccess: (linkType: string) =>
    showSuccessToast('Link Created', {
      description: `${linkType} has been linked successfully`,
    }),
  
  alreadyExists: (linkType: string) =>
    showWarningToast('Link Already Exists', {
      description: `This ${linkType} is already linked`,
      duration: 4000,
    }),
  
  createError: (error?: string) =>
    showErrorToast('Failed to Create Link', {
      description: error || 'Please try again or contact support',
    }),
  
  deleteSuccess: (linkType: string) =>
    showSuccessToast('Link Removed', {
      description: `${linkType} has been unlinked`,
    }),
  
  deleteError: (error?: string) =>
    showErrorToast('Failed to Remove Link', {
      description: error || 'Please try again or contact support',
    }),
};

// Campaign Toasts
export const campaignToasts = {
  createSuccess: (name: string) =>
    showSuccessToast('Campaign Created', {
      description: `"${name}" has been created successfully`,
    }),

  createError: (error?: string) =>
    showErrorToast('Failed to Create Campaign', {
      description: error || 'Please try again or contact support',
    }),

  updateSuccess: (name: string) =>
    showSuccessToast('Campaign Updated', {
      description: `"${name}" has been updated successfully`,
    }),

  updateError: (error?: string) =>
    showErrorToast('Failed to Update Campaign', {
      description: error || 'Please try again or contact support',
    }),

  deleteSuccess: (name: string) =>
    showSuccessToast('Campaign Deleted', {
      description: `"${name}" has been removed`,
    }),

  deleteError: (error?: string) =>
    showErrorToast('Failed to Delete Campaign', {
      description: error || 'Please try again or contact support',
    }),

  startSuccess: (name: string) =>
    showSuccessToast('Campaign Started', {
      description: `"${name}" is now sending emails`,
    }),

  startError: (error?: string) =>
    showErrorToast('Failed to Start Campaign', {
      description: error || 'Please try again or contact support',
    }),

  pauseSuccess: (name: string) =>
    showSuccessToast('Campaign Paused', {
      description: `"${name}" has been paused`,
    }),

  pauseError: (error?: string) =>
    showErrorToast('Failed to Pause Campaign', {
      description: error || 'Please try again or contact support',
    }),

  resumeSuccess: (name: string) =>
    showSuccessToast('Campaign Resumed', {
      description: `"${name}" is now sending again`,
    }),

  resumeError: (error?: string) =>
    showErrorToast('Failed to Resume Campaign', {
      description: error || 'Please try again or contact support',
    }),

  cloneSuccess: (name: string) =>
    showSuccessToast('Campaign Cloned', {
      description: `"${name}" has been created as a copy`,
    }),

  cloneError: (error?: string) =>
    showErrorToast('Failed to Clone Campaign', {
      description: error || 'Please try again or contact support',
    }),

  testEmailSuccess: (email: string) =>
    showSuccessToast('Test Email Sent', {
      description: `Test email sent to ${email}`,
    }),

  testEmailError: (error?: string) =>
    showErrorToast('Failed to Send Test Email', {
      description: error || 'Please try again or contact support',
    }),

  savedAsDraft: (name: string) =>
    showSuccessToast('Saved as Draft', {
      description: `"${name}" has been saved as a draft`,
    }),

  noEmailProvider: () =>
    showWarningToast('Email Provider Required', {
      description: 'Please connect O365 or Gmail in Settings > Integrations',
    }),

  validationError: (message: string) =>
    showWarningToast('Validation Error', {
      description: message,
    }),
};

// Generic Operation Toasts
export const genericToasts = {
  loading: (message: string) =>
    showInfoToast(message),
  
  saveSuccess: () =>
    showSuccessToast('Changes Saved', {
      description: 'Your changes have been saved successfully',
    }),
  
  saveError: (error?: string) =>
    showErrorToast('Failed to Save', {
      description: error || 'Please try again or contact support',
    }),
  
  copySuccess: (item: string) =>
    showSuccessToast('Copied to Clipboard', {
      description: `${item} has been copied`,
    }),
  
  networkError: () =>
    showErrorToast('Network Error', {
      description: 'Please check your connection and try again',
    }),
  
  sessionExpired: () =>
    showWarningToast('Session Expired', {
      description: 'Please log in again to continue',
    }),
};

// Order Toasts
export const orderToasts = {
  createSuccess: (orderNumber: string) =>
    showSuccessToast('Order Created', {
      description: `${orderNumber} has been created successfully`,
    }),

  createError: (error?: string) =>
    showErrorToast('Failed to Create Order', {
      description: error || 'Please try again or contact support',
    }),

  updateSuccess: (orderNumber: string) =>
    showSuccessToast('Order Saved', {
      description: `${orderNumber} has been updated successfully`,
    }),

  updateError: (error?: string) =>
    showErrorToast('Failed to Save Order', {
      description: error || 'Please try again or contact support',
    }),

  deleteSuccess: (orderNumber: string) =>
    showSuccessToast('Order Deleted', {
      description: `${orderNumber} has been removed`,
    }),

  deleteError: (error?: string) =>
    showErrorToast('Failed to Delete Order', {
      description: error || 'Please try again or contact support',
    }),

  invoiceCreatedFromOrder: (invoiceNumber: string) =>
    showSuccessToast('Invoice Created', {
      description: `Invoice ${invoiceNumber} has been created from order`,
    }),

  invoiceCreationError: (error?: string) =>
    showErrorToast('Failed to Create Invoice', {
      description: error || 'Please try again or contact support',
    }),

  duplicateSuccess: (orderNumber: string) =>
    showSuccessToast('Order Duplicated', {
      description: `${orderNumber} has been created successfully`,
    }),

  duplicateError: (error?: string) =>
    showErrorToast('Failed to Duplicate Order', {
      description: error || 'Please try again or contact support',
    }),
};

// Team Member Toasts
export const teamMemberToasts = {
  createSuccess: (name: string) =>
    showSuccessToast('User Created', {
      description: `${name} has been added to your team`,
    }),

  createError: (error?: string) =>
    showErrorToast('Failed to Create User', {
      description: error || 'Please try again or contact support',
    }),

  updateSuccess: (name: string) =>
    showSuccessToast('User Updated', {
      description: `${name}'s information has been updated`,
    }),

  updateError: (error?: string) =>
    showErrorToast('Failed to Update User', {
      description: error || 'Please try again or contact support',
    }),

  deleteSuccess: (name: string) =>
    showSuccessToast('User Deleted', {
      description: `${name} has been removed from your team`,
    }),

  deleteError: (error?: string) =>
    showErrorToast('Failed to Delete User', {
      description: error || 'Please try again or contact support',
    }),

  statusChanged: (name: string, enabled: boolean) =>
    showSuccessToast(enabled ? 'User Activated' : 'User Deactivated', {
      description: `${name} has been ${enabled ? 'activated' : 'deactivated'}`,
    }),
};

// Quote Toasts
export const quoteToasts = {
  createSuccess: (quoteNumber: string) =>
    showSuccessToast('Quote Created', {
      description: `${quoteNumber} has been created successfully`,
    }),

  createError: (error?: string) =>
    showErrorToast('Failed to Create Quote', {
      description: error || 'Please try again or contact support',
    }),

  updateSuccess: (quoteNumber: string) =>
    showSuccessToast('Quote Saved', {
      description: `${quoteNumber} has been updated successfully`,
    }),

  updateError: (error?: string) =>
    showErrorToast('Failed to Save Quote', {
      description: error || 'Please try again or contact support',
    }),

  deleteSuccess: (quoteNumber: string) =>
    showSuccessToast('Quote Deleted', {
      description: `${quoteNumber} has been removed`,
    }),

  deleteError: (error?: string) =>
    showErrorToast('Failed to Delete Quote', {
      description: error || 'Please try again or contact support',
    }),

  duplicateSuccess: (quoteNumber: string) =>
    showSuccessToast('Quote Duplicated', {
      description: `${quoteNumber} has been created as a copy`,
    }),

  duplicateError: (error?: string) =>
    showErrorToast('Failed to Duplicate Quote', {
      description: error || 'Please try again or contact support',
    }),

  stageChanged: (quoteNumber: string, newStage: string) =>
    showSuccessToast('Stage Updated', {
      description: `${quoteNumber} moved to ${newStage}`,
    }),

  stageChangeError: (error?: string) =>
    showErrorToast('Failed to Update Stage', {
      description: error || 'Please try again or contact support',
    }),
};
