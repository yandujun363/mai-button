import { state, setAudioUrl } from '@core/state.js';
import { eventBinder } from '@app/eventBinder.js';
import { cdnManager } from '@app/cdnManager.js';
import { audioInitializer } from '@app/audioInitializer.js';
import { renderCdnOptions } from '@ui/cdnRenderer.js';

export const app = {
    async init() {
        try {
            if (state.isLocalMode) {
                console.log('使用本地文件模式');
                setAudioUrl('public/voices/');
                await audioInitializer.start();
            } else if (state.isSingleCdnMode) {
                console.log('使用单CDN模式');
                const cdn = state.availableCdns[0];
                state.selectedCdn = cdn;
                setAudioUrl(cdn.url);
                await audioInitializer.start();
            } else {
                console.log('使用多CDN选择模式');
                renderCdnOptions();
                
                const savedCdn = await cdnManager.getSaved();
                if (savedCdn) {
                    await cdnManager.select(savedCdn.id);
                } else {
                    const cdnSelectScreen = document.getElementById('cdnSelectScreen');
                    if (cdnSelectScreen) {
                        cdnSelectScreen.style.display = 'flex';
                    }
                }
            }
            
            eventBinder.bindAll();
        } catch (error) {
            console.error('初始化失败:', error);
            // 降级方案
            if (state.availableCdns.length > 0) {
                await cdnManager.select(state.availableCdns[0].id);
            } else {
                state.isLocalMode = true;
                setAudioUrl('public/voices/');
                await audioInitializer.start();
            }
        }
    }
};