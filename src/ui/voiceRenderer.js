import { state } from '@core/state.js';

/**
 * 按标签分组音频
 * 
 * @param {Array<Object>} voices - 音频配置数组
 * @returns {Object} 分组后的对象 { tag: [voice, ...], ... }
 * 
 * 示例：
 * 输入：[
 *   { tag: 'greetings', ... },
 *   { tag: 'greetings', ... },
 *   { tag: 'reactions', ... }
 * ]
 * 输出：{
 *   greetings: [voice1, voice2],
 *   reactions: [voice3]
 * }
 */
function groupVoicesByTag(voices) {
    return voices.reduce((groups, voice) => {
        if (!groups[voice.tag]) {
            groups[voice.tag] = [];
        }
        groups[voice.tag].push(voice);
        return groups;
    }, {});
}

/**
 * 获取本地化的标签名称
 * 
 * @param {string} tag - 标签键名
 * @returns {string} 本地化后的标签名称
 * 
 * 查找顺序：
 * 1. 当前语言的翻译
 * 2. 如果找不到，返回原 tag 值
 * 
 * 示例：
 * - tag: 'greetings'
 * - 当前语言: 'zh'
 * - locales.zh.tags.greetings = '问候语'
 * - 返回: '问候语'
 */
function getLocalizedTag(tag) {
    return state.locales[state.currentLang].tags?.[tag] || tag;
}

/**
 * 获取本地化的音频标题
 * 
 * @param {Object} voice - 音频配置对象
 * @param {Object} voice.messages - 多语言名称对象
 * @returns {string} 本地化后的音频名称
 * 
 * 查找顺序：
 * 1. 当前语言的名称
 * 2. 中文名称
 * 3. 第一个可用的名称
 * 4. 默认值 '未知音频'
 * 
 * 示例：
 * - messages: { zh: '你好', en: 'Hello', ja: 'こんにちは' }
 * - currentLang: 'en'
 * - 返回: 'Hello'
 */
function getLocalizedVoiceTitle(voice) {
    return voice.messages[state.currentLang] || 
           voice.messages.zh || 
           Object.values(voice.messages)[0] || 
           '未知音频';
}

/**
 * 创建单个音频按钮
 * 
 * @param {Object} voice - 音频配置对象
 * @returns {HTMLElement} 按钮包装元素
 * 
 * 按钮特征：
 * 1. 显示本地化名称
 * 2. 超过15个字符自动添加 tooltip
 * 3. 绑定点击事件（点击播放）
 * 
 * 数据属性：
 * - data-path: 音频路径（用于查找按钮）
 */
function createVoiceButton(voice) {
    const wrapper = document.createElement('div');
    wrapper.className = 'haruka-button';
    wrapper.dataset.path = voice.path;
    
    const title = getLocalizedVoiceTitle(voice);
    let buttonHtml = '';
    
    if (title.length > 15) {
        buttonHtml = `
            <div class="tooltip">
                <button>${title.substring(0, 15)}...</button>
                <span class="tooltip-text">${title}</span>
            </div>
        `;
    } else {
        buttonHtml = `<button>${title}</button>`;
    }
    
    wrapper.innerHTML = buttonHtml;
    
    return wrapper;
}

/**
 * 渲染所有音频按钮
 * 
 * 功能：
 * 1. 清空音频容器
 * 2. 按标签分组
 * 3. 为每个标签创建分类区域
 * 4. 为每个音频创建按钮
 * 5. 绑定播放事件
 * 
 * HTML 结构：
 * <div id="voiceContainer">
 *   <div class="voice-category">
 *     <h2>问候语</h2>
 *     <div class="voice-buttons">
 *       <div class="haruka-button" data-path="...">
 *         <button>你好</button>
 *       </div>
 *       ...
 *     </div>
 *   </div>
 * </div>
 * 
 * 注意事项：
 * - 如果音频列表为空，不渲染任何内容
 * - 每个标签必须都有对应的翻译
 * - 按钮点击事件使用动态导入，优化性能
 */
export function renderVoiceButtons() {
    const container = document.getElementById('voiceContainer');
    if (!container) return;
    
    const groupedVoices = groupVoicesByTag(state.voices);
    container.innerHTML = '';
    
    Object.keys(groupedVoices).forEach(tag => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'voice-category';
        
        const tagName = getLocalizedTag(tag);
        categoryElement.innerHTML = `<h2>${tagName}</h2><div class="voice-buttons"></div>`;
        
        const buttonsContainer = categoryElement.querySelector('.voice-buttons');
        groupedVoices[tag].forEach(voice => {
            const buttonWrapper = createVoiceButton(voice);
            // 绑定点击事件
            const btn = buttonWrapper.querySelector('button');
            if (btn) {
                btn.addEventListener('click', () => {
                    import('@core/audioPlayer.js').then(({ playVoice }) => {
                        playVoice(voice);
                    });
                });
            }
            buttonsContainer.appendChild(buttonWrapper);
        });
        
        container.appendChild(categoryElement);
    });
}