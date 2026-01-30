'use client';

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'flow-workflow-import';
const STORE_NAME = 'pending-imports';
const DB_VERSION = 1;

export interface WorkflowImportProduct {
  factoryPartNumber: string;
  description?: string;
  unitPrice: number | string;
  upc?: string;
  category?: string;
  defaultCommissionRate?: number | string;
  quantityPricing?: Array<{
    quantityLow: number | string;
    quantityHigh?: number | string | null;
    unitPrice: number | string;
  }>;
  customerPricing?: Array<{
    customerName: string;
    customerPartNumber?: string;
    unitPrice: number | string;
    commissionRate: number | string;
  }>;
}

export interface WorkflowImportData {
  sessionId: string;
  workflowId: string;
  workflowName: string;
  detectedFactory: string | null;
  products: WorkflowImportProduct[];
  outputFileUrl?: string;
  createdAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDb(): Promise<IDBPDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
        }
      },
    }).catch((error) => {
      console.warn('[WorkflowImportStorage] Failed to open IndexedDB:', error);
      dbPromise = null;
      return null as unknown as IDBPDatabase;
    });
  }

  return dbPromise;
}

export async function saveWorkflowImport(
  data: Omit<WorkflowImportData, 'sessionId' | 'createdAt'>
): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    console.warn('[WorkflowImportStorage] IndexedDB not available');
    return null;
  }

  const sessionId = crypto.randomUUID();
  const entry: WorkflowImportData = {
    ...data,
    sessionId,
    createdAt: Date.now(),
  };

  try {
    await db.put(STORE_NAME, entry);
    return sessionId;
  } catch (error) {
    console.error('[WorkflowImportStorage] Failed to save import data:', error);
    return null;
  }
}

export async function loadWorkflowImport(sessionId: string): Promise<WorkflowImportData | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const entry = await db.get(STORE_NAME, sessionId);
    return entry || null;
  } catch (error) {
    console.error('[WorkflowImportStorage] Failed to load import data:', error);
    return null;
  }
}

export async function clearWorkflowImport(sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.delete(STORE_NAME, sessionId);
  } catch (error) {
    console.warn('[WorkflowImportStorage] Failed to clear import data:', error);
  }
}

export async function cleanupOldImports(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  try {
    const all = await db.getAll(STORE_NAME);
    const oldEntries = all.filter((entry: WorkflowImportData) => entry.createdAt < oneDayAgo);

    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const entry of oldEntries) {
      await tx.store.delete(entry.sessionId);
    }
    await tx.done;

    if (oldEntries.length > 0) {
      console.log(`[WorkflowImportStorage] Cleaned up ${oldEntries.length} old imports`);
    }
  } catch (error) {
    console.warn('[WorkflowImportStorage] Failed to cleanup old imports:', error);
  }
}
