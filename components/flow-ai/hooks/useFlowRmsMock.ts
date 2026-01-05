'use client'

import { useState, useCallback } from 'react';

export type FieldCategory = "Primary" | "Other";

export interface ExtractedField {
  id: string;
  key: string;
  value: string | number;
  category: FieldCategory;
  confidence?: number;
  path?: { page: number; x: number; y: number; w: number; h: number };
  nested?: ExtractedField[]; // For address groups
}

export interface ChangeItem {
  id: string;
  timestamp: string;
  summary: string;
  type: "edit" | "add" | "remove";
  fieldKey?: string;
  before?: string | number;
  after?: string | number;
}

export interface TemplateItem {
  id: string;
  company: string;
  docType: string;
  fieldsCount: number;
  lastUsed: string;
  color?: string;
}

const MOCK_PRIMARY_FIELDS: ExtractedField[] = [
  { id: '1', key: 'Order Type', value: 'Purchase Order', category: 'Primary', confidence: 0.98 },
  { id: '2', key: 'Order #', value: 'PO-2025-001234', category: 'Primary', confidence: 0.99 },
  { id: '3', key: 'Order Date', value: '2025-01-15', category: 'Primary', confidence: 0.97 },
  { id: '4', key: 'Ship Date', value: '2025-01-20', category: 'Primary', confidence: 0.96 },
  { id: '5', key: 'Due Date', value: '2025-02-01', category: 'Primary', confidence: 0.95 },
  { id: '6', key: 'Job Name', value: 'Building A - Floor 3 Installation', category: 'Primary', confidence: 0.93 },
  { id: '7', key: 'Mark #', value: 'MK-789', category: 'Primary', confidence: 0.91 },
  { id: '8', key: 'Shipping Terms', value: 'FOB Origin', category: 'Primary', confidence: 0.94 },
  { id: '9', key: 'Payment Terms', value: 'Net 30', category: 'Primary', confidence: 0.96 },
  
  // Line items
  { id: '10', key: 'Line #', value: '1', category: 'Primary', confidence: 0.99 },
  { id: '11', key: 'Qty', value: '250', category: 'Primary', confidence: 0.98 },
  { id: '12', key: 'Unit Price', value: '$12.50', category: 'Primary', confidence: 0.97 },
  { id: '13', key: 'UOM', value: 'EA', category: 'Primary', confidence: 0.98 },
  { id: '14', key: 'Description', value: 'Electrical Conduit - 3/4" EMT', category: 'Primary', confidence: 0.96 },
  { id: '15', key: 'Line Total', value: '$3,125.00', category: 'Primary', confidence: 0.99 },
  
  // Nested address fields
  {
    id: '16',
    key: 'End User',
    value: '',
    category: 'Primary',
    nested: [
      { id: '16a', key: 'Name', value: 'ABC Construction LLC', category: 'Primary', confidence: 0.95 },
      { id: '16b', key: 'Address Line 1', value: '456 Industrial Pkwy', category: 'Primary', confidence: 0.94 },
      { id: '16c', key: 'City', value: 'Chicago', category: 'Primary', confidence: 0.97 },
      { id: '16d', key: 'State', value: 'IL', category: 'Primary', confidence: 0.98 },
      { id: '16e', key: 'ZIP', value: '60601', category: 'Primary', confidence: 0.96 },
    ]
  },
  {
    id: '17',
    key: 'Sold To Customer',
    value: '',
    category: 'Primary',
    nested: [
      { id: '17a', key: 'Name', value: 'Premier Electric Supply', category: 'Primary', confidence: 0.96 },
      { id: '17b', key: 'Address Line 1', value: '789 Commerce Dr', category: 'Primary', confidence: 0.93 },
      { id: '17c', key: 'City', value: 'Milwaukee', category: 'Primary', confidence: 0.95 },
      { id: '17d', key: 'State', value: 'WI', category: 'Primary', confidence: 0.97 },
      { id: '17e', key: 'ZIP', value: '53202', category: 'Primary', confidence: 0.94 },
    ]
  },
  {
    id: '18',
    key: 'Bill To Customer',
    value: '',
    category: 'Primary',
    nested: [
      { id: '18a', key: 'Name', value: 'Premier Electric Supply', category: 'Primary', confidence: 0.96 },
      { id: '18b', key: 'Address Line 1', value: '789 Commerce Dr', category: 'Primary', confidence: 0.93 },
      { id: '18c', key: 'City', value: 'Milwaukee', category: 'Primary', confidence: 0.95 },
      { id: '18d', key: 'State', value: 'WI', category: 'Primary', confidence: 0.97 },
      { id: '18e', key: 'ZIP', value: '53202', category: 'Primary', confidence: 0.94 },
    ]
  },
  {
    id: '19',
    key: 'Factory',
    value: '',
    category: 'Primary',
    nested: [
      { id: '19a', key: 'Name', value: 'Anixter Inc.', category: 'Primary', confidence: 0.98 },
      { id: '19b', key: 'Address Line 1', value: '2301 Patriot Blvd', category: 'Primary', confidence: 0.95 },
      { id: '19c', key: 'City', value: 'Glenview', category: 'Primary', confidence: 0.96 },
      { id: '19d', key: 'State', value: 'IL', category: 'Primary', confidence: 0.98 },
      { id: '19e', key: 'ZIP', value: '60026', category: 'Primary', confidence: 0.97 },
    ]
  },
];

