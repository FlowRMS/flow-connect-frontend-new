import { Upload, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  csvColumns: string;
  onUpload?: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  title,
  description,
  csvColumns,
  onUpload,
}: UploadModalProps) {
  if (!isOpen) return null;

  const handleUpload = () => {
    onUpload?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Click to upload or drag and drop</p>
            <p className="text-sm text-muted-foreground">{csvColumns}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>Upload</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
