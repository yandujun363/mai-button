import { state } from '@core/state.js';
import { batchPreload } from '@core/audioLoader.js';
import { renderVoiceButtons } from '@ui/voiceRenderer.js';
import { updateProgress } from '@ui/cdnRenderer.js';
import { cleanupOldCache } from '@storage/audioCache.js';
import { voices } from '@config/voices.js';

export const audioInitializer = {
    // 开始音频加载
    async start() {
        try {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'flex';
            }
            
            state.voices = voices;
            
            const currentUrl = state.audioUrl || '';
            await cleanupOldCache(currentUrl);
            
            await batchPreload(state.voices, updateProgress);
            
            this.showMainContent();
            renderVoiceButtons();
            
            console.log('初始化完成，已加载音频:', state.voices.length);
            if (state.isLocalMode) {
                console.log('使用本地文件模式');
            } else if (state.selectedCdn) {
                console.log('使用的CDN:', state.selectedCdn.name);
            }
        } catch (error) {
            console.error('加载失败:', error);
            this.showMainContent();
            state.voices = voices;
            renderVoiceButtons();
        }
    },
    
    // 显示主界面
    showMainContent() {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainContent = document.getElementById('mainContent');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    }
};