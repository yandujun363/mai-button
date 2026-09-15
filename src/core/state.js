import { zhLocale } from '@locales/zh.js';
import { CDN_CONFIGS } from '@config/cdns.js';

/**
 * 并发加载数量
 * 
 * 控制同时加载的音频文件数量
 * - 值太小：加载速度慢
 * - 值太大：可能占用过多网络带宽
 * - 推荐值：3-10
 */
const CONCURRENCY_MIX = 5;

/**
 * 全局状态对象
 * 
 * 所有状态都集中管理，便于追踪和调试
 */
export const state = {
    // ========== 用户偏好设置 ==========
    currentLang: 'zh',          // 当前语言
    isLoopMode: false,          // 循环播放模式
    
    // ========== 播放管理 ==========
    playingAudios: new Map(),   // 播放中的音频 { audioId: { audio, path, progressMask, voice, cleanup } }
    audioCache: new Map(),      // 内存缓存 { path: Blob }
    
    // ========== 音频数据 ==========
    voices: [],                 // 音频配置列表
    locales: {                  // 多语言配置
        zh: zhLocale,
        en: zhLocale,           // 目前使用中文作为降级
        ja: zhLocale            // 目前使用中文作为降级
    },
    
    // ========== CDN 相关 ==========
    audioUrl: '',               // 当前音频源 URL
    selectedCdn: null,          // 选中的 CDN 配置
    availableCdns: CDN_CONFIGS || [],  // 可用 CDN 列表

    // ========== IndexedDB 配置 ==========
    DBConfig : {
        DB_NAME: 'MaiButtonDB', // 数据库名称
        DB_VERSION: 2, // 数据库版本
        STORE_NAME: 'audioCache', // 音频缓存存储名称
        CDN_STORE_NAME: 'cdnSettings' // CDN 设置存储名称
    },
    
    // ========== 加载状态 ==========
    totalToLoad: 0,             // 总音频数
    loadedCount: 0,             // 已加载数
    
    // ========== 运行模式（自动判断） ==========
    isSingleCdnMode: CDN_CONFIGS && CDN_CONFIGS.length === 1,
    isLocalMode: !CDN_CONFIGS || CDN_CONFIGS.length === 0
};

/**
 * 设置音频源 URL
 * 
 * @param {string} url - 音频基础 URL
 * 
 * 使用场景：
 * - 选择 CDN 后调用
 * - 切换到本地模式时调用
 * 
 * 注意：
 * - URL 必须以斜杠结尾
 * - 示例：'https://cdn.example.com/voices/'
 */
export function setAudioUrl(url) {
    state.audioUrl = url;
}

/**
 * 并发数常量
 * 
 * 控制音频加载的并发数量
 * 可通过修改 CONCURRENCY_MIX 调整
 */
export const CONCURRENCY = CONCURRENCY_MIX;