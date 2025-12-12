/**
 * Tests for Campaigns Types Module
 */

import {
  mapContactSearchResultToContact,
  mapCampaignStatus,
  mapDisplayStatusToAPI,
  mapListTypeToAPI,
  mapAPIToListType,
  mapSendPaceToAPI,
  getFieldsForEntity,
  getOperatorsForFieldType,
  getStatusColor,
  ENTITY_TYPE_OPTIONS,
  OPERATOR_OPTIONS,
  ENTITY_FIELDS,
} from '../types';

describe('Types - Contact Mapping', () => {
  describe('mapContactSearchResultToContact', () => {
    it('should map a full contact result correctly', () => {
      const apiContact = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phone: '555-1234',
        role: 'Manager',
        territory: 'West',
        tags: 'VIP, Hot Lead',
        createdAt: '2024-01-01',
      };

      const result = mapContactSearchResultToContact(apiContact);

      expect(result.id).toBe('123');
      expect(result.name).toBe('John Doe');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john@test.com');
      expect(result.phone).toBe('555-1234');
      expect(result.role).toBe('Manager');
      expect(result.type).toBe('Manager'); // role maps to type for backward compat
      expect(result.territory).toBe('West');
      expect(result.tags).toBe('VIP, Hot Lead');
    });

    it('should handle missing first name', () => {
      const apiContact = {
        id: '123',
        firstName: '',
        lastName: 'Doe',
        email: 'john@test.com',
        createdAt: '2024-01-01',
      };

      const result = mapContactSearchResultToContact(apiContact);
      expect(result.name).toBe('Doe');
    });

    it('should handle missing last name', () => {
      const apiContact = {
        id: '123',
        firstName: 'John',
        lastName: '',
        email: 'john@test.com',
        createdAt: '2024-01-01',
      };

      const result = mapContactSearchResultToContact(apiContact);
      expect(result.name).toBe('John');
    });

    it('should handle missing both names', () => {
      const apiContact = {
        id: '123',
        firstName: '',
        lastName: '',
        email: 'john@test.com',
        createdAt: '2024-01-01',
      };

      const result = mapContactSearchResultToContact(apiContact);
      expect(result.name).toBe('');
    });
  });
});

describe('Types - Campaign Status Mapping', () => {
  describe('mapCampaignStatus', () => {
    it('should map DRAFT to Draft', () => {
      expect(mapCampaignStatus('DRAFT')).toBe('Draft');
    });

    it('should map SCHEDULED to Scheduled', () => {
      expect(mapCampaignStatus('SCHEDULED')).toBe('Scheduled');
    });

    it('should map SENDING to Sending', () => {
      expect(mapCampaignStatus('SENDING')).toBe('Sending');
    });

    it('should map COMPLETED to Completed', () => {
      expect(mapCampaignStatus('COMPLETED')).toBe('Completed');
    });

    it('should map PAUSED to Paused', () => {
      expect(mapCampaignStatus('PAUSED')).toBe('Paused');
    });
  });

  describe('mapDisplayStatusToAPI', () => {
    it('should map Draft to DRAFT', () => {
      expect(mapDisplayStatusToAPI('Draft')).toBe('DRAFT');
    });

    it('should map Scheduled to SCHEDULED', () => {
      expect(mapDisplayStatusToAPI('Scheduled')).toBe('SCHEDULED');
    });

    it('should map Sending to SENDING', () => {
      expect(mapDisplayStatusToAPI('Sending')).toBe('SENDING');
    });

    it('should map Completed to COMPLETED', () => {
      expect(mapDisplayStatusToAPI('Completed')).toBe('COMPLETED');
    });

    it('should map Paused to PAUSED', () => {
      expect(mapDisplayStatusToAPI('Paused')).toBe('PAUSED');
    });
  });
});

describe('Types - List Type Mapping', () => {
  describe('mapListTypeToAPI', () => {
    it('should map static to STATIC', () => {
      expect(mapListTypeToAPI('static')).toBe('STATIC');
    });

    it('should map criteria to CRITERIA_BASED', () => {
      expect(mapListTypeToAPI('criteria')).toBe('CRITERIA_BASED');
    });

    it('should map dynamic to DYNAMIC', () => {
      expect(mapListTypeToAPI('dynamic')).toBe('DYNAMIC');
    });
  });

  describe('mapAPIToListType', () => {
    it('should map STATIC to static', () => {
      expect(mapAPIToListType('STATIC')).toBe('static');
    });

    it('should map CRITERIA_BASED to criteria', () => {
      expect(mapAPIToListType('CRITERIA_BASED')).toBe('criteria');
    });

    it('should map DYNAMIC to dynamic', () => {
      expect(mapAPIToListType('DYNAMIC')).toBe('dynamic');
    });
  });
});

describe('Types - Send Pace Mapping', () => {
  describe('mapSendPaceToAPI', () => {
    it('should map fast to FAST', () => {
      expect(mapSendPaceToAPI('fast')).toBe('FAST');
    });

    it('should map medium to MEDIUM', () => {
      expect(mapSendPaceToAPI('medium')).toBe('MEDIUM');
    });

    it('should map slow to SLOW', () => {
      expect(mapSendPaceToAPI('slow')).toBe('SLOW');
    });
  });
});

