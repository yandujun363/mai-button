// ES模块版本
import { zhLocale } from './src/locales/zh.js';
import { voices } from './src/config/voices.js';

// 全局状态
const state = {
    currentLang: 'zh',
    isLoopMode: false,
    playingAudios: new Map(), // 存储正在播放的音频及其循环状态
    audioCache: new Map(), // 内存缓存已加载的音频Blob
    voices: [],
    locales: {
        zh: zhLocale,
        en: zhLocale, // 暂时使用中文，可后续添加英文
        ja: zhLocale  // 暂时使用中文，可后续添加日文
    },
    totalToLoad: 0,
    loadedCount: 0
};

// ===== 新增：打碟模式状态和配置 =====
const djState = {
    active: false,
    // 主键盘映射 (QWE/ASD/ZXC)
    mainKeyMapping: {
        'KeyQ': { row: 0, col: 0, index: 0, label: 'Q' },
        'KeyW': { row: 0, col: 1, index: 1, label: 'W' },
        'KeyE': { row: 0, col: 2, index: 2, label: 'E' },
        'KeyA': { row: 1, col: 0, index: 3, label: 'A' },
        'KeyS': { row: 1, col: 1, index: 4, label: 'S' },
        'KeyD': { row: 1, col: 2, index: 5, label: 'D' },
        'KeyZ': { row: 2, col: 0, index: 6, label: 'Z' },
        'KeyX': { row: 2, col: 1, index: 7, label: 'X' },
        'KeyC': { row: 2, col: 2, index: 8, label: 'C' }
    },
    // 小键盘映射 (NumPad 7-9/4-6/1-3)
    numpadMapping: {
        'Numpad7': { row: 0, col: 0, index: 0, label: '7' },
        'Numpad8': { row: 0, col: 1, index: 1, label: '8' },
        'Numpad9': { row: 0, col: 2, index: 2, label: '9' },
        'Numpad4': { row: 1, col: 0, index: 3, label: '4' },
        'Numpad5': { row: 1, col: 1, index: 4, label: '5' },
        'Numpad6': { row: 1, col: 2, index: 5, label: '6' },
        'Numpad1': { row: 2, col: 0, index: 6, label: '1' },
        'Numpad2': { row: 2, col: 1, index: 7, label: '2' },
        'Numpad3': { row: 2, col: 2, index: 8, label: '3' }
    },
    // 当前激活的按键系统
    activeKeySystem: 'main', // 'main' 或 'numpad'
    padAssignments: []
};

const voiceSelector = {
    modal: null,
    searchInput: null,
    voiceList: null,
    currentPadIndex: -1,
    selectedVoiceIndex: -1
};


// ===== 修改：创建九宫格界面，支持两套按键提示 =====
function createDjPadGrid() {
    const grid = document.getElementById('djPadGrid');
    if (!grid) return;

    grid.innerHTML = '';

    // 加载保存的配置
    loadDjConfig();

    // 如果没有保存的配置，使用前9个音效
    if (!djState.padAssignments.some(voice => voice)) {
        djState.padAssignments = state.voices.slice(0, 9);
    }

    // 创建9个格子
    for (let i = 0; i < 9; i++) {
        const pad = document.createElement('div');
        pad.className = 'dj-pad';
        pad.dataset.index = i;

        const voice = djState.padAssignments[i];
        const title = voice ? getLocalizedVoiceTitle(voice).substring(0, 15) : '点击分配';

        // 获取两套按键提示
        const mainKey = Object.entries(djState.mainKeyMapping)
            .find(([_, value]) => value.index === i);
        const numpadKey = Object.entries(djState.numpadMapping)
            .find(([_, value]) => value.index === i);

        const mainHint = mainKey ? mainKey[1].label : '?';
        const numpadHint = numpadKey ? numpadKey[1].label : '?';

        pad.innerHTML = `
            <div class="pad-label">${title}</div>
            <div class="key-hints">
                <span class="main-key-hint">${mainHint}</span>
                <span class="separator">/</span>
                <span class="numpad-key-hint">${numpadHint}</span>
            </div>
        `;

        // 添加tooltip显示完整音效名
        if (voice) {
            pad.title = getLocalizedVoiceTitle(voice);
        }

        // 点击分配音效
        pad.addEventListener('click', () => openVoiceSelectorForPad(i));

        grid.appendChild(pad);
    }
}

