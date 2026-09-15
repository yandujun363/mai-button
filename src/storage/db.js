import { state } from '@core/state.js';

/**
 * IndexedDB 数据库名称
 */
const DB_NAME = state.DBConfig.DB_NAME;

/**
 * IndexedDB 数据库版本
 */
const DB_VERSION = state.DBConfig.DB_VERSION;

/**
 * 音频缓存存储名称
 * 
 * 存储音频 Blob 数据
 * - keyPath: 'path'（音频路径作为主键）
 * - 每条记录：{ path, blob, timestamp, cdnUrl }
 */
const STORE_NAME = state.DBConfig.STORE_NAME;

/**
 * CDN 设置存储名称
 * 
 * 存储用户 CDN 偏好
 * - keyPath: 'id'（CDN ID 作为主键）
 * - 索引：'selected'（用于快速查找选中的 CDN）
 * - 每条记录：{ id, url, name, selected, timestamp }
 */
const CDN_STORE_NAME = state.DBConfig.CDN_STORE_NAME;

/**
 * 初始化 IndexedDB 数据库
 * 
 * @async
 * @returns {Promise<IDBDatabase>} 数据库连接对象
 * 
 * 功能：
 * 1. 打开数据库
 * 2. 如果版本变化，触发 upgrade 事件
 * 3. 创建所需的对象存储和索引
 * 
 * 注意事项：
 * - 使用 Promise 封装，便于 async/await
 * - 错误会通过 Promise reject 传递
 * - 数据库连接需要在使用后关闭（或保持打开）
 */
export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        /**
         * 数据库升级事件
         * 
         * 当数据库版本号增加时触发
         * 用于创建或更新对象存储结构
         */
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // 检查并创建 audioCache 存储
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'path' });
            }
            
            // 检查并创建 cdnSettings 存储
            if (!db.objectStoreNames.contains(CDN_STORE_NAME)) {
                const cdnStore = db.createObjectStore(CDN_STORE_NAME, { keyPath: 'id' });
                // 创建索引以加速查询
                cdnStore.createIndex('selected', 'selected', { unique: false });
            }
        };
    });
}