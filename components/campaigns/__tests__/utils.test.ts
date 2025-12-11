/**
 * Tests for Campaigns Utils Module
 */

import {
  formatDate,
  filterContactsBySearch,
  filterContactsByCompany,
  filterContactsByType,
  applyContactFilters,
  getUniqueContactValues,
  generateConditionId,
  generateGroupId,
  isConditionValid,
  areAllConditionsValid,
} from '../utils';
import {
  getStatusColor,
  getFieldsForEntity,
  getOperatorsForFieldType,
} from '../types';
import type { Contact, RuleCondition } from '../types';

describe('Utils - Status and Formatting', () => {
  describe('getStatusColor', () => {
    it('should return correct color for Draft status', () => {
      expect(getStatusColor('Draft')).toBe('bg-gray-100 text-gray-700');
    });

    it('should return correct color for Scheduled status', () => {
      // Updated: Scheduled uses yellow in the new API-aligned colors
      expect(getStatusColor('Scheduled')).toBe('bg-yellow-100 text-yellow-700');
    });

    it('should return correct color for Sending status', () => {
      // Updated: Sending uses blue in the new API-aligned colors
      expect(getStatusColor('Sending')).toBe('bg-blue-100 text-blue-700');
    });

    it('should return correct color for Completed status', () => {
      expect(getStatusColor('Completed')).toBe('bg-green-100 text-green-700');
    });

    it('should return correct color for Paused status', () => {
      // Updated: Paused uses orange in the new API-aligned colors
      expect(getStatusColor('Paused')).toBe('bg-orange-100 text-orange-700');
    });

    it('should return default color for unknown status', () => {
      expect(getStatusColor('Unknown')).toBe('bg-gray-100 text-gray-700');
    });
  });

  describe('formatDate', () => {
    it('should format a valid date string', () => {
      const result = formatDate('2024-11-15');
      // Result depends on locale, just check it's a string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

describe('Utils - Field and Operator Helpers', () => {
  describe('getFieldsForEntity', () => {
    it('should return fields for CONTACT entity', () => {
      // Updated: Use API-style entity type (uppercase)
      const fields = getFieldsForEntity('CONTACT');
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some(f => f.value === 'email')).toBe(true);
      expect(fields.some(f => f.value === 'role')).toBe(true);
    });

    it('should return fields for JOB entity', () => {
      const fields = getFieldsForEntity('JOB');
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some(f => f.value === 'job_name')).toBe(true);
      expect(fields.some(f => f.value === 'status_id')).toBe(true);
    });

    it('should return fields for COMPANY entity', () => {
      const fields = getFieldsForEntity('COMPANY');
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some(f => f.value === 'name')).toBe(true);
    });

    it('should return empty array for unknown entity', () => {
      const fields = getFieldsForEntity('Unknown');
      expect(fields).toEqual([]);
    });
  });

  describe('getOperatorsForFieldType', () => {
    it('should return text operators for text fields', () => {
      const operators = getOperatorsForFieldType('text');
      expect(operators.length).toBeGreaterThan(0);
      // Updated: Use API-style operator values (uppercase)
      expect(operators.some(o => o.value === 'EQUALS')).toBe(true);
      expect(operators.some(o => o.value === 'CONTAINS')).toBe(true);
    });

    it('should return number operators for number fields', () => {
      const operators = getOperatorsForFieldType('number');
      expect(operators.length).toBeGreaterThan(0);
      expect(operators.some(o => o.value === 'EQUALS')).toBe(true);
      expect(operators.some(o => o.value === 'GREATER_THAN')).toBe(true);
      expect(operators.some(o => o.value === 'LESS_THAN')).toBe(true);
    });

    it('should return date operators for date fields', () => {
      const operators = getOperatorsForFieldType('date');
      expect(operators.length).toBeGreaterThan(0);
      expect(operators.some(o => o.value === 'EQUALS')).toBe(true);
      expect(operators.some(o => o.value === 'GREATER_THAN')).toBe(true); // 'After' in label
    });

    it('should return all operators as default for unknown types', () => {
      // Updated: Unknown types now return OPERATOR_OPTIONS (all operators)
      const operators = getOperatorsForFieldType('unknown');
      expect(operators.length).toBeGreaterThan(0);
      expect(operators.some(o => o.value === 'EQUALS')).toBe(true);
    });
  });
});

describe('Utils - Contact Filters', () => {
  const mockContacts: Contact[] = [
    { id: '1', name: 'John Doe', email: 'john@acme.com', company: 'Acme Corp', type: 'Developer' },
    { id: '2', name: 'Jane Smith', email: 'jane@widgets.com', company: 'Widgets Inc', type: 'Manager' },
    { id: '3', name: 'Bob Johnson', email: 'bob@acme.com', company: 'Acme Corp', type: 'Designer' },
    { id: '4', name: 'Alice Brown', email: 'alice@tech.com', company: 'Tech Solutions', type: 'Developer' },
  ];

  describe('filterContactsBySearch', () => {
    it('should return all contacts when search query is empty', () => {
      const result = filterContactsBySearch(mockContacts, '');
      expect(result).toEqual(mockContacts);
    });

    it('should filter by name', () => {
      const result = filterContactsBySearch(mockContacts, 'john');
      expect(result).toHaveLength(2);
      expect(result.some(c => c.name === 'John Doe')).toBe(true);
      expect(result.some(c => c.name === 'Bob Johnson')).toBe(true);
    });

    it('should filter by email', () => {
      const result = filterContactsBySearch(mockContacts, '@acme.com');
      expect(result).toHaveLength(2);
    });

    it('should filter by company', () => {
      const result = filterContactsBySearch(mockContacts, 'widgets');
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Widgets Inc');
    });

    it('should be case insensitive', () => {
      const result = filterContactsBySearch(mockContacts, 'JOHN');
      expect(result).toHaveLength(2);
    });
  });

  describe('filterContactsByCompany', () => {
    it('should return all contacts when no companies selected', () => {
      const result = filterContactsByCompany(mockContacts, []);
      expect(result).toEqual(mockContacts);
    });

    it('should filter by single company', () => {
      const result = filterContactsByCompany(mockContacts, ['Acme Corp']);
      expect(result).toHaveLength(2);
      expect(result.every(c => c.company === 'Acme Corp')).toBe(true);
    });

    it('should filter by multiple companies', () => {
      const result = filterContactsByCompany(mockContacts, ['Acme Corp', 'Widgets Inc']);
      expect(result).toHaveLength(3);
    });
  });

  describe('filterContactsByType', () => {
    it('should return all contacts when no types selected', () => {
      const result = filterContactsByType(mockContacts, []);
      expect(result).toEqual(mockContacts);
    });

    it('should filter by single type', () => {
      const result = filterContactsByType(mockContacts, ['Developer']);
      expect(result).toHaveLength(2);
      expect(result.every(c => c.type === 'Developer')).toBe(true);
    });

    it('should filter by multiple types', () => {
      const result = filterContactsByType(mockContacts, ['Developer', 'Manager']);
      expect(result).toHaveLength(3);
    });
  });

  describe('applyContactFilters', () => {
    it('should apply all filters combined', () => {
      // Search for 'john' returns John Doe and Bob Johnson
      // Filter by Acme Corp keeps both (John and Bob are at Acme)
      const result = applyContactFilters(
        mockContacts,
        'john',
        ['Acme Corp'],
        []
      );
      expect(result).toHaveLength(2);
      expect(result.some(c => c.name === 'John Doe')).toBe(true);
      expect(result.some(c => c.name === 'Bob Johnson')).toBe(true);
    });

    it('should return empty array when no matches', () => {
      const result = applyContactFilters(
        mockContacts,
        'xyz',
        ['Acme Corp'],
        ['Manager']
      );
      expect(result).toHaveLength(0);
    });
  });

  describe('getUniqueContactValues', () => {
    it('should get unique companies', () => {
      const result = getUniqueContactValues(mockContacts, 'company');
      expect(result).toHaveLength(3);
      expect(result).toContain('Acme Corp');
      expect(result).toContain('Widgets Inc');
      expect(result).toContain('Tech Solutions');
    });

    it('should get unique types', () => {
      const result = getUniqueContactValues(mockContacts, 'type');
      expect(result).toHaveLength(3);
      expect(result).toContain('Developer');
      expect(result).toContain('Manager');
      expect(result).toContain('Designer');
    });
  });
});

describe('Utils - ID Generation', () => {
  describe('generateConditionId', () => {
    it('should generate condition ID with group prefix', () => {
      const id = generateConditionId('group-1', 2);
      expect(id).toBe('group-1-3');
    });

    it('should handle zero count', () => {
      const id = generateConditionId('g', 0);
      expect(id).toBe('g-1');
    });
  });

  describe('generateGroupId', () => {
    it('should generate group ID', () => {
      const id = generateGroupId(2);
      expect(id).toBe('3');
    });

    it('should handle zero count', () => {
      const id = generateGroupId(0);
      expect(id).toBe('1');
    });
  });
});

describe('Utils - Validation', () => {
  describe('isConditionValid', () => {
    it('should return true for valid condition', () => {
      const condition: RuleCondition = {
        id: '1',
        entity: 'CONTACT',
        field: 'first_name',
        operator: 'CONTAINS',
        value: 'John',
      };
      expect(isConditionValid(condition)).toBe(true);
    });

    it('should return false when entity is empty', () => {
      const condition: RuleCondition = {
        id: '1',
        entity: '',
        field: 'first_name',
        operator: 'CONTAINS',
        value: 'John',
      };
      expect(isConditionValid(condition)).toBe(false);
    });

    it('should return false when field is empty', () => {
      const condition: RuleCondition = {
        id: '1',
        entity: 'CONTACT',
        field: '',
        operator: 'CONTAINS',
        value: 'John',
      };
      expect(isConditionValid(condition)).toBe(false);
    });

    it('should return false when operator is empty', () => {
      const condition: RuleCondition = {
        id: '1',
        entity: 'CONTACT',
        field: 'first_name',
        operator: '',
        value: 'John',
      };
      expect(isConditionValid(condition)).toBe(false);
    });

    it('should return false when value is empty', () => {
      const condition: RuleCondition = {
        id: '1',
        entity: 'CONTACT',
        field: 'first_name',
        operator: 'CONTAINS',
        value: '',
      };
      expect(isConditionValid(condition)).toBe(false);
    });
  });

  describe('areAllConditionsValid', () => {
    it('should return true when all conditions are valid', () => {
      const conditions: RuleCondition[] = [
        { id: '1', entity: 'CONTACT', field: 'first_name', operator: 'CONTAINS', value: 'John' },
        { id: '2', entity: 'JOB', field: 'status_id', operator: 'EQUALS', value: 'Active' },
      ];
      expect(areAllConditionsValid(conditions)).toBe(true);
    });

    it('should return false when any condition is invalid', () => {
      const conditions: RuleCondition[] = [
        { id: '1', entity: 'CONTACT', field: 'first_name', operator: 'CONTAINS', value: 'John' },
        { id: '2', entity: 'JOB', field: '', operator: 'EQUALS', value: 'Active' },
      ];
      expect(areAllConditionsValid(conditions)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(areAllConditionsValid([])).toBe(true);
    });
  });
});
