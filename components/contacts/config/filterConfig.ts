/**
 * Contact Filter Configuration
 * Note: columnName should match the UI Contact type field names
 */

import type { Contact } from '../types';

export interface ContactFilterOption {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'date';
  columnName?: string;
  available: boolean;
  options?: string[];
}

/**
 * Generate filter options with dynamic unique values
 */
export function getContactFilterOptions(contacts: Contact[]): ContactFilterOption[] {
  const uniqueFirstNames = Array.from(new Set(contacts.map(c => c.firstName).filter(Boolean))).sort();
  const uniqueLastNames = Array.from(new Set(contacts.map(c => c.lastName).filter(Boolean))).sort();
  const uniqueEmails = Array.from(new Set(contacts.map(c => c.email).filter(Boolean))).sort();
  const uniqueCompanies = Array.from(new Set(contacts.map(c => c.company).filter(Boolean))).sort();
  const uniqueRoles = Array.from(new Set(contacts.map(c => c.role).filter(Boolean))).sort();
  const uniqueCreators = Array.from(new Set(contacts.map(c => c.createdBy).filter(Boolean))).sort();

  return [
    { 
      id: 'first-name', 
      label: 'First Name', 
      type: 'dropdown', 
      columnName: 'firstName', 
      available: true, 
      options: uniqueFirstNames 
    },
    { 
      id: 'last-name', 
      label: 'Last Name', 
      type: 'dropdown', 
      columnName: 'lastName', 
      available: true,
      options: uniqueLastNames 
    },
    { 
      id: 'email', 
      label: 'Email', 
      type: 'dropdown', 
      columnName: 'email', 
      available: true, 
      options: uniqueEmails 
    },
    { 
      id: 'phone', 
      label: 'Phone', 
      type: 'text', 
      columnName: 'phone', 
      available: true 
    },
    { 
      id: 'company', 
      label: 'Company', 
      type: 'dropdown', 
      columnName: 'company', 
      available: true, 
      options: uniqueCompanies 
    },
    { 
      id: 'role', 
      label: 'Role', 
      type: 'dropdown', 
      columnName: 'role', 
      available: true, 
      options: uniqueRoles 
    },
    { 
      id: 'created-by', 
      label: 'Created By', 
      type: 'dropdown', 
      columnName: 'createdBy', 
      available: true, 
      options: uniqueCreators 
    },
    { 
      id: 'contact-id', 
      label: 'Contact ID', 
      type: 'text', 
      available: false 
    },
    { 
      id: 'contact-type', 
      label: 'Contact Type', 
      type: 'dropdown', 
      available: false 
    },
    { 
      id: 'territory', 
      label: 'Territory', 
      type: 'dropdown', 
      available: false 
    },
    { 
      id: 'tags', 
      label: 'Tags', 
      type: 'dropdown', 
      available: false 
    },
    { 
      id: 'lists', 
      label: 'Lists', 
      type: 'dropdown', 
      available: false 
    },
    { 
      id: 'last-activity', 
      label: 'Last Activity', 
      type: 'date', 
      available: false 
    },
  ];
}
