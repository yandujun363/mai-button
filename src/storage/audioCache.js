import { initDB } from '@storage/db.js';

const STORE_NAME = 'audioCache';

// 从IndexedDB获取音频
export async function getAudioFromCache(path) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(path);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('从缓存获取音频失败:', error);
        return null;
    }
}

// 保存音频到IndexedDB
export async function saveAudioToCache(path, blob, cdnUrl) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ 
                path, 
                blob, 
                timestamp: Date.now(),
                cdnUrl: cdnUrl
            });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('保存音频到缓存失败:', error);
    }
}

// 清理旧的缓存（超过30天）
export async function cleanupOldCache(currentCdnUrl) {
    try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            
            request.result.forEach(item => {
                if (item.timestamp < thirtyDaysAgo || 
                    (item.cdnUrl && item.cdnUrl !== currentCdnUrl)) {
                    store.delete(item.path);
                }
            });
        };
    } catch (error) {
        console.warn('清理缓存失败:', error);
    }
}