// ===== 实现：openVoiceSelectorForPad 函数 =====
function openVoiceSelectorForPad(padIndex) {
    if (!djState.active) return;

    voiceSelector.currentPadIndex = padIndex;
    voiceSelector.selectedVoiceIndex = -1;

    // 获取或创建模态框元素
    let modal = document.getElementById('voiceSelectorModal');
    if (!modal) {
        // 动态创建模态框（防止HTML中忘记添加）
        modal = document.createElement('div');
        modal.id = 'voiceSelectorModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        document.body.appendChild(modal);
    }

    voiceSelector.modal = modal;

    // 更新标题显示当前格子
    const indexSpan = document.getElementById('targetPadIndex');
    if (indexSpan) {
        indexSpan.textContent = padIndex + 1; // 显示为1-9
    }

    // 渲染音效列表
    renderVoiceSelectorList();

    // 显示模态框
    modal.style.display = 'flex';

    // 绑定模态框事件（防止重复绑定）
    bindVoiceSelectorEvents();
}

// ===== 渲染音效列表 =====
function renderVoiceSelectorList(searchTerm = '') {
    const voiceList = document.getElementById('voiceList');
    if (!voiceList) return;

    voiceList.innerHTML = '';

    // 过滤音效
    const filteredVoices = state.voices.filter(voice => {
        if (!searchTerm.trim()) return true;

        const title = getLocalizedVoiceTitle(voice).toLowerCase();
        const tag = voice.tag.toLowerCase();
        return title.includes(searchTerm.toLowerCase()) ||
            tag.includes(searchTerm.toLowerCase());
    });

    // 渲染音效列表项
    filteredVoices.forEach((voice, index) => {
        const item = document.createElement('div');
        item.className = 'voice-list-item';
        item.dataset.index = index;

        const title = getLocalizedVoiceTitle(voice);
        const tagName = getLocalizedTag(voice.tag);

        item.innerHTML = `
            <div class="voice-name">${title}</div>
            <div class="voice-tag">${tagName}</div>
        `;

        // 如果这个音效已经是当前格子的分配，标记为已选择
        const currentAssignment = djState.padAssignments[voiceSelector.currentPadIndex];
        if (currentAssignment && currentAssignment.path === voice.path) {
            item.classList.add('selected');
            voiceSelector.selectedVoiceIndex = index;
        }

        voiceList.appendChild(item);
    });
}

// ===== 绑定音效选择器事件 =====
function bindVoiceSelectorEvents() {
    // 音效列表点击事件
    const voiceList = document.getElementById('voiceList');
    if (voiceList) {
        voiceList.onclick = (e) => {
            const item = e.target.closest('.voice-list-item');
            if (item) {
                // 移除之前的选择
                document.querySelectorAll('.voice-list-item.selected').forEach(el => {
                    el.classList.remove('selected');
                });

                // 标记当前选择
                item.classList.add('selected');
                voiceSelector.selectedVoiceIndex = parseInt(item.dataset.index);
            }
        };
    }

    // 搜索框输入事件
    const searchInput = document.getElementById('voiceSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            renderVoiceSelectorList(e.target.value);
        };
        searchInput.value = ''; // 清空搜索框
        searchInput.focus(); // 自动聚焦
    }

    // 关闭按钮事件
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = closeVoiceSelector;
    }

    // 取消按钮事件
    const cancelBtn = document.getElementById('cancelSelection');
    if (cancelBtn) {
        cancelBtn.onclick = closeVoiceSelector;
    }

    // 确认按钮事件
    const confirmBtn = document.getElementById('confirmSelection');
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            if (voiceSelector.selectedVoiceIndex !== -1) {
                // 获取选择的音效
                const searchInput = document.getElementById('voiceSearch');
                const searchTerm = searchInput ? searchInput.value : '';

                // 需要重新获取过滤后的音效列表
                const filteredVoices = state.voices.filter(voice => {
                    if (!searchTerm.trim()) return true;
                    const title = getLocalizedVoiceTitle(voice).toLowerCase();
                    const tag = voice.tag.toLowerCase();
                    return title.includes(searchTerm.toLowerCase()) ||
                        tag.includes(searchTerm.toLowerCase());
                });

                const selectedVoice = filteredVoices[voiceSelector.selectedVoiceIndex];

                if (selectedVoice) {
                    // 更新九宫格分配
                    djState.padAssignments[voiceSelector.currentPadIndex] = selectedVoice;

                    // 更新九宫格显示
                    updatePadDisplay(voiceSelector.currentPadIndex, selectedVoice);

                    // 保存配置到本地存储
                    saveDjConfig();
                }
            }
            closeVoiceSelector();
        };
    }

    // 点击模态框背景关闭
    voiceSelector.modal.onclick = (e) => {
        if (e.target === voiceSelector.modal) {
            closeVoiceSelector();
        }
    };
}

