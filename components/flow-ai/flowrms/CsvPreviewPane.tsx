'use client'

import { useState, useMemo } from 'react';
import { Maximize2, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/flow-ai/ui/card';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/flow-ai/ui/dialog';
import { ContextMenuProvider } from '@/components/flow-ai/ui/context-menu';
import dynamic from 'next/dynamic';
import type { SelectionData } from '@/components/flow-ai/DataGrid';

// Dynamically import the web component to avoid SSR issues
const CsvGridWC = dynamic(() => import('@/components/flow-ai/CsvGridWC'), { 
  ssr: false,
  loading: () => <div className="p-4">Loading grid...</div>
});

interface CsvPreviewPaneProps {
  csvData?: unknown[][] | null;
  fileName?: string;
  onSelectionChange?: (selection: SelectionData, closeDialog?: () => void) => void;
}

// Convert raw CSV data to structured format
function transformCsvData(csvData: unknown[][]): Record<string, unknown>[] {
  if (!csvData || csvData.length === 0) return [];
  
  // First row is headers
  const headers = csvData[0] as string[];
  const rows = csvData.slice(1);
  
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      const value = row[index];
      // Try to parse numbers
      if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
        obj[header] = Number(value);
      } else {
        obj[header] = value;
      }
    });
    return obj;
  });
}

// Generate columns from CSV data
function generateColumns(csvData: unknown[][]): Array<{ name: string; prop: string; size: number; columnType?: string; sortable: boolean; filter: boolean }> {
  if (!csvData || csvData.length === 0) return [];
  
  const headers = csvData[0] as string[];
  
  return headers.map((header) => {
    // Check if column contains mostly numbers
    const values = csvData.slice(1).map(row => row[headers.indexOf(header)]);
    const numericCount = values.filter(val => 
      typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== ''
    ).length;
    const isNumeric = numericCount > values.length * 0.7; // If 70% are numeric
    
    return {
      name: header,
      prop: header,
      size: Math.max(120, Math.min(200, header.length * 10 + 80)),
      columnType: isNumeric ? 'numeric' : undefined,
      sortable: true,
      filter: true
    };
  });
}

export function CsvPreviewPane({ csvData, fileName, onSelectionChange }: CsvPreviewPaneProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const transformedData = useMemo(() => transformCsvData(csvData || []), [csvData]);
  const columns = useMemo(() => generateColumns(csvData || []), [csvData]);

  const handleSelectionChange = (selection: SelectionData, closeDialog?: () => void) => {
    onSelectionChange?.(selection, closeDialog);
  };

  if (!csvData || csvData.length === 0) {
    return (
      <Card className="flow-card h-full flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="p-6 bg-muted rounded-2xl inline-flex">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No CSV Data</h3>
            <p className="text-sm text-muted-foreground">CSV data is loading or not available</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flow-card h-full flex flex-col animated-border">
      <CardHeader className="flex-none border-b space-y-4 pb-4 bg-gradient-to-r from-blue/5 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">CSV Preview</h3>
            <Badge variant="outline" className="text-xs border-blue/30 bg-blue/10">
              {transformedData.length} rows, {columns.length} columns
            </Badge>
          </div>
          <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Maximize2 className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col">
              <ContextMenuProvider>
                <DialogHeader>
                  <DialogTitle>CSV Preview - Fullscreen View</DialogTitle>
                  <div className="text-sm text-muted-foreground mt-2">
                    Click on cells, rows, or columns to generate prompts for changes
                  </div>
                </DialogHeader>
                <div className="flex-1 mt-6 overflow-hidden">
                  <div className="rounded-2xl shadow bg-white h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <CsvGridWC
                      columns={columns}
                      rows={transformedData}
                      showChangeIndicators={false}
                      enableInteractions={true}
                      showRowNumbers={true}
                      onSelectionChange={(selection: SelectionData) => handleSelectionChange(selection, () => setIsFullscreen(false))}
                      height="100%"
                    />
                  </div>
                </div>
              </ContextMenuProvider>
            </DialogContent>
          </Dialog>
        </div>
        <div className="text-sm text-muted-foreground">
          {fileName && `File: ${fileName} • `}
          Click cells, rows, or columns to make changes
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-hidden min-h-0">
        <div className="rounded-2xl shadow bg-white border" style={{ height: '500px', maxHeight: '500px', minHeight: '500px' }}>
          <CsvGridWC
            columns={columns}
            rows={transformedData}
            showChangeIndicators={false}
            enableInteractions={true}
            showRowNumbers={true}
            onSelectionChange={handleSelectionChange}
            height={500}
          />
        </div>
      </CardContent>
    </Card>
  );
}








