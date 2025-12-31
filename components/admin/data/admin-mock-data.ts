// Admin Settings Mock Data

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'outside_rep' | 'inside_rep' | 'administrator' | 'owner' | 'warehouse_manager' | 'warehouse_employee' | 'driver';
  roleDisplay: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface Permission {
  entity: string;
  role: string;
  view: 'all' | 'own' | 'none';
  write: 'all' | 'own' | 'none';
  delete: 'all' | 'own' | 'none';
}

export interface CompanySettings {
  logo?: string;
  logoWidth: number;
  logoHeight: number;
  name: string;
  streetAddress: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
}

export interface FlowBotSettings {
  canCreateProducts: boolean;
  canCreateFactories: boolean;
  canCreateCustomers: boolean;
  canCreateQuotes: boolean;
  canCreateOrders: boolean;
  canCreateInvoices: boolean;
  allowEntityAutoUpdates: boolean;
  autoMatchEndUser: boolean;
  includeFreightLines: boolean;
  trainingBooster: boolean;
  extractionBooster: boolean;
  trainingBaseline: number;
  extractionBaseline: number;
}

export interface SalesRepSelection {
  id: string;
  factoryId: string;
  factoryName: string;
  customerId: string;
  customerName: string;
  reps: { id: string; name: string; type: 'outside' | 'inside' }[];
}

export interface Factory {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
}

// Mock Company Settings
export const mockCompanySettings: CompanySettings = {
  logoWidth: 100,
  logoHeight: 100,
  name: 'demo',
  streetAddress: '55 Main St',
  addressLine2: '5b',
  city: 'Raleigh',
  state: 'NC',
  zipCode: '12345',
  email: 'support@flowrms.com',
  phone: '(555) 555-55555',
};

// Mock Team Members
export const mockTeamMembers: TeamMember[] = [
  // Outside Reps (49)
  { id: 'or-1', name: 'Outside Rep', roleDisplay: 'Outside Rep', email: 'nicolas.inside@flowrms.com', role: 'outside_rep', status: 'active' },
  { id: 'or-2', name: 'Outside Rep', roleDisplay: 'Outside Rep', email: 'nicolas.test@flowrms.com', role: 'outside_rep', status: 'active' },
  { id: 'or-3', name: 'John Smith', roleDisplay: 'Outside Rep', email: 'john.smith@flowrms.com', role: 'outside_rep', status: 'active' },
  { id: 'or-4', name: 'Sarah Johnson', roleDisplay: 'Outside Rep', email: 'sarah.j@flowrms.com', role: 'outside_rep', status: 'active' },
  { id: 'or-5', name: 'Mike Davis', roleDisplay: 'Outside Rep', email: 'mike.d@flowrms.com', role: 'outside_rep', status: 'inactive' },
  { id: 'or-6', name: 'Emily Brown', roleDisplay: 'Outside Rep', email: 'emily.b@flowrms.com', role: 'outside_rep', status: 'inactive' },
  // Administrators (2)
  { id: 'admin-1', name: 'Admin User', roleDisplay: 'Administrator', email: 'admin@flowrms.com', role: 'administrator', status: 'active' },
  { id: 'admin-2', name: 'System Admin', roleDisplay: 'Administrator', email: 'sysadmin@flowrms.com', role: 'administrator', status: 'active' },
  // Inside Reps (3)
  { id: 'ir-1', name: 'Nicolas Garcia', roleDisplay: 'Inside rep', email: 'nicolas.inside@flowrms.com', role: 'inside_rep', status: 'active' },
  { id: 'ir-2', name: 'Maria Santos', roleDisplay: 'Inside rep', email: 'maria.santos@flowrms.com', role: 'inside_rep', status: 'active' },
  { id: 'ir-3', name: 'Alex Chen', roleDisplay: 'Inside rep', email: 'alex.chen@flowrms.com', role: 'inside_rep', status: 'active' },
  // Owners (1)
  { id: 'owner-1', name: 'Company Owner', roleDisplay: 'Owner', email: 'owner@flowrms.com', role: 'owner', status: 'active' },
  // Warehouse
  { id: 'wm-1', name: 'Warehouse Manager', roleDisplay: 'Warehouse manager', email: 'warehouse@flowrms.com', role: 'warehouse_manager', status: 'active' },
  { id: 'we-1', name: 'Warehouse Employee', roleDisplay: 'Warehouse employee', email: 'employee@flowrms.com', role: 'warehouse_employee', status: 'active' },
  // Drivers
  { id: 'driver-1', name: 'Driver One', roleDisplay: 'Driver', email: 'driver1@flowrms.com', role: 'driver', status: 'active' },
];

