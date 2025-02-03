const CACHE_NAME = 'latin-cat-v1';
const urlsToCache = [
    './',
    './index.html',
    './study.html',
    './css/style.css',
    './js/main.js',
    './js/csvParser.js',
    './js/memory.js',
    './js/ai-helper.js',
    './data/example.csv',
    './data/sample.csv',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
];

// 安装 Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 处理请求
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果在缓存中找到响应，则返回缓存的响应
                if (response) {
                    return response;
                }

                // 否则发送网络请求
                return fetch(event.request).then(
                    response => {
                        // 检查是否是有效的响应
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 克隆响应
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});
