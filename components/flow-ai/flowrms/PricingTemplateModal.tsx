'use client';

import { useState, useEffect } from 'react';
import { Loader2, DollarSign, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/flow-ai/ui/dialog';
import { workflowAPI, type Workflow } from '@/lib/flow-ai/workflow-api';
import { toast } from 'sonner';

interface PricingTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (templateId: string) => void;
}

export function PricingTemplateModal({ open, onOpenChange, onConfirm }: PricingTemplateModalProps) {
  const [templates, setTemplates] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const result = await workflowAPI.getPricingTemplates();
      setTemplates(result);
      if (result.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(result[0].id);
      }
    } catch (error) {
      console.error('Failed to load pricing templates:', error);
      toast.error('Failed to load pricing templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedTemplateId) {
      toast.error('Please select a pricing template');
      return;
    }
    onConfirm(selectedTemplateId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Select Pricing Template
          </DialogTitle>
          <DialogDescription>
            Choose a pricing template to process your uploaded files. The template&apos;s saved code will be used to transform your data.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pricing templates found.</p>
              <p className="text-sm mt-1">Create a workflow and save it as a pricing template first.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTemplateId === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2 flex-shrink-0">
                      <Calendar className="w-3 h-3" />
                      {formatDate(template.created_at)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTemplateId || templates.length === 0}
          >
            Process with Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
