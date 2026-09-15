import { initDB } from '@storage/db.js';
import { state } from '@core/state.js';

const CDN_STORE_NAME = state.DBConfig.CDN_STORE_NAME;

/**
 * 保存选中的 CDN 到 IndexedDB
 * 
 * @async
 * @param {string} cdnId - 选中的 CDN ID
 * @param {Array<Object>} availableCdns - 所有可用的 CDN 配置
 * @returns {Promise<Object|null>} 保存的 CDN 数据或 null
 * 
 * 操作流程：
 * 1. 将所有现有记录的 selected 设为 false
 * 2. 创建新的记录，selected 设为 true
 * 3. 保存到 IndexedDB
 * 
 * 注意事项：
 * - 使用事务确保数据一致性
 * - 如果 CDN 不存在，返回 null
 * - 保存失败时返回 null 并记录警告
 */
export async function saveSelectedCdn(cdnId, availableCdns) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CDN_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CDN_STORE_NAME);
            
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const records = getAllRequest.result;
                
                const updatePromises = records.map(record => {
                    if (record.selected) {
                        record.selected = false;
                        return store.put(record);
                    }
                    return null;
                }).filter(p => p !== null);
                
                Promise.all(updatePromises.map(p => 
                    new Promise((res, rej) => {
                        p.onsuccess = res;
                        p.onerror = rej;
                    })
                )).then(() => {
                    const cdn = availableCdns.find(c => c.id === cdnId);
                    if (cdn) {
                        const cdnData = {
                            id: cdn.id,
                            url: cdn.url,
                            name: cdn.name,
                            selected: true,
                            timestamp: Date.now()
                        };
                        const request = store.put(cdnData);
                        request.onsuccess = () => resolve(cdnData);
                        request.onerror = () => reject(request.error);
                    } else {
                        resolve(null);
                    }
                });
            };
            
            getAllRequest.onerror = () => reject(getAllRequest.error);
        });
    } catch (error) {
        console.warn('保存CDN设置失败:', error);
        return null;
    }
}

/**
 * 从 IndexedDB 获取选中的 CDN
 * 
 * @async
 * @returns {Promise<Object|null>} 选中的 CDN 数据或 null
 * 
 * 查找逻辑：
 * 1. 获取所有 CDN 设置记录
 * 2. 查找 selected === true 的记录
 * 3. 返回第一个匹配的记录
 * 
 * 注意事项：
 * - 理想情况下只有一个记录为 selected: true
 * - 如果多个记录为 true，只返回第一个
 * - 如果没有记录，返回 null
 */
export async function getSelectedCdn() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CDN_STORE_NAME], 'readonly');
            const store = transaction.objectStore(CDN_STORE_NAME);
            
            const request = store.getAll();
            
            request.onsuccess = () => {
                const selectedCdn = request.result.find(cdn => cdn.selected === true);
                resolve(selectedCdn || null);
            };
            
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('获取CDN设置失败:', error);
        return null;
    }
}