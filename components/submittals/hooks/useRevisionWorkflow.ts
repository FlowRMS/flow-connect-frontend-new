import { useState, useCallback } from 'react';
import type {
  Submittal,
  SubmittalRevision,
  ReturnedPdf,
  EmailSendRecord,
  ItemChange,
} from '../../../lib/types/submittals';
import {
  useSendSubmittalEmail,
  useUpdateItemChange,
  useDeleteItemChange,
  useResolveItemChange,
  type UpdateItemChangeInput,
  type ItemChangeStatusGQL,
} from '../api/useSubmittalsApi';
import { submittalToasts } from '../../lib/toast';

interface UseRevisionWorkflowParams {
  submittal: Submittal;
  onUpdate?: (updates: Partial<Submittal>) => void;
  onResubmit?: (itemsToResubmit: string[]) => void;
}

export function useRevisionWorkflow({
  submittal,
  onUpdate,
  onResubmit,
}: UseRevisionWorkflowParams) {
  const [emailDialogRevision, setEmailDialogRevision] = useState<SubmittalRevision | null>(null);
  const [uploadDialogRevision, setUploadDialogRevision] = useState<SubmittalRevision | null>(null);
  const [analysisReturnedPdf, setAnalysisReturnedPdf] = useState<ReturnedPdf | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // API hooks
  const sendEmailMutation = useSendSubmittalEmail();
  const updateItemChangeMutation = useUpdateItemChange();
  const deleteItemChangeMutation = useDeleteItemChange();
  const resolveItemChangeMutation = useResolveItemChange();

  const handleSendEmail = useCallback(async (emailRecord: Omit<EmailSendRecord, 'id' | 'sentAt'>) => {
    if (!emailDialogRevision || !submittal.id) return;

    setIsSendingEmail(true);
    try {
      await sendEmailMutation.mutateAsync({
        submittalId: submittal.id,
        revisionId: emailDialogRevision.id,
        subject: emailRecord.subject,
        body: emailRecord.body,
        recipientEmails: emailRecord.recipients,
        attachmentUrl: emailRecord.attachmentUrl || undefined,
        attachmentName: emailRecord.attachmentName || undefined,
      });

      // Query invalidation happens automatically in the mutation hook
      setEmailDialogRevision(null);
      submittalToasts.emailSent(emailRecord.recipients.length);
    } catch (error) {
      console.error('Error sending email:', error);
      submittalToasts.emailError(error instanceof Error ? error.message : 'Unknown error');
      throw error; // Re-throw to allow dialog to reset its sending state
    } finally {
      setIsSendingEmail(false);
    }
  }, [emailDialogRevision, submittal.id, sendEmailMutation]);

  const handleUploadReturned = (returnedPdf: Omit<ReturnedPdf, 'id' | 'uploadedAt' | 'uploadedBy'>) => {
    if (!uploadDialogRevision || !onUpdate) return;

    const newReturnedPdf: ReturnedPdf = {
      ...returnedPdf,
      id: `ret-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Current User',
    };

    const updatedRevisions = submittal.revisions.map(rev => {
      if (rev.revisionNumber === uploadDialogRevision.revisionNumber) {
        return {
          ...rev,
          returnedPdfs: [...rev.returnedPdfs, newReturnedPdf],
        };
      }
      return rev;
    });

    onUpdate({ revisions: updatedRevisions });
    setUploadDialogRevision(null);

    if (newReturnedPdf.changeAnalysis) {
      setAnalysisReturnedPdf(newReturnedPdf);
    }
  };

  const handleUpdateChange = useCallback(async (changeId: string, updates: Partial<ItemChange>) => {
    if (!analysisReturnedPdf || !submittal.id) return;

    // Map local updates to GraphQL input
    const input: UpdateItemChangeInput = {};
    if (updates.status !== undefined) {
      // Map local status to GraphQL enum
      const statusMap: Record<string, ItemChangeStatusGQL> = {
        'approved': 'APPROVED',
        'approved_as_noted': 'APPROVED_AS_NOTED',
        'revise': 'REVISE',
        'rejected': 'REJECTED',
      };
      input.status = statusMap[updates.status] || 'APPROVED';
    }
    if (updates.notes !== undefined) {
      input.notes = updates.notes;
    }
    if (updates.pageReferences !== undefined) {
      input.pageReferences = updates.pageReferences;
    }
    if (updates.resolved !== undefined) {
      input.resolved = updates.resolved;
    }
    if (updates.fixtureType !== undefined) {
      input.fixtureType = updates.fixtureType;
    }
    if (updates.catalogNumber !== undefined) {
      input.catalogNumber = updates.catalogNumber;
    }
    if (updates.manufacturer !== undefined) {
      input.manufacturer = updates.manufacturer;
    }

    // Optimistic update for immediate UI feedback
    if (onUpdate) {
      const updatedRevisions = submittal.revisions.map(rev => ({
        ...rev,
        returnedPdfs: rev.returnedPdfs.map(pdf => {
          if (pdf.id === analysisReturnedPdf.id && pdf.changeAnalysis) {
            return {
              ...pdf,
              changeAnalysis: {
                ...pdf.changeAnalysis,
                itemChanges: pdf.changeAnalysis.itemChanges.map(change =>
                  change.id === changeId ? { ...change, ...updates } : change
                ),
              },
            };
          }
          return pdf;
        }),
      }));
      onUpdate({ revisions: updatedRevisions });
    }

    if (analysisReturnedPdf.changeAnalysis) {
      setAnalysisReturnedPdf({
        ...analysisReturnedPdf,
        changeAnalysis: {
          ...analysisReturnedPdf.changeAnalysis,
          itemChanges: analysisReturnedPdf.changeAnalysis.itemChanges.map(change =>
            change.id === changeId ? { ...change, ...updates } : change
          ),
        },
      });
    }

    // Call mutation
    try {
      await updateItemChangeMutation.mutateAsync({
        id: changeId,
        input,
        submittalId: submittal.id,
      });
    } catch (error) {
      console.error('Error updating item change:', error);
      submittalToasts.changeUpdateError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [analysisReturnedPdf, submittal.id, submittal.revisions, onUpdate, updateItemChangeMutation]);

  const handleAddChange = (change: Omit<ItemChange, 'id'>) => {
    if (!analysisReturnedPdf || !analysisReturnedPdf.changeAnalysis || !onUpdate) return;

    const newChange: ItemChange = {
      ...change,
      id: `ic-${Date.now()}`,
    };

    const updatedRevisions = submittal.revisions.map(rev => ({
      ...rev,
      returnedPdfs: rev.returnedPdfs.map(pdf => {
        if (pdf.id === analysisReturnedPdf.id && pdf.changeAnalysis) {
          return {
            ...pdf,
            changeAnalysis: {
              ...pdf.changeAnalysis,
              totalChangesDetected: pdf.changeAnalysis.totalChangesDetected + 1,
              itemChanges: [...pdf.changeAnalysis.itemChanges, newChange],
            },
          };
        }
        return pdf;
      }),
    }));

    onUpdate({ revisions: updatedRevisions });

    setAnalysisReturnedPdf({
      ...analysisReturnedPdf,
      changeAnalysis: {
        ...analysisReturnedPdf.changeAnalysis,
        totalChangesDetected: analysisReturnedPdf.changeAnalysis.totalChangesDetected + 1,
        itemChanges: [...analysisReturnedPdf.changeAnalysis.itemChanges, newChange],
      },
    });
  };

  const handleDeleteChange = useCallback(async (changeId: string) => {
    if (!analysisReturnedPdf || !analysisReturnedPdf.changeAnalysis || !submittal.id) return;

    // Optimistic update for immediate UI feedback
    if (onUpdate) {
      const updatedRevisions = submittal.revisions.map(rev => ({
        ...rev,
        returnedPdfs: rev.returnedPdfs.map(pdf => {
          if (pdf.id === analysisReturnedPdf.id && pdf.changeAnalysis) {
            return {
              ...pdf,
              changeAnalysis: {
                ...pdf.changeAnalysis,
                totalChangesDetected: Math.max(0, pdf.changeAnalysis.totalChangesDetected - 1),
                itemChanges: pdf.changeAnalysis.itemChanges.filter(c => c.id !== changeId),
              },
            };
          }
          return pdf;
        }),
      }));
      onUpdate({ revisions: updatedRevisions });
    }

    setAnalysisReturnedPdf({
      ...analysisReturnedPdf,
      changeAnalysis: {
        ...analysisReturnedPdf.changeAnalysis,
        totalChangesDetected: Math.max(0, analysisReturnedPdf.changeAnalysis.totalChangesDetected - 1),
        itemChanges: analysisReturnedPdf.changeAnalysis.itemChanges.filter(c => c.id !== changeId),
      },
    });

    // Call mutation
    try {
      await deleteItemChangeMutation.mutateAsync({
        id: changeId,
        submittalId: submittal.id,
      });
    } catch (error) {
      console.error('Error deleting item change:', error);
      submittalToasts.changeDeleteError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [analysisReturnedPdf, submittal.id, submittal.revisions, onUpdate, deleteItemChangeMutation]);

  const handleResolveChange = useCallback(async (changeId: string) => {
    if (!analysisReturnedPdf || !analysisReturnedPdf.changeAnalysis || !submittal.id) return;

    // Optimistic update for immediate UI feedback
    if (onUpdate) {
      const updatedRevisions = submittal.revisions.map(rev => ({
        ...rev,
        returnedPdfs: rev.returnedPdfs.map(pdf => {
          if (pdf.id === analysisReturnedPdf.id && pdf.changeAnalysis) {
            return {
              ...pdf,
              changeAnalysis: {
                ...pdf.changeAnalysis,
                itemChanges: pdf.changeAnalysis.itemChanges.map(change =>
                  change.id === changeId ? { ...change, resolved: true } : change
                ),
              },
            };
          }
          return pdf;
        }),
      }));
      onUpdate({ revisions: updatedRevisions });
    }

    setAnalysisReturnedPdf({
      ...analysisReturnedPdf,
      changeAnalysis: {
        ...analysisReturnedPdf.changeAnalysis,
        itemChanges: analysisReturnedPdf.changeAnalysis.itemChanges.map(change =>
          change.id === changeId ? { ...change, resolved: true } : change
        ),
      },
    });

    // Call mutation
    try {
      await resolveItemChangeMutation.mutateAsync({
        id: changeId,
        submittalId: submittal.id,
      });
    } catch (error) {
      console.error('Error resolving item change:', error);
      submittalToasts.changeResolveError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [analysisReturnedPdf, submittal.id, submittal.revisions, onUpdate, resolveItemChangeMutation]);

  const handleResubmit = (revision: SubmittalRevision, returnedPdf: ReturnedPdf) => {
    if (!returnedPdf.changeAnalysis || !onResubmit) return;

    const itemsToResubmit = returnedPdf.changeAnalysis.itemChanges
      .filter(c => c.status === 'revise' || c.status === 'rejected')
      .map(c => c.itemId);

    onResubmit(itemsToResubmit);
  };

  return {
    emailDialogRevision,
    setEmailDialogRevision,
    uploadDialogRevision,
    setUploadDialogRevision,
    analysisReturnedPdf,
    setAnalysisReturnedPdf,
    handleSendEmail,
    handleUploadReturned,
    handleUpdateChange,
    handleAddChange,
    handleDeleteChange,
    handleResolveChange,
    handleResubmit,
    isSendingEmail,
    isUpdatingChange: updateItemChangeMutation.isPending,
    isDeletingChange: deleteItemChangeMutation.isPending,
    isResolvingChange: resolveItemChangeMutation.isPending,
  };
}
