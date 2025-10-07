import { INITIAL_PROMPT_LIBRARY_DATA } from './promptLibrarySeed';

const DB_NAME = 'AIArchVizDB';
const DB_VERSION = 2;
export const HISTORY_STORE_NAME = 'designHistory';
export const PROMPT_STORE_NAME = 'promptLibrary';

let dbPromise: Promise<IDBDatabase> | null = null;

export const openDB = (): Promise<IDBDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            
            // Create history store if it doesn't exist
            if (!dbInstance.objectStoreNames.contains(HISTORY_STORE_NAME)) {
                dbInstance.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id' });
            }

            // Create prompt library store if it doesn't exist and seed it with initial data
            if (!dbInstance.objectStoreNames.contains(PROMPT_STORE_NAME)) {
                const promptStore = dbInstance.createObjectStore(PROMPT_STORE_NAME, { keyPath: 'id' });
                // Seed the database with initial data
                INITIAL_PROMPT_LIBRARY_DATA.forEach(item => {
                    promptStore.put(item);
                });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            const error = (event.target as IDBOpenDBRequest).error;
            console.error('IndexedDB error:', error);
            const errorMessage = error ? `${error.name}: ${error.message}` : 'Error opening IndexedDB.';
            reject(new Error(errorMessage));
        };
    });

    return dbPromise;
};
