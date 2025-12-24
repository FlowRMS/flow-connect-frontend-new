/**
 * Tests for Campaigns API Module
 */

import {
  extractUniqueValues,
  getContactRoles,
  getContactTerritories,
  getCompanyTypes,
  getJobTypes,
  getJobStatuses,
  getTaskStatuses,
  getTaskPriorities,
  extractAllTags,
  type ContactSearchResult,
  type CompanySearchResult,
  type JobSearchResult,
  type TaskSearchResult,
} from '../api/campaignsApi';

// Mock the GraphQL request module
jest.mock('../../lib/crm-graphql', () => ({
  crmGraphQLRequest: jest.fn(),
}));

describe('Campaigns API - Helper Functions', () => {
  describe('extractUniqueValues', () => {
    it('should extract unique values from an array of objects', () => {
      const items = [
        { name: 'Alice', role: 'Manager' },
        { name: 'Bob', role: 'Developer' },
        { name: 'Charlie', role: 'Manager' },
        { name: 'Dave', role: 'Designer' },
      ];

      const result = extractUniqueValues(items, 'role');
      expect(result).toEqual(['Designer', 'Developer', 'Manager']);
    });

    it('should filter out null and empty values', () => {
      const items = [
        { name: 'Alice', role: 'Manager' },
        { name: 'Bob', role: null },
        { name: 'Charlie', role: '' },
        { name: 'Dave', role: 'Developer' },
      ];

      const result = extractUniqueValues(items, 'role');
      expect(result).toEqual(['Developer', 'Manager']);
    });

    it('should return sorted unique values', () => {
      const items = [
        { name: 'Zebra' },
        { name: 'Apple' },
        { name: 'Mango' },
        { name: 'Apple' },
      ];

      const result = extractUniqueValues(items, 'name');
      expect(result).toEqual(['Apple', 'Mango', 'Zebra']);
    });

    it('should handle empty arrays', () => {
      const result = extractUniqueValues([], 'name');
      expect(result).toEqual([]);
    });
  });

  describe('getContactRoles', () => {
    it('should extract unique roles from contacts', () => {
      const contacts: ContactSearchResult[] = [
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', role: 'Manager', createdAt: '2024-01-01' },
        { id: '2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com', role: 'Developer', createdAt: '2024-01-01' },
        { id: '3', firstName: 'Bob', lastName: 'Smith', email: 'bob@test.com', role: 'Manager', createdAt: '2024-01-01' },
      ];

      const result = getContactRoles(contacts);
      expect(result).toEqual(['Developer', 'Manager']);
    });
  });

  describe('getContactTerritories', () => {
    it('should extract unique territories from contacts', () => {
      const contacts: ContactSearchResult[] = [
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', territory: 'West', createdAt: '2024-01-01' },
        { id: '2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com', territory: 'East', createdAt: '2024-01-01' },
        { id: '3', firstName: 'Bob', lastName: 'Smith', email: 'bob@test.com', territory: 'West', createdAt: '2024-01-01' },
      ];

      const result = getContactTerritories(contacts);
      expect(result).toEqual(['East', 'West']);
    });
  });

  describe('getCompanyTypes', () => {
    it('should extract unique company types', () => {
      const companies: CompanySearchResult[] = [
        { id: '1', name: 'Company A', companySourceType: 'Contractor' },
        { id: '2', name: 'Company B', companySourceType: 'Supplier' },
        { id: '3', name: 'Company C', companySourceType: 'Contractor' },
      ];

      const result = getCompanyTypes(companies);
      expect(result).toEqual(['Contractor', 'Supplier']);
    });
  });

  describe('getJobTypes', () => {
    it('should extract unique job types', () => {
      const jobs: JobSearchResult[] = [
        { id: '1', jobName: 'Job A', jobType: 'Commercial' },
        { id: '2', jobName: 'Job B', jobType: 'Residential' },
        { id: '3', jobName: 'Job C', jobType: 'Commercial' },
      ];

      const result = getJobTypes(jobs);
      expect(result).toEqual(['Commercial', 'Residential']);
    });
  });

  describe('getJobStatuses', () => {
    it('should extract unique job status names', () => {
      const jobs: JobSearchResult[] = [
        { id: '1', jobName: 'Job A', status: { id: 's1', name: 'Active' } },
        { id: '2', jobName: 'Job B', status: { id: 's2', name: 'Completed' } },
        { id: '3', jobName: 'Job C', status: { id: 's3', name: 'Active' } },
      ];

      const result = getJobStatuses(jobs);
      expect(result).toEqual(['Active', 'Completed']);
    });

    it('should handle jobs without status', () => {
      const jobs: JobSearchResult[] = [
        { id: '1', jobName: 'Job A' },
        { id: '2', jobName: 'Job B', status: { id: 's2', name: 'Active' } },
      ];

      const result = getJobStatuses(jobs);
      expect(result).toEqual(['Active']);
    });
  });

  describe('getTaskStatuses', () => {
    it('should extract unique task statuses', () => {
      const tasks: TaskSearchResult[] = [
        { id: '1', title: 'Task A', status: 'Open', priority: 'High' },
        { id: '2', title: 'Task B', status: 'In Progress', priority: 'Medium' },
        { id: '3', title: 'Task C', status: 'Open', priority: 'Low' },
      ];

      const result = getTaskStatuses(tasks);
      expect(result).toEqual(['In Progress', 'Open']);
    });
  });

  describe('getTaskPriorities', () => {
    it('should extract unique task priorities', () => {
      const tasks: TaskSearchResult[] = [
        { id: '1', title: 'Task A', status: 'Open', priority: 'High' },
        { id: '2', title: 'Task B', status: 'Open', priority: 'Medium' },
        { id: '3', title: 'Task C', status: 'Open', priority: 'High' },
      ];

      const result = getTaskPriorities(tasks);
      expect(result).toEqual(['High', 'Medium']);
    });
  });

  describe('extractAllTags', () => {
    it('should extract tags from JSON array string', () => {
      const items = [
        { tags: '["VIP", "Hot Lead"]' },
        { tags: '["Cold Lead", "VIP"]' },
      ];

      const result = extractAllTags(items);
      expect(result).toEqual(['Cold Lead', 'Hot Lead', 'VIP']);
    });

    it('should extract tags from comma-separated string', () => {
      const items = [
        { tags: 'VIP, Hot Lead' },
        { tags: 'Cold Lead, VIP' },
      ];

      const result = extractAllTags(items);
      expect(result).toEqual(['Cold Lead', 'Hot Lead', 'VIP']);
    });

    it('should extract tags from array', () => {
      const items = [
        { tags: ['VIP', 'Hot Lead'] },
        { tags: ['Cold Lead', 'VIP'] },
      ];

      const result = extractAllTags(items);
      expect(result).toEqual(['Cold Lead', 'Hot Lead', 'VIP']);
    });

    it('should handle null and undefined tags', () => {
      const items = [
        { tags: null },
        { tags: undefined },
        { tags: 'VIP' },
      ];

      const result = extractAllTags(items);
      expect(result).toEqual(['VIP']);
    });

    it('should return empty array when no tags', () => {
      const items = [
        { name: 'Item 1' },
        { name: 'Item 2' },
      ];

      const result = extractAllTags(items);
      expect(result).toEqual([]);
    });
  });
});
