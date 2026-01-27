'use client'

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Maximize2, HelpCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/flow-ai/ui/card';
import { Input } from '@/components/flow-ai/ui/input';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { cn } from '@/lib/flow-ai/cn';
import { ScrollArea } from '@/components/flow-ai/ui/scroll-area';
import { Label } from '@/components/flow-ai/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/flow-ai/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/flow-ai/ui/tooltip';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/flow-ai/ui/dialog';
import { useContextMenu, createDescribeAction, createEditAction, createUnmapAction, ContextMenuProvider } from '@/components/flow-ai/ui/context-menu';
import dynamic from 'next/dynamic';
import { DataSetTabs } from '@/components/flow-ai/flowrms/DataSetTabs';
import type { DataGridContextMenuConfig } from '@/components/flow-ai/DataGrid';
import { LINE_ITEM_SOURCE_MAP_KEY } from '@/lib/flow-ai/parseExtracted';
import { formatDisplayValue } from '@/lib/flow-ai/format-utils';

// Dynamically import the web component to avoid SSR issues
const ItemsGridWC = dynamic(() => import('@/components/flow-ai/ItemsGridWC'), { 
  ssr: false,
  loading: () => <div className="p-4">Loading grid...</div>
});

const LINE_ITEM_CONTEXT_MENU: DataGridContextMenuConfig = {
  cell: ['describe', 'edit', 'unmap'],
  row: ['describe', 'unmap'],
  column: ['describe', 'unmap'],
};

// Import the selection data type
import type { SelectionData } from '@/components/flow-ai/DataGrid';

type FieldCategory = 'Primary' | 'Other';

export interface ExtractedField {
  id: string;
  key: string;
  value: string | number | null;
  category: FieldCategory;
  sourcePath?: string;
  confidence?: number;
  path?: { page: number; x: number; y: number; w: number; h: number };
  nested?: ExtractedField[];
}

interface FieldsExtractedPaneProps {
  fields: ExtractedField[];
  onFieldClick?: (
    fieldName: string,
    fieldValue: string | number | null,
    action?: 'describe' | 'edit' | 'unmap',
    parentField?: string,
    dataSetIdentifier?: string,
    sourcePath?: string,
    dataSetIndex?: number
  ) => void;
  onManualFieldEdit?: (field: ExtractedField, parentField?: string, dataSetIdentifier?: string) => void;
  onFieldUnmap?: (field: ExtractedField, parentField?: string, dataSetIdentifier?: string) => void;
  onLineItemCellClick?: (
    rowData: Record<string, unknown>,
    columnProp: string,
    columnName: string,
    dataSetIdentifier?: string
  ) => void;
  onLineItemSelectionChange?: (
    selection: SelectionData,
    closeDialog?: () => void,
    dataSetIdentifier?: string,
    dataSetIndex?: number,
    source?: 'pdf' | 'csv'
  ) => void;
  lineItems?: Record<string, unknown>[];
  dataSetIdentifier?: string; // e.g., "Order #12345" or "Quote #67890"
  dataSets?: Array<{ index: number; label: string; value: string }>;
  activeDataSetIndex?: number;
  onDataSetChange?: (index: number) => void;
  disableInteractions?: boolean;
  stagedFieldPaths?: Set<string>;
  /** Entity type (QUOTES, ORDERS, etc.) for showing required field indicators */
  entityType?: string | null;
  /** Required field paths that are missing values */
  missingRequiredFields?: Set<string>;
}

// Field descriptions for tooltips (only shown in primary fields)
const FIELD_DESCRIPTIONS: Record<string, string> = {
  'Order Type': 'The type of order (Purchase Order, Sales Order, etc.)',
  'Order #': 'Unique identifier for this order',
  'Order Date': 'Date when the order was created',
  'Ship Date': 'Planned shipping date',
  'Due Date': 'Expected delivery date',
  'Job Name': 'Name or description of the project',
  'Mark #': 'Internal marking or reference number',
  'Shipping Terms': 'Terms governing shipping costs and responsibilities',
  'Payment Terms': 'Payment conditions (Net 30, COD, etc.)',
  'Ack #': 'Acknowledgement number for order confirmation',
  'Sold To Customer': 'Customer who purchased the items',
  'Bill To Customer': 'Entity receiving the invoice',
  'Factory': 'Manufacturing or distribution facility'
};

// Required fields for quotes and orders
const REQUIRED_FIELD_PATHS = new Set(['sold_to_customer.name']);

// Parent fields that contain required children
const REQUIRED_PARENT_FIELDS = new Set(['Sold To Customer']);

