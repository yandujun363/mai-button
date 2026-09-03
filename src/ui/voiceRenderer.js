import { state } from '@core/state.js';

// 按标签分组
function groupVoicesByTag(voices) {
    return voices.reduce((groups, voice) => {
        if (!groups[voice.tag]) {
            groups[voice.tag] = [];
        }
        groups[voice.tag].push(voice);
        return groups;
    }, {});
}

// 获取本地化的标签名
function getLocalizedTag(tag) {
    return state.locales[state.currentLang].tags?.[tag] || tag;
}

// 获取本地化的音频标题
function getLocalizedVoiceTitle(voice) {
    return voice.messages[state.currentLang] || 
           voice.messages.zh || 
           Object.values(voice.messages)[0] || 
           '未知音频';
}

// 创建音频按钮
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

// 渲染音频按钮
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