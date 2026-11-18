import { expect, test, type Page } from "@playwright/test";

const SCOPE = "/e2e/fixtures/";
const FIXTURE = `${SCOPE}service-worker-cache.html`;
const RESOURCE = `${SCOPE}maps/offline.json`;
const LEGACY_WORKER = `${SCOPE}legacy-service-worker.js`;
const PRE_FIX_WORKER = `${SCOPE}pre-fix-service-worker.js`;
const UPDATED_WORKER = "/service-worker.js";
const LEGACY_CACHE = "resourcesCache-2026-11-18-22-41";
const EXPECTED_JSON = { source: "legacy-runtime-cache" };
const OFFLINE_ERROR = /Failed to fetch|NetworkError|Load failed|no-response/;

async function activateWorker(page: Page, scriptURL: string, scope = SCOPE) {
  await page.evaluate(
    async ({ scriptURL, scope }) => {
      await navigator.serviceWorker.register(scriptURL, { scope });
    },
    { scriptURL, scope }
  );

  await expect
    .poll(() =>
      page.evaluate(async scope => {
        const registration =
          await navigator.serviceWorker.getRegistration(scope);
        return registration?.active?.scriptURL
          ? new URL(registration.active.scriptURL).pathname
          : null;
      }, scope)
    )
    .toBe(scriptURL);

  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() =>
        navigator.serviceWorker.controller
          ? new URL(navigator.serviceWorker.controller.scriptURL).pathname
          : null
      )
    )
    .toBe(scriptURL);
}

async function readJson(page: Page, path = RESOURCE) {
  return page.evaluate(async path => {
    try {
      return await (await fetch(path)).json();
    } catch (error) {
      return String(error);
    }
  }, path);
}

async function waitForCached(page: Page, cacheName: string, path = RESOURCE) {
  await expect
    .poll(() =>
      page.evaluate(
        async ({ cacheName, path }) => {
          const cache = await caches.open(cacheName);
          return Boolean(await cache.match(new URL(path, location.href)));
        },
        { cacheName, path }
      )
    )
    .toBe(true);
}

test("keeps the real legacy worker's cached JSON available before and after update", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await activateWorker(page, LEGACY_WORKER);

  expect(await readJson(page)).toEqual(EXPECTED_JSON);
  await waitForCached(page, LEGACY_CACHE);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual(EXPECTED_JSON);

  await context.setOffline(false);
  await activateWorker(page, UPDATED_WORKER);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual(EXPECTED_JSON);
});

test("updating to another dated build loses the real legacy worker's offline JSON", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await activateWorker(page, LEGACY_WORKER);
  expect(await readJson(page)).toEqual(EXPECTED_JSON);
  await waitForCached(page, LEGACY_CACHE);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual(EXPECTED_JSON);

  await context.setOffline(false);
  await activateWorker(page, PRE_FIX_WORKER);
  await waitForCached(page, LEGACY_CACHE);
  await context.setOffline(true);
  expect(String(await readJson(page))).toMatch(OFFLINE_ERROR);
});

test("the new worker recovers legacy offline JSON after a dated build could not serve it", async ({
  page,
  context,
  browserName
}) => {
  test.skip(
    browserName !== "chromium",
    "WebKit drops not-yet-flushed Cache Storage writes on the second service worker replacement in one session"
  );
  await page.goto(FIXTURE);
  await page.evaluate(
    async ({ cacheName, path, source }) => {
      const cache = await caches.open(cacheName);
      await cache.put(
        new URL(path, location.href),
        new Response(JSON.stringify({ source }), {
          headers: {
            "Content-Type": "application/json",
            Date: new Date(Date.now() - 60_000).toUTCString()
          }
        })
      );
    },
    {
      cacheName: LEGACY_CACHE,
      path: RESOURCE,
      source: EXPECTED_JSON.source
    }
  );

  await activateWorker(page, PRE_FIX_WORKER);
  await context.setOffline(true);
  expect(String(await readJson(page))).toMatch(OFFLINE_ERROR);

  await context.setOffline(false);
  await activateWorker(page, UPDATED_WORKER);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual(EXPECTED_JSON);
});
