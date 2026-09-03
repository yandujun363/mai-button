import { state, setAudioUrl } from '@core/state.js';
import { saveSelectedCdn, getSelectedCdn } from '@storage/cdnSettings.js';
import { audioInitializer } from '@app/audioInitializer.js';
import { renderCdnOptions } from '@ui/cdnRenderer.js';

export const cdnManager = {
    // 选择CDN
    async select(cdnId) {
        const cdn = state.availableCdns.find(c => c.id === cdnId);
        if (!cdn) {
            console.error(`CDN ${cdnId} 不存在`);
            return false;
        }
        
        state.selectedCdn = cdn;
        
        const rememberCheckbox = document.getElementById('rememberCdn');
        const remember = rememberCheckbox ? rememberCheckbox.checked : true;
        
        if (remember && !state.isLocalMode) {
            await saveSelectedCdn(cdnId, state.availableCdns);
        }
        
        setAudioUrl(cdn.url);
        
        // 隐藏CDN选择界面
        const cdnSelectScreen = document.getElementById('cdnSelectScreen');
        if (cdnSelectScreen) {
            cdnSelectScreen.style.display = 'none';
        }
        
        await audioInitializer.start();
        return true;
    },
    
    // 获取保存的CDN
    async getSaved() {
        return await getSelectedCdn();
    },
    
    // 显示CDN选择界面
    showSelector() {
        const mainContent = document.getElementById('mainContent');
        const cdnSelectScreen = document.getElementById('cdnSelectScreen');
        
        if (mainContent) mainContent.style.display = 'none';
        if (cdnSelectScreen) cdnSelectScreen.style.display = 'flex';
        
        // 停止所有音频
        import('@core/audioPlayer.js').then(({ stopAllVoices }) => {
            stopAllVoices();
        });
        
        renderCdnOptions();
    }
};