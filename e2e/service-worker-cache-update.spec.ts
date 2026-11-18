import { expect, test } from "@playwright/test";

const SCOPE = "/e2e/fixtures/";
const RESOURCE = `${SCOPE}maps/offline.json`;
const LEGACY_CACHE = "resourcesCache-2026-11-18-20-08";

test("keeps a cached map JSON available offline after the worker updates", async ({
  page,
  context
}) => {
  await page.goto(`${SCOPE}service-worker-cache.html`);
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(registration => registration.unregister())
    );
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith("resourcesCache"))
        .map(name => caches.delete(name))
    );
  });

  await page.evaluate(async scope => {
    await navigator.serviceWorker.register(
      "/e2e/fixtures/legacy-cache-worker.js",
      { scope }
    );
    await navigator.serviceWorker.ready;
  }, SCOPE);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller))
    )
    .toBe(true);

  const original = await page.evaluate(async resource => {
    const response = await fetch(resource);
    return response.json();
  }, RESOURCE);
  expect(original).toEqual({ source: "legacy-runtime-cache" });
  await expect
    .poll(() =>
      page.evaluate(async cacheName => {
        const cache = await caches.open(cacheName);
        return Boolean(
          await cache.match(
            new URL("/e2e/fixtures/maps/offline.json", location.href)
          )
        );
      }, LEGACY_CACHE)
    )
    .toBe(true);

  await page.evaluate(async scope => {
    await navigator.serviceWorker.register("/service-worker.js", { scope });
    await navigator.serviceWorker.ready;
  }, SCOPE);
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? "")
    )
    .toBe("http://localhost:5176/service-worker.js");
  await expect
    .poll(() =>
      page.evaluate(async cacheName => {
        const cache = await caches.open(cacheName);
        return Boolean(
          await cache.match(
            new URL("/e2e/fixtures/maps/offline.json", location.href)
          )
        );
      }, "resourcesCache")
    )
    .toBe(true);

  await context.setOffline(true);
  const restored = await page.evaluate(async resource => {
    const response = await fetch(resource);
    return response.json();
  }, RESOURCE);
  expect(restored).toEqual({ source: "legacy-runtime-cache" });
});
