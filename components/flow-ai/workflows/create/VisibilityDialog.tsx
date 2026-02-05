'use client';

import { Button } from '@/components/flow-ai/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/flow-ai/ui/dialog';

interface VisibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onSave: (isPublic: boolean) => void;
}

export function VisibilityDialog({ open, onOpenChange, saving, onSave }: VisibilityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make this workflow public?</DialogTitle>
          <DialogDescription>
            Choose whether this workflow should appear in the public gallery for this
            tenant, or remain private under &quot;My Workflows&quot;.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onSave(false)}
          >
            Save as Private
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => onSave(true)}
          >
            Save as Public
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
