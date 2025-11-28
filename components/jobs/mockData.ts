/**
 * Mock Data for Jobs
 */

import type { ConnectedEntities, CompanyDetails } from './types';

// Mock connected entities data
export const mockConnectedEntities: ConnectedEntities = {
  companies: [
    { id: 'CO-001', name: 'Turner Construction', companyType: 'GC', contacts: 3 },
    { id: 'CO-002', name: 'Miller Electric', companyType: 'EC', contacts: 2 },
    { id: 'CO-003', name: 'ABC Distributors', companyType: 'Distributor', contacts: 1 },
    { id: 'CO-004', name: 'Design Associates', companyType: 'EE', contacts: 2 },
  ],
  contacts: [
    { id: 'C-001', name: 'John Smith', role: 'Project Manager', company: 'Turner Construction', phone: '(555) 123-4567', contactType: 'GC' },
    { id: 'C-002', name: 'Sarah Williams', role: 'Estimator', company: 'Miller Electric', phone: '(555) 234-5678', contactType: 'EC' },
    { id: 'C-003', name: 'Mike Johnson', role: 'Superintendent', company: 'Turner Construction', phone: '(555) 345-6789', contactType: 'GC' },
    { id: 'C-004', name: 'Emily Chen', role: 'Electrical Engineer', company: 'Design Associates', phone: '(555) 456-7890', contactType: 'EE' },
    { id: 'C-005', name: 'Robert Taylor', role: 'Owner Representative', company: 'Plaza Development LLC', phone: '(555) 567-8901', contactType: 'Owner' },
  ],
  'pre-opportunities': [
    { id: 'PO-001', name: 'Hospital Expansion Opportunity', value: '$3.5M', date: '03/05/2024', status: 'Qualification' },
    { id: 'PO-002', name: 'Office Complex Lighting', value: '$1.2M', date: '03/12/2024', status: 'Researching' },
  ],
  quotes: [
    { id: 'Q-001', name: 'Initial Lighting Quote', value: '$2.3M', date: '03/01/2024', status: 'Approved' },
    { id: 'Q-002', name: 'Revised Controls Quote', value: '$450K', date: '03/10/2024', status: 'Pending' },
  ],
  orders: [
    { id: 'O-001', name: 'LED Fixtures Order', value: '$1.2M', date: '03/20/2024', status: 'Shipped' },
    { id: 'O-002', name: 'Control Systems', value: '$380K', date: '03/25/2024', status: 'Processing' },
  ],
  invoices: [
    { id: 'INV-001', name: 'Deposit Invoice', value: '$500K', date: '03/15/2024', status: 'Paid' },
    { id: 'INV-002', name: 'Progress Payment 1', value: '$800K', date: '04/01/2024', status: 'Outstanding' },
  ],
  checks: [
    { id: 'CHK-001', name: 'Deposit Payment', value: '$500K', date: '03/18/2024', status: 'Cleared' },
  ],
  documents: [
    { id: 'DOC-001', name: 'Contract Agreement.pdf', size: '2.3 MB', date: '03/01/2024', type: 'Contract' },
    { id: 'DOC-002', name: 'Site Plans.dwg', size: '15.7 MB', date: '03/05/2024', type: 'Drawing' },
    { id: 'DOC-003', name: 'Specifications.pdf', size: '4.1 MB', date: '03/08/2024', type: 'Specification' },
  ],
};

// Mock detailed company data
export const mockCompanyDetails: Record<string, CompanyDetails> = {
  'CO-001': {
    id: 'CO-001',
    name: 'Turner Construction',
    companyType: 'GC',
    address: '375 Hudson Street, New York, NY 10014',
    phone: '(212) 229-6000',
    website: 'www.turnerconstruction.com',
    linkedin: 'https://linkedin.com/company/turner-construction',
    contacts: [
      { id: 'C-001', name: 'John Smith', role: 'Project Manager', email: 'john.smith@turner.com', phone: '(555) 123-4567', department: 'Operations' },
      { id: 'C-003', name: 'Mike Johnson', role: 'Superintendent', email: 'mike.j@turner.com', phone: '(555) 345-6789', department: 'Field Operations' },
      { id: 'C-006', name: 'Lisa Anderson', role: 'Estimator', email: 'lisa.a@turner.com', phone: '(555) 678-9012', department: 'Preconstruction' },
      { id: 'C-007', name: 'Tom Bradley', role: 'Safety Director', email: 'tom.b@turner.com', phone: '(555) 789-0123', department: 'Safety' },
    ],
    activeJobs: [
      { id: 'J-001', name: 'Downtown Plaza Renovation', value: '$2.3M', status: 'Active', role: 'GC' },
      { id: 'J-003', name: 'Riverside Medical Center', value: '$4.2M', status: 'Active', role: 'GC' },
    ],
    notes: 'Preferred GC for large commercial projects. Strong safety record.',
  },
  'CO-002': {
    id: 'CO-002',
    name: 'Miller Electric',
    companyType: 'EC',
    address: '1250 Industrial Blvd, Dallas, TX 75207',
    phone: '(214) 555-3000',
    website: 'www.millerelectric.com',
    linkedin: 'https://linkedin.com/company/miller-electric',
    contacts: [
      { id: 'C-002', name: 'Sarah Williams', role: 'Estimator', email: 'sarah.w@millerelectric.com', phone: '(555) 234-5678', department: 'Estimating' },
      { id: 'C-008', name: 'David Chen', role: 'Project Manager', email: 'david.c@millerelectric.com', phone: '(555) 890-1234', department: 'Project Management' },
    ],
    activeJobs: [
      { id: 'J-001', name: 'Downtown Plaza Renovation', value: '$2.3M', status: 'Active', role: 'EC' },
    ],
    notes: 'Reliable electrical contractor. Good pricing on LED systems.',
  },
};

export function getCompanyDetails(companyId: string): CompanyDetails | undefined {
  return mockCompanyDetails[companyId];
}