export function FieldsExtractedPane({
  fields,
  onFieldClick,
  onManualFieldEdit,
  onFieldUnmap,
  onLineItemCellClick,
  onLineItemSelectionChange,
  lineItems = [],
  dataSetIdentifier,
  dataSets = [],
  activeDataSetIndex = 0,
  onDataSetChange,
  disableInteractions = false,
  stagedFieldPaths,
  entityType,
  missingRequiredFields,
}: FieldsExtractedPaneProps) {
  // Check if entity type requires field validation
  const normalizedEntityType = entityType?.toUpperCase();
  const showRequiredIndicators = normalizedEntityType === 'QUOTES' || normalizedEntityType === 'ORDERS';

  // Helper to check if a field is required
  const isFieldRequired = (sourcePath?: string) => {
    if (!showRequiredIndicators || !sourcePath) return false;
    return REQUIRED_FIELD_PATHS.has(sourcePath);
  };

  // Helper to check if a parent field contains required children
  const isParentFieldRequired = (fieldKey: string) => {
    if (!showRequiredIndicators) return false;
    return REQUIRED_PARENT_FIELDS.has(fieldKey);
  };

  // Helper to check if a required field is missing
  const isFieldMissing = (sourcePath?: string) => {
    if (!sourcePath || !missingRequiredFields) return false;
    return missingRequiredFields.has(sourcePath);
  };
  const [activeTab, setActiveTab] = useState<'primary' | 'lineitems'>('primary');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isGridFullscreen, setIsGridFullscreen] = useState(false);
  const lineItemRows = useMemo(() => lineItems ?? [], [lineItems]);
  const lineItemColumns = useMemo(() => deriveLineItemColumns(lineItemRows), [lineItemRows]);
  const { showContextMenu } = useContextMenu();
  const isReadOnly = disableInteractions;
  const hasFieldActions = Boolean(onFieldClick || onManualFieldEdit || onFieldUnmap);

  const filteredFields = useMemo(() => {
    if (activeTab === 'lineitems') return [];

    const lineItemFieldKeys = ['Line #', 'Qty', 'Unit Price', 'UOM', 'Description', 'Line Total'];
    const primaryFields = fields.filter(
      (f) => f.category === 'Primary' && !lineItemFieldKeys.includes(f.key)
    );

    if (!searchQuery) return primaryFields;

    return primaryFields.filter(
      (f) =>
        f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(f.value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [fields, activeTab, searchQuery]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderField = (field: ExtractedField, isNested = false, parentFieldName?: string) => {
    const description = FIELD_DESCRIPTIONS[field.key];
    const rawValue = field.value === null ? 'null' : String(field.value ?? '');
    // Format the display value, including date formatting for date fields
    const formattedValue = formatDisplayValue(rawValue, field.key);
    const displayValue = formattedValue.trim().length === 0 ? 'N/A' : formattedValue;
    const isManuallyEdited = Boolean(field.sourcePath && stagedFieldPaths?.has(field.sourcePath));

    // Check if this field is required and/or missing
    const fieldRequired = isFieldRequired(field.sourcePath);
    const fieldMissing = isFieldMissing(field.sourcePath);
    const showRequiredBadge = fieldRequired;
    const showMissingWarning = fieldRequired && (fieldMissing || displayValue === 'N/A' || displayValue === 'NA');

    if (field.nested && field.nested.length > 0) {
      const isExpanded = expandedGroups.has(field.id);
      const parentRequired = isParentFieldRequired(field.key);
      return (
        <Collapsible
          key={field.id}
          open={isExpanded}
          onOpenChange={() => toggleGroup(field.id)}
          className={`${!isNested ? 'mb-3' : 'mb-2'}`}
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <Label className="font-semibold text-sm cursor-pointer">{field.key}</Label>
                {parentRequired && (
                  <span className="text-red-500 text-sm">*</span>
                )}
                <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                  {field.nested.length} fields
                </Badge>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 pl-4">
            {field.nested.map(nf => renderField(nf, true, field.key))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div key={field.id} className={`${isNested ? 'ml-4 mt-1.5' : 'mb-2'} group relative`}>
        <div
          className={cn(
            'flex items-start gap-2 w-full p-2 rounded-lg border border-border/50 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all',
            isManuallyEdited && 'border-amber-300 bg-amber-50/80 shadow-amber-100',
            showMissingWarning && 'border-red-300 bg-red-50/50'
          )}
        >
          <div className="flex-shrink-0 min-w-0 max-w-[40%]">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-semibold cursor-pointer block text-foreground">{field.key}</Label>
                    {showRequiredBadge && (
                      <span className="text-red-500 text-sm">*</span>
                    )}
                    {activeTab === 'primary' && description && (
                      <HelpCircle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                    {showMissingWarning && (
                      <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                </TooltipTrigger>
                {activeTab === 'primary' && description && (
                  <TooltipContent>
                    <p className="text-xs max-w-xs">{description}</p>
                    {showRequiredBadge && (
                      <p className="text-xs text-red-400 mt-1">This field is required for quotes and orders</p>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            {field.confidence && (
              <Badge variant="secondary" className="text-[11px] mt-0.5 px-1.5 py-0">
                {Math.round(field.confidence * 100)}%
              </Badge>
            )}
            {isManuallyEdited && (
              <Badge variant="outline" className="text-[10px] mt-1 px-1 py-0 border-amber-400 text-amber-800 bg-amber-50">
                Unsaved edit
              </Badge>
            )}
            {showMissingWarning && (
              <Badge variant="outline" className="text-[10px] mt-1 px-1 py-0 border-red-400 text-red-700 bg-red-50">
                Required
              </Badge>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div 
              className={cn(
                "text-sm text-foreground font-mono px-2 py-1.5 rounded-md border transition-all w-full",
                isReadOnly || !hasFieldActions ? "cursor-default" : "cursor-pointer hover:bg-primary/5 hover:border-primary/50",
                isManuallyEdited ? "bg-amber-100/80 border-amber-300" : "bg-muted/50 border-border/30"
              )}
              onClick={(e) => {
                if (isReadOnly || !hasFieldActions) {
                  return;
                }

                e.stopPropagation();
                
                const actions = [];

                // Don't show describe action for primary fields (when activeTab is 'primary')
                if (onFieldClick && activeTab !== 'primary') {
                  actions.push(
                    createDescribeAction(() => {
                      onFieldClick(field.key, field.value, 'describe', parentFieldName, dataSetIdentifier, field.sourcePath, activeDataSetIndex);
                    })
                  );
                }

                if (onManualFieldEdit) {
                  actions.push(
                    createEditAction(() => {
                      onManualFieldEdit(field, parentFieldName, dataSetIdentifier);
                    })
                  );
                }

                if (onFieldUnmap) {
                  actions.push(
                    createUnmapAction(() => {
                      onFieldUnmap(field, parentFieldName, dataSetIdentifier);
                    })
                  );
                }

                if (actions.length === 0) {
                  return;
                }

                showContextMenu(e.clientX, e.clientY, actions);
              }}
              title={
                isReadOnly
                  ? "View only"
                  : hasFieldActions
                    ? activeTab === 'primary' 
                      ? "Click to manually edit or unmap this field"
                      : "Click to describe, manually edit, or unmap this field"
                    : "No field actions configured"
              }
            >
              <span className="truncate block text-left">{displayValue}</span>
            </div>
          </div>

          {field.path && (
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-muted-foreground">
                Page {field.path.page}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="flow-card h-full flex flex-col animated-border">
        {/* Data Set Tabs - only show if there are multiple sets */}
        {dataSets && dataSets.length > 1 && onDataSetChange && (
          <DataSetTabs
            tabs={dataSets}
            activeIndex={activeDataSetIndex}
            onTabChange={onDataSetChange}
          />
        )}

        <CardHeader className="flex-none border-b space-y-4 pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Fields Extracted</h3>
            <Badge variant="secondary" className="text-xs">
              {activeTab === 'lineitems' ? `${lineItems.length} items` : `${filteredFields.length} fields`}
            </Badge>
          </div>

          {/* Custom Tab-like Buttons */}
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
            <Button
              variant="ghost"
              onClick={() => setActiveTab('primary')}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1",
                activeTab === 'primary' 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Primary Fields
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('lineitems')}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1",
                activeTab === 'lineitems' 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Line Items
            </Button>
          </div>

          {activeTab !== 'lineitems' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus-ring border-primary/20"
              />
            </div>
          )}

          {activeTab === 'lineitems' && (
            <div className="flex justify-end">
              <Dialog open={isGridFullscreen} onOpenChange={setIsGridFullscreen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Fullscreen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
                  <ContextMenuProvider>
                    <DialogHeader>
                      <DialogTitle>Line Items - Fullscreen View</DialogTitle>
                      <div className="text-sm text-muted-foreground mt-2">
                        {isReadOnly ? 'Read-only view of line items' : 'Click on a cell to edit it in the chat'}
                      </div>
                    </DialogHeader>
                    <div className="flex-1 mt-6 overflow-hidden">
                      <div className="rounded-2xl shadow p-3 bg-white h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div style={{ minWidth: '1200px' }}>
                          {lineItemColumns.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              No line items available
                            </div>
                          ) : (
                            <ItemsGridWC
                              columns={lineItemColumns}
                              rows={lineItemRows}
                              readonly={isReadOnly}
                              contextMenuConfig={LINE_ITEM_CONTEXT_MENU}
                              selectionOrigin="lineItems"
                              onCellClick={
                                isReadOnly
                                  ? undefined
                                  : (row, prop, name) => {
                                      onLineItemCellClick?.(
                                        row as Record<string, unknown>,
                                        prop,
                                        name,
                                        dataSetIdentifier
                                      );
                                    }
                              }
                              onSelectionChange={
                                isReadOnly
                                  ? undefined
                                  : (selection) => {
                                      onLineItemSelectionChange?.(
                                        selection,
                                        () => setIsGridFullscreen(false),
                                        dataSetIdentifier,
                                        activeDataSetIndex,
                                        'pdf'
                                      );
                                    }
                              }
                              height="calc(70vh - 60px)"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </ContextMenuProvider>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
          {activeTab === 'lineitems' ? (
            <div className="p-4 h-full flex flex-col">
              <div className="rounded-2xl shadow bg-white border flex-shrink-0" style={{ height: '400px', maxHeight: '400px', minHeight: '400px' }}>
                {lineItemColumns.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-6">
                    No line items found for this document.
                  </div>
                ) : (
                  <ItemsGridWC
                    columns={lineItemColumns}
                    rows={lineItemRows}
                    readonly={isReadOnly}
                    contextMenuConfig={LINE_ITEM_CONTEXT_MENU}
                    selectionOrigin="lineItems"
                    onCellClick={
                      isReadOnly
                        ? undefined
                        : (row, prop, name) => {
                            onLineItemCellClick?.(
                              row as Record<string, unknown>,
                              prop,
                              name,
                              dataSetIdentifier
                            );
                          }
                    }
                    onSelectionChange={
                      isReadOnly
                        ? undefined
                        : (selection) => {
                            onLineItemSelectionChange?.(
                              selection,
                              undefined,
                              dataSetIdentifier,
                              activeDataSetIndex,
                              'pdf'
                            );
                          }
                    }
                    height={420}
                  />
                )}
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4">
                {filteredFields.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">No fields found</p>
                  </div>
                ) : (
                  filteredFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="fade-in"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      {renderField(field)}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
}

const COLUMN_LABELS: Record<string, string> = {
  flow_index: 'Flow Index',
  line_number: 'Line #',
  line_no: 'Line #',
  item_number: 'Item #',
  item_no: 'Item #',
  quantity: 'Quantity',
  quantity_ordered: 'Qty Ordered',
  qty: 'Quantity',
  unit_price: 'Unit Price',
  unit_cost: 'Unit Cost',
  uom: 'UOM',
  extended_price: 'Extended Price',
  // End user fields
  end_user_name: 'End User Name',
  end_user_address_line_one: 'End User Address 1',
  end_user_address_line_two: 'End User Address 2',
  end_user_address_city: 'End User City',
  end_user_address_state: 'End User State',
  end_user_address_zip_code: 'End User ZIP',
  // Factory fields
  factory_name: 'Factory Name',
  factory_address_line_one: 'Factory Address 1',
  factory_address_line_two: 'Factory Address 2',
  factory_address_city: 'Factory City',
  factory_address_state: 'Factory State',
  factory_address_zip_code: 'Factory ZIP',
  // Customer fields
  customer_name: 'Customer Name',
  customer_address_line_one: 'Customer Address 1',
  customer_address_line_two: 'Customer Address 2',
  customer_address_city: 'Customer City',
  customer_address_state: 'Customer State',
  customer_address_zip_code: 'Customer ZIP',
};

function deriveLineItemColumns(rows: Record<string, unknown>[]) {
  const keys: string[] = [];
  rows.forEach((row) => {
    Object.keys(row ?? {}).forEach((key) => {
      if (isLineItemMetadataKey(key)) {
        return;
      }
      if (!keys.includes(key)) {
        keys.push(key);
      }
    });
  });

  return keys.map((key) => ({
    name: COLUMN_LABELS[key] ?? toTitleCase(key),
    prop: key,
    size: 140,
    columnType: isLikelyNumeric(rows, key) ? 'numeric' : undefined,
    sortable: true,
    filter: true,
  }));
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function isLineItemMetadataKey(key: string) {
  return key === LINE_ITEM_SOURCE_MAP_KEY || key.startsWith('_') || key === 'internal_uuid';
}

// Fields that should not be treated as numeric even if they contain only digits
const NON_NUMERIC_FIELDS = new Set([
  'end_user_address_zip_code',
  'factory_address_zip_code',
  'customer_address_zip_code',
  'zip_code',
  'zip',
  'postal_code',
]);

function isLikelyNumeric(rows: Record<string, unknown>[], key: string) {
  // ZIP codes and postal codes should never be treated as numeric
  if (NON_NUMERIC_FIELDS.has(key) || key.toLowerCase().includes('zip')) {
    return false;
  }

  for (const row of rows) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    if (typeof value === 'number') return true;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) continue;
      if (!Number.isNaN(Number(trimmed.replace(/[^0-9.-]+/g, '')))) {
        return true;
      }
    }
    return false;
  }
  return false;
}










