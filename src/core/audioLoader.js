import { state, CONCURRENCY } from '@core/state.js';
import { getAudioFromCache, saveAudioToCache } from '@storage/audioCache.js';

// 预加载音频
export async function preloadAudio(voice, updateProgress) {
    const path = voice.path;
    
    if (state.audioCache.has(path)) {
        state.loadedCount++;
        updateProgress();
        return Promise.resolve();
    }
    
    const cached = await getAudioFromCache(path);
    if (cached && cached.blob) {
        state.audioCache.set(path, cached.blob);
        state.loadedCount++;
        updateProgress();
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${state.audioUrl}${path}`, true);
        xhr.responseType = 'blob';
        
        xhr.onload = async () => {
            if (xhr.status === 200) {
                const blob = xhr.response;
                state.audioCache.set(path, blob);
                saveAudioToCache(path, blob, state.audioUrl);
                state.loadedCount++;
                updateProgress();
                resolve();
            } else {
                reject(new Error(`加载失败: ${path}`));
            }
        };
        
        xhr.onerror = () => reject(new Error(`网络错误: ${path}`));
        xhr.send();
    });
}

// 批量预加载
export async function batchPreload(voices, updateProgress) {
    state.totalToLoad = voices.length;
    state.loadedCount = 0;
    
    updateProgress();
    
    const batches = [];
    
    for (let i = 0; i < voices.length; i += CONCURRENCY) {
        const batch = voices.slice(i, i + CONCURRENCY);
        const promises = batch.map(voice => 
            preloadAudio(voice, updateProgress).catch(error => {
                console.warn(`音频 ${voice.path} 预加载失败:`, error);
                state.loadedCount++;
                updateProgress();
            })
        );
        
        batches.push(Promise.all(promises));
    }
    
    for (const batch of batches) {
        await batch;
    }
}