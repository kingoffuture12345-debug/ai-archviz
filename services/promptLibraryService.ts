
import { LibraryItem } from '../types';
import { openDB, PROMPT_STORE_NAME } from './dbService';

export const saveLibraryItem = async (item: LibraryItem): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(PROMPT_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PROMPT_STORE_NAME);
    store.put(item);

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
            const error = transaction.error;
            console.error("Transaction error on save:", error);
            const errorMessage = error ? `${error.name}: ${error.message}` : "Unknown transaction error on save.";
            reject(new Error(errorMessage));
        };
    });
};

export const getLibraryItems = async (): Promise<LibraryItem[]> => {
    const db = await openDB();
    const transaction = db.transaction(PROMPT_STORE_NAME, 'readonly');
    const store = transaction.objectStore(PROMPT_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result.sort((a, b) => a.name.localeCompare(b.name)));
        };
        request.onerror = () => {
            const error = request.error;
            console.error("Request error on get all:", error);
            const errorMessage = error ? `${error.name}: ${error.message}` : "Unknown request error on get all.";
            reject(new Error(errorMessage));
        };
    });
};

export const deleteLibraryItem = async (id: string, allItems: LibraryItem[]): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(PROMPT_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(PROMPT_STORE_NAME);
    
    // Find all children recursively and delete them
    const idsToDelete: string[] = [id];
    const findChildren = (parentId: string) => {
        const children = allItems.filter(item => item.parentId === parentId);
        children.forEach(child => {
            idsToDelete.push(child.id);
            if (child.type === 'library') {
                findChildren(child.id);
            }
        });
    };

    findChildren(id);
    idsToDelete.forEach(itemId => store.delete(itemId));

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
            const error = transaction.error;
            console.error("Transaction error on delete:", error);
            const errorMessage = error ? `${error.name}: ${error.message}` : "Unknown transaction error on delete.";
            reject(new Error(errorMessage));
        };
    });
};