// Permission entities and roles
export const permissionEntities = [
  'Check',
  'Credit',
  'Customer',
  'Expense',
  'Factory',
  'Invoice',
  'Job',
  'Order',
  'Product',
  'Quote',
  'Task',
];

export const permissionRoles = [
  { id: 'OWNER', label: 'Owner' },
  { id: 'ADMINISTRATOR', label: 'Administrator' },
  { id: 'INSIDE_REP', label: 'Inside Rep' },
  { id: 'OUTSIDE_REP', label: 'Outside Rep' },
  { id: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager' },
  { id: 'WAREHOUSE_EMPLOYEE', label: 'Warehouse Employee' },
  { id: 'DRIVER', label: 'Driver' },
];

// Mock Permissions - based on the screenshot
export const mockPermissions: Permission[] = [
  // Check permissions
  { entity: 'Check', role: 'inside_rep', view: 'all', write: 'all', delete: 'all' },
  { entity: 'Check', role: 'outside_rep', view: 'own', write: 'own', delete: 'none' },
  { entity: 'Check', role: 'warehouse_manager', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Check', role: 'warehouse_employee', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Check', role: 'driver', view: 'none', write: 'none', delete: 'none' },
  // Credit permissions
  { entity: 'Credit', role: 'inside_rep', view: 'all', write: 'all', delete: 'all' },
  { entity: 'Credit', role: 'outside_rep', view: 'own', write: 'own', delete: 'none' },
  { entity: 'Credit', role: 'warehouse_manager', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Credit', role: 'warehouse_employee', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Credit', role: 'driver', view: 'none', write: 'none', delete: 'none' },
  // Customer permissions
  { entity: 'Customer', role: 'inside_rep', view: 'own', write: 'own', delete: 'none' },
  { entity: 'Customer', role: 'outside_rep', view: 'all', write: 'all', delete: 'all' },
  { entity: 'Customer', role: 'warehouse_manager', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Customer', role: 'warehouse_employee', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Customer', role: 'driver', view: 'none', write: 'none', delete: 'none' },
  // Expense permissions
  { entity: 'Expense', role: 'inside_rep', view: 'all', write: 'all', delete: 'all' },
  { entity: 'Expense', role: 'outside_rep', view: 'own', write: 'own', delete: 'none' },
  { entity: 'Expense', role: 'warehouse_manager', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Expense', role: 'warehouse_employee', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Expense', role: 'driver', view: 'none', write: 'none', delete: 'none' },
  // Factory permissions
  { entity: 'Factory', role: 'inside_rep', view: 'own', write: 'own', delete: 'none' },
  { entity: 'Factory', role: 'outside_rep', view: 'all', write: 'all', delete: 'all' },
  { entity: 'Factory', role: 'warehouse_manager', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Factory', role: 'warehouse_employee', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Factory', role: 'driver', view: 'none', write: 'none', delete: 'none' },
  // Invoice permissions
  { entity: 'Invoice', role: 'inside_rep', view: 'all', write: 'all', delete: 'all' },
  { entity: 'Invoice', role: 'outside_rep', view: 'own', write: 'own', delete: 'none' },
  { entity: 'Invoice', role: 'warehouse_manager', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Invoice', role: 'warehouse_employee', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Invoice', role: 'driver', view: 'none', write: 'none', delete: 'none' },
  // Job permissions
  { entity: 'Job', role: 'inside_rep', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Job', role: 'outside_rep', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Job', role: 'warehouse_manager', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Job', role: 'warehouse_employee', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Job', role: 'driver', view: 'none', write: 'none', delete: 'none' },
  // Order permissions
  { entity: 'Order', role: 'inside_rep', view: 'all', write: 'all', delete: 'all' },
  { entity: 'Order', role: 'outside_rep', view: 'own', write: 'own', delete: 'none' },
  { entity: 'Order', role: 'warehouse_manager', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Order', role: 'warehouse_employee', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Order', role: 'driver', view: 'none', write: 'none', delete: 'none' },
  // Product permissions
  { entity: 'Product', role: 'inside_rep', view: 'all', write: 'all', delete: 'all' },
  { entity: 'Product', role: 'outside_rep', view: 'all', write: 'none', delete: 'none' },
  { entity: 'Product', role: 'warehouse_manager', view: 'all', write: 'none', delete: 'none' },
  { entity: 'Product', role: 'warehouse_employee', view: 'all', write: 'none', delete: 'none' },
  { entity: 'Product', role: 'driver', view: 'none', write: 'none', delete: 'none' },
  // Quote permissions
  { entity: 'Quote', role: 'inside_rep', view: 'all', write: 'all', delete: 'all' },
  { entity: 'Quote', role: 'outside_rep', view: 'own', write: 'own', delete: 'own' },
  { entity: 'Quote', role: 'warehouse_manager', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Quote', role: 'warehouse_employee', view: 'none', write: 'none', delete: 'none' },
  { entity: 'Quote', role: 'driver', view: 'none', write: 'none', delete: 'none' },
  // Task permissions
  { entity: 'Task', role: 'inside_rep', view: 'all', write: 'all', delete: 'all' },
  { entity: 'Task', role: 'outside_rep', view: 'own', write: 'own', delete: 'own' },
  { entity: 'Task', role: 'warehouse_manager', view: 'own', write: 'own', delete: 'none' },
  { entity: 'Task', role: 'warehouse_employee', view: 'own', write: 'own', delete: 'none' },
  { entity: 'Task', role: 'driver', view: 'own', write: 'own', delete: 'none' },
];

// Commissions visibility roles
export const commissionVisibilityRoles = [
  { id: 'inside_rep', label: 'Inside Sales Rep', checked: true },
  { id: 'outside_rep', label: 'Outside Sales Rep', checked: true },
  { id: 'manager', label: 'Manager', checked: true },
];

// Mock flowBot Settings
export const mockFlowBotSettings: FlowBotSettings = {
  canCreateProducts: true,
  canCreateFactories: true,
  canCreateCustomers: true,
  canCreateQuotes: true,
  canCreateOrders: true,
  canCreateInvoices: true,
  allowEntityAutoUpdates: true,
  autoMatchEndUser: false,
  includeFreightLines: true,
  trainingBooster: true,
  extractionBooster: true,
  trainingBaseline: 0,
  extractionBaseline: 0,
};

// Mock Lost Reasons
export const mockLostReasons: string[] = ['demo test'];

// Mock Expense Categories
export const mockExpenseCategories: string[] = ['Generic', 'hello', 'Cost of Goods Sold', 'traveling'];

// Mock Credit Reasons
export const mockCreditReasons: string[] = ['Test'];

// Mock Manufacturer Types
export const mockManufacturerTypes: string[] = ['Lighting', 'Electrical', 'Plumbing', 'HVAC'];

// Mock Customer Types
export const mockCustomerTypes: string[] = ['Contractor', 'Distributor', 'End User', 'OEM'];

// Mock Factories
export const mockFactories: Factory[] = [
  { id: 'f-1', name: 'Test Factory' },
  { id: 'f-2', name: 'Acme Manufacturing' },
  { id: 'f-3', name: 'Global Industries' },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  { id: 'c-1', name: 'ANDALUISA UTILITIES' },
  { id: 'c-2', name: 'Metro Electric' },
  { id: 'c-3', name: 'City Power Co' },
  { id: 'c-4', name: 'Pacific Power' },
  { id: 'c-5', name: 'Eastern Distributors' },
  { id: 'c-6', name: 'Midwest Supply Co' },
];

// Mock End Users
export interface EndUser {
  id: string;
  name: string;
}

export const mockEndUsers: EndUser[] = [
  { id: 'eu-1', name: 'ABC Construction' },
  { id: 'eu-2', name: 'BuildRight Inc' },
  { id: 'eu-3', name: 'Premier Contractors' },
  { id: 'eu-4', name: 'Delta Engineering' },
  { id: 'eu-5', name: 'Sunrise Builders' },
];

// Mock Customer Rep Assignments
export interface RepSplit {
  repId: string;
  repName: string;
  percentage: number;
}

export interface RepAssignment {
  id: string;
  entityId: string;
  entityName: string;
  reps: RepSplit[]; // Support multiple reps with percentage splits
}

export const mockCustomerRepAssignments: RepAssignment[] = [
  { id: 'cra-1', entityId: 'c-1', entityName: 'ANDALUISA UTILITIES', reps: [{ repId: 'or-1', repName: 'Outside Rep', percentage: 100 }] },
  { id: 'cra-2', entityId: 'c-2', entityName: 'Metro Electric', reps: [{ repId: 'or-3', repName: 'John Smith', percentage: 100 }] },
  { id: 'cra-3', entityId: 'c-3', entityName: 'City Power Co', reps: [{ repId: 'or-4', repName: 'Sarah Johnson', percentage: 60 }, { repId: 'or-3', repName: 'John Smith', percentage: 40 }] },
  { id: 'cra-4', entityId: 'c-4', entityName: 'Pacific Power', reps: [{ repId: 'or-1', repName: 'Outside Rep', percentage: 100 }] },
  { id: 'cra-5', entityId: 'c-5', entityName: 'Eastern Distributors', reps: [{ repId: 'or-3', repName: 'John Smith', percentage: 100 }] },
  { id: 'cra-6', entityId: 'c-6', entityName: 'Midwest Supply Co', reps: [{ repId: 'or-4', repName: 'Sarah Johnson', percentage: 100 }] },
];

export const mockEndUserRepAssignments: RepAssignment[] = [
  { id: 'eura-1', entityId: 'eu-1', entityName: 'ABC Construction', reps: [{ repId: 'or-1', repName: 'Outside Rep', percentage: 100 }] },
  { id: 'eura-2', entityId: 'eu-2', entityName: 'BuildRight Inc', reps: [{ repId: 'or-3', repName: 'John Smith', percentage: 50 }, { repId: 'or-4', repName: 'Sarah Johnson', percentage: 50 }] },
  { id: 'eura-3', entityId: 'eu-3', entityName: 'Premier Contractors', reps: [{ repId: 'or-4', repName: 'Sarah Johnson', percentage: 100 }] },
  { id: 'eura-4', entityId: 'eu-4', entityName: 'Delta Engineering', reps: [{ repId: 'or-1', repName: 'Outside Rep', percentage: 100 }] },
  { id: 'eura-5', entityId: 'eu-5', entityName: 'Sunrise Builders', reps: [{ repId: 'or-3', repName: 'John Smith', percentage: 100 }] },
];

// Inside Rep Assignments - by Customer
export const mockInsideRepCustomerAssignments: RepAssignment[] = [
  { id: 'irca-1', entityId: 'c-1', entityName: 'ANDALUISA UTILITIES', reps: [{ repId: 'ir-1', repName: 'Nicolas Garcia', percentage: 100 }] },
  { id: 'irca-2', entityId: 'c-2', entityName: 'Metro Electric', reps: [{ repId: 'ir-2', repName: 'Maria Santos', percentage: 100 }] },
  { id: 'irca-3', entityId: 'c-3', entityName: 'City Power Co', reps: [{ repId: 'ir-3', repName: 'Alex Chen', percentage: 100 }] },
  { id: 'irca-4', entityId: 'c-4', entityName: 'Pacific Power', reps: [{ repId: 'ir-1', repName: 'Nicolas Garcia', percentage: 100 }] },
  { id: 'irca-5', entityId: 'c-5', entityName: 'Eastern Distributors', reps: [{ repId: 'ir-2', repName: 'Maria Santos', percentage: 100 }] },
];

// Inside Rep Assignments - by Factory/Manufacturer
export const mockInsideRepFactoryAssignments: RepAssignment[] = [
  { id: 'irfa-1', entityId: 'f-1', entityName: 'Test Factory', reps: [{ repId: 'ir-1', repName: 'Nicolas Garcia', percentage: 100 }] },
  { id: 'irfa-2', entityId: 'f-2', entityName: 'Acme Manufacturing', reps: [{ repId: 'ir-2', repName: 'Maria Santos', percentage: 100 }] },
  { id: 'irfa-3', entityId: 'f-3', entityName: 'Global Industries', reps: [{ repId: 'ir-3', repName: 'Alex Chen', percentage: 100 }] },
];

// Mock Sales Rep Selections
export const mockSalesRepSelections: SalesRepSelection[] = [
  {
    id: 'srs-1',
    factoryId: 'f-1',
    factoryName: 'Test Factory',
    customerId: 'c-1',
    customerName: 'ANDALUISA UTILITIES',
    reps: [{ id: 'or-1', name: 'Outside Rep', type: 'outside' }],
  },
];

// Helper function to get permission status
export function getPermissionStatus(permission: Permission): 'all' | 'customized' | 'none' {
  if (permission.view === 'all' && permission.write === 'all' && permission.delete === 'all') {
    return 'all';
  }
  if (permission.view === 'none' && permission.write === 'none' && permission.delete === 'none') {
    return 'none';
  }
  return 'customized';
}

// Helper function to get team counts by role
export function getTeamCounts(members: TeamMember[]) {
  const active = members.filter(m => m.status === 'active');
  const inactive = members.filter(m => m.status === 'inactive');

  return {
    outsideReps: active.filter(m => m.role === 'outside_rep').length,
    administrators: active.filter(m => m.role === 'administrator').length,
    insideReps: active.filter(m => m.role === 'inside_rep').length,
    owners: active.filter(m => m.role === 'owner').length,
    warehouseManagers: active.filter(m => m.role === 'warehouse_manager').length,
    warehouseEmployees: active.filter(m => m.role === 'warehouse_employee').length,
    drivers: active.filter(m => m.role === 'driver').length,
    totalActive: active.length,
    totalInactive: inactive.length,
  };
}

// Territory Management Types
export type TerritoryLevel = 'state' | 'city' | 'zip';

export interface TerritoryLocation {
  type: TerritoryLevel;
  value: string; // State code (e.g., "NC"), City name, or Zip code
  state?: string; // Required for city and zip
  city?: string; // Optional for zip
}

export interface Territory {
  id: string;
  name: string;
  color: string; // For map visualization
  locations: TerritoryLocation[];
  reps: RepSplit[];
  createdAt: string;
}

// Rep Territory - territory config per rep
export interface RepTerritory {
  repId: string;
  // Counties by state - if empty array for a state, means ALL counties in that state
  // Format: { stateCode: ['County Name', ...] } - empty array means whole state
  counties: { [stateCode: string]: string[] };
}

// County data for each state (subset of counties for demo purposes)
export const stateCounties: { [stateCode: string]: { name: string; fips: string }[] } = {
  'NC': [
    { name: 'Mecklenburg', fips: '119' },
    { name: 'Wake', fips: '183' },
    { name: 'Guilford', fips: '081' },
    { name: 'Forsyth', fips: '067' },
    { name: 'Durham', fips: '063' },
    { name: 'Cumberland', fips: '051' },
    { name: 'Buncombe', fips: '021' },
    { name: 'Gaston', fips: '071' },
    { name: 'New Hanover', fips: '129' },
    { name: 'Cabarrus', fips: '025' },
    { name: 'Union', fips: '179' },
    { name: 'Iredell', fips: '097' },
    { name: 'Catawba', fips: '035' },
    { name: 'Rowan', fips: '159' },
    { name: 'Davidson', fips: '057' },
  ],
  'SC': [
    { name: 'Greenville', fips: '045' },
    { name: 'Richland', fips: '079' },
    { name: 'Charleston', fips: '019' },
    { name: 'Horry', fips: '051' },
    { name: 'Spartanburg', fips: '083' },
    { name: 'Lexington', fips: '063' },
    { name: 'York', fips: '091' },
    { name: 'Anderson', fips: '007' },
    { name: 'Berkeley', fips: '015' },
    { name: 'Dorchester', fips: '035' },
  ],
  'GA': [
    { name: 'Fulton', fips: '121' },
    { name: 'Gwinnett', fips: '135' },
    { name: 'Cobb', fips: '067' },
    { name: 'DeKalb', fips: '089' },
    { name: 'Chatham', fips: '051' },
    { name: 'Clayton', fips: '063' },
    { name: 'Cherokee', fips: '057' },
    { name: 'Forsyth', fips: '117' },
    { name: 'Henry', fips: '151' },
    { name: 'Richmond', fips: '245' },
  ],
  'TX': [
    { name: 'Harris', fips: '201' },
    { name: 'Dallas', fips: '113' },
    { name: 'Tarrant', fips: '439' },
    { name: 'Bexar', fips: '029' },
    { name: 'Travis', fips: '453' },
    { name: 'Collin', fips: '085' },
    { name: 'Hidalgo', fips: '215' },
    { name: 'El Paso', fips: '141' },
    { name: 'Denton', fips: '121' },
    { name: 'Fort Bend', fips: '157' },
    { name: 'Montgomery', fips: '339' },
    { name: 'Williamson', fips: '491' },
  ],
  'OK': [
    { name: 'Oklahoma', fips: '109' },
    { name: 'Tulsa', fips: '143' },
    { name: 'Cleveland', fips: '027' },
    { name: 'Canadian', fips: '017' },
    { name: 'Comanche', fips: '031' },
    { name: 'Rogers', fips: '131' },
    { name: 'Wagoner', fips: '145' },
    { name: 'Payne', fips: '119' },
  ],
  'NY': [
    { name: 'Kings', fips: '047' },
    { name: 'Queens', fips: '081' },
    { name: 'New York', fips: '061' },
    { name: 'Suffolk', fips: '103' },
    { name: 'Bronx', fips: '005' },
    { name: 'Nassau', fips: '059' },
    { name: 'Westchester', fips: '119' },
    { name: 'Erie', fips: '029' },
    { name: 'Monroe', fips: '055' },
    { name: 'Richmond', fips: '085' },
    { name: 'Onondaga', fips: '067' },
    { name: 'Albany', fips: '001' },
  ],
  'NJ': [
    { name: 'Bergen', fips: '003' },
    { name: 'Middlesex', fips: '023' },
    { name: 'Essex', fips: '013' },
    { name: 'Hudson', fips: '017' },
    { name: 'Monmouth', fips: '025' },
    { name: 'Ocean', fips: '029' },
    { name: 'Union', fips: '039' },
    { name: 'Passaic', fips: '031' },
    { name: 'Camden', fips: '007' },
    { name: 'Morris', fips: '027' },
  ],
  'CT': [
    { name: 'Fairfield', fips: '001' },
    { name: 'Hartford', fips: '003' },
    { name: 'New Haven', fips: '009' },
    { name: 'New London', fips: '011' },
    { name: 'Litchfield', fips: '005' },
    { name: 'Middlesex', fips: '007' },
    { name: 'Tolland', fips: '013' },
    { name: 'Windham', fips: '015' },
  ],
  'FL': [
    { name: 'Miami-Dade', fips: '086' },
    { name: 'Broward', fips: '011' },
    { name: 'Palm Beach', fips: '099' },
    { name: 'Hillsborough', fips: '057' },
    { name: 'Orange', fips: '095' },
    { name: 'Pinellas', fips: '103' },
    { name: 'Duval', fips: '031' },
    { name: 'Lee', fips: '071' },
    { name: 'Polk', fips: '105' },
    { name: 'Brevard', fips: '009' },
  ],
  'CA': [
    { name: 'Los Angeles', fips: '037' },
    { name: 'San Diego', fips: '073' },
    { name: 'Orange', fips: '059' },
    { name: 'Riverside', fips: '065' },
    { name: 'San Bernardino', fips: '071' },
    { name: 'Santa Clara', fips: '085' },
    { name: 'Alameda', fips: '001' },
    { name: 'Sacramento', fips: '067' },
    { name: 'Contra Costa', fips: '013' },
    { name: 'Fresno', fips: '019' },
    { name: 'San Francisco', fips: '075' },
    { name: 'Ventura', fips: '111' },
  ],
};

// US States for selection
export const usStates = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

// Territory colors palette
export const territoryColors = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

// Mock Territories (legacy - keeping for backwards compatibility)
export const mockTerritories: Territory[] = [];

// Mock Rep Territories - territory config per rep
// counties: { stateCode: ['County1', 'County2', ...] } - empty array means ALL counties in that state
export const mockRepTerritories: RepTerritory[] = [
  {
    repId: 'or-3', // John Smith
    // All counties in NC, SC, GA
    counties: {
      'NC': [], // empty = all counties
      'SC': [],
      'GA': [],
    },
  },
  {
    repId: 'or-4', // Sarah Johnson
    // Specific counties in TX and OK
    counties: {
      'TX': ['Harris', 'Dallas', 'Travis'], // Houston, Dallas, Austin areas
      'OK': ['Oklahoma', 'Tulsa'],
    },
  },
  {
    repId: 'or-1', // Outside Rep
    // Specific counties in NY, all of NJ and CT
    counties: {
      'NY': ['Kings', 'Queens', 'New York', 'Bronx', 'Richmond'], // NYC boroughs
      'NJ': [],
      'CT': [],
    },
  },
];
