import { state } from '@core/state.js';
import { getAudioFromCache } from '@storage/audioCache.js';

/**
 * 播放音频
 * 
 * @async
 * @param {Object} voice - 音频配置对象
 * @param {string} voice.path - 音频文件路径
 * @returns {Promise<void>}
 * 
 * 播放策略：
 * 1. 优先使用内存缓存（最快）
 * 2. 其次使用 IndexedDB 缓存
 * 3. 最后直接从网络加载
 * 
 * 内存管理：
 * - 使用 Blob URL 播放时，播放完成后自动 revoke
 * - 防止内存泄漏
 */
export async function playVoice(voice) {
    const path = voice.path;
    
    let blob = state.audioCache.get(path);
    
    if (!blob) {
        const cached = await getAudioFromCache(path);
        if (cached && cached.blob) {
            blob = cached.blob;
            state.audioCache.set(path, blob);
        } else {
            const audio = new Audio(`${state.audioUrl}${path}`);
            playAudioElement(audio, voice);
            return;
        }
    }
    
    const audioUrl_ = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl_);
    
    playAudioElement(audio, voice, () => {
        URL.revokeObjectURL(audioUrl_);
    });
}

/**
 * 播放音频元素（内部函数）
 * 
 * @param {HTMLAudioElement} audio - 音频元素
 * @param {Object} voice - 音频配置对象
 * @param {Function} cleanupCallback - 清理回调（用于释放 Blob URL）
 * 
 * 功能：
 * 1. 创建并显示进度遮罩动画
 * 2. 管理播放状态
 * 3. 处理循环播放
 * 4. 错误处理
 */
function playAudioElement(audio, voice, cleanupCallback) {
    const button = document.querySelector(`.haruka-button[data-path="${voice.path}"]`);
    
    const progressMask = document.createElement('span');
    progressMask.className = 'process-mask';
    if (button) {
        button.appendChild(progressMask);
    }
    
    const audioId = `${voice.path}-${Date.now()}`;
    
    state.playingAudios.set(audioId, {
        audio: audio,
        path: voice.path,
        progressMask: progressMask,
        voice: voice,
        cleanup: cleanupCallback
    });
    
    audio.play().then(() => {
        const duration = audio.duration || 3;
        progressMask.style.transition = `width ${duration}s linear`;
        progressMask.style.width = '100%';
        
        audio.onended = () => {
            cleanupAudio(audioId);
            if (state.isLoopMode) {
                playVoice(voice);
            }
        };
        
        audio.onerror = () => {
            console.error(`音频播放错误: ${voice.path}`);
            cleanupAudio(audioId);
        };
    }).catch(error => {
        console.error('播放失败:', error);
        cleanupAudio(audioId);
    });
}

/**
 * 清理音频资源（内部函数）
 * 
 * @param {string} audioId - 音频唯一标识
 * 
 * 清理内容：
 * 1. 调用清理回调（释放 Blob URL）
 * 2. 移除进度遮罩
 * 3. 从播放列表中移除
 */
function cleanupAudio(audioId) {
    const item = state.playingAudios.get(audioId);
    if (item) {
        if (item.cleanup) item.cleanup();
        if (item.progressMask) {
            item.progressMask.remove();
        }
        state.playingAudios.delete(audioId);
    }
}

/**
 * 停止所有正在播放的音频
 * 
 * 功能：
 * 1. 暂停所有音频
 * 2. 释放所有资源
 * 3. 移除所有进度遮罩
 * 4. 清空播放列表
 * 
 * 使用场景：
 * - 点击停止按钮
 * - 切换 CDN 前
 * - 页面卸载时
 */
export function stopAllVoices() {
    state.playingAudios.forEach(item => {
        item.audio.pause();
        if (item.cleanup) item.cleanup();
        if (item.progressMask) {
            item.progressMask.remove();
        }
    });
    state.playingAudios.clear();
}

/**
 * 随机播放一个音频
 * 
 * 从所有可用音频中随机选择一个播放
 * 
 * 使用场景：
 * - 点击"随机播放"按钮
 * - 作为欢迎音效
 * 
 * 注意：
 * - 如果音频列表为空，不执行任何操作
 */
export function playRandomVoice() {
    if (state.voices.length === 0) return;
    const randomIndex = Math.floor(Math.random() * state.voices.length);
    playVoice(state.voices[randomIndex]);
}