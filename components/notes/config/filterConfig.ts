/**
 * Filter Configuration for Notes
 */

type FilterOption = {
  id: string;
  label: string;
  type: 'dropdown' | 'date' | 'text' | 'number';
  columnName?: string;
  available?: boolean;
  options?: string[];
};

export function getNoteFilterOptions(): FilterOption[] {
  return [
    { id: 'note-id', label: 'Note ID', type: 'text' as const },
    { id: 'title', label: 'Title', type: 'text' as const },
    { id: 'content', label: 'Content', type: 'text' as const },
    { id: 'created-by', label: 'Created By', type: 'dropdown' as const },
    { id: 'created-date', label: 'Created Date', type: 'date' as const },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const },
    { id: 'entity-type', label: 'Entity Type', type: 'dropdown' as const },
    { id: 'entity-name', label: 'Entity Name', type: 'dropdown' as const },
    { id: 'mentions', label: 'Mentions', type: 'dropdown' as const },
    { id: 'has-attachments', label: 'Has Attachments', type: 'dropdown' as const },
  ];
}
