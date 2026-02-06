'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FieldNameCell } from './FieldNameCell';
import { FieldInputDropdown } from './FieldInputDropdown';
import { MappedIndicator } from './MappedIndicator';

export interface FieldMappingRowProps {
  /** Unique key for the field (standardFieldKey) */
  fieldKey: string;
  /** Display name of the field */
  fieldName: string;
  /** Description shown in tooltip */
  fieldDescription: string;
  /** Whether this field is preferred */
  isPreferred?: boolean;

  // Mapping state
  /** Current mapped value */
  currentMapping: string;
  /** Current search term for dropdown filtering */
  searchTerm: string;
  /** Whether the dropdown is currently open */
  isDropdownOpen: boolean;
  /** Whether the field is locked (auto-populated from another field) */
  isLocked?: boolean;
  /** Whether the field is a group field (ONE_REQUIRED or CAN_CALCULATE) */
  isGroupField?: boolean;
  /** Whether the field is required */
  isRequired?: boolean;
  /** Whether the group requirement is unsatisfied */
  isGroupUnsatisfied?: boolean;
  /** Available columns for dropdown suggestions */
  columns: string[];

  // Handlers
  /** Called when input value changes */
  onInputChange: (value: string) => void;
  /** Called when input is focused */
  onFocus: () => void;
  /** Called when a column is selected from dropdown */
  onSelect: (value: string) => void;
  /** Called when dropdown should close (click outside) */
  onClose?: () => void;

  // Render props for customizable parts
  /** Render the requirement status badge */
  renderRequirementBadge: () => ReactNode;
  /** Render the visibility column(s) - can be one or multiple columns */
  renderVisibilityColumns: () => ReactNode;
}

/**
 * Reusable table row component for field mapping.
 * Used in distributor, manufacturer, and send-mapping pages.
 *
 * Renders the common structure:
 * - Field name cell
 * - Input dropdown cell
 * - Mapped indicator cell
 * - Status badge cell (via render prop)
 * - Visibility column(s) (via render prop)
 */
export function FieldMappingRow({
  fieldKey,
  fieldName,
  fieldDescription,
  isPreferred,
  currentMapping,
  searchTerm,
  isDropdownOpen,
  isLocked = false,
  isGroupField = false,
  isRequired = false,
  isGroupUnsatisfied = false,
  columns,
  onInputChange,
  onFocus,
  onSelect,
  onClose,
  renderRequirementBadge,
  renderVisibilityColumns,
}: FieldMappingRowProps) {
  const isMapped = currentMapping.length > 0;

  return (
    <tr
      key={fieldKey}
      className={cn(
        'hover:bg-muted/50',
        isGroupField && 'bg-purple-50/20',
        isLocked && 'opacity-60'
      )}
    >
      <td className="px-4 py-3">
        <FieldNameCell
          name={fieldName}
          description={fieldDescription}
          isPreferred={isPreferred}
        />
      </td>
      <td className="px-4 py-3">
        <FieldInputDropdown
          value={currentMapping}
          searchTerm={searchTerm}
          isOpen={isDropdownOpen}
          isLocked={isLocked}
          isMapped={isMapped}
          isRequired={isRequired}
          isGroupUnsatisfied={isGroupUnsatisfied}
          columns={columns}
          onInputChange={onInputChange}
          onFocus={onFocus}
          onSelect={onSelect}
          onClose={onClose}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <MappedIndicator isMapped={isMapped} />
      </td>
      <td className="px-4 py-3 text-center">
        {renderRequirementBadge()}
      </td>
      {renderVisibilityColumns()}
    </tr>
  );
}
