import { initDB } from '@storage/db.js';

const CDN_STORE_NAME = 'cdnSettings';

// 保存选中的CDN到IndexedDB
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

// 从IndexedDB获取选中的CDN
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