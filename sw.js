// アプリケーション リソースに変更を加える場合は、VERSION を更新する
const VERSION = "v3";
const CACHE_NAME = `period-tracker-${VERSION}`;

const APP_STATIC_RESOURCES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/cycletracker.json",
  "/icons/wheel.svg",
];

// インストール時にキャッシュを保存する
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      cache.addAll(APP_STATIC_RESOURCES);
    })(),
  );
});

// サービスワーカーのアップデート時に古いキャッシュを削除し、新しいキャッシュを有効にする
// activate イベントは、新しいサービスワーカーがインストールされた後、古いサービスワーカーを置き換える準備ができたときに発生
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        }),
      );
      await clients.claim();
    })(),
  );
});

// ネットワークリクエストが発生したときにサービスワーカーが介入してカスタムレスポンスを提供
self.addEventListener("fetch", (event) => {
  // ページを移動するリクエストの場合,ルートページにリダイレクト
  if (event.request.mode === "navigate") {
    event.respondWith(caches.match("/"));
    return;
  }

  // それ以外はキャッシュにあるものを返す
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request.url);
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response(null, { status: 404 });
    })(),
  );
});