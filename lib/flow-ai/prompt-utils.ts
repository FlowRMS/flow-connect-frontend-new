import type { SelectionData } from '@/components/flow-ai/DataGrid';

// Helper function to intelligently select the best primary key column from row data
function getReferenceColumn(
  rowData: Record<string, unknown>, 
  allRows?: Record<string, unknown>[],
  columnsOrder?: Array<{ key: string; name: string }>
): { key: string; name: string } {
  const keys = Object.keys(rowData).filter(key => 
    // Exclude internal metadata fields that start with underscore
    !key.startsWith('_')
  );
  
  if (keys.length === 0) return { key: 'id', name: 'ID' };
  
  // PRIORITY 1: If this is PDF line items (columnsOrder provided) AND flow_index exists, ALWAYS use it
  if (columnsOrder && keys.includes('flow_index') && rowData.flow_index !== undefined && rowData.flow_index !== null) {
    return { key: 'flow_index', name: 'flow_index' };
  }
  
  // PRIORITY 2: Check if flow_index exists - this is the system-generated primary key
  if (keys.includes('flow_index') && rowData.flow_index !== undefined && rowData.flow_index !== null) {
    return { key: 'flow_index', name: 'flow_index' };
  }
  
  // PRIORITY 3: If we have column order information (from PDF line items), use the FIRST column
  // This is the most reliable way to get the correct reference column
  if (columnsOrder && columnsOrder.length > 0) {
    const firstColumn = columnsOrder[0];
    // Verify the column exists in the row data
    if (keys.includes(firstColumn.key)) {
      return { key: firstColumn.key, name: firstColumn.name };
    }
  }
  
  // PRIORITY 4: If we have all rows data, try to find the best primary key
  if (allRows && allRows.length > 1) {
    const primaryKeyCandidate = findBestPrimaryKey(keys, allRows);
    if (primaryKeyCandidate) {
      return { key: primaryKeyCandidate, name: primaryKeyCandidate };
    }
  }
  
  // Fallback: Use the first column from column order, or first key from object
  if (columnsOrder && columnsOrder.length > 0) {
    const firstColumn = columnsOrder[0];
    return { key: firstColumn.key, name: firstColumn.name };
  }
  
  const firstKey = keys[0];
  
  // Use the column name as-is for display (preserving original case and formatting)
  return { key: firstKey, name: firstKey };
}

// Helper function to find the best primary key column
function findBestPrimaryKey(keys: string[], allRows: Record<string, unknown>[]): string | null {
  // Priority order for likely primary key field names (case-insensitive)
  const primaryKeyPatterns = [
    /^(po_?number|po_?no|purchase_?order_?number?)$/i,
    /^(order_?number|order_?no|order_?id)$/i,
    /^(invoice_?number|invoice_?no|invoice_?id)$/i,
    /^(document_?number|document_?no|doc_?number|doc_?no)$/i,
    /^(item_?number|item_?no|item_?id|part_?number|part_?no|sku)$/i,
    /^(id|identifier|ref|reference)$/i,
    /^(line_?number|line_?no|line_?item)$/i,
    /^(entry_?number|entry_?no|entry_?id)$/i
  ];
  
  // Fields that should NOT be used as primary keys (even if unique)
  const excludePatterns = [
    /^flow_index$/i, // Exclude flow_index since it's handled separately as priority 1
    /^(name|rep_?name|sales_?rep|contact|person|user)$/i,
    /^(description|desc|notes|comments|remarks)$/i,
    /^(address|location|city|state|zip|postal)$/i,
    /^(email|phone|tel|telephone|mobile)$/i,
    /^(date|time|timestamp|created|updated|modified)$/i,
    /^(price|cost|amount|total|subtotal|tax|fee)$/i,
    /^(quantity|qty|units|count|weight|volume)$/i,
    /^(status|state|condition|type|category)$/i
  ];
  
  // Filter out keys that match exclude patterns
  const validKeys = keys.filter(key => 
    !excludePatterns.some(pattern => pattern.test(key))
  );
  
  // First, look for keys that match primary key patterns AND have all unique values
  for (const pattern of primaryKeyPatterns) {
    const matchingKeys = validKeys.filter(key => pattern.test(key));
    for (const key of matchingKeys) {
      if (hasAllUniqueValues(key, allRows)) {
        return key;
      }
    }
  }
  
  // If no pattern matches, find any valid key with all unique values
  for (const key of validKeys) {
    if (hasAllUniqueValues(key, allRows)) {
      return key;
    }
  }
  
  // If no unique keys found, return null to fallback to first column
  return null;
}

