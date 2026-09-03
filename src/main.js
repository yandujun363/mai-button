import { state, setAudioUrl } from '@core/state.js';
import { batchPreload } from '@core/audioLoader.js';
import { playRandomVoice, stopAllVoices } from '@core/audioPlayer.js';
import { renderVoiceButtons } from '@ui/voiceRenderer.js';
import { renderCdnOptions, updateProgress } from '@ui/cdnRenderer.js';
import { saveSelectedCdn, getSelectedCdn } from '@storage/cdnSettings.js';
import { cleanupOldCache } from '@storage/audioCache.js';
import { voices } from '@config/voices.js';

// 开始音频加载
async function startAudioLoading() {
    try {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
        
        state.voices = voices;
        
        // 使用 state 中的 audioUrl，通过闭包传递
        const currentUrl = state.audioUrl || '';
        await cleanupOldCache(currentUrl);
        
        await batchPreload(state.voices, updateProgress);
        
        showMainContent();
        renderVoiceButtons();
        bindEvents();
        
        console.log('初始化完成，已加载音频:', state.voices.length);
        if (state.isLocalMode) {
            console.log('使用本地文件模式');
        } else if (state.selectedCdn) {
            console.log('使用的CDN:', state.selectedCdn.name);
        }
    } catch (error) {
        console.error('初始化失败:', error);
        showMainContent();
        state.voices = voices;
        renderVoiceButtons();
        bindEvents();
    }
}

// 选择CDN
export async function selectCdn(cdnId) {
    const cdn = state.availableCdns.find(c => c.id === cdnId);
    if (!cdn) return;
    
    state.selectedCdn = cdn;
    
    const rememberCheckbox = document.getElementById('rememberCdn');
    const remember = rememberCheckbox ? rememberCheckbox.checked : true;
    
    if (remember && !state.isLocalMode) {
        await saveSelectedCdn(cdnId, state.availableCdns);
    }
    
    setAudioUrl(cdn.url);
    
    const cdnSelectScreen = document.getElementById('cdnSelectScreen');
    if (cdnSelectScreen) {
        cdnSelectScreen.style.display = 'none';
    }
    
    startAudioLoading();
}

// 显示CDN选择界面
function showCdnSelect() {
    const mainContent = document.getElementById('mainContent');
    const cdnSelectScreen = document.getElementById('cdnSelectScreen');
    
    if (mainContent) mainContent.style.display = 'none';
    if (cdnSelectScreen) cdnSelectScreen.style.display = 'flex';
    
    stopAllVoices();
    renderCdnOptions();
}

// 隐藏加载界面，显示主界面
function showMainContent() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContent = document.getElementById('mainContent');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
}

// 绑定事件
function bindEvents() {
    const randomPlayBtn = document.getElementById('randomPlay');
    if (randomPlayBtn) {
        randomPlayBtn.addEventListener('click', playRandomVoice);
    }
    
    const stopAllBtn = document.getElementById('stopAll');
    if (stopAllBtn) {
        stopAllBtn.addEventListener('click', stopAllVoices);
    }
    
    const loopModeCheckbox = document.getElementById('loopMode');
    if (loopModeCheckbox) {
        loopModeCheckbox.addEventListener('change', (e) => {
            state.isLoopMode = e.target.checked;
        });
    }
    
    const changeCdnBtn = document.getElementById('changeCdn');
    if (changeCdnBtn) {
        if (state.isLocalMode || state.isSingleCdnMode) {
            changeCdnBtn.style.display = 'none';
        } else {
            changeCdnBtn.addEventListener('click', showCdnSelect);
        }
    }
}

// 初始化
async function init() {
    try {
        if (state.isLocalMode) {
            console.log('使用本地文件模式');
            setAudioUrl('public/voices/');
            startAudioLoading();
        } else if (state.isSingleCdnMode) {
            console.log('使用单CDN模式');
            const cdn = state.availableCdns[0];
            state.selectedCdn = cdn;
            setAudioUrl(cdn.url);
            startAudioLoading();
        } else {
            console.log('使用多CDN选择模式');
            renderCdnOptions();
            
            const savedCdn = await getSelectedCdn();
            
            if (savedCdn) {
                await selectCdn(savedCdn.id);
            } else {
                const cdnSelectScreen = document.getElementById('cdnSelectScreen');
                if (cdnSelectScreen) {
                    cdnSelectScreen.style.display = 'flex';
                }
            }
        }
    } catch (error) {
        console.error('初始化失败:', error);
        if (state.availableCdns.length > 0) {
            await selectCdn(state.availableCdns[0].id);
        } else {
            state.isLocalMode = true;
            setAudioUrl('public/voices/');
            startAudioLoading();
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);