const MOCK_OTHER_FIELDS: ExtractedField[] = [
  { id: 'o1', key: 'Sales Rep', value: 'John Martinez', category: 'Other', confidence: 0.89 },
  { id: 'o2', key: 'Sales Rep Email', value: 'jmartinez@anixter.com', category: 'Other', confidence: 0.91 },
  { id: 'o3', key: 'Sales Rep Phone', value: '(847) 555-0123', category: 'Other', confidence: 0.88 },
  { id: 'o4', key: 'PO Notes', value: 'Rush order - expedite shipping', category: 'Other', confidence: 0.82 },
  { id: 'o5', key: 'Freight Terms', value: 'Prepaid & Add', category: 'Other', confidence: 0.85 },
  { id: 'o6', key: 'Carrier', value: 'FedEx Freight', category: 'Other', confidence: 0.87 },
  { id: 'o7', key: 'Tracking #', value: 'TRK-98765432', category: 'Other', confidence: 0.90 },
  { id: 'o8', key: 'Tax Rate', value: '8.75%', category: 'Other', confidence: 0.84 },
  { id: 'o9', key: 'Tax Amount', value: '$273.44', category: 'Other', confidence: 0.86 },
  { id: 'o10', key: 'Shipping Fee', value: '$125.00', category: 'Other', confidence: 0.92 },
  { id: 'o11', key: 'Subtotal', value: '$3,125.00', category: 'Other', confidence: 0.95 },
  { id: 'o12', key: 'Grand Total', value: '$3,523.44', category: 'Other', confidence: 0.97 },
  { id: 'o13', key: 'Currency', value: 'USD', category: 'Other', confidence: 0.99 },
  { id: 'o14', key: 'Requested By', value: 'Sarah Chen', category: 'Other', confidence: 0.83 },
  { id: 'o15', key: 'Approved By', value: 'Mike Johnson', category: 'Other', confidence: 0.81 },
  
  // Additional dummy fields for richer data
  { id: 'o16', key: 'Project Manager', value: 'David Rodriguez', category: 'Other', confidence: 0.79 },
  { id: 'o17', key: 'Project Code', value: 'PRJ-2025-0142', category: 'Other', confidence: 0.93 },
  { id: 'o18', key: 'Department', value: 'Electrical Services', category: 'Other', confidence: 0.87 },
  { id: 'o19', key: 'Cost Center', value: 'CC-4500-ENG', category: 'Other', confidence: 0.91 },
  { id: 'o20', key: 'Account Manager', value: 'Lisa Thompson', category: 'Other', confidence: 0.86 },
  { id: 'o21', key: 'Delivery Date', value: '2025-01-22', category: 'Other', confidence: 0.94 },
  { id: 'o22', key: 'Installation Date', value: '2025-01-25', category: 'Other', confidence: 0.88 },
  { id: 'o23', key: 'Warranty Period', value: '24 months', category: 'Other', confidence: 0.82 },
  { id: 'o24', key: 'Special Instructions', value: 'Call before delivery - restricted access', category: 'Other', confidence: 0.77 },
  { id: 'o25', key: 'Certification Required', value: 'UL Listed', category: 'Other', confidence: 0.89 },
  { id: 'o26', key: 'Delivery Window', value: '8:00 AM - 4:00 PM', category: 'Other', confidence: 0.85 },
  { id: 'o27', key: 'Site Contact', value: 'Robert Kim', category: 'Other', confidence: 0.83 },
  { id: 'o28', key: 'Site Phone', value: '(312) 555-7890', category: 'Other', confidence: 0.86 },
  { id: 'o29', key: 'Purchase Category', value: 'Capital Equipment', category: 'Other', confidence: 0.90 },
  { id: 'o30', key: 'Budget Line', value: 'CAPEX-2025-Q1', category: 'Other', confidence: 0.88 },
  { id: 'o31', key: 'Vendor Classification', value: 'Preferred Supplier', category: 'Other', confidence: 0.92 },
  { id: 'o32', key: 'Payment Method', value: 'ACH Transfer', category: 'Other', confidence: 0.94 },
  { id: 'o33', key: 'Invoice Format', value: 'Electronic PDF', category: 'Other', confidence: 0.87 },
  { id: 'o34', key: 'Remit To Address', value: 'PO Box 12345, Chicago, IL 60690', category: 'Other', confidence: 0.84 },
  { id: 'o35', key: 'Document Version', value: 'v2.1', category: 'Other', confidence: 0.96 },
];

