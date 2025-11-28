/**
 * Filter Configuration for Companies
 */

import type { Company } from '../types';

export function getCompanyFilterOptions(
  uniqueCompanyNames: string[],
  uniqueCompanyTypes: string[],
  uniqueCreatedBy: string[]
) {
  return [
    { 
      id: 'name', 
      label: 'Company Name', 
      type: 'dropdown' as const, 
      columnName: 'name', 
      available: true, 
      options: uniqueCompanyNames 
    },
    { 
      id: 'type', 
      label: 'Company Type', 
      type: 'dropdown' as const, 
      columnName: 'companySourceType', 
      available: true, 
      options: uniqueCompanyTypes 
    },
    { 
      id: 'phone', 
      label: 'Phone', 
      type: 'text' as const, 
      columnName: 'phone', 
      available: true 
    },
    { 
      id: 'website', 
      label: 'Website', 
      type: 'text' as const, 
      columnName: 'website', 
      available: true 
    },
    { 
      id: 'createdBy', 
      label: 'Created By', 
      type: 'dropdown' as const, 
      columnName: 'createdBy', 
      available: true, 
      options: uniqueCreatedBy 
    },
    { 
      id: 'company-id', 
      label: 'Company ID', 
      type: 'text' as const, 
      available: false 
    },
    { 
      id: 'address', 
      label: 'Address', 
      type: 'text' as const, 
      available: false 
    },
    { 
      id: 'territory', 
      label: 'Territory', 
      type: 'dropdown' as const, 
      available: false 
    },
    { 
      id: 'tags', 
      label: 'Tags', 
      type: 'dropdown' as const, 
      available: false 
    },
    { 
      id: 'lists', 
      label: 'Lists', 
      type: 'dropdown' as const, 
      available: false 
    },
    { 
      id: 'contact-count', 
      label: 'Contact Count', 
      type: 'number' as const, 
      available: false 
    },
    { 
      id: 'job-count', 
      label: 'Job Count', 
      type: 'number' as const, 
      available: false 
    },
    { 
      id: 'last-activity', 
      label: 'Last Activity', 
      type: 'date' as const, 
      available: false 
    },
  ];
}
