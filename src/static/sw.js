// The previous version of this site installed a service worker that cached
// its pages. This one replaces it: it clears those caches, unregisters itself
// and reloads open tabs, so returning visitors get the current site.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
      await self.registration.unregister();
      const tabs = await self.clients.matchAll({ type: "window" });
      await Promise.all(tabs.map((tab) => tab.navigate(tab.url)));
    })()
  );
});