const MOCK_TEMPLATES: TemplateItem[] = [
  {
    id: 't1',
    company: 'Anixter Inc.',
    docType: 'Purchase Order',
    fieldsCount: 28,
    lastUsed: '2025-01-10T14:30:00Z',
    color: '#5048E6'
  },
  {
    id: 't2',
    company: 'Graybar Electric',
    docType: 'Sales Order',
    fieldsCount: 24,
    lastUsed: '2025-01-08T09:15:00Z',
    color: '#0B84C7'
  },
  {
    id: 't3',
    company: 'WESCO Distribution',
    docType: 'Invoice',
    fieldsCount: 32,
    lastUsed: '2025-01-05T16:45:00Z',
    color: '#6BD194'
  },
  {
    id: 't4',
    company: 'Rexel USA',
    docType: 'Purchase Order',
    fieldsCount: 26,
    lastUsed: '2024-12-28T11:20:00Z',
    color: '#F0B972'
  },
];

export function useMockExtractedFields() {
  const [fields, setFields] = useState<ExtractedField[]>([
    ...MOCK_PRIMARY_FIELDS,
    ...MOCK_OTHER_FIELDS
  ]);

  const updateField = useCallback((id: string, newValue: string | number) => {
    setFields(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, value: newValue };
      }
      if (f.nested) {
        return {
          ...f,
          nested: f.nested.map(nf => nf.id === id ? { ...nf, value: newValue } : nf)
        };
      }
      return f;
    }));
  }, []);

  return {
    data: fields,
    updateField,
    isLoading: false
  };
}

export function useMockChanges() {
  const [changes, setChanges] = useState<ChangeItem[]>([
    {
      id: 'c1',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      summary: 'Changed Shipping Fee to Tax Amount',
      type: 'edit',
      fieldKey: 'Shipping Fee',
      before: '$125.00',
      after: 'Tax Amount: $273.44'
    },
    {
      id: 'c2',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      summary: 'Normalized Order Date format',
      type: 'edit',
      fieldKey: 'Order Date',
      before: '01/15/2025',
      after: '2025-01-15'
    }
  ]);

  const addChange = useCallback((change: Omit<ChangeItem, 'id' | 'timestamp'>) => {
    const newChange: ChangeItem = {
      ...change,
      id: `c${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setChanges(prev => [newChange, ...prev]);
  }, []);

  return {
    data: changes,
    addChange,
    isLoading: false
  };
}

export function useMockTemplates() {
  const [templates, setTemplates] = useState<TemplateItem[]>(MOCK_TEMPLATES);

  const addTemplate = useCallback((template: Omit<TemplateItem, 'id' | 'lastUsed'>) => {
    const newTemplate: TemplateItem = {
      ...template,
      id: `t${Date.now()}`,
      lastUsed: new Date().toISOString()
    };
    setTemplates(prev => [newTemplate, ...prev]);
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    data: templates,
    addTemplate,
    deleteTemplate,
    isLoading: false
  };
}






