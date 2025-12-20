// 音频缓存管理器
class AudioCacheManager {
    constructor() {
        this.db = null;
        this.DB_NAME = 'mai-button-audio-cache';
        this.DB_VERSION = 1;
        this.STORE_NAME = 'audio-cache';
        
        // 音频文件基础路径
        this.BASE_PATH = 'public/voices/';
        
        // 缓存统计
        this.stats = {
            total: 0,
            cached: 0,
            size: 0
        };
    }

    // 初始化 IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = (event) => {
                console.error('IndexedDB 初始化失败:', event.target.error);
                resolve(false); // 不阻止应用启动，只是降级到普通加载
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB 初始化成功');
                resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'path' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('创建音频缓存存储空间');
                }
            };
        });
    }

    // 获取缓存的音频数据
    async getAudio(path) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(null); // 数据库未初始化
                return;
            }
            
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(path);
            
            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    // 检查缓存是否过期（30天）
                    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                    if (result.timestamp > thirtyDaysAgo) {
                        console.log('从缓存加载:', path);
                        this.stats.cached++;
                        resolve(result.blob);
                    } else {
                        // 缓存过期，删除并重新加载
                        this.deleteAudio(path);
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = (event) => {
                console.error('读取缓存失败:', event.target.error);
                resolve(null);
            };
        });
    }

    // 缓存音频数据
    async cacheAudio(path, audioBlob) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(false);
                return;
            }
            
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            
            const audioData = {
                path: path,
                blob: audioBlob,
                timestamp: Date.now(),
                size: audioBlob.size
            };
            
            const request = store.put(audioData);
            
            request.onsuccess = () => {
                console.log('音频已缓存:', path);
                this.stats.size += audioBlob.size;
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('缓存音频失败:', event.target.error);
                resolve(false);
            };
        });
    }

    // 删除缓存的音频
    async deleteAudio(path) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(false);
                return;
            }
            
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.delete(path);
            
            request.onsuccess = () => {
                console.log('已删除缓存:', path);
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('删除缓存失败:', event.target.error);
                resolve(false);
            };
        });
    }

    // 清空所有缓存
    async clearCache() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(false);
                return;
            }
            
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('已清空所有缓存');
                this.stats.cached = 0;
                this.stats.size = 0;
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('清空缓存失败:', event.target.error);
                resolve(false);
            };
        });
    }

    // 获取缓存统计
    getStats() {
        return {
            ...this.stats,
            formattedSize: this.formatBytes(this.stats.size)
        };
    }

    // 格式化为可读的文件大小
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // 计算所有缓存大小
    async calculateTotalCacheSize() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(0);
                return;
            }
            
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = (event) => {
                const items = event.target.result;
                const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
                this.stats.size = totalSize;
                resolve(totalSize);
            };
            
            request.onerror = (event) => {
                console.error('计算缓存大小失败:', event.target.error);
                resolve(0);
            };
        });
    }
}