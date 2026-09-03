// IndexedDB数据库配置
const DB_NAME = 'MaiButtonDB';
const DB_VERSION = 2;
const STORE_NAME = 'audioCache';
const CDN_STORE_NAME = 'cdnSettings';

// 初始化IndexedDB
export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'path' });
            }
            
            if (!db.objectStoreNames.contains(CDN_STORE_NAME)) {
                const cdnStore = db.createObjectStore(CDN_STORE_NAME, { keyPath: 'id' });
                cdnStore.createIndex('selected', 'selected', { unique: false });
            }
        };
    });
}