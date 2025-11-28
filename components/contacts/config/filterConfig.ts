/**
 * Contact Filter Configuration
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
  const uniqueNames = Array.from(new Set(contacts.map(c => c.name))).sort();
  const uniqueEmails = Array.from(new Set(contacts.map(c => c.email).filter(Boolean))).sort();
  const uniqueCompanies = Array.from(new Set(contacts.map(c => c.company).filter(Boolean))).sort();
  const uniqueRoles = Array.from(new Set(contacts.map(c => c.role).filter(Boolean))).sort();
  const uniqueCreators = Array.from(new Set(contacts.map(c => c.createdBy).filter(Boolean))).sort();

  return [
    { 
      id: 'first-name', 
      label: 'First Name', 
      type: 'text', 
      columnName: 'firstName', 
      available: true, 
      options: uniqueNames 
    },
    { 
      id: 'last-name', 
      label: 'Last Name', 
      type: 'text', 
      columnName: 'lastName', 
      available: true 
    },
    { 
      id: 'email', 
      label: 'Email', 
      type: 'text', 
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
      columnName: 'companyName', 
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
