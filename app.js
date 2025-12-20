// ES模块版本
import { zhLocale } from './src/locales/zh.js';
import { voices } from './src/config/voices.js';

// 全局状态
const state = {
    currentLang: 'zh',
    isLoopMode: false,
    playingAudios: new Map(), // 存储正在播放的音频及其循环状态
    audioCache: new Map(), // 内存缓存已加载的音频Blob
    voices: [],
    locales: {
        zh: zhLocale,
        en: zhLocale, // 暂时使用中文，可后续添加英文
        ja: zhLocale  // 暂时使用中文，可后续添加日文
    },
    totalToLoad: 0,
    loadedCount: 0
};

// IndexedDB数据库配置
const DB_NAME = 'MaiButtonDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioCache';

// 初始化IndexedDB
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'path' });
            }
        };
    });
}

// 从IndexedDB获取音频
async function getAudioFromCache(path) {
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
async function saveAudioToCache(path, blob) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ path, blob, timestamp: Date.now() });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('保存音频到缓存失败:', error);
    }
}

// 清理旧的缓存（超过30天）
async function cleanupOldCache() {
    try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            request.result.forEach(item => {
                if (item.timestamp < thirtyDaysAgo) {
                    store.delete(item.path);
                }
            });
        };
    } catch (error) {
        console.warn('清理缓存失败:', error);
    }
}

