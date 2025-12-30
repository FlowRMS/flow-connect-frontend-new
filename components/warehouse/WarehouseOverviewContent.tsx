'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  mockHighPriorityOrders,
  mockWarehouseTasks,
  mockIncomingShipments,
  mockStockControlItems,
  getInventoryStats,
  getFulfillmentStats,
  getWarehouseStats,
} from '@/lib/data/warehouse-mock';
import { shipmentStatusColors, shipmentStatusLabels } from '@/lib/types/warehouse';
import { Task, taskTypeColors, taskPriorityColors, taskTypeLabels } from '@/lib/types/tasks';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';

export default function WarehouseOverviewContent() {
  const { selectedWarehouse } = useWarehouse();
  const [tasks, setTasks] = useState<Task[]>(mockWarehouseTasks);

  const inventoryStats = useMemo(() => getInventoryStats(), []);
  const fulfillmentStats = useMemo(() => getFulfillmentStats(), []);
  const warehouseStats = useMemo(() => getWarehouseStats(), []);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : undefined,
            status: !task.completed ? 'Completed' : 'Today'
          }
        : task
    ));
  };

  // Filter to show only today's warehouse tasks
  const todaysTasks = tasks.filter(t => t.status === 'Today' || t.status === 'Completed');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Warehouse Overview</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Control center for warehouse operations
          </p>
        </div>
        <WarehouseSelector />
      </div>

      {/* Stats Cards - Clickable to navigate to relevant pages */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Link
          href="/warehouse/inventory"
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 transition-all cursor-pointer hover:shadow-md hover:border-[var(--primary)]/50"
        >
          <div className="text-sm text-[var(--muted-foreground)]">Total Products</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{inventoryStats.totalProducts}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">In inventory</div>
        </Link>
        <Link
          href="/warehouse/inventory?filter=available"
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 transition-all cursor-pointer hover:shadow-md hover:border-[var(--primary)]/50"
        >
          <div className="text-sm text-[var(--muted-foreground)]">Available Units</div>
          <div className="text-2xl font-semibold text-green-600 mt-1">{inventoryStats.availableQuantity.toLocaleString()}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Ready to ship</div>
        </Link>
        <Link
          href="/warehouse/fulfillment?filter=pending"
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 transition-all cursor-pointer hover:shadow-md hover:border-[var(--primary)]/50"
        >
          <div className="text-sm text-[var(--muted-foreground)]">Pending Fulfillment</div>
          <div className="text-2xl font-semibold text-yellow-600 mt-1">{fulfillmentStats.pendingFulfillments}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Orders to process</div>
        </Link>
        <Link
          href="/warehouse/deliveries"
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 transition-all cursor-pointer hover:shadow-md hover:border-[var(--primary)]/50"
        >
          <div className="text-sm text-[var(--muted-foreground)]">Incoming Deliveries</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">{warehouseStats.pendingShipments}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Expected deliveries</div>
        </Link>
        <Link
          href="/warehouse/inventory?filter=low_stock"
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 transition-all cursor-pointer hover:shadow-md hover:border-[var(--primary)]/50"
        >
          <div className="text-sm text-[var(--muted-foreground)]">Low Stock Items</div>
          <div className="text-2xl font-semibold text-red-600 mt-1">{inventoryStats.lowStockCount}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">Below reorder point</div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Today's High-Priority Orders */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Today&apos;s High-Priority Orders
            </h2>
            <Link href="/warehouse/fulfillment" className="text-sm text-[var(--primary)] hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {mockHighPriorityOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-[var(--muted-foreground)]">
                No high-priority orders today
              </div>
            ) : (
              mockHighPriorityOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-[var(--muted)]/20 transition-colors">
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{order.orderNumber}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">{order.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[var(--foreground)]">{order.itemCount} items</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{formatDate(order.orderDate)}</div>
                  </div>
                  <Link href={`/warehouse/fulfillment?order=${order.id}`} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Warehouse Tasks */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Today&apos;s Tasks
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--muted-foreground)]">
                {todaysTasks.filter(t => t.completed).length}/{todaysTasks.length} completed
              </span>
              <Link href="/tasks?category=warehouse" className="text-sm text-[var(--primary)] hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-[var(--border)] max-h-[340px] overflow-y-auto">
            {todaysTasks.map((task) => (
              <div
                key={task.id}
                className="px-6 py-3 flex items-start gap-3 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                onClick={() => toggleTask(task.id)}
              >
                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                  task.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-[var(--border)] hover:border-[var(--primary)]'
                }`}>
                  {task.completed && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${task.completed ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>
                      {task.title}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${taskTypeColors[task.taskType]}`}>
                      {taskTypeLabels[task.taskType]}
                    </span>
                  </div>
                  {task.assignedToName && (
                    <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Assigned to {task.assignedToName}
                      {task.warehouse?.binLocation && ` • ${task.warehouse.binLocation}`}
                      {task.warehouse?.waveNumber && ` • Wave ${task.warehouse.waveNumber}`}
                      {task.warehouse?.orderNumber && ` • Order ${task.warehouse.orderNumber}`}
                    </div>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${taskPriorityColors[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incoming Shipments */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Incoming Shipments
          </h2>
          <Link href="/warehouse/deliveries" className="text-sm text-[var(--primary)] hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">ETA</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {mockIncomingShipments.slice(0, 5).map((shipment) => (
                <tr key={shipment.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{shipment.poNumber}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{shipment.vendorName}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{formatDate(shipment.eta)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${shipmentStatusColors[shipment.status]}`}>
                      {shipmentStatusLabels[shipment.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Control */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Stock Control</h2>
          <Link href="/warehouse/inventory" className="text-sm text-[var(--primary)] hover:underline">
            View all inventory
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 p-6">
          {mockStockControlItems.map((item) => (
            <div key={item.id} className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--muted)]/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)]">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[var(--foreground)]">{item.productName}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-1">{item.productDescription}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                  <span className="text-[var(--muted-foreground)]">Bin: </span>
                  <span className="text-[var(--foreground)] font-medium">{item.binLocation}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Shelf: </span>
                  <span className="text-[var(--foreground)] font-medium">{item.shelfNumber}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-semibold text-[var(--foreground)]">${item.price.toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    item.status === 'in_stock' ? 'text-green-600' :
                    item.status === 'low_stock' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.inventoryCount}
                  </span>
                  <Link href={`/warehouse/inventory?product=${item.productId}`} className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
