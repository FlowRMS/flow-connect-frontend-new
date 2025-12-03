/**
 * Mock Data for Take-Offs
 */

import type { Takeoff, TakeoffDocument, ParsedItem, AbridgmentReportItem } from './types';

// Mock takeoffs data
export const mockTakeoffs: Takeoff[] = [
  {
    id: 'TO-001',
    title: 'Downtown Plaza Renovation',
    source: 'Manual Upload',
    createdBy: 'Sarah Johnson',
    createdDate: '2025-01-15',
    status: 'Complete',
    quoteId: 'Q-001',
  },
  {
    id: 'TO-002',
    title: 'Hospital Expansion Project',
    source: 'Email',
    createdBy: 'Marcus Chen',
    createdDate: '2025-01-20',
    status: 'Parsing',
  },
  {
    id: 'TO-003',
    title: 'Office Complex Lighting',
    source: 'Manual Upload',
    createdBy: 'Sarah Johnson',
    createdDate: '2025-01-22',
    status: 'Classification',
  },
];

// Mock documents data
export const mockDocuments: TakeoffDocument[] = [
  {
    id: 'doc-1',
    name: '076---P151 ENLARGED PLUMBING PLANS.pdf',
    type: 'PDF',
    size: '897.8 KB',
    uploadDate: '12/1/2025',
    classification: 'Fixture Schedules',
    confidence: 60,
    pages: 45,
    abridged: false,
  },
  {
    id: 'doc-2',
    name: '067---M801 MECHANICAL SCHEDULES.pdf',
    type: 'PDF',
    size: '760.7 KB',
    uploadDate: '12/1/2025',
    classification: 'Fixture Schedules',
    confidence: 60,
    pages: 38,
    abridged: false,
  },
  {
    id: 'doc-3',
    name: '136--ADDM1 P801 PLUMBING SCHEDULES.pdf',
    type: 'PDF',
    size: '743.4 KB',
    uploadDate: '12/1/2025',
    classification: 'Fixture Schedules',
    confidence: 60,
    pages: 892,
    abridged: false,
  },
  {
    id: 'doc-4',
    name: '081---P801 PLUMBING SCHEDULES.pdf',
    type: 'PDF',
    size: '728.0 KB',
    uploadDate: '12/1/2025',
    classification: 'Fixture Schedules',
    confidence: 60,
    pages: 615,
    abridged: false,
  },
  {
    id: 'doc-5',
    name: '074---P101 LEVEL 1 PLUMBING PLAN.pdf',
    type: 'PDF',
    size: '1094.0 KB',
    uploadDate: '12/1/2025',
    classification: 'Fixture Schedules',
    confidence: 60,
    pages: 725,
    abridged: false,
  },
];

// Mock parsed items data
export const mockParsedItems: ParsedItem[] = [
  {
    id: 'item-1',
    manufacturer: 'Competitor A',
    partNumber: 'CA-12345',
    description: 'LED Panel Light 2x4 40W 5000K',
    quantity: 125,
    isOurManufacturer: false,
    isCrossed: false,
  },
  {
    id: 'item-2',
    manufacturer: 'Our Company',
    partNumber: 'OC-98765',
    description: 'Emergency Exit Sign LED Red',
    quantity: 48,
    isOurManufacturer: true,
    isCrossed: false,
  },
  {
    id: 'item-3',
    manufacturer: 'Competitor B',
    partNumber: 'CB-55555',
    description: 'Recessed Downlight 6" LED 15W',
    quantity: 200,
    isOurManufacturer: false,
    isCrossed: true,
    crossedManufacturer: 'Our Company',
    crossedPartNumber: 'OC-45678',
    crossedDescription: 'Recessed LED Downlight 6" 15W 3000K',
  },
  {
    id: 'item-4',
    manufacturer: 'Competitor A',
    partNumber: 'CA-77777',
    description: 'Track Light Head Adjustable 20W',
    quantity: 75,
    isOurManufacturer: false,
    isCrossed: false,
  },
  {
    id: 'item-5',
    manufacturer: 'Competitor C',
    partNumber: 'CC-99999',
    description: 'Linear LED Fixture 4ft 40W',
    quantity: 85,
    isOurManufacturer: false,
    isCrossed: true,
    crossedManufacturer: 'Our Company',
    crossedPartNumber: 'OC-34567',
    crossedDescription: 'LED Linear Light 4ft 40W 4000K',
  },
];

// Mock abridgment report data
export const mockAbridgmentReport: AbridgmentReportItem[] = [
  { page: 1, included: true, reason: 'Title page with project information' },
  { page: 2, included: false, reason: 'Table of contents - not relevant' },
  { page: 3, included: true, reason: 'Fixture schedule table' },
  { page: 4, included: true, reason: 'Fixture specifications' },
  { page: 5, included: false, reason: 'Blank page' },
  { page: 6, included: true, reason: 'Lighting plan details' },
  { page: 7, included: false, reason: 'General notes - redundant' },
  { page: 8, included: true, reason: 'Product specifications' },
];
