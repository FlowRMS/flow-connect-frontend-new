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
  { id: 'ir-1', name: 'Outside Rep', roleDisplay: 'Inside rep', email: 'nicolas.inside@flowrms.com', role: 'inside_rep', status: 'active' },
  { id: 'ir-2', name: 'Outside Rep', roleDisplay: 'Inside rep', email: 'nicolas.test@flowrms.com', role: 'inside_rep', status: 'active' },
  { id: 'ir-3', name: 'Inside Rep', roleDisplay: 'Inside rep', email: 'support+inside@flowrms.com', role: 'inside_rep', status: 'active' },
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
  { id: 'inside_rep', label: 'Inside rep' },
  { id: 'outside_rep', label: 'Outside rep' },
  { id: 'warehouse_manager', label: 'Warehouse manager' },
  { id: 'warehouse_employee', label: 'Warehouse employee' },
  { id: 'driver', label: 'Driver' },
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
