// Enhanced Service Worker for Dreamer AI Solutions
// Provides offline functionality, caching strategies, and performance optimizations

const CACHE_NAME = 'dreamer-ai-cache-v1';
const RUNTIME_CACHE = 'dreamer-ai-runtime-v1';
const IMAGE_CACHE = 'dreamer-ai-images-v1';
const API_CACHE = 'dreamer-ai-api-v1';

// Resources to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/founder-jlasalle.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  new RegExp('/api/showcase/'),
  new RegExp('/api/contact/'),
  new RegExp('/api/analytics/')
];

// Image file extensions to cache
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Install event - Cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      
      // Initialize other caches
      caches.open(RUNTIME_CACHE),
      caches.open(IMAGE_CACHE),
      caches.open(API_CACHE)
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('dreamer-ai-') && 
                     ![CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, API_CACHE].includes(cacheName);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

// Fetch event - Handle different caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(handleRequest(request));
});

// Main request handler with different strategies
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Static resources (HTML, CSS, JS) - Cache first
    if (isStaticResource(pathname)) {
      return await cacheFirst(request, CACHE_NAME);
    }

    // Images - Stale while revalidate
    if (isImage(pathname)) {
      return await staleWhileRevalidate(request, IMAGE_CACHE);
    }

    // API calls - Network first with fallback
    if (isApiCall(pathname)) {
      return await networkFirstWithTimeout(request, API_CACHE, 5000);
    }

    // Navigation requests - Network first with offline page fallback
    if (isNavigationRequest(request)) {
      return await handleNavigationRequest(request);
    }

    // Runtime resources - Stale while revalidate
    return await staleWhileRevalidate(request, RUNTIME_CACHE);

  } catch (error) {
    console.warn('[SW] Request failed:', error);
    return await handleOfflineRequest(request);
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Network first strategy with timeout
async function networkFirstWithTimeout(request, cacheName, timeout = 5000) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetchWithTimeout(request, timeout);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Network request failed, trying cache:', error);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Always try to fetch and update cache in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Silently fail background updates
    return null;
  });

  // Return cached version immediately if available
  if (cached) {
    return cached;
  }

  // If no cache, wait for network
  return await fetchPromise;
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const response = await fetchWithTimeout(request, 3000);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return cached page or offline fallback
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    // Return offline page
    return await cache.match('/') || new Response(
      generateOfflinePage(),
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle offline requests
async function handleOfflineRequest(request) {
  const url = new URL(request.url);
  
  if (isImage(url.pathname)) {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="14">Image unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }

  if (isApiCall(url.pathname)) {
    return new Response(
      JSON.stringify({
        error: 'Service unavailable',
        message: 'This feature requires an internet connection',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response('Service unavailable', { status: 503 });
}

// Utility functions
function fetchWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeout);

    fetch(request).then((response) => {
      clearTimeout(timeoutId);
      resolve(response);
    }).catch((error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

function isStaticResource(pathname) {
  return pathname.includes('/static/') || 
         pathname.endsWith('.js') || 
         pathname.endsWith('.css') ||
         pathname.endsWith('.html');
}

function isImage(pathname) {
  return IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext));
}

function isApiCall(pathname) {
  return pathname.startsWith('/api/') || 
         API_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function generateOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Dreamer AI Solutions</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .container {
          max-width: 600px;
          padding: 2rem;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          margin: 0 auto 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }
        h1 {
          font-size: 2.5rem;
          margin: 0 0 1rem;
        }
        p {
          font-size: 1.2rem;
          opacity: 0.9;
          margin: 0 0 2rem;
        }
        .retry-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid white;
          color: white;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .retry-btn:hover {
          background: white;
          color: #667eea;
        }
        .features {
          margin-top: 3rem;
          text-align: left;
          background: rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          border-radius: 10px;
        }
        .feature {
          margin: 1rem 0;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pulse {
          animation: pulse 2s infinite;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo pulse">🤖</div>
        <h1>You're Offline</h1>
        <p>Don't worry! Some features are still available while you're offline.</p>
        
        <button class="retry-btn" onclick="window.location.reload()">
          Try Again
        </button>

        <div class="features">
          <h3>Available Offline:</h3>
          <div class="feature">✅ Browse cached pages</div>
          <div class="feature">✅ View previously loaded content</div>
          <div class="feature">✅ Access cached images</div>
          <div class="feature">❌ Contact forms (requires internet)</div>
          <div class="feature">❌ Live demos (requires internet)</div>
          <div class="feature">❌ Real-time analytics (requires internet)</div>
        </div>
      </div>

      <script>
        // Auto-retry when online
        window.addEventListener('online', () => {
          window.location.reload();
        });

        // Show online status
        function updateOnlineStatus() {
          if (navigator.onLine) {
            document.querySelector('.retry-btn').textContent = 'Back Online - Click to Refresh';
            document.querySelector('.retry-btn').style.background = '#10B981';
            document.querySelector('.retry-btn').style.borderColor = '#10B981';
          }
        }

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
      </script>
    </body>
    </html>
  `;
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAN_CACHE':
      handleCacheCleanup(payload).then((result) => {
        event.ports[0].postMessage(result);
      });
      break;
      
    case 'PREFETCH_URLS':
      handlePrefetch(payload.urls).then((result) => {
        event.ports[0].postMessage(result);
      });
      break;
      
    default:
      console.warn('[SW] Unknown message type:', type);
  }
});

// Handle cache cleanup
async function handleCacheCleanup(options = {}) {
  const { maxAge = 7 * 24 * 60 * 60 * 1000, maxEntries = 100 } = options;
  
  try {
    const cacheNames = [RUNTIME_CACHE, IMAGE_CACHE, API_CACHE];
    let totalCleaned = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      // Sort by date (newest first)
      const sortedKeys = keys.sort((a, b) => {
        const aDate = new Date(a.headers.get('date') || 0);
        const bDate = new Date(b.headers.get('date') || 0);
        return bDate.getTime() - aDate.getTime();
      });

      // Remove old entries
      const now = Date.now();
      const toDelete = sortedKeys.filter((key, index) => {
        const date = new Date(key.headers.get('date') || 0);
        const isOld = now - date.getTime() > maxAge;
        const exceedsLimit = index >= maxEntries;
        return isOld || exceedsLimit;
      });

      for (const key of toDelete) {
        await cache.delete(key);
        totalCleaned++;
      }
    }

    return { success: true, cleaned: totalCleaned };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle prefetching
async function handlePrefetch(urls) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const results = await Promise.allSettled(
      urls.map(url => fetch(url).then(response => {
        if (response.ok) {
          cache.put(url, response.clone());
        }
        return { url, success: response.ok };
      }))
    );

    return {
      success: true,
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
      )
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Handle queued form submissions when back online
  // This would typically involve reading from IndexedDB
  console.log('[SW] Performing background sync for contact forms');
}

// Push notification handling (for future implementation)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const { title, body, icon, badge, tag } = event.data.json();
  
  const options = {
    body,
    icon: icon || '/logo192.png',
    badge: badge || '/logo192.png',
    tag: tag || 'dreamer-ai-notification',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service worker loaded successfully');