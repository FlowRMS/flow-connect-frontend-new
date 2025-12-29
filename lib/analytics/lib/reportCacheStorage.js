"use client";

import { openDB } from "idb";

const DB_NAME = "flow-analytics-report-cache";
const STORE_NAME = "entries";
const DB_VERSION = 1;

let dbPromise = null;

async function getDb() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      },
    }).catch((error) => {
      console.warn("[ReportCacheStorage] Failed to open IndexedDB:", error);
      dbPromise = null;
      return null;
    });
  }

  return dbPromise;
}

export async function loadPersistedEntries() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.getAll(STORE_NAME);
  } catch (error) {
    console.warn("[ReportCacheStorage] Failed to load entries:", error);
    return [];
  }
}

export async function persistEntries(entries) {
  const db = await getDb();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    await tx.store.clear();

    for (const entry of entries) {
      await tx.store.put(entry);
    }

    await tx.done;
  } catch (error) {
    console.warn("[ReportCacheStorage] Failed to persist entries:", error);
  }
}

export async function removeEntries(keys) {
  const db = await getDb();
  if (!db || !Array.isArray(keys) || keys.length === 0) return;

  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    for (const key of keys) {
      await tx.store.delete(key);
    }
    await tx.done;
  } catch (error) {
    console.warn("[ReportCacheStorage] Failed to remove entries:", error);
  }
}

export async function clearPersistedEntries() {
  const db = await getDb();
  if (!db) return;

  try {
    await db.clear(STORE_NAME);
  } catch (error) {
    console.warn("[ReportCacheStorage] Failed to clear entries:", error);
  }
}
