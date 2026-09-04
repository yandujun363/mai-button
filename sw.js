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
      .then(cachedResponse => {
        // 如果有缓存，发起网络请求进行验证（带 If-Modified-Since 或 If-None-Match）
        if (cachedResponse) {
          // 获取缓存的响应头信息用于验证
          const cachedHeaders = cachedResponse.headers;
          const eTag = cachedHeaders.get('ETag');
          const lastModified = cachedHeaders.get('Last-Modified');
          
          // 构建验证请求头
          const headers = new Headers();
          if (eTag) {
            headers.set('If-None-Match', eTag);
          }
          if (lastModified) {
            headers.set('If-Modified-Since', lastModified);
          }

          // 发起网络请求进行验证
          const validationRequest = new Request(event.request.url, {
            method: 'GET',
            headers: headers
          });

          return fetch(validationRequest)
            .then(networkResponse => {
              // 如果返回 304（Not Modified），使用缓存
              if (networkResponse.status === 304) {
                console.log('304验证通过，使用缓存:', event.request.url);
                return cachedResponse;
              }

              // 如果返回 200，说明资源有更新
              if (networkResponse.status === 200) {
                console.log('资源已更新，更新缓存:', event.request.url);
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
                return networkResponse;
              }
            })
            .catch(error => {
              // 网络请求失败，使用缓存
              console.warn('网络请求失败，使用缓存:', event.request.url, error);
              return cachedResponse;
            });
        }

        // 没有缓存，直接请求网络
        return fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(error => {
            console.warn('请求失败:', event.request.url, error);
            return new Response('网络连接已断开，请检查网络后重试。', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});