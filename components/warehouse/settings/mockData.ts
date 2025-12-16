import { mockWarehouses } from '@/lib/data/warehouse-mock';
import { defaultLocationLevels } from '@/lib/types/warehouse';
import type { WarehouseWorker, ShippingCarrier, WarehouseWithSettings } from './types';

export const mockAvailableWorkers: WarehouseWorker[] = [
  { id: 'W001', name: 'Marcus Johnson', email: 'marcus.j@company.com', role: 'worker' },
  { id: 'W002', name: 'Sarah Chen', email: 'sarah.c@company.com', role: 'manager' },
  { id: 'W003', name: 'David Rodriguez', email: 'david.r@company.com', role: 'worker' },
  { id: 'W004', name: 'Emily Thompson', email: 'emily.t@company.com', role: 'worker' },
  { id: 'W005', name: 'James Wilson', email: 'james.w@company.com', role: 'manager' },
  { id: 'W006', name: 'Lisa Park', email: 'lisa.p@company.com', role: 'worker' },
  { id: 'W007', name: 'Michael Brown', email: 'michael.b@company.com', role: 'worker' },
  { id: 'W008', name: 'Jennifer Davis', email: 'jennifer.d@company.com', role: 'worker' },
];

// Mock shipping carriers with comprehensive data
export const mockShippingCarriers: ShippingCarrier[] = [
  {
    id: 'SC001',
    name: 'FedEx',
    code: 'FEDX',
    isActive: true,
    accountNumber: '1234567890',
    billingAddress: '123 Corporate Blvd, Memphis, TN 38118',
    paymentTerms: 'Net 30',
    apiKey: '••••••••••••••••',
    trackingUrlTemplate: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
    contactName: 'John Smith',
    contactPhone: '(800) 463-3339',
    contactEmail: 'support@fedex.com',
    serviceTypes: ['Ground', 'Express Saver', '2Day', 'Priority Overnight', 'Standard Overnight'],
    defaultServiceType: 'Ground',
    maxWeight: 150,
    maxDimensions: '108x108x165',
    fuelSurchargePercent: 12.5,
    pickupSchedule: 'Daily at 4:00 PM',
    pickupLocation: 'Loading Dock A',
  },
  {
    id: 'SC002',
    name: 'UPS',
    code: 'UPSS',
    isActive: true,
    accountNumber: '9876543210',
    paymentTerms: 'Net 30',
    trackingUrlTemplate: 'https://www.ups.com/track?tracknum={tracking_number}',
    contactName: 'Sarah Johnson',
    contactPhone: '(800) 742-5877',
    contactEmail: 'support@ups.com',
    serviceTypes: ['Ground', '3 Day Select', '2nd Day Air', 'Next Day Air', 'Next Day Air Saver'],
    defaultServiceType: 'Ground',
    maxWeight: 150,
    fuelSurchargePercent: 11.75,
    pickupSchedule: 'Daily at 3:30 PM',
    pickupLocation: 'Loading Dock A',
  },
  {
    id: 'SC003',
    name: 'Old Dominion',
    code: 'ODFL',
    isActive: true,
    accountNumber: 'OD-445566',
    contactName: 'Shawn Him',
    contactPhone: '(800) 432-6335',
    contactEmail: 'shawn.him@olddominion.com',
    serviceTypes: ['LTL Standard', 'LTL Expedited', 'LTL Guaranteed'],
    defaultServiceType: 'LTL Standard',
    maxWeight: 20000,
    pickupSchedule: 'On Request',
    remarks: 'We have a login to arrange shipments with Old Dominion in Navigator.',
    internalNotes: 'Preferred carrier for LTL shipments over 500 lbs',
  },
  {
    id: 'SC004',
    name: 'ABF Freight',
    code: 'ABFS',
    isActive: true,
    accountNumber: 'ABF-778899',
    contactPhone: '(800) 610-5544',
    serviceTypes: ['LTL', 'Volume LTL', 'Truckload'],
    defaultServiceType: 'LTL',
    maxWeight: 44000,
    pickupSchedule: 'Call for pickup',
  },
  {
    id: 'SC005',
    name: 'TForce Freight',
    code: 'TFRC',
    isActive: true,
    accountNumber: 'TF-112233',
    contactPhone: '(800) 333-7400',
    serviceTypes: ['Standard LTL', 'Guaranteed', 'Time Critical'],
    defaultServiceType: 'Standard LTL',
  },
  {
    id: 'SC006',
    name: 'Estes Express',
    code: 'EXLA',
    isActive: true,
    accountNumber: 'EST-554433',
    contactPhone: '(804) 353-1900',
    serviceTypes: ['LTL', 'Volume', 'Truckload', 'Final Mile'],
    defaultServiceType: 'LTL',
    maxWeight: 20000,
  },
  {
    id: 'SC007',
    name: 'AAA Cooper',
    code: 'AACT',
    isActive: false,
    accountNumber: 'AAA-998877',
    contactPhone: '(334) 793-2284',
    serviceTypes: ['Regional LTL', 'Guaranteed'],
    internalNotes: 'Account on hold - billing dispute',
  },
];

// Initialize warehouses with default settings
export const initializeWarehouses = (): WarehouseWithSettings[] => {
  return mockWarehouses.map((wh, index) => ({
    ...wh,
    settings: {
      locationLevels: [...defaultLocationLevels],
      // Assign some workers to each warehouse for demo
      workers: index === 0
        ? [
            { workerId: 'W001', role: 'worker' },
            { workerId: 'W002', role: 'manager' },
            { workerId: 'W003', role: 'worker' },
            { workerId: 'W006', role: 'worker' },
          ]
        : [
            { workerId: 'W004', role: 'worker' },
            { workerId: 'W005', role: 'manager' },
            { workerId: 'W003', role: 'worker' }, // David is in both warehouses
          ],
    },
  }));
};