describe('Types - Entity Fields', () => {
  describe('ENTITY_TYPE_OPTIONS', () => {
    it('should have all required entity types', () => {
      expect(ENTITY_TYPE_OPTIONS).toHaveLength(4);
      expect(ENTITY_TYPE_OPTIONS.map(o => o.value)).toContain('CONTACT');
      expect(ENTITY_TYPE_OPTIONS.map(o => o.value)).toContain('JOB');
      expect(ENTITY_TYPE_OPTIONS.map(o => o.value)).toContain('COMPANY');
      expect(ENTITY_TYPE_OPTIONS.map(o => o.value)).toContain('TASK');
    });
  });

  describe('ENTITY_FIELDS', () => {
    it('should have fields for CONTACT', () => {
      expect(ENTITY_FIELDS.CONTACT.length).toBeGreaterThan(0);
      expect(ENTITY_FIELDS.CONTACT.some(f => f.value === 'email')).toBe(true);
      expect(ENTITY_FIELDS.CONTACT.some(f => f.value === 'role')).toBe(true);
    });

    it('should have fields for JOB', () => {
      expect(ENTITY_FIELDS.JOB.length).toBeGreaterThan(0);
      expect(ENTITY_FIELDS.JOB.some(f => f.value === 'job_name')).toBe(true);
      expect(ENTITY_FIELDS.JOB.some(f => f.value === 'status_id')).toBe(true);
    });

    it('should have fields for COMPANY', () => {
      expect(ENTITY_FIELDS.COMPANY.length).toBeGreaterThan(0);
      expect(ENTITY_FIELDS.COMPANY.some(f => f.value === 'name')).toBe(true);
    });

    it('should have fields for TASK', () => {
      expect(ENTITY_FIELDS.TASK.length).toBeGreaterThan(0);
      expect(ENTITY_FIELDS.TASK.some(f => f.value === 'title')).toBe(true);
      expect(ENTITY_FIELDS.TASK.some(f => f.value === 'status')).toBe(true);
    });
  });

  describe('getFieldsForEntity', () => {
    it('should return fields for valid entity type', () => {
      const fields = getFieldsForEntity('CONTACT');
      expect(fields.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid entity type', () => {
      const fields = getFieldsForEntity('INVALID');
      expect(fields).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const fields = getFieldsForEntity('');
      expect(fields).toEqual([]);
    });
  });
});

describe('Types - Operators', () => {
  describe('OPERATOR_OPTIONS', () => {
    it('should have all required operators', () => {
      const operatorValues = OPERATOR_OPTIONS.map(o => o.value);
      expect(operatorValues).toContain('EQUALS');
      expect(operatorValues).toContain('NOT_EQUALS');
      expect(operatorValues).toContain('CONTAINS');
      expect(operatorValues).toContain('NOT_CONTAINS');
      expect(operatorValues).toContain('GREATER_THAN');
      expect(operatorValues).toContain('LESS_THAN');
      expect(operatorValues).toContain('IS_NULL');
      expect(operatorValues).toContain('IS_NOT_NULL');
      expect(operatorValues).toContain('IN');
      expect(operatorValues).toContain('NOT_IN');
    });
  });

  describe('getOperatorsForFieldType', () => {
    it('should return text operators for text type', () => {
      const operators = getOperatorsForFieldType('text');
      expect(operators.some(o => o.value === 'CONTAINS')).toBe(true);
      expect(operators.some(o => o.value === 'NOT_CONTAINS')).toBe(true);
    });

    it('should return number operators for number type', () => {
      const operators = getOperatorsForFieldType('number');
      expect(operators.some(o => o.value === 'GREATER_THAN')).toBe(true);
      expect(operators.some(o => o.value === 'LESS_THAN')).toBe(true);
    });

    it('should return date operators for date type', () => {
      const operators = getOperatorsForFieldType('date');
      expect(operators.some(o => o.value === 'GREATER_THAN')).toBe(true);
      expect(operators.some(o => o.label === 'After')).toBe(true);
    });

    it('should return select operators for select type', () => {
      const operators = getOperatorsForFieldType('select');
      expect(operators.some(o => o.value === 'IN')).toBe(true);
      expect(operators.some(o => o.value === 'NOT_IN')).toBe(true);
    });

    it('should return all operators for unknown type', () => {
      const operators = getOperatorsForFieldType('unknown');
      expect(operators).toEqual(OPERATOR_OPTIONS);
    });
  });
});

describe('Types - Status Colors', () => {
  describe('getStatusColor', () => {
    it('should return correct color for DRAFT', () => {
      expect(getStatusColor('DRAFT')).toBe('bg-gray-100 text-gray-700');
    });

    it('should return correct color for Draft', () => {
      expect(getStatusColor('Draft')).toBe('bg-gray-100 text-gray-700');
    });

    it('should return correct color for SCHEDULED', () => {
      expect(getStatusColor('SCHEDULED')).toBe('bg-yellow-100 text-yellow-700');
    });

    it('should return correct color for SENDING', () => {
      expect(getStatusColor('SENDING')).toBe('bg-blue-100 text-blue-700');
    });

    it('should return correct color for COMPLETED', () => {
      expect(getStatusColor('COMPLETED')).toBe('bg-green-100 text-green-700');
    });

    it('should return correct color for PAUSED', () => {
      expect(getStatusColor('PAUSED')).toBe('bg-orange-100 text-orange-700');
    });

    it('should return default color for unknown status', () => {
      expect(getStatusColor('UNKNOWN')).toBe('bg-gray-100 text-gray-700');
    });
  });
});
