'use client'

import { useCallback, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card } from '@/components/flow-ai/ui/card';

interface PdfUploadGateProps {
  onUploaded: (file: File, fileType: 'pdf' | 'csv') => void;
}

export function PdfUploadGate({ onUploaded }: PdfUploadGateProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        onUploaded(file, 'pdf');
      } else if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        onUploaded(file, 'csv');
      }
    }
  }, [onUploaded]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        onUploaded(file, 'pdf');
      } else if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        onUploaded(file, 'csv');
      }
    }
  }, [onUploaded]);

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <Card
        className={`flow-card max-w-xl w-full p-12 border-2 border-dashed transition-all duration-200 ${
          isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className={`p-6 rounded-2xl transition-colors ${
            isDragging ? 'bg-primary/10' : 'bg-muted'
          }`}>
            <FileText className={`w-16 h-16 transition-colors ${
              isDragging ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Upload Document</h2>
            <p className="text-muted-foreground">
              Drag and drop your PDF or CSV file here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground/70">
              Supported formats: PDF, CSV
            </p>
          </div>

          <input
            type="file"
            accept=".pdf,.csv,application/pdf,text/csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          
          <label htmlFor="file-upload">
            <Button size="lg" className="gap-2 cursor-pointer" asChild>
              <span>
                <Upload className="w-5 h-5" />
                Choose File
              </span>
            </Button>
          </label>
        </div>
      </Card>
    </div>
  );
}









