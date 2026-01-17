import { useState } from 'react';
import type {
  Submittal,
  SubmittalRevision,
  ReturnedPdf,
  EmailSendRecord,
  ItemChange,
} from '../../../lib/types/submittals';

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

  const handleSendEmail = (emailRecord: Omit<EmailSendRecord, 'id' | 'sentAt'>) => {
    if (!emailDialogRevision || !onUpdate) return;

    const newEmailRecord: EmailSendRecord = {
      ...emailRecord,
      id: `email-${Date.now()}`,
      sentAt: new Date().toISOString(),
    };

    const updatedRevisions = submittal.revisions.map(rev => {
      if (rev.revisionNumber === emailDialogRevision.revisionNumber) {
        return {
          ...rev,
          emailsSent: [...(rev.emailsSent || []), newEmailRecord],
        };
      }
      return rev;
    });

    onUpdate({ revisions: updatedRevisions });
    setEmailDialogRevision(null);
  };

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

  const handleUpdateChange = (changeId: string, updates: Partial<ItemChange>) => {
    if (!analysisReturnedPdf || !onUpdate) return;

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
  };

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

  const handleDeleteChange = (changeId: string) => {
    if (!analysisReturnedPdf || !analysisReturnedPdf.changeAnalysis || !onUpdate) return;

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

    setAnalysisReturnedPdf({
      ...analysisReturnedPdf,
      changeAnalysis: {
        ...analysisReturnedPdf.changeAnalysis,
        totalChangesDetected: Math.max(0, analysisReturnedPdf.changeAnalysis.totalChangesDetected - 1),
        itemChanges: analysisReturnedPdf.changeAnalysis.itemChanges.filter(c => c.id !== changeId),
      },
    });
  };

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
    handleResubmit,
  };
}
