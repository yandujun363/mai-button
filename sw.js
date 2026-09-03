const CACHE_NAME = 'mai-button-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/favicon.jpg',
  
  // app 文件夹
  '/src/app/audioInitializer.js',
  '/src/app/cdnManager.js',
  '/src/app/eventBinder.js',
  '/src/app/index.js',
  
  // config 文件夹
  '/src/config/cdns.js',
  '/src/config/voices.js',
  
  // core 文件夹
  '/src/core/audioLoader.js',
  '/src/core/audioPlayer.js',
  '/src/core/state.js',
  
  // locales 文件夹
  '/src/locales/zh.js',
  
  // storage 文件夹
  '/src/storage/audioCache.js',
  '/src/storage/cdnSettings.js',
  '/src/storage/db.js',
  
  // ui 文件夹
  '/src/ui/cdnRenderer.js',
  '/src/ui/voiceRenderer.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('预缓存资源中...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 只拦截同源的 JS、CSS、HTML 请求
  const shouldIntercept = 
    event.request.method === 'GET' &&
    url.origin === self.location.origin &&  // 只拦截同源请求
    (
      event.request.destination === 'document' ||      // HTML
      event.request.destination === 'style' ||         // CSS
      event.request.destination === 'script' ||        // JS
      event.request.destination === 'worker' ||        // Web Worker
      event.request.destination === 'sharedworker' ||  // Shared Worker
      /\.(css|js|html?)$/i.test(url.pathname)          // 通过扩展名兜底
    );

  if (!shouldIntercept) {
    // 不拦截的请求直接放行
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('从缓存返回:', event.request.url);
          return response;
        }
        return fetch(event.request).then(
          networkResponse => {
            // 可选：缓存新获取的资源
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          }
        ).catch(error => {
          console.warn('请求失败:', event.request.url, error);
          return new Response('网络连接已断开，请检查网络后重试。', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});