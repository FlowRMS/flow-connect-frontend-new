// ============================================================================
// Flow CRM - Task Type Definitions
// Unified task system for CRM and Warehouse operations
// ============================================================================

// -----------------------------------------------------------------------------
// Task Types - Categories of tasks
// -----------------------------------------------------------------------------

// CRM Task Types (existing)
export type CrmTaskType =
  | 'Call'
  | 'Meeting'
  | 'Follow-up'
  | 'Site Visit'
  | 'Lunch-and-Learn'
  | 'Trade Show'
  | 'General'
  | 'Note/Action'
  | 'Waiting';

// Warehouse Task Types (new)
export type WarehouseTaskType =
  | 'Pick'
  | 'Pack'
  | 'Ship'
  | 'Receive'
  | 'Put Away'
  | 'Cycle Count'
  | 'Inventory Adjustment'
  | 'Restock'
  | 'Transfer'
  | 'Quality Check'
  | 'Returns Processing'
  | 'Warehouse General';

// Combined task type
export type TaskType = CrmTaskType | WarehouseTaskType;

// Task category to distinguish CRM vs Warehouse tasks
export type TaskCategory = 'crm' | 'warehouse';

// -----------------------------------------------------------------------------
// Task Status
// -----------------------------------------------------------------------------

export type TaskStatus = 'Today' | 'Overdue' | 'Upcoming' | 'Waiting' | 'Completed';

export type TaskPriority = 'No priority' | 'Low' | 'Medium' | 'High' | 'Urgent';

// -----------------------------------------------------------------------------
// Task Interface
// -----------------------------------------------------------------------------

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  reminderDate?: string;
  assignedTo: string;
  assignedToName?: string;
  taskType: TaskType;
  category: TaskCategory;        // 'crm' or 'warehouse'
  status: TaskStatus;
  tags: string[];
  priority: TaskPriority;
  completed?: boolean;
  completedAt?: string;
  comments?: number;

  // Entity linkages (for CRM tasks)
  entities?: {
    jobs?: string[];
    contacts?: string[];
    companies?: string[];
    quotes?: string[];
    orders?: string[];
  };

  // Warehouse-specific fields (for warehouse tasks)
  warehouse?: {
    warehouseId?: string;
    warehouseName?: string;
    waveId?: string;
    waveNumber?: string;
    fulfillmentId?: string;
    orderNumber?: string;
    shipmentId?: string;
    poNumber?: string;
    rmaId?: string;
    rmaNumber?: string;
    binLocation?: string;
    productId?: string;
    productName?: string;
    quantity?: number;
    // For cycle count tasks
    expectedQuantity?: number;
    actualQuantity?: number;
  };

  // Audit fields
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// -----------------------------------------------------------------------------
// Task Type Labels and Colors
// -----------------------------------------------------------------------------

export const taskTypeLabels: Record<TaskType, string> = {
  // CRM types
  'Call': 'Call',
  'Meeting': 'Meeting',
  'Follow-up': 'Follow-up',
  'Site Visit': 'Site Visit',
  'Lunch-and-Learn': 'Lunch & Learn',
  'Trade Show': 'Trade Show',
  'General': 'General',
  'Note/Action': 'Note/Action',
  'Waiting': 'Waiting',
  // Warehouse types
  'Pick': 'Pick',
  'Pack': 'Pack',
  'Ship': 'Ship',
  'Receive': 'Receive',
  'Put Away': 'Put Away',
  'Cycle Count': 'Cycle Count',
  'Inventory Adjustment': 'Inventory Adjustment',
  'Restock': 'Restock',
  'Transfer': 'Transfer',
  'Quality Check': 'Quality Check',
  'Returns Processing': 'Returns Processing',
  'Warehouse General': 'Warehouse General',
};

export const taskTypeColors: Record<TaskType, string> = {
  // CRM types
  'Call': 'bg-blue-100 text-blue-700',
  'Meeting': 'bg-purple-100 text-purple-700',
  'Follow-up': 'bg-yellow-100 text-yellow-700',
  'Site Visit': 'bg-green-100 text-green-700',
  'Lunch-and-Learn': 'bg-orange-100 text-orange-700',
  'Trade Show': 'bg-pink-100 text-pink-700',
  'General': 'bg-gray-100 text-gray-700',
  'Note/Action': 'bg-indigo-100 text-indigo-700',
  'Waiting': 'bg-amber-100 text-amber-700',
  // Warehouse types
  'Pick': 'bg-cyan-100 text-cyan-700',
  'Pack': 'bg-teal-100 text-teal-700',
  'Ship': 'bg-sky-100 text-sky-700',
  'Receive': 'bg-emerald-100 text-emerald-700',
  'Put Away': 'bg-lime-100 text-lime-700',
  'Cycle Count': 'bg-violet-100 text-violet-700',
  'Inventory Adjustment': 'bg-fuchsia-100 text-fuchsia-700',
  'Restock': 'bg-rose-100 text-rose-700',
  'Transfer': 'bg-amber-100 text-amber-700',
  'Quality Check': 'bg-red-100 text-red-700',
  'Returns Processing': 'bg-orange-100 text-orange-700',
  'Warehouse General': 'bg-slate-100 text-slate-700',
};

export const taskStatusColors: Record<TaskStatus, string> = {
  'Today': 'bg-blue-100 text-blue-700',
  'Overdue': 'bg-red-100 text-red-700',
  'Upcoming': 'bg-green-100 text-green-700',
  'Waiting': 'bg-yellow-100 text-yellow-700',
  'Completed': 'bg-gray-100 text-gray-700',
};

export const taskPriorityColors: Record<TaskPriority, string> = {
  'No priority': 'bg-gray-100 text-gray-600',
  'Low': 'bg-blue-100 text-blue-700',
  'Medium': 'bg-yellow-100 text-yellow-700',
  'High': 'bg-orange-100 text-orange-700',
  'Urgent': 'bg-red-100 text-red-700',
};

// -----------------------------------------------------------------------------
// Warehouse Task Tags
// -----------------------------------------------------------------------------

export const warehouseTaskTags = [
  'Priority',
  'Expedite',
  'Fragile',
  'Heavy',
  'Hazmat',
  'Temperature Controlled',
  'Large Item',
  'Multi-Location',
  'Customer Pickup',
  'LTL',
  'Parcel',
  'Pallet',
];

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

export function isWarehouseTask(task: Task): boolean {
  return task.category === 'warehouse';
}

export function isCrmTask(task: Task): boolean {
  return task.category === 'crm';
}

export function getTaskTypeCategory(taskType: TaskType): TaskCategory {
  const warehouseTypes: WarehouseTaskType[] = [
    'Pick', 'Pack', 'Ship', 'Receive', 'Put Away', 'Cycle Count',
    'Inventory Adjustment', 'Restock', 'Transfer', 'Quality Check',
    'Returns Processing', 'Warehouse General'
  ];
  return warehouseTypes.includes(taskType as WarehouseTaskType) ? 'warehouse' : 'crm';
}

export function computeTaskStatus(task: Task): TaskStatus {
  if (task.completed) return 'Completed';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  if (task.taskType === 'Waiting') return 'Waiting';
  if (dueDate < today) return 'Overdue';
  if (dueDate.getTime() === today.getTime()) return 'Today';
  return 'Upcoming';
}