// ===== 更新九宫格显示 =====
function updatePadDisplay(padIndex, voice) {
    const pad = document.querySelector(`.dj-pad[data-index="${padIndex}"]`);
    if (!pad) return;

    const title = getLocalizedVoiceTitle(voice);
    const displayTitle = title.length > 15 ? title.substring(0, 15) + '...' : title;

    const label = pad.querySelector('.pad-label');
    if (label) {
        label.textContent = displayTitle;
    }

    // 添加提示tooltip
    pad.title = title;
}

// ===== 关闭音效选择器 =====
function closeVoiceSelector() {
    if (voiceSelector.modal) {
        voiceSelector.modal.style.display = 'none';
    }
    voiceSelector.currentPadIndex = -1;
    voiceSelector.selectedVoiceIndex = -1;
}

// ===== 保存/加载九宫格配置 =====
function saveDjConfig() {
    const config = {
        assignments: djState.padAssignments.map(voice => voice ? voice.path : null),
        savedAt: new Date().toISOString()
    };
    localStorage.setItem('maiButton_djConfig', JSON.stringify(config));
}

function loadDjConfig() {
    const saved = localStorage.getItem('maiButton_djConfig');
    if (!saved) return;

    try {
        const config = JSON.parse(saved);
        if (config.assignments && config.assignments.length === 9) {
            // 根据路径恢复音效分配
            config.assignments.forEach((path, index) => {
                if (path) {
                    const voice = state.voices.find(v => v.path === path);
                    if (voice) {
                        djState.padAssignments[index] = voice;
                    }
                }
            });
        }
    } catch (error) {
        console.warn('加载DJ配置失败:', error);
    }
}

// ===== 新增：支持重叠播放的关键函数 =====
function playDjPad(index) {
    if (!djState.active || index < 0 || index >= djState.padAssignments.length) {
        return;
    }

    const voice = djState.padAssignments[index];
    if (!voice) return;

    const path = voice.path;
    const button = document.querySelector(`.dj-pad[data-index="${index}"]`);

    // 创建全新的音频对象，允许多个同时播放
    const audio = new Audio(`public/voices/${path}`);

    // 创建独立的进度条
    const progressMask = document.createElement('div');
    progressMask.className = 'process-mask';
    button.appendChild(progressMask);

    // 播放音频
    audio.play().then(() => {
        // 按钮高亮反馈
        button.classList.add('active');
        setTimeout(() => button.classList.remove('active'), 150);

        // 进度条动画
        const duration = audio.duration || 3;
        progressMask.style.transition = `height ${duration}s linear`;
        progressMask.style.height = '100%';

        // 播放结束清理
        audio.onended = () => {
            progressMask.remove();
        };

        audio.onerror = () => {
            console.error(`DJ音频播放失败: ${path}`);
            progressMask.remove();
        };

    }).catch(error => {
        console.error('DJ播放失败:', error);
        progressMask.remove();
    });
}