// Helper function to check if a column has all unique values
function hasAllUniqueValues(key: string, allRows: Record<string, unknown>[]): boolean {
  const values = allRows.map(row => String(row[key] ?? '').trim().toLowerCase());
  const nonEmptyValues = values.filter(val => val !== '');
  const uniqueValues = new Set(nonEmptyValues);
  
  // Must have at least 2 unique values and all values must be unique
  return uniqueValues.size >= 2 && uniqueValues.size === nonEmptyValues.length;
}

// Helper function to get reference value from row data
function getReferenceValue(
  rowData: Record<string, unknown>, 
  allRows?: Record<string, unknown>[],
  columnsOrder?: Array<{ key: string; name: string }>
): string {
  const { key } = getReferenceColumn(rowData, allRows, columnsOrder);
  return String(rowData[key] ?? 'unknown');
}

export function generateLineItemPrompt(selection: SelectionData, dataSetIdentifier?: string): string {
  const { type, action, data } = selection;

  // Prefix with data set identifier if provided
  const prefix = dataSetIdentifier ? `[${dataSetIdentifier}] ` : '';

  // Handle delete actions
  if (action === 'delete') {
    return prefix + generateDeletePrompt(type, data);
  }

  // Handle edit actions (original behavior)
  return prefix + generateEditPrompt(type, data);
}

export function generateFieldPrompt(
  fieldName: string,
  fieldValue: string | number | null,
  action: 'describe' | 'unmap',
  parentField?: string,
  dataSetIdentifier?: string
): string {
  const fullFieldName = parentField ? `${parentField} -> ${fieldName}` : fieldName;
  const formattedValue = fieldValue === null ? 'null' : String(fieldValue);
  
  // Prefix with data set identifier if provided
  const prefix = dataSetIdentifier ? `[${dataSetIdentifier}] ` : '';
  
  if (action === 'unmap') {
    return `${prefix}Remove the mapping for field "${fullFieldName}" (currently: "${formattedValue}"). This field should no longer be extracted from the document.`;
  }

  // Describe/auto-edit action
  return `${prefix}Change field "${fullFieldName}" from "${formattedValue}" to `;
}

function generateDeletePrompt(type: string, data: SelectionData['data']): string {
  // Extract column order if available (for PDF line items)
  const columnsOrder = data._columns;
  
  switch (type) {
    case 'cell': {
      if (data.rowData && data.columnKey && data.columnName) {
        // Use all rows data if available for intelligent primary key detection
        const allRowsData = data.rows ? data.rows.map(row => row.data) : undefined;
        const referenceValue = getReferenceValue(data.rowData, allRowsData, columnsOrder);
        const { name: referenceName } = getReferenceColumn(data.rowData, allRowsData, columnsOrder);
        return `Delete the "${data.columnName}" value for line item with ${referenceName} "${referenceValue}"`;
      }
      break;
    }

    case 'row': {
      if (data.rows && data.rows.length > 0) {
        // Extract all row data for primary key analysis
        const allRowsData = data.rows.map(row => row.data);
        
        if (data.rows.length === 1) {
          const referenceValue = getReferenceValue(data.rows[0].data, allRowsData, columnsOrder);
          const { name: referenceName } = getReferenceColumn(data.rows[0].data, allRowsData, columnsOrder);
          return `Delete the entire line item row with ${referenceName} "${referenceValue}"`;
        } else {
          const firstRow = data.rows[0];
          const { name: referenceName } = getReferenceColumn(firstRow.data, allRowsData, columnsOrder);
          const referenceValues = data.rows
            .map((row: { index: number; data: Record<string, unknown> }) => getReferenceValue(row.data, allRowsData, columnsOrder))
            .filter((value: string, index: number, array: string[]) => array.indexOf(value) === index);

          // If all rows were selected, use concise wording
          if (data.allSelected) {
            return `Delete all line item rows`;
          }

          // Otherwise list all reference values without truncation
          const valueText = `"${referenceValues.join('", "')}"`;
          return `Delete the line item rows with ${referenceName} values ${valueText}`;
        }
      }
      break;
    }

    case 'column': {
      if (data.columns && data.columns.length > 0) {
        const column = data.columns[0];
        return `Delete all values in the "${column.name}" column for all line items`;
      }
      break;
    }
  }

  return 'Delete the selected line item data';
}

