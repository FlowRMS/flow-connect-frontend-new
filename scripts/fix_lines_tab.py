#!/usr/bin/env python3
"""Fix LinesTab.tsx by adding missing state, props, and functions."""

import re

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\quotes\tabs\LinesTab.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add useRouter import
content = content.replace(
    "import React from 'react';",
    "import React, { useState, useCallback, useMemo } from 'react';\nimport { useRouter } from 'next/navigation';"
)

# 2. Add mockOrders import
content = content.replace(
    "import { availableOutsideReps, availableInsideReps, availableEndUsers, availableManufacturers } from '../data';",
    "import { availableOutsideReps, availableInsideReps, availableEndUsers, availableManufacturers, mockSections } from '../data';\nimport { mockOrders } from '../../../lib/data/rms-mock';"
)

# 3. Add missing props to interface - find the end of the interface and add before the closing brace
props_to_add = '''
  // Spec sheet selections
  specSheetSelections: Set<string>;
  setSpecSheetSelections: React.Dispatch<React.SetStateAction<Set<string>>>;
}'''

content = content.replace(
    '''  // Line details modal
  showLineDetailsModal: boolean;
  setShowLineDetailsModal: (show: boolean) => void;
  lineDetailsModalItem: LineItem | null;
  setLineDetailsModalItem: React.Dispatch<React.SetStateAction<LineItem | null>>;
}''',
    '''  // Line details modal
  showLineDetailsModal: boolean;
  setShowLineDetailsModal: (show: boolean) => void;
  lineDetailsModalItem: LineItem | null;
  setLineDetailsModalItem: React.Dispatch<React.SetStateAction<LineItem | null>>;

  // Spec sheet selections
  specSheetSelections: Set<string>;
  setSpecSheetSelections: React.Dispatch<React.SetStateAction<Set<string>>>;
}'''
)

# 4. Add specSheetSelections to destructured props
content = content.replace(
    '''    showLineDetailsModal,
    setShowLineDetailsModal,
    lineDetailsModalItem,
    setLineDetailsModalItem,
  } = props;''',
    '''    showLineDetailsModal,
    setShowLineDetailsModal,
    lineDetailsModalItem,
    setLineDetailsModalItem,
    specSheetSelections,
    setSpecSheetSelections,
  } = props;'''
)

# 5. Add local state and functions after the destructuring
# Find the pattern after } = props; and the first definition
local_state_and_functions = '''

  const router = useRouter();

  // Local state for section management
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState<string | null>(null);
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Current quote sections (use quoteSections prop directly)
  const currentQuoteSections = quoteSections;

  // Helper functions
  const toggleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, [setCollapsedSections]);

  const toggleLineItemSelection = useCallback((id: string) => {
    setSelectedLineItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, [setSelectedLineItems]);

  const addLineItem = useCallback(() => {
    const newItem: LineItem = {
      id: `new-${Date.now()}`,
      productNumber: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      manufacturer: '',
      sectionId: null,
      sellPrice: 0,
      basePrice: 0,
      overagePercent: 0,
      outsideRepSplits: [],
      insideRepSplits: [],
      approvalStatus: 'none',
    };
    setQuoteLineItems(prev => [...prev, newItem]);
  }, [setQuoteLineItems]);

  const addSection = useCallback(() => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: `Section ${quoteSections.length + 1}`,
      order: quoteSections.length,
    };
    setQuoteSections(prev => [...prev, newSection]);
  }, [quoteSections.length, setQuoteSections]);

  const createSectionAndMoveItem = useCallback((itemId: string, sectionName: string) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: sectionName,
      order: quoteSections.length,
    };
    setQuoteSections(prev => [...prev, newSection]);
    setQuoteLineItems(prev => prev.map(li =>
      li.id === itemId ? { ...li, sectionId: newSection.id } : li
    ));
  }, [quoteSections.length, setQuoteSections, setQuoteLineItems]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, [setEditingCell]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent, item: LineItem, column: ColumnKey) => {
    if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      setEditingCell(null);
    }
  }, [cancelEdit, setEditingCell]);

'''

# Find where to insert the local state - after "} = props;" and before "// Editable columns"
content = content.replace(
    '''  } = props;

  // Editable columns''',
    '''  } = props;''' + local_state_and_functions + '''
  // Editable columns'''
)

# 6. Add renderBodyCell function (find a good spot after handleKeyDown function)
render_body_cell = '''
  // Render body cell for a column
  const renderBodyCell = (colKey: ColumnKey, item: LineItem): React.ReactNode => {
    if (colKey === 'endUser' && !showEndUserPerLine) return null;

    switch (colKey) {
      case 'partNumber':
        return (
          <td key={colKey} className="px-3 py-2 font-mono text-sm text-center">
            {item.productNumber || '-'}
          </td>
        );
      case 'description':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center max-w-[200px] truncate">
            {item.description || '-'}
          </td>
        );
      case 'quantity':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            {item.quantity}
          </td>
        );
      case 'manufacturer':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            {item.manufacturer || '-'}
          </td>
        );
      case 'unitPrice':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            ${item.unitPrice.toFixed(2)}
          </td>
        );
      case 'sellTotal':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center font-medium">
            ${(item.quantity * item.unitPrice).toFixed(2)}
          </td>
        );
      default:
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            -
          </td>
        );
    }
  };

'''

# Insert renderBodyCell after handleKeyDown function
content = content.replace(
    '''  };

  // Render header cell''',
    '''  };
''' + render_body_cell + '''
  // Render header cell''',
    1  # Only replace first occurrence
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed LinesTab.tsx - added missing state, functions, and imports")