// ===== 修改：键盘事件监听，支持两套系统 =====
function handleDjKeyDown(event) {
    if (!djState.active) return;

    let mapping = null;

    // 检查主键盘
    mapping = djState.mainKeyMapping[event.code];
    if (mapping) {
        event.preventDefault();
        playDjPad(mapping.index);
        highlightActivePad(mapping.index, 'main');
        return;
    }

    // 检查小键盘（需要确保NumLock状态）
    mapping = djState.numpadMapping[event.code];
    if (mapping) {
        event.preventDefault();
        playDjPad(mapping.index);
        highlightActivePad(mapping.index, 'numpad');
        return;
    }
}

// ===== 新增：高亮激活的格子（区分按键系统） =====
function highlightActivePad(padIndex, keySystem) {
    const pad = document.querySelector(`.dj-pad[data-index="${padIndex}"]`);
    if (!pad) return;

    // 添加系统特定的高亮类
    pad.classList.add('active');
    pad.classList.add(`${keySystem}-active`);

    // 移除高亮
    setTimeout(() => {
        pad.classList.remove('active');
        pad.classList.remove(`${keySystem}-active`);
    }, 150);
}

// IndexedDB数据库配置
const DB_NAME = 'MaiButtonDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioCache';

// 初始化IndexedDB
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'path' });
            }
        };
    });
}

// 从IndexedDB获取音频
async function getAudioFromCache(path) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(path);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('从缓存获取音频失败:', error);
        return null;
    }
}

// ===== 模式切换函数 =====
function setupModeSwitch() {
    const modeSwitch = document.getElementById('modeSwitch');
    const keySystemSwitch = document.getElementById('keySystemSwitch');
    const voiceContainer = document.getElementById('voiceContainer');
    const djContainer = document.getElementById('djContainer');

    if (!modeSwitch) return;

    modeSwitch.addEventListener('change', (e) => {
        if (e.target.value === 'dj') {
            // 切换到打碟模式
            djState.active = true;
            voiceContainer.style.display = 'none';
            djContainer.style.display = 'block';

            // 显示按键系统切换器
            if (keySystemSwitch) {
                keySystemSwitch.style.display = 'inline-block';
            }

            // 初始化九宫格
            if (!document.querySelector('.dj-pad')) {
                createDjPadGrid();
                updateKeyHintsDisplay();
            }

            // 添加键盘监听
            document.addEventListener('keydown', handleDjKeyDown);

        } else {
            // 切换回浏览模式
            djState.active = false;
            voiceContainer.style.display = 'block';
            djContainer.style.display = 'none';

            // 隐藏按键系统切换器
            if (keySystemSwitch) {
                keySystemSwitch.style.display = 'none';
            }

            // 移除键盘监听
            document.removeEventListener('keydown', handleDjKeyDown);
        }
    });
}

// ===== 新增：按键系统切换 =====
function setupKeySystemSwitch() {
    const switchElem = document.getElementById('keySystemSwitch');
    if (!switchElem) return;

    // 加载保存的按键系统偏好
    const savedKeySystem = localStorage.getItem('maiButton_keySystem');
    if (savedKeySystem) {
        switchElem.value = savedKeySystem;
        djState.activeKeySystem = savedKeySystem;
    }

    switchElem.addEventListener('change', (e) => {
        djState.activeKeySystem = e.target.value;
        localStorage.setItem('maiButton_keySystem', djState.activeKeySystem);

        // 更新九宫格提示的显示
        updateKeyHintsDisplay();
    });
}

// ===== 新增：更新按键提示显示 =====
function updateKeyHintsDisplay() {
    const pads = document.querySelectorAll('.dj-pad');
    pads.forEach(pad => {
        const hints = pad.querySelector('.key-hints');
        if (hints) {
            if (djState.activeKeySystem === 'main') {
                hints.querySelector('.main-key-hint').style.fontWeight = 'bold';
                hints.querySelector('.numpad-key-hint').style.fontWeight = 'normal';
            } else {
                hints.querySelector('.main-key-hint').style.fontWeight = 'normal';
                hints.querySelector('.numpad-key-hint').style.fontWeight = 'bold';
            }
        }
    });
}

// 保存音频到IndexedDB
async function saveAudioToCache(path, blob) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ path, blob, timestamp: Date.now() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.warn('保存音频到缓存失败:', error);
    }
}

