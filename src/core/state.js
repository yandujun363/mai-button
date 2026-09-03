import { zhLocale } from '@locales/zh.js';
import { CDN_CONFIGS } from '@config/cdns.js';

const CONCURRENCY_MIX = 5;

// 全局状态
export const state = {
    currentLang: 'zh',
    isLoopMode: false,
    playingAudios: new Map(),
    audioCache: new Map(),
    voices: [],
    locales: {
        zh: zhLocale,
        en: zhLocale,
        ja: zhLocale
    },
    audioUrl: '',
    totalToLoad: 0,
    loadedCount: 0,
    selectedCdn: null,
    availableCdns: CDN_CONFIGS || [],
    isSingleCdnMode: CDN_CONFIGS && CDN_CONFIGS.length === 1,
    isLocalMode: !CDN_CONFIGS || CDN_CONFIGS.length === 0
};

export function setAudioUrl(url) {
    state.audioUrl = url;
}

export const CONCURRENCY = CONCURRENCY_MIX;