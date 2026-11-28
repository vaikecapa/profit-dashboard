/*
 * Service worker: phone notifications only (Web Push, ticket 06). It caches nothing and handles no requests, so the
 * app's own update check (src/update.ts) stays in charge of new builds.
 * A push carries { title, body, url, tag } from supabase/functions/_shared/pushNotify.ts. iPhone needs every push to
 * show a notification, so one is always shown. Tapping it opens the app at `url` (e.g. ./#email/42).
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let m = {};
  try { m = event.data ? event.data.json() : {}; } catch { m = {}; }
  event.waitUntil(self.registration.showNotification(m.title || "Profit", {
    body: m.body || "",
    tag: m.tag,
    data: { url: m.url || "./" },
    icon: "icon-192.png",
    badge: "icon-192.png",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "./", self.registration.scope).href;
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const client = open.find((c) => c.url.startsWith(self.registration.scope));
    if (client) {
      await client.focus();
      client.postMessage({ type: "open", url }); // the app moves to the page (src/push.ts)
      return;
    }
    await self.clients.openWindow(url);
  })());
});
