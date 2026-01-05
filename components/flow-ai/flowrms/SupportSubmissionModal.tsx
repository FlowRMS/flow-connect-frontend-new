'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/flow-ai/ui/dialog';
import { Button } from '@/components/flow-ai/ui/button';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Label } from '@/components/flow-ai/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SupportSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userName: string;
  pendingId?: string;
  documentName?: string;
  isCsv?: boolean;
  pdfUrl?: string;
  originalCsvData?: unknown[][] | null;
  processedCsvData?: unknown[][] | null;
}

export function SupportSubmissionModal({
  open,
  onOpenChange,
  userEmail,
  userName,
  pendingId,
  documentName,
  isCsv = false,
  pdfUrl,
  originalCsvData,
  processedCsvData,
}: SupportSubmissionModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please describe the challenges you are having');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          userName,
          pendingId,
          documentName,
          message: message.trim(),
          isCsv,
          pdfUrl,
          originalCsvData,
          processedCsvData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit support request');
      }

      toast.success('Support request submitted successfully! The team will review and get back to you.');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit support request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit support request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Submit to Flow Support
          </DialogTitle>
          <DialogDescription>
            This will be submitted to the support team to correctly extract the information and build
            this template for you. Please describe below the challenges you are having.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Information</Label>
            <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
              <div>
                <span className="font-medium">Name:</span> {userName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {userEmail}
              </div>
              {pendingId && (
                <div>
                  <span className="font-medium">Pending ID:</span> {pendingId}
                </div>
              )}
              {documentName && (
                <div>
                  <span className="font-medium">Document:</span> {documentName}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Describe your challenges *
            </Label>
            <Textarea
              id="message"
              placeholder="Please describe the issues you're experiencing with data extraction..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit to Support'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}









