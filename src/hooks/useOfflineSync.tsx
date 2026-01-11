import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncQueueItem {
  id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  local_id: string;
  record_data: Record<string, unknown>;
  created_at: string;
}

const DB_NAME = "nawap_offline_db";
const DB_VERSION = 1;
const STORES = ["sync_queue", "clients", "assets", "loans", "payments"];

type SyncableTable = 'clients' | 'assets' | 'loans' | 'payments';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open IndexedDB");
    };

    request.onsuccess = () => {
      setDb(request.result);
      updatePendingCount(request.result);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      STORES.forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: "local_id" });
          if (storeName === "sync_queue") {
            store.createIndex("synced", "synced", { unique: false });
          }
        }
      });
    };
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online! Syncing data...");
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline. Changes will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [db]);

  const updatePendingCount = async (database: IDBDatabase) => {
    return new Promise<number>((resolve) => {
      const transaction = database.transaction("sync_queue", "readonly");
      const store = transaction.objectStore("sync_queue");
      const index = store.index("synced");
      const request = index.count(IDBKeyRange.only(false));

      request.onsuccess = () => {
        setPendingCount(request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(0);
      };
    });
  };

  const addToSyncQueue = useCallback(async (
    tableName: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    localId: string,
    recordData: Record<string, unknown>
  ) => {
    if (!db) return;

    const item: SyncQueueItem & { synced: boolean } = {
      id: crypto.randomUUID(),
      table_name: tableName,
      operation,
      local_id: localId,
      record_data: recordData,
      created_at: new Date().toISOString(),
      synced: false,
    };

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("sync_queue", "readwrite");
      const store = transaction.objectStore("sync_queue");
      const request = store.add({ ...item, local_id: item.id });

      request.onsuccess = () => {
        updatePendingCount(db);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }, [db]);

  const saveLocally = useCallback(async (
    storeName: string,
    data: Record<string, unknown> & { local_id?: string }
  ) => {
    if (!db) return null;

    const localId = data.local_id || crypto.randomUUID();
    const record = { ...data, local_id: localId, sync_status: 'pending' };

    return new Promise<string>((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(record);

      request.onsuccess = () => {
        resolve(localId);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }, [db]);

  const getLocalData = useCallback(async <T,>(storeName: string): Promise<T[]> => {
    if (!db) return [];

    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  }, [db]);

  const syncPendingChanges = useCallback(async () => {
    if (!db || !isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      const transaction = db.transaction("sync_queue", "readonly");
      const store = transaction.objectStore("sync_queue");
      const index = store.index("synced");
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = async () => {
        const pendingItems = request.result as (SyncQueueItem & { synced: boolean })[];
        let syncedCount = 0;
        
        for (const item of pendingItems) {
          try {
            const tableName = item.table_name as SyncableTable;
            
            // Sync to Supabase
            if (item.operation === 'INSERT') {
              const { local_id, sync_status, ...data } = item.record_data;
              const { error } = await supabase.from(tableName).insert(data as any);
              if (error) throw error;
            } else if (item.operation === 'UPDATE') {
              const { id, local_id, sync_status, ...data } = item.record_data;
              if (id) {
                const { error } = await supabase.from(tableName).update(data as any).eq('id', id as string);
                if (error) throw error;
              }
            } else if (item.operation === 'DELETE') {
              const { id } = item.record_data as { id?: string };
              if (id) {
                const { error } = await supabase.from(tableName).update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
                if (error) throw error;
              }
            }

            // Mark as synced
            const updateTx = db.transaction("sync_queue", "readwrite");
            const updateStore = updateTx.objectStore("sync_queue");
            updateStore.put({ ...item, synced: true });
            syncedCount++;
          } catch (error) {
            console.error("Sync error for item:", item.id, error);
          }
        }

        await updatePendingCount(db);
        if (syncedCount > 0) {
          toast.success(`Synced ${syncedCount} changes`);
        }
      };
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Sync failed. Will retry when online.");
    } finally {
      setIsSyncing(false);
    }
  }, [db, isOnline, isSyncing]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    addToSyncQueue,
    saveLocally,
    getLocalData,
    syncPendingChanges,
  };
};
