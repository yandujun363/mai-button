// src/config/cdns.js
export const CDN_CONFIGS = [
    {
        id: 'local',
        name: '本地文件',
        url: '/public/voices/3546775765912341/',
        description: '使用本地文件夹中的音频文件',
        priority: 0
    },
    {
        id: 'cdn3',
        name: 'NASCDN',
        url: 'https://naslink.yangdujun.top/api/public/dl/2XO4OUh3/3546775765912341/',
        description: '用NAS实现的CDN，容易炸，但是速度会快点',
        priority: 3
    },
];