// 清理旧的缓存（超过30天）
async function cleanupOldCache() {
    try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            request.result.forEach(item => {
                if (item.timestamp < thirtyDaysAgo) {
                    store.delete(item.path);
                }
            });
        };
    } catch (error) {
        console.warn('清理缓存失败:', error);
    }
}

// 预加载音频
async function preloadAudio(voice, updateProgress) {
    const path = voice.path;

    // 先检查内存缓存
    if (state.audioCache.has(path)) {
        state.loadedCount++;
        updateProgress();
        return Promise.resolve();
    }

    // 检查IndexedDB缓存
    const cached = await getAudioFromCache(path);
    if (cached && cached.blob) {
        state.audioCache.set(path, cached.blob);
        state.loadedCount++;
        updateProgress();
        return Promise.resolve();
    }

    // 从网络加载
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `public/voices/${path}`, true);
        xhr.responseType = 'blob';

        xhr.onload = async () => {
            if (xhr.status === 200) {
                const blob = xhr.response;
                state.audioCache.set(path, blob);

                // 异步保存到IndexedDB
                saveAudioToCache(path, blob);

                state.loadedCount++;
                updateProgress();
                resolve();
            } else {
                reject(new Error(`加载失败: ${path}`));
            }
        };

        xhr.onerror = () => reject(new Error(`网络错误: ${path}`));
        xhr.send();
    });
}

// 更新加载进度
function updateProgress() {
    const progress = document.getElementById('loadingProgress');
    const progressText = document.getElementById('loadingProgressText');

    if (progress && progressText) {
        const percentage = Math.round((state.loadedCount / state.totalToLoad) * 100);
        progress.style.width = `${percentage}%`;
        progressText.textContent = `${state.loadedCount}/${state.totalToLoad}`;
    }
}

// 批量预加载
async function batchPreload(voices) {
    state.totalToLoad = voices.length;
    state.loadedCount = 0;

    // 更新进度显示
    updateProgress();

    // 并行加载，但控制并发数
    const CONCURRENCY = 5;
    const batches = [];

    for (let i = 0; i < voices.length; i += CONCURRENCY) {
        const batch = voices.slice(i, i + CONCURRENCY);
        const promises = batch.map(voice =>
            preloadAudio(voice, updateProgress).catch(error => {
                console.warn(`音频 ${voice.path} 预加载失败:`, error);
                state.loadedCount++;
                updateProgress();
            })
        );

        batches.push(Promise.all(promises));
    }

    // 等待所有批次完成
    for (const batch of batches) {
        await batch;
    }
}

// 渲染音频按钮
function renderVoiceButtons() {
    const container = document.getElementById('voiceContainer');
    if (!container) return;

    // 按标签分组
    const groupedVoices = groupVoicesByTag(state.voices);

    // 清空容器
    container.innerHTML = '';

    // 渲染每个分组
    Object.keys(groupedVoices).forEach(tag => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'voice-category';

        // 渲染分类标题
        const tagName = getLocalizedTag(tag);
        categoryElement.innerHTML = `<h2>${tagName}</h2><div class="voice-buttons"></div>`;

        // 渲染按钮
        const buttonsContainer = categoryElement.querySelector('.voice-buttons');
        groupedVoices[tag].forEach(voice => {
            buttonsContainer.appendChild(createVoiceButton(voice));
        });

        container.appendChild(categoryElement);
    });
}

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

// 创建音频按钮
function createVoiceButton(voice) {
    const wrapper = document.createElement('div');
    wrapper.className = 'haruka-button';
    wrapper.dataset.path = voice.path;

    const title = getLocalizedVoiceTitle(voice);
    let buttonHtml = '';

    // 如果标题过长，添加tooltip
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

    // 添加点击事件
    wrapper.querySelector('button').addEventListener('click', () => {
        playVoice(voice);
    });

    return wrapper;
}

// 获取本地化的标签名
function getLocalizedTag(tag) {
    return state.locales[state.currentLang].tags[tag] || tag;
}

