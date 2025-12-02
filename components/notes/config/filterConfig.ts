/**
 * Filter and Sort Configuration for Notes
 * Note: columnName should match the ParsedNote type field names
 */

type FilterOption = {
  id: string;
  label: string;
  type: 'dropdown' | 'date' | 'text' | 'number';
  columnName?: string;
  available?: boolean;
  options?: string[];
};

type SortOption = {
  columnName: string;
  label: string;
};

export function getNoteFilterOptions(
  uniqueTitles: string[] = [],
  uniqueTags: string[] = [],
  uniqueCreators: string[] = []
): FilterOption[] {
  return [
    { id: 'title', label: 'Title', type: 'dropdown' as const, columnName: 'title', available: true, options: uniqueTitles },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const, columnName: 'tags', available: true, options: uniqueTags },
    { id: 'created-by', label: 'Created By', type: 'dropdown' as const, columnName: 'createdBy', available: true, options: uniqueCreators },
    { id: 'content', label: 'Content', type: 'text' as const, columnName: 'content', available: false },
    { id: 'created-date', label: 'Created Date', type: 'date' as const, available: false },
    { id: 'mentions', label: 'Mentions', type: 'dropdown' as const, available: false },
  ];
}

export function getNoteSortOptions(): SortOption[] {
  return [
    { columnName: 'title', label: 'Title' },
    { columnName: 'createdAt', label: 'Created Date' },
    { columnName: 'createdBy', label: 'Created By' },
  ];
}
