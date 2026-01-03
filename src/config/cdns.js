// src/config/cdns.js
export const CDN_CONFIGS = [
    {
        id: 'cdn1',
        name: '主CDN(Cloudflare)',
        url: 'https://cdn.yangdujun.top/auido/3546775765912341/',
        description: '主要CDN源，通过Cloudflare加载',
        priority: 1
    },
    // {
    //     id: 'cdn2',
    //     name: '杭州市 阿里云(善恶如辨OvO的服务器)',
    //     url: 'https://auido.shanerubian.online/auido/3546775765912341/',
    //     description: '借善恶如辨OvO的服务器实现的音频源',
    //     priority: 2
    // },
    {
        id: 'cdn3',
        name: 'NASCDN',
        url: 'https://naslink.yangdujun.top/api/public/dl/2XO4OUh3/3546775765912341/',
        description: '用NAS实现的CDN，容易炸，但是速度会快点',
        priority: 3
    },
];