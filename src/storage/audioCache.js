import { initDB } from '@storage/db.js';
import { state } from '@core/state.js';

const STORE_NAME = state.DBConfig.STORE_NAME;

/**
 * 从 IndexedDB 获取音频缓存
 * 
 * @async
 * @param {string} path - 音频文件路径
 * @returns {Promise<Object|null>} 缓存对象或 null
 * 
 * 缓存对象结构：
 * {
 *   path: string,      // 音频路径（主键）
 *   blob: Blob,        // 音频数据
 *   timestamp: number, // 缓存时间戳
 *   cdnUrl: string     // 来源CDN URL
 * }
 */
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

/**
 * 保存音频到 IndexedDB 缓存
 * 
 * @async
 * @param {string} path - 音频文件路径
 * @param {Blob} blob - 音频数据
 * @param {string} cdnUrl - 来源CDN URL
 * @returns {Promise<void>}
 * 
 * 注意：
 * - 保存操作不会阻塞主流程
 * - 如果保存失败，只记录警告日志
 */
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

/**
 * 清理旧的音频缓存
 * 
 * @async
 * @param {string} currentCdnUrl - 当前使用的CDN URL
 * @returns {Promise<void>}
 * 
 * 清理条件：
 * 1. 缓存时间超过30天
 * 2. 缓存来源CDN与当前CDN不同（切换CDN时清理）
 * 
 * 注意：
 * 1. 切换CDN时会自动清理旧CDN的缓存
 * 2. 清理操作是异步的，不阻塞主流程
 */
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