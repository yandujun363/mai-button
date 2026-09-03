import { state } from '@core/state.js';
import { getAudioFromCache } from '@storage/audioCache.js';

// 播放音频
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

// 播放音频元素
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

// 清理音频资源
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

// 停止所有音频
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

// 随机播放
export function playRandomVoice() {
    if (state.voices.length === 0) return;
    const randomIndex = Math.floor(Math.random() * state.voices.length);
    playVoice(state.voices[randomIndex]);
}