import { state } from '@core/state.js';
import { batchPreload } from '@core/audioLoader.js';
import { renderVoiceButtons } from '@ui/voiceRenderer.js';
import { updateProgress } from '@ui/cdnRenderer.js';
import { cleanupOldCache } from '@storage/audioCache.js';
import { voices } from '@config/voices.js';

export const audioInitializer = {
    /**
     * 启动音频加载流程
     * 
     * @async
     * @returns {Promise<void>}
     * 
     * 错误处理：
     * - 加载失败时仍会显示主界面
     * - 使用 voices 作为降级配置
     * - 错误信息记录到控制台
     */
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
    
    /**
     * 切换显示主界面
     * 
     * 隐藏加载界面，显示主内容区域
     */
    showMainContent() {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainContent = document.getElementById('mainContent');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    }
};