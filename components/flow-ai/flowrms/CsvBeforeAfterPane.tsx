'use client'

import { useState, useMemo, useCallback, memo } from 'react';
import { Maximize2, FileSpreadsheet, EyeOff, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/flow-ai/ui/card';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Checkbox } from '@/components/flow-ai/ui/checkbox';
import { Label } from '@/components/flow-ai/ui/label';
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
import { compareCsvData, transformCsvToObjects, getChangeStats } from '@/lib/flow-ai/csv-comparison';
import { cn } from '@/lib/flow-ai/cn';

// Dynamically import the web component to avoid SSR issues
const CsvGridWC = dynamic(() => import('@/components/flow-ai/CsvGridWC').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => <div className="p-4">Loading grid...</div>
});

export interface CsvBeforeAfterPaneProps {
  originalCsvData?: unknown[][] | null;
  processedCsvData?: unknown[][] | null;
  fileName?: string;
  onSelectionChange?: (selection: SelectionData, closeDialog?: () => void) => void;
  disableInteractions?: boolean;
  layout?: 'side-by-side' | 'stacked';
}

// Generate columns from CSV data - memoized function
const generateColumns = (csvData: unknown[][]): Array<{ name: string; prop: string; size: number; columnType?: string; sortable: boolean; filter: boolean }> => {
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
};