// 预加载音频
async function preloadAudio(voice, updateProgress) {
    const path = voice.path;
    
    // 先检查内存缓存
    if (state.audioCache.has(path)) {
        state.loadedCount++;
        updateProgress();
        return Promise.resolve();
    }
    
    // 检查IndexedDB缓存
    const cached = await getAudioFromCache(path);
    if (cached && cached.blob) {
        state.audioCache.set(path, cached.blob);
        state.loadedCount++;
        updateProgress();
        return Promise.resolve();
    }
    
    // 从网络加载
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `public/voices/${path}`, true);
        xhr.responseType = 'blob';
        
        xhr.onload = async () => {
            if (xhr.status === 200) {
                const blob = xhr.response;
                state.audioCache.set(path, blob);
                
                // 异步保存到IndexedDB
                saveAudioToCache(path, blob);
                
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

// 更新加载进度
function updateProgress() {
    const progress = document.getElementById('loadingProgress');
    const progressText = document.getElementById('loadingProgressText');
    
    if (progress && progressText) {
        const percentage = Math.round((state.loadedCount / state.totalToLoad) * 100);
        progress.style.width = `${percentage}%`;
        progressText.textContent = `${state.loadedCount}/${state.totalToLoad}`;
    }
}

// 批量预加载
async function batchPreload(voices) {
    state.totalToLoad = voices.length;
    state.loadedCount = 0;
    
    // 更新进度显示
    updateProgress();
    
    // 并行加载，但控制并发数
    const CONCURRENCY = 5;
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
    
    // 等待所有批次完成
    for (const batch of batches) {
        await batch;
    }
}

// 渲染音频按钮
function renderVoiceButtons() {
    const container = document.getElementById('voiceContainer');
    if (!container) return;
    
    // 按标签分组
    const groupedVoices = groupVoicesByTag(state.voices);
    
    // 清空容器
    container.innerHTML = '';
    
    // 渲染每个分组
    Object.keys(groupedVoices).forEach(tag => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'voice-category';
        
        // 渲染分类标题
        const tagName = getLocalizedTag(tag);
        categoryElement.innerHTML = `<h2>${tagName}</h2><div class="voice-buttons"></div>`;
        
        // 渲染按钮
        const buttonsContainer = categoryElement.querySelector('.voice-buttons');
        groupedVoices[tag].forEach(voice => {
            buttonsContainer.appendChild(createVoiceButton(voice));
        });
        
        container.appendChild(categoryElement);
    });
}

// 按标签分组
function groupVoicesByTag(voices) {
    return voices.reduce((groups, voice) => {
        if (!groups[voice.tag]) {
            groups[voice.tag] = [];
        }
        groups[voice.tag].push(voice);
        return groups;
    }, {});
}

// 创建音频按钮
function createVoiceButton(voice) {
    const wrapper = document.createElement('div');
    wrapper.className = 'haruka-button';
    wrapper.dataset.path = voice.path;
    
    const title = getLocalizedVoiceTitle(voice);
    let buttonHtml = '';
    
    // 如果标题过长，添加tooltip
    if (title.length > 15) {
        buttonHtml = `
            <div class="tooltip">
                <button>${title.substring(0, 15)}...</button>
                <span class="tooltip-text">${title}</span>
            </div>
        `;
    } else {
        buttonHtml = `<button>${title}</button>`;
    }
    
    wrapper.innerHTML = buttonHtml;
    
    // 添加点击事件
    wrapper.querySelector('button').addEventListener('click', () => {
        playVoice(voice);
    });
    
    return wrapper;
}

// 获取本地化的标签名
function getLocalizedTag(tag) {
    return state.locales[state.currentLang].tags[tag] || tag;
}

// 获取本地化的音频标题
function getLocalizedVoiceTitle(voice) {
    return voice.messages[state.currentLang] || 
           voice.messages.zh || 
           Object.values(voice.messages)[0] || 
           '未知音频';
}

// 播放音频
async function playVoice(voice) {
    const path = voice.path;
    
    // 从缓存获取Blob
    let blob = state.audioCache.get(path);
    
    if (!blob) {
        // 如果内存中没有，尝试从IndexedDB加载
        const cached = await getAudioFromCache(path);
        if (cached && cached.blob) {
            blob = cached.blob;
            state.audioCache.set(path, blob);
        } else {
            // 回退到直接加载
            const audio = new Audio(`public/voices/${path}`);
            playAudioElement(audio, voice);
            return;
        }
    }
    
    // 从Blob创建音频对象
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    
    playAudioElement(audio, voice, () => {
        // 播放完成后释放URL
        URL.revokeObjectURL(audioUrl);
    });
}

// 播放音频元素
function playAudioElement(audio, voice, cleanupCallback) {
    const button = document.querySelector(`.haruka-button[data-path="${voice.path}"]`);
    
    // 创建进度条
    const progressMask = document.createElement('span');
    progressMask.className = 'process-mask';
    button.appendChild(progressMask);
    
    // 生成唯一标识符
    const audioId = `${voice.path}-${Date.now()}`;
    
    // 存储音频实例
    state.playingAudios.set(audioId, {
        audio: audio,
        path: voice.path,
        progressMask: progressMask,
        voice: voice,
        cleanup: cleanupCallback
    });
    
    // 播放音频
    audio.play().then(() => {
        // 设置进度条动画
        const duration = audio.duration || 3;
        progressMask.style.transition = `width ${duration}s linear`;
        progressMask.style.width = '100%';
        
        // 音频结束时处理
        audio.onended = () => {
            cleanupAudio(audioId);
            
            // 如果开启循环模式，重新播放当前音频
            if (state.isLoopMode) {
                playVoice(voice);
            }
        };
        
        // 错误处理
        audio.onerror = () => {
            console.error(`音频播放错误: ${voice.path}`);
            cleanupAudio(audioId);
        };
    }).catch(error => {
        console.error('播放失败:', error);
        cleanupAudio(audioId);
    });
}

// 清理音频资源
function cleanupAudio(audioId) {
    const item = state.playingAudios.get(audioId);
    if (item) {
        if (item.cleanup) item.cleanup();
        item.progressMask.remove();
        state.playingAudios.delete(audioId);
    }
}

// 停止所有音频
function stopAllVoices() {
    state.playingAudios.forEach(item => {
        item.audio.pause();
        if (item.cleanup) item.cleanup();
        item.progressMask.remove();
    });
    
    state.playingAudios.clear();
}

// 随机播放
function playRandomVoice() {
    const randomIndex = Math.floor(Math.random() * state.voices.length);
    playVoice(state.voices[randomIndex]);
}

// 绑定事件
function bindEvents() {
    // 随机播放
    document.getElementById('randomPlay').addEventListener('click', playRandomVoice);
    
    // 停止所有
    document.getElementById('stopAll').addEventListener('click', stopAllVoices);
    
    // 循环模式切换
    document.getElementById('loopMode').addEventListener('change', (e) => {
        state.isLoopMode = e.target.checked;
    });
}

// 隐藏加载界面，显示主界面
function showMainContent() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContent = document.getElementById('mainContent');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
}

// 初始化
async function init() {
    try {
        // 设置音频数据
        state.voices = voices;
        
        // 清理旧缓存
        cleanupOldCache();
        
        // 预加载音频
        await batchPreload(state.voices);
        
        // 显示主界面
        showMainContent();
        
        // 渲染音频按钮
        renderVoiceButtons();
        
        // 绑定事件
        bindEvents();
        
        console.log('初始化完成，已加载音频:', state.voices.length);
    } catch (error) {
        console.error('初始化失败:', error);
        // 即使预加载失败，也显示界面
        showMainContent();
        state.voices = voices;
        renderVoiceButtons();
        bindEvents();
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);