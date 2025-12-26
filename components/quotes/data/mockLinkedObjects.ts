import type {
  LinkedPreOpp,
  LinkedOrder,
  LinkedInvoice,
  LinkedCommissionStatement,
  LinkedContact,
  LinkedCompany,
  LinkedTag,
} from '../types';

// Mock linked objects for quotes
export const mockLinkedPreOpps: LinkedPreOpp[] = [
  { id: 'PO-2024-001', name: 'Downtown Office Complex', status: 'active', value: 125000, date: '2024-02-15' },
  { id: 'PO-2024-003', name: 'Residential Tower Project', status: 'pending', value: 85000, date: '2024-03-01' },
];

export const mockLinkedOrders: LinkedOrder[] = [
  { id: 'ORD-2024-0156', name: 'Downtown Office - Phase 1', status: 'processing', value: 45000, date: '2024-03-10' },
  { id: 'ORD-2024-0189', name: 'Downtown Office - Phase 2', status: 'shipped', value: 62000, date: '2024-03-18' },
];

export const mockLinkedInvoices: LinkedInvoice[] = [
  { id: 'INV-2024-0892', name: 'Downtown Office - Deposit', status: 'paid', value: 25000, date: '2024-03-12' },
  { id: 'INV-2024-0923', name: 'Downtown Office - Progress 1', status: 'pending', value: 35000, date: '2024-03-20' },
];

export const mockLinkedCommissionStatements: LinkedCommissionStatement[] = [
  { id: 'CS-2024-03', name: 'March 2024 Statement', status: 'processed', value: 4250, date: '2024-03-31' },
];

export const mockLinkedContacts: LinkedContact[] = [
  { id: 'CON-001', name: 'John Smith', role: 'Project Manager', company: 'Turner Construction', email: 'jsmith@turner.com' },
  { id: 'CON-002', name: 'Emily Davis', role: 'Purchasing Agent', company: 'Turner Construction', email: 'edavis@turner.com' },
  { id: 'CON-003', name: 'Michael Chen', role: 'Electrical Engineer', company: 'MEP Associates', email: 'mchen@mep.com' },
];

export const mockLinkedCompanies: LinkedCompany[] = [
  { id: 'COMP-001', name: 'Turner Construction', type: 'Customer', city: 'New York', state: 'NY' },
  { id: 'COMP-002', name: 'MEP Associates', type: 'Consultant', city: 'Chicago', state: 'IL' },
];

export const mockLinkedTags: LinkedTag[] = [
  { id: 'TAG-001', name: 'High Priority', color: '#EF4444' },
  { id: 'TAG-002', name: 'Hospitality', color: '#8B5CF6' },
  { id: 'TAG-003', name: 'LED Retrofit', color: '#10B981' },
  { id: 'TAG-004', name: 'Energy Rebate', color: '#F59E0B' },
];