function generateEditPrompt(type: string, data: SelectionData['data']): string {
  // Extract column order if available (for PDF line items)
  const columnsOrder = data._columns;
  
  switch (type) {
    case 'cell': {
      if (data.rowData && data.columnKey && data.columnName) {
        // Use all rows data if available for intelligent primary key detection
        const allRowsData = data.rows ? data.rows.map(row => row.data) : undefined;
        const referenceValue = getReferenceValue(data.rowData, allRowsData, columnsOrder);
        const { name: referenceName } = getReferenceColumn(data.rowData, allRowsData, columnsOrder);
        const currentValue = String(data.value ?? '');
        return `For line item with ${referenceName} value "${referenceValue}", change "${data.columnName}" value from "${currentValue}" to `;
      }
      break;
    }

    case 'row': {
      if (data.rows && data.rows.length > 0) {
        // Extract all row data for primary key analysis
        const allRowsData = data.rows.map(row => row.data);
        
        if (data.rows.length === 1) {
          const row = data.rows[0];
          const referenceValue = getReferenceValue(row.data, allRowsData, columnsOrder);
          const { name: referenceName } = getReferenceColumn(row.data, allRowsData, columnsOrder);
          return `For line item with ${referenceName} value "${referenceValue}", make the following changes to the row:`;
        } else {
          // If all rows selected, use concise wording
          if (data.allSelected) {
            return `For all line items, make the following change(s): `;
          }

          const firstRow = data.rows[0];
          const { name: referenceName } = getReferenceColumn(firstRow.data, allRowsData, columnsOrder);
          const referenceValues = data.rows
            .map((row: { index: number; data: Record<string, unknown> }) => getReferenceValue(row.data, allRowsData, columnsOrder))
            .filter((value: string, index: number, array: string[]) => array.indexOf(value) === index); // Remove duplicates

          // List all reference values without truncation
          const valueText = referenceValues.join('", "');
          return `For line items with ${referenceName} values "${valueText}", make the following change(s): `;
        }
      }
      break;
    }

    case 'column': {
      // For column selections we want a concise prompt that targets the entire column.
      if (data.columns && data.columns.length > 0) {
        const column = data.columns[0];
        return `Change values in the entire column "${column.name}" to `;
      }
      break;
    }

    case 'range': {
      if (data.cells && data.cells.length > 0) {
        const uniqueColumns = Array.from(
          new Set(data.cells.map((cell: { columnName: string }) => cell.columnName))
        );
        
        // Extract all row data for primary key analysis
        const allRowsData = data.cells.map(cell => cell.rowData);
        
        const firstCell = data.cells[0];
        const { name: referenceName } = getReferenceColumn(firstCell.rowData, allRowsData, columnsOrder);
        const uniqueRows = Array.from(
          new Set(data.cells.map((cell: { rowData: Record<string, unknown> }) => getReferenceValue(cell.rowData, allRowsData, columnsOrder)))
        );

        if (uniqueColumns.length === 1 && uniqueRows.length === 1) {
          // Single cell (shouldn't happen in range, but handle it)
          const cell = data.cells[0];
          const referenceValue = getReferenceValue(cell.rowData, allRowsData, columnsOrder);
          const currentValue = String(cell.value ?? '');
          return `For line item with ${referenceName} value "${referenceValue}", change "${cell.columnName}" value from "${currentValue}" to `;
        } else if (uniqueColumns.length === 1) {
          // Single column, multiple rows
          const column = uniqueColumns[0];
          const valueText = uniqueRows.length > 3
            ? `${uniqueRows.slice(0, 3).join('", "')} and ${uniqueRows.length - 3} more`
            : uniqueRows.join('", "');
          return `For line items with ${referenceName} values "${valueText}", change "${column}" values to `;
        } else if (uniqueRows.length === 1) {
          // Single row, multiple columns
          const referenceValue = uniqueRows[0];
          const columnText = uniqueColumns.length > 3
            ? `${uniqueColumns.slice(0, 3).join('", "')} and ${uniqueColumns.length - 3} more`
            : uniqueColumns.join('", "');
          return `For line item with ${referenceName} value "${referenceValue}", change fields "${columnText}" to `;
        } else {
          // Multiple rows and columns
          const rowText = uniqueRows.length > 2
            ? `${uniqueRows.slice(0, 2).join('", "')} and ${uniqueRows.length - 2} more`
            : uniqueRows.join('", "');
          const columnText = uniqueColumns.length > 2
            ? `${uniqueColumns.slice(0, 2).join('", "')} and ${uniqueColumns.length - 2} more`
            : uniqueColumns.join('", "');
          return `For line items with ${referenceName} values "${rowText}", change fields "${columnText}" to `;
        }
      }
      break;
    }
  }

  return 'Update selected line item data to ';
}






