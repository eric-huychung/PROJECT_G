/**
 * IndexedDB adapter — persists CSV bytes and schema for workspace rehydrate.
 */

import type { workspace_snapshot } from "@/lib/types/workspace";

const DB_NAME = "project_g_workspace";
const DB_VERSION = 1;
const STORE_NAME = "workspace";
const WORKSPACE_KEY = "current";

function open_db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB."));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function idb_request<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed."));
    };
  });
}

/** Replaces the current workspace snapshot in IndexedDB. */
export async function save_workspace(
  snapshot: workspace_snapshot,
): Promise<void> {
  const db = await open_db();

  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    await idb_request(store.put(snapshot, WORKSPACE_KEY));
  } finally {
    db.close();
  }
}

/** Returns the saved workspace, or null when none exists. */
export async function load_workspace(): Promise<workspace_snapshot | null> {
  const db = await open_db();

  try {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const result = await idb_request(store.get(WORKSPACE_KEY));
    return (result as workspace_snapshot | undefined) ?? null;
  } finally {
    db.close();
  }
}

/** Merges partial fields into the current workspace snapshot. */
export async function patch_workspace(
  partial: Partial<workspace_snapshot>,
): Promise<void> {
  const current = await load_workspace();
  if (!current) {
    throw new Error("No workspace to update.");
  }

  await save_workspace({ ...current, ...partial });
}

/** Deletes the saved workspace — used by clear-workspace. */
export async function clear_workspace(): Promise<void> {
  const db = await open_db();

  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    await idb_request(store.delete(WORKSPACE_KEY));
  } finally {
    db.close();
  }
}
