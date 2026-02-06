'use client';

import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SampleFileUploadProps {
  columns: string[];
  maxDisplayColumns?: number;
  onUploadClick?: () => void;
}

export function SampleFileUpload({ 
  columns, 
  maxDisplayColumns = 15,
  onUploadClick 
}: SampleFileUploadProps) {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">Load columns from a sample file</p>
          <p className="text-xs text-muted-foreground">
            Upload a sample CSV/Excel to populate the column dropdown, or type field names manually
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onUploadClick}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Sample
        </Button>
      </div>
      {columns.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Detected columns:</p>
          <div className="flex flex-wrap gap-1">
            {columns.slice(0, maxDisplayColumns).map((col) => (
              <span key={col} className="text-xs bg-background px-2 py-0.5 rounded border">
                {col}
              </span>
            ))}
            {columns.length > maxDisplayColumns && (
              <span className="text-xs text-muted-foreground">
                +{columns.length - maxDisplayColumns} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
