import type { EntityMatch, EntityType, EntityStep } from '@/components/flow-ai/types/entity-matching';

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200';
  if (confidence >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

export const getCreateNewDefaults = (entity: EntityMatch, type: string): Record<string, string> => {
  if (type === 'product') {
    return {
      'Part Number': entity.spreadsheetData.rawValue || entity.spreadsheetName,
      'Product Name': entity.spreadsheetName,
      'Factory': 'Auto-detected',
      'Category': 'Placeholder',
      'Unit of Measure': 'ea (Each)',
      'Description': 'Auto-generated from spreadsheet'
    } as Record<string, string>;
  } else {
    return {
      'Name': entity.spreadsheetName,
      'Address': entity.spreadsheetData.address || 'Not provided',
      'Status': 'Active',
      'Created From': 'Commission Statement Upload'
    } as Record<string, string>;
  }
};

export const getTableColumns = (type: string): string[] => {
  if (type === 'product') {
    return ['Part Number', 'Product Name', 'Factory', 'Category', 'Unit of Measure', 'Description'];
  } else {
    return ['Name', 'Address', 'Status', 'Created From'];
  }
};

export const getFieldOptions = (field: string): string[] | null => {
  switch (field) {
    case 'Category':
      return ['Placeholder', 'Valves', 'Fittings', 'Actuators', 'Controls', 'Pumps', 'Sensors', 'Gauges', 'Motors'];
    case 'Unit of Measure':
      return ['ea (Each)', 'box (Box)', 'ft (Feet)', 'lb (Pound)', 'gal (Gallon)', 'case (Case)', 'pair (Pair)', 'set (Set)'];
    case 'Status':
      return ['Active', 'Inactive', 'Pending'];
    case 'Factory':
      return ['Auto-detected', 'Emerson', 'Fisher', 'Flowserve', 'Crane', 'Cameron', 'GE', 'Siemens', 'ABB'];
    case 'Created From':
      return ['Commission Statement Upload', 'Manual Entry', 'API Import', 'Bulk Upload'];
    default:
      return null;
  }
};

export const isDropdownField = (field: string): boolean => {
  return ['Category', 'Unit of Measure', 'Status', 'Factory', 'Created From'].includes(field);
};

export const entityStepToType = (step: EntityStep): EntityType => {
  switch (step) {
    case 'factories': return 'factory';
    case 'customers': return 'customer';
    case 'endusers': return 'enduser';
    case 'products': return 'product';
    default: return 'factory';
  }
};

export const generateSpreadsheetSamples = (entity: EntityMatch, type: string) => {
  const columns = type === 'product'
    ? ['Line', 'Date', 'Invoice #', 'Customer', 'Product', 'Part Number', 'Qty', 'Unit Price', 'Total']
    : ['Line', 'Date', 'Invoice #', 'Company Name', 'Address', 'City', 'State', 'ZIP', 'Amount'];

  const rows = entity.spreadsheetData.lines.slice(0, 5).map(lineNum => {
    if (type === 'product') {
      return [
        lineNum,
        `2024-0${Math.floor(Math.random() * 9) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        `INV-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        `Customer ${Math.floor(Math.random() * 50) + 1}`,
        entity.spreadsheetName,
        entity.spreadsheetData.rawValue || entity.spreadsheetName,
        Math.floor(Math.random() * 50) + 1,
        `$${(Math.random() * 500 + 50).toFixed(2)}`,
        `$${(Math.random() * 5000 + 500).toFixed(2)}`
      ];
    } else {
      return [
        lineNum,
        `2024-0${Math.floor(Math.random() * 9) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        `INV-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        entity.spreadsheetData.rawValue || entity.spreadsheetName,
        entity.spreadsheetData.address?.split(',')[0] || `${Math.floor(Math.random() * 9999)} Main St`,
        entity.spreadsheetData.address?.split(',')[1]?.trim() || 'Houston',
        'TX',
        entity.spreadsheetData.address?.match(/\d{5}/)?.[0] || '77001',
        `$${(Math.random() * 10000 + 1000).toFixed(2)}`
      ];
    }
  });

  return { columns, rows };
};





