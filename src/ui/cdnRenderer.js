import { state } from '@core/state.js';
import { cdnManager } from '@app/cdnManager.js';

// 渲染CDN选择界面
export function renderCdnOptions() {
    const container = document.getElementById('cdnOptions');
    if (!container) return;
    
    container.innerHTML = '';
    
    state.availableCdns.forEach(cdn => {
        const optionElement = document.createElement('div');
        optionElement.className = 'cdn-option';
        optionElement.dataset.cdnId = cdn.id;
        
        optionElement.innerHTML = `
            <div class="cdn-option-header">
                <h3>${cdn.name}</h3>
                <span class="cdn-priority">优先级: ${cdn.priority}</span>
            </div>
            <div class="cdn-option-url">${cdn.url}</div>
            <div class="cdn-option-desc">${cdn.description || ''}</div>
        `;
        
        optionElement.addEventListener('click', () => {
            cdnManager.select(cdn.id);
        });
        
        container.appendChild(optionElement);
    });
}

// 更新加载进度
export function updateProgress() {
    const progress = document.getElementById('loadingProgress');
    const progressText = document.getElementById('loadingProgressText');
    const loadingCdnInfo = document.getElementById('loadingCdnInfo');
    
    if (progress && progressText) {
        const percentage = state.totalToLoad > 0 
            ? Math.round((state.loadedCount / state.totalToLoad) * 100) 
            : 0;
        progress.style.width = `${percentage}%`;
        progressText.textContent = `${state.loadedCount}/${state.totalToLoad}`;
    }
    
    if (loadingCdnInfo) {
        if (state.isLocalMode) {
            loadingCdnInfo.textContent = '音频源: 本地文件 (public/voices/)';
        } else if (state.selectedCdn) {
            loadingCdnInfo.textContent = `音频源: ${state.selectedCdn.name}`;
        }
    }
}