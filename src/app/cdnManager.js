import { state, setAudioUrl } from '@core/state.js';
import { saveSelectedCdn, getSelectedCdn } from '@storage/cdnSettings.js';
import { audioInitializer } from '@app/audioInitializer.js';
import { renderCdnOptions } from '@ui/cdnRenderer.js';

export const cdnManager = {
    /**
     * 选择并切换到指定的CDN
     * 
     * @async
     * @param {string} cdnId - CDN配置ID
     * @returns {Promise<boolean>} 选择是否成功
     * 
     * 流程：
     * 1. 验证CDN是否存在
     * 2. 更新选中的CDN状态
     * 3. 保存用户偏好（如果勾选记住选择）
     * 4. 更新音频URL
     * 5. 隐藏CDN选择界面
     * 6. 重新初始化音频系统
     */
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
    
    /**
     * 获取用户保存的CDN偏好
     * 
     * @async
     * @returns {Promise<Object|null>} 保存的CDN配置，不存在时返回null
     */
    async getSaved() {
        return await getSelectedCdn();
    },
    
    /**
     * 显示CDN选择界面
     * 
     * 功能：
     * 1. 隐藏主界面
     * 2. 显示CDN选择界面
     * 3. 停止所有正在播放的音频
     * 4. 渲染CDN选项列表
     */
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