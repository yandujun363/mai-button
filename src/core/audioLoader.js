import { state, CONCURRENCY } from '@core/state.js';
import { getAudioFromCache, saveAudioToCache } from '@storage/audioCache.js';

/**
 * 预加载单个音频文件
 * 
 * @async
 * @param {Object} voice - 音频配置对象
 * @param {string} voice.path - 音频文件路径
 * @param {Function} updateProgress - 进度更新回调函数
 * @returns {Promise<void>}
 * 
 * 加载流程：
 * 1. 检查内存缓存 → 命中则直接返回
 * 2. 检查 IndexedDB 缓存 → 命中则加载到内存
 * 3. 发起网络请求 → 保存到内存和 IndexedDB
 * 
 * 错误处理：
 * - 缓存读取失败：继续走网络请求
 * - 网络请求失败：计数进度后抛出错误
 * - 保存缓存失败：只记录警告，不影响主流程
 */
export async function preloadAudio(voice, updateProgress) {
    const path = voice.path;
    
    // 1. 检查内存缓存
    if (state.audioCache.has(path)) {
        state.loadedCount++;
        updateProgress?.();
        return;
    }
    
    // 2. 检查 IndexedDB 缓存
    try {
        const cached = await getAudioFromCache(path);
        if (cached?.blob) {
            state.audioCache.set(path, cached.blob);
            state.loadedCount++;
            updateProgress?.();
            return;
        }
    } catch (error) {
        console.warn(`读取缓存失败: ${path}`, error);
        // 缓存读取失败，继续走网络请求
    }
    
    // 3. 网络请求
    try {
        const blob = await fetchAudio(path);
        state.audioCache.set(path, blob);
        
        // 异步保存到 IndexedDB（不阻塞）
        saveAudioToCache(path, blob, state.audioUrl).catch(err => {
            console.warn(`保存缓存失败: ${path}`, err);
        });
        
        state.loadedCount++;
        updateProgress?.();
    } catch (error) {
        console.error(`音频加载失败: ${path}`, error);
        state.loadedCount++; // 仍然计数，避免进度卡死
        updateProgress?.();
        throw error; // 重新抛出，让上层知道失败了
    }
}

/**
 * 网络请求封装（使用 XMLHttpRequest）
 * 
 * @param {string} path - 音频文件路径
 * @returns {Promise<Blob>} 音频 Blob 对象
 * 
 * 特点：
 * - 使用 Blob 响应类型，便于缓存
 * - 超时时间：60秒
 * - 支持错误状态码处理
 * 
 * 为什么使用 XHR 而不是 fetch？
 * - XHR 支持更好的进度追踪
 * - XHR 的 Blob 响应更稳定
 * - 更细粒度的超时控制
 */
function fetchAudio(path) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${state.audioUrl}${path}`, true);
        xhr.responseType = 'blob';
        
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.response);
            } else {
                reject(new Error(`HTTP ${xhr.status}: ${path}`));
            }
        };
        
        xhr.onerror = () => reject(new Error(`网络错误: ${path}`));
        xhr.ontimeout = () => reject(new Error(`超时: ${path}`));
        xhr.timeout = 60000; // 60秒超时
        
        xhr.send();
    });
}

/**
 * 批量预加载音频（并发控制）
 * 
 * @async
 * @param {Array<Object>} voices - 音频配置数组
 * @param {Function} updateProgress - 进度更新回调
 * @returns {Promise<void>}
 * 
 * 并发控制原理：
 * 1. 维护一个任务队列
 * 2. 同时最多执行 CONCURRENCY 个任务
 * 3. 任务完成后自动从队列中取下一个
 * 4. 所有任务完成后 resolve
 * 
 * 进度更新：
 * - 每完成一个音频，调用一次 updateProgress
 * - 不会因为某个音频失败而中断整体流程
 * 
 * 错误处理：
 * - 单个音频加载失败只记录警告
 * - 不会阻止其他音频加载
 * - 失败音频的进度会计入已完成
 */
export async function batchPreload(voices, updateProgress) {
    // 重置状态
    state.totalToLoad = voices.length;
    state.loadedCount = 0;
    updateProgress?.();

    if (voices.length === 0) return;

    // 使用队列控制并发
    const queue = [...voices];
    let activeCount = 0;
    let completedCount = 0;
    let hasError = false;

    return new Promise((resolve, reject) => {
        function next() {
            // 所有任务完成
            if (completedCount === voices.length) {
                resolve();
                return;
            }

            // 达到并发上限 或 队列为空
            if (activeCount >= CONCURRENCY || queue.length === 0) {
                return;
            }

            // 取出下一个任务
            const voice = queue.shift();
            activeCount++;

            preloadAudio(voice, updateProgress)
                .catch((error) => {
                    hasError = true;
                    console.warn(`音频 ${voice.path} 预加载失败:`, error);
                })
                .finally(() => {
                    activeCount--;
                    completedCount++;
                    
                    // 继续处理下一个
                    next();
                    
                    // 如果所有任务完成，确保 resolve
                    if (completedCount === voices.length) {
                        resolve();
                    }
                });

            // 如果还有余量，继续启动下一个
            if (activeCount < CONCURRENCY && queue.length > 0) {
                next();
            }
        }

        // 启动初始任务（填满并发池）
        for (let i = 0; i < Math.min(CONCURRENCY, voices.length); i++) {
            next();
        }
    });
}