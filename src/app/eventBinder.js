import { state } from '@core/state.js';
import { playRandomVoice, stopAllVoices } from '@core/audioPlayer.js';
import { cdnManager } from '@app/cdnManager.js';

export const eventBinder = {
    /**
     * 绑定所有事件
     * 
     * 在主界面初始化后调用
     */
    bindAll() {
        this.bindRandomPlay();
        this.bindStopAll();
        this.bindLoopMode();
        this.bindChangeCdn();
    },
    
    /**
     * 绑定随机播放事件
     * 
     * 从所有音频中随机选择一个播放
     */
    bindRandomPlay() {
        const btn = document.getElementById('randomPlay');
        if (btn) {
            btn.addEventListener('click', playRandomVoice);
        }
    },
    
    /**
     * 绑定停止所有事件
     * 
     * 停止所有正在播放的音频并清理资源
     */
    bindStopAll() {
        const btn = document.getElementById('stopAll');
        if (btn) {
            btn.addEventListener('click', stopAllVoices);
        }
    },
    
    /**
     * 绑定循环模式切换事件
     * 
     * 音频播放完成后自动重新播放
     */
    bindLoopMode() {
        const checkbox = document.getElementById('loopMode');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                state.isLoopMode = e.target.checked;
            });
        }
    },
    
    /**
     * 绑定切换CDN事件
     * 
     * 在本地模式或单CDN模式下自动隐藏按钮
     */
    bindChangeCdn() {
        const btn = document.getElementById('changeCdn');
        if (!btn) return;
        
        if (state.isLocalMode || state.isSingleCdnMode) {
            btn.style.display = 'none';
        } else {
            btn.addEventListener('click', () => cdnManager.showSelector());
        }
    }
};