import { toast } from 'sonner';

/**
 * Clears all FlowRMS document-related localStorage items and navigates to the upload page.
 * This ensures a clean state for uploading a new document.
 */
export function navigateToNewUpload(): void {
  // Clear all localStorage items related to the current document
  localStorage.removeItem('flowrms_pending_id');
  localStorage.removeItem('flowrms_document_id');
  localStorage.removeItem('flowrms_mode');
  localStorage.removeItem('fileUploadProcessId');
  localStorage.removeItem('flowrms_initial_instructions');
  localStorage.removeItem('flowrms_context_files');
  localStorage.removeItem('flowrms_skip_instructions_prompt');

  // Clear all pendingId_* entries (dynamic keys with document IDs)
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('pendingId_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  // Show a toast notification
  toast.success('Ready for new upload');

  // Navigate to the dedicated upload page
  window.location.href = '/flow-ai/upload';
}





