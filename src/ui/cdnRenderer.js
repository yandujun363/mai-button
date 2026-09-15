import { state } from '@core/state.js';
import { cdnManager } from '@app/cdnManager.js';

/**
 * 渲染 CDN 选择界面
 * 
 * 功能：
 * 1. 清空现有选项
 * 2. 遍历所有可用 CDN
 * 3. 创建并渲染每个 CDN 选项卡片
 * 4. 绑定点击事件
 * 
 * HTML 结构：
 * <div id="cdnOptions">
 *   <div class="cdn-option" data-cdn-id="cdn1">
 *     <div class="cdn-option-header">
 *       <h3>CDN名称</h3>
 *       <span class="cdn-priority">优先级: 1</span>
 *     </div>
 *     <div class="cdn-option-url">https://cdn.example.com/</div>
 *     <div class="cdn-option-desc">描述信息</div>
 *   </div>
 * </div>
 * 
 * 注意：
 * - 如果 #cdnOptions 元素不存在，不执行任何操作
 * - 每个 CDN 选项点击后自动切换
 */
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

/**
 * 更新加载进度
 * 
 * 功能：
 * 1. 更新进度条宽度
 * 2. 更新进度文字（已加载/总数）
 * 3. 显示当前音频源信息
 * 
 * HTML 元素要求：
 * - #loadingProgress: 进度条元素 (width 控制宽度)
 * - #loadingProgressText: 进度文字显示
 * - #loadingCdnInfo: CDN 信息显示
 * 
 * 进度计算：
 * - percentage = (loadedCount / totalToLoad) * 100
 * - 显示格式：已加载数/总数
 * 
 * CDN 信息：
 * - 本地模式：显示 "音频源: 本地文件"
 * - CDN 模式：显示 "音频源: CDN名称"
 */
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