// 获取本地化的音频标题
function getLocalizedVoiceTitle(voice) {
    return voice.messages[state.currentLang] ||
        voice.messages.zh ||
        Object.values(voice.messages)[0] ||
        '未知音频';
}

// 播放音频
async function playVoice(voice) {
    const path = voice.path;

    // 从缓存获取Blob
    let blob = state.audioCache.get(path);

    if (!blob) {
        // 如果内存中没有，尝试从IndexedDB加载
        const cached = await getAudioFromCache(path);
        if (cached && cached.blob) {
            blob = cached.blob;
            state.audioCache.set(path, blob);
        } else {
            // 回退到直接加载
            const audio = new Audio(`public/voices/${path}`);
            playAudioElement(audio, voice);
            return;
        }
    }

    // 从Blob创建音频对象
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    playAudioElement(audio, voice, () => {
        // 播放完成后释放URL
        URL.revokeObjectURL(audioUrl);
    });
}

// 播放音频元素
function playAudioElement(audio, voice, cleanupCallback) {
    const button = document.querySelector(`.haruka-button[data-path="${voice.path}"]`);

    // 创建进度条
    const progressMask = document.createElement('span');
    progressMask.className = 'process-mask';
    button.appendChild(progressMask);

    // 生成唯一标识符
    const audioId = `${voice.path}-${Date.now()}`;

    // 存储音频实例
    state.playingAudios.set(audioId, {
        audio: audio,
        path: voice.path,
        progressMask: progressMask,
        voice: voice,
        cleanup: cleanupCallback
    });

    // 播放音频
    audio.play().then(() => {
        // 设置进度条动画
        const duration = audio.duration || 3;
        progressMask.style.transition = `width ${duration}s linear`;
        progressMask.style.width = '100%';

        // 音频结束时处理
        audio.onended = () => {
            cleanupAudio(audioId);

            // 如果开启循环模式，重新播放当前音频
            if (state.isLoopMode) {
                playVoice(voice);
            }
        };

        // 错误处理
        audio.onerror = () => {
            console.error(`音频播放错误: ${voice.path}`);
            cleanupAudio(audioId);
        };
    }).catch(error => {
        console.error('播放失败:', error);
        cleanupAudio(audioId);
    });
}

// 清理音频资源
function cleanupAudio(audioId) {
    const item = state.playingAudios.get(audioId);
    if (item) {
        if (item.cleanup) item.cleanup();
        item.progressMask.remove();
        state.playingAudios.delete(audioId);
    }
}

// 停止所有音频
function stopAllVoices() {
    state.playingAudios.forEach(item => {
        item.audio.pause();
        if (item.cleanup) item.cleanup();
        item.progressMask.remove();
    });

    state.playingAudios.clear();
}

// 随机播放
function playRandomVoice() {
    const randomIndex = Math.floor(Math.random() * state.voices.length);
    playVoice(state.voices[randomIndex]);
}

// 绑定事件
function bindEvents() {
    // 随机播放
    document.getElementById('randomPlay').addEventListener('click', playRandomVoice);

    // 停止所有
    document.getElementById('stopAll').addEventListener('click', stopAllVoices);

    // 循环模式切换
    document.getElementById('loopMode').addEventListener('change', (e) => {
        state.isLoopMode = e.target.checked;
    });
}

// 隐藏加载界面，显示主界面
function showMainContent() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContent = document.getElementById('mainContent');

    if (loadingScreen) loadingScreen.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
}

// 初始化
async function init() {
    try {
        // 设置音频数据
        state.voices = voices;

        // 清理旧缓存
        cleanupOldCache();

        // 预加载音频
        await batchPreload(state.voices);

        // 显示主界面
        showMainContent();

        // 渲染音频按钮
        renderVoiceButtons();

        // 绑定事件
        bindEvents();

        // 新增：设置模式切换
        setupModeSwitch();

        setupKeySystemSwitch()

        console.log('初始化完成，已加载音频:', state.voices.length);
    } catch (error) {
        console.error('初始化失败:', error);
        // 即使预加载失败，也显示界面
        showMainContent();
        state.voices = voices;
        renderVoiceButtons();
        bindEvents();
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);