const CsvBeforeAfterPaneComponent = ({
  originalCsvData,
  processedCsvData,
  fileName,
  onSelectionChange,
  disableInteractions = false,
  layout = 'side-by-side',
}: CsvBeforeAfterPaneProps) => {
  const [isBeforeFullscreen, setIsBeforeFullscreen] = useState(false);
  const [isAfterFullscreen, setIsAfterFullscreen] = useState(false);

  // State for hiding empty rows
  const [hideEmptyRows, setHideEmptyRows] = useState(false);
  const interactionsDisabled = disableInteractions;
  const isStackedLayout = layout === 'stacked';

  // Transform before data (no change indicators needed) - memoized
  const beforeData = useMemo(() => transformCsvToObjects(originalCsvData || null), [originalCsvData]);
  
  // Generate columns from BEFORE CSV headers for before pane - memoized
  const beforeColumns = useMemo(() => generateColumns(originalCsvData || []), [originalCsvData]);
  
  // Generate columns from AFTER CSV headers for after pane - memoized
  const afterColumns = useMemo(() => generateColumns(processedCsvData || []), [processedCsvData]);

  // Compare and compute changes for after data - memoized
  const afterDataRaw = useMemo(() => {
    return compareCsvData(originalCsvData || null, processedCsvData || null);
  }, [originalCsvData, processedCsvData]);

  // Filter empty rows if toggle is enabled - memoized
  const afterData = useMemo(() => {
    if (!hideEmptyRows) return afterDataRaw;
    
    // Filter out rows where all data fields (excluding metadata fields) are empty
    // This includes both "added" rows that are empty and any other empty rows
    return afterDataRaw.filter(row => {
      // Get all keys except the metadata fields that start with underscore
      const dataKeys = Object.keys(row).filter(key => !key.startsWith('_'));
      
      // If there are no data keys, it's an empty row
      if (dataKeys.length === 0) {
        return false;
      }
      
      // Check if at least one data field has a non-empty value
      const hasData = dataKeys.some(key => {
        const value = row[key];
        
        // Check for various types of empty values
        if (value === null || value === undefined) {
          return false;
        }
        
        // Convert to string and trim
        const stringValue = String(value).trim();
        
        // Check if it's an empty string or common empty indicators
        if (stringValue === '' || 
            stringValue === 'null' || 
            stringValue === 'undefined' ||
            stringValue === 'NaN') {
          return false;
        }
        
        return true;
      });
      
      // Keep the row only if it has data
      // This will filter out empty rows regardless of their _changeType (added, edited, deleted, unchanged)
      return hasData;
    });
  }, [afterDataRaw, hideEmptyRows]);

  // Get change statistics - memoized
  const changeStats = useMemo(() => getChangeStats(afterDataRaw), [afterDataRaw]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleBeforeSelectionChange = useCallback(
    (selection: SelectionData, closeDialog?: () => void) => {
      if (interactionsDisabled) {
        closeDialog?.();
        return;
      }
      onSelectionChange?.(selection, closeDialog);
    },
    [interactionsDisabled, onSelectionChange]
  );

  const handleAfterSelectionChange = useCallback((selection: SelectionData, closeDialog?: () => void) => {
    // After preview is read-only - no prompt generation
    // Just close dialog if provided
    if (closeDialog) {
      closeDialog();
    }
  }, []);

  if (!originalCsvData || originalCsvData.length === 0) {
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
    <div
      className={cn(
        "h-full grid gap-4",
        isStackedLayout ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
      )}
    >
      {/* Before Preview */}
      <Card className="flow-card h-full flex flex-col animated-border">
        <CardHeader className="flex-none border-b space-y-4 pb-4 bg-gradient-to-r from-orange/5 to-yellow/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Before (Original CSV)</h3>
              <Badge variant="outline" className="text-xs border-orange/30 bg-orange/10">
                {beforeData.length} rows
              </Badge>
              <Badge variant="outline" className="text-xs border-orange/30 bg-orange/10">
                {beforeColumns.length} columns
              </Badge>
            </div>
            <Dialog open={isBeforeFullscreen} onOpenChange={setIsBeforeFullscreen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Fullscreen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
                <ContextMenuProvider>
                  <DialogHeader>
                    <DialogTitle>Before (Original CSV) - Fullscreen View</DialogTitle>
                    <div className="text-sm text-muted-foreground mt-2">
                      {interactionsDisabled
                        ? 'Read-only preview of the original CSV'
                        : 'Click on cells, rows, or columns to generate prompts for changes'}
                    </div>
                  </DialogHeader>
                  <div className="flex-1 mt-6 overflow-hidden">
                    <div className="rounded-2xl shadow p-3 bg-white h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      <div style={{ minWidth: '1200px' }}>
                        <CsvGridWC
                          columns={beforeColumns}
                          rows={beforeData}
                          showChangeIndicators={false}
                          enableInteractions={!interactionsDisabled}
                          showRowNumbers={true}
                          onSelectionChange={
                            interactionsDisabled
                              ? undefined
                              : (selection: SelectionData) =>
                                  handleBeforeSelectionChange(selection, () => setIsBeforeFullscreen(false))
                          }
                          height={"calc(70vh - 60px)"}
                        />
                      </div>
                    </div>
                  </div>
                </ContextMenuProvider>
              </DialogContent>
            </Dialog>
          </div>
          <div className="text-sm text-muted-foreground">
            {fileName && `File: ${fileName} • `}
            {interactionsDisabled
              ? 'Original CSV data (view only)'
              : 'Original CSV data - Click cells, rows, or columns to make changes'}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 min-h-0">
          <div className="rounded-2xl shadow p-3 bg-white border flex flex-col" style={{ height: '490px' }}>
            <CsvGridWC
              columns={beforeColumns}
              rows={beforeData}
              showChangeIndicators={false}
              enableInteractions={!interactionsDisabled}
              showRowNumbers={true}
              onSelectionChange={interactionsDisabled ? undefined : handleBeforeSelectionChange}
              height={470}
            />
          </div>
        </CardContent>
      </Card>

      {/* After Preview */}
      <Card className="flow-card h-full flex flex-col animated-border">
        <CardHeader className="flex-none border-b space-y-4 pb-4 bg-gradient-to-r from-green/5 to-emerald/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">After (Processed CSV)</h3>
                <Badge variant="outline" className="text-xs border-green/30 bg-green/10">
                  {afterData.length} rows
                </Badge>
                <Badge variant="outline" className="text-xs border-green/30 bg-green/10">
                  {afterColumns.length} columns
                </Badge>
                {changeStats.edited > 0 && (
                  <Badge variant="outline" className="text-xs border-yellow-400 bg-yellow-50 text-yellow-800">
                    {changeStats.edited} edited
                  </Badge>
                )}
                {changeStats.added > 0 && (
                  <Badge variant="outline" className="text-xs border-green-400 bg-green-50 text-green-800">
                    +{changeStats.added} new
                  </Badge>
                )}
                {changeStats.deleted > 0 && (
                  <Badge variant="outline" className="text-xs border-red-400 bg-red-50 text-red-800">
                    -{changeStats.deleted} deleted
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Checkbox 
                  id="hide-empty" 
                  checked={hideEmptyRows} 
                  onCheckedChange={(checked) => setHideEmptyRows(checked === true)}
                />
                <Label htmlFor="hide-empty" className="text-xs flex items-center gap-1 cursor-pointer">
                  {hideEmptyRows ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  Hide empty rows
                </Label>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Dialog open={isAfterFullscreen} onOpenChange={setIsAfterFullscreen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Fullscreen
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
                <ContextMenuProvider>
                  <DialogHeader>
                    <DialogTitle>After (Processed CSV) - Fullscreen View</DialogTitle>
                    <div className="flex items-center justify-between gap-4 mt-2">
                      <div className="text-sm text-muted-foreground">
                        Read-only view of processed data
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 pl-2 border-l border-gray-300">
                          <Checkbox 
                            id="hide-empty-fullscreen" 
                            checked={hideEmptyRows} 
                            onCheckedChange={(checked) => setHideEmptyRows(checked === true)}
                          />
                          <Label htmlFor="hide-empty-fullscreen" className="text-xs flex items-center gap-1 cursor-pointer">
                            {hideEmptyRows ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            Hide empty rows
                          </Label>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400"></div>
                            <span className="text-muted-foreground">Edited</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-green-100 border border-green-400"></div>
                            <span className="text-muted-foreground">New</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-red-100 border border-red-400"></div>
                            <span className="text-muted-foreground">Deleted</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="flex-1 mt-6 overflow-hidden">
                    <div className="rounded-2xl shadow p-3 bg-white h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      <div style={{ minWidth: '1200px' }}>
                        <CsvGridWC
                          columns={afterColumns}
                          rows={afterData}
                          showChangeIndicators={true}
                          enableInteractions={false}
                          showRowNumbers={true}
                          onSelectionChange={(selection: SelectionData) => handleAfterSelectionChange(selection, () => setIsAfterFullscreen(false))}
                          height={"calc(70vh - 60px)"}
                        />
                      </div>
                    </div>
                  </div>
                </ContextMenuProvider>
              </DialogContent>
            </Dialog>
          </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Processed CSV data - Read-only view of changes
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400"></div>
                <span className="text-muted-foreground">Edited</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-400"></div>
                <span className="text-muted-foreground">New</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-400"></div>
                <span className="text-muted-foreground">Deleted</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 min-h-0">
          <div className="rounded-2xl shadow p-3 bg-white border flex flex-col" style={{ height: '490px' }}>
            <CsvGridWC
              columns={afterColumns}
              rows={afterData}
              showChangeIndicators={true}
              enableInteractions={false}
              showRowNumbers={true}
              onSelectionChange={handleAfterSelectionChange}
              height={470}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Export memoized version for better performance with large datasets
export const CsvBeforeAfterPane = memo(CsvBeforeAfterPaneComponent);









