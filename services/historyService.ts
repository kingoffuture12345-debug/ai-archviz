
import { HistoryItem } from '../types';
import { openDB, HISTORY_STORE_NAME } from './dbService';

export const saveHistoryItem = async (item: HistoryItem): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE_NAME);
    store.put(item);

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject('Transaction error on save.');
    });
};

export const getHistory = async (): Promise<HistoryItem[]> => {
    const db = await openDB();
    const transaction = db.transaction(HISTORY_STORE_NAME, 'readonly');
    const store = transaction.objectStore(HISTORY_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            // Sort by timestamp descending to get newest first
            resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
        };
        request.onerror = () => reject('Transaction error on get all.');
    });
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE_NAME);
    store.delete(id);

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject('Transaction error on delete.');
    });
};

export const clearHistory = async (): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE_NAME);
    store.clear();
    
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject('Transaction error on clear.');
    });
};
