/**
 * List View Component for Contacts
 * Table view with HTML table structure, sticky header, and infinite scroll
 */

import React, { useRef } from 'react';
import { getInitials, getAvatarColor, formatDate } from '../utils';
import type { Contact } from '../types';
import { useScrollPagination } from '@/components/hooks/useInfiniteScroll';
import { ContactsTableSkeleton } from './ContactsTableSkeleton';
import { ContactsEmptyState } from './ContactsEmptyState';
import { ContactsTableHeader } from './ContactsTableHeader';
import type { ActiveFilter } from '@/components/advancedFilters/types';
import { getContactFilterOptions } from '../config/filterConfig';
import { PicklistValue } from '@/lib/picklists/components';
import { PicklistKey } from '@/lib/picklists/enums';


interface ListViewProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
  // Infinite scroll props
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  isLoading?: boolean;
  // For empty state
  hasFilters?: boolean;
  onClearFilters?: () => void;
  // Column filters
  onColumnFiltersChange?: (filters: Record<string, ActiveFilter[]>) => void;
  filterOptions?: ReturnType<typeof getContactFilterOptions>;
  columnFilters?: Record<string, ActiveFilter[]>;
  // Sorting (header UI)
  activeSort?: { columnName: string; direction: 'ASC' | 'DESC' };
  onSortChange?: (columnName: string) => void;
}

export default function ListView({ 
  contacts, 
  onContactClick,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isLoading = false,
  hasFilters = false,
  onClearFilters,
  onColumnFiltersChange,
  filterOptions = getContactFilterOptions(),
  columnFilters: parentColumnFilters,
  activeSort,
  onSortChange,
}: ListViewProps) {
  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if there are column filters applied
  const hasColumnFilters = parentColumnFilters 
    ? Object.keys(parentColumnFilters).length > 0 
    : false;

  // Use scroll pagination hook to detect when scrolling near bottom of table
  const shouldPaginate = (hasNextPage ?? false);
  useScrollPagination(scrollContainerRef, {
    hasNextPage: shouldPaginate,
    isFetchingNextPage: isFetchingNextPage ?? false,
    fetchNextPage: fetchNextPage ?? (() => {}),
    threshold: 200, // Trigger when within 200px of bottom
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
      {!isLoading && contacts.length === 0 ? (
        // Empty state - show message
        <ContactsEmptyState 
          hasFilters={hasFilters || hasColumnFilters} 
          onClearFilters={onClearFilters}
        />
      ) : (
        <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          <div 
            ref={scrollContainerRef}
            className="overflow-auto scrollbar-always-visible flex-1"
          >
            <table className="w-full min-w-[800px]">
              <ContactsTableHeader
                onColumnFiltersChange={onColumnFiltersChange}
                filterOptions={filterOptions}
                columnFilters={parentColumnFilters}
                activeSort={activeSort}
                onSortChange={onSortChange}
              />
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <ContactsTableSkeleton rowCount={8} />
                ) : (
                  contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => onContactClick(contact)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                            {getInitials(contact.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm text-gray-900 truncate">{contact.name}</h3>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <a 
                                href={`mailto:${contact.email}`} 
                                className="text-xs text-gray-500 hover:text-[var(--primary)] truncate" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                {contact.email}
                              </a>
                              <a 
                                href={`tel:${contact.phone}`} 
                                className="text-xs text-gray-500 hover:text-[var(--primary)]" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                {contact.phone}
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-gray-900 truncate block">{contact.company}</span>
                      </td>
                      <td className="px-3 py-3">
                        {contact.role ? (
                          <PicklistValue
                            picklistKey={PicklistKey.CONTACT_ROLES}
                            value={contact.role}
                            variant="badge"
                            showColor={true}
                          />
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-gray-600 truncate block max-w-[200px]" title={contact.roleDetail || ''}>
                          {contact.roleDetail || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {contact.tags.slice(0, 1).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs truncate max-w-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 1 && (
                            <span className="text-xs text-gray-500">+{contact.tags.length - 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-500">{formatDate(contact.createdAt)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-gray-900 truncate block">{contact.createdBy}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="text-sm">Loading more contacts...</span>
          </div>
        </div>
      )}
    </div>
  );
}
