import { expect, test, type Page } from "@playwright/test";

const SCOPE = "/e2e/fixtures/";
const FIXTURE = `${SCOPE}service-worker-cache.html`;
const MAPS_SCOPE = `${SCOPE}maps/`;
const RESOURCE = `${MAPS_SCOPE}offline.json`;
const WORKER = "/service-worker.js";
const LEGACY_CACHE = "resourcesCache-2026-11-18-22-41";
const OLDER_CACHE = "resourcesCache-2026-11-18-20-08";
const NEWER_CACHE = "resourcesCache-2026-11-18-22-41";
const FIXED_CACHE = "resourcesCache";

async function activateWorker(page: Page, scriptURL = WORKER, scope = SCOPE) {
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

  const controlledPage =
    scope === MAPS_SCOPE ? `${MAPS_SCOPE}service-worker-cache.html` : FIXTURE;
  if (new URL(page.url()).pathname !== controlledPage) {
    await page.goto(controlledPage);
  } else {
    await page.reload();
  }
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

async function seed(
  page: Page,
  cacheName: string,
  path: string,
  source: string,
  ageMs: number | null
) {
  await page.evaluate(
    async ({ cacheName, path, source, ageMs }) => {
      const headers = new Headers({ "Content-Type": "application/json" });
      if (ageMs !== null) {
        headers.set("Date", new Date(Date.now() - ageMs).toUTCString());
      }
      const cache = await caches.open(cacheName);
      await cache.put(
        new URL(path, location.href),
        new Response(JSON.stringify({ source }), { headers })
      );
    },
    { cacheName, path, source, ageMs }
  );
}

async function cachedJson(page: Page, cacheName: string, path = RESOURCE) {
  return page.evaluate(
    async ({ cacheName, path }) => {
      const cache = await caches.open(cacheName);
      return (await cache.match(new URL(path, location.href)))?.json();
    },
    { cacheName, path }
  );
}

test("serves an uncopied legacy JSON offline when the fixed-cache write hits quota", async ({
  page,
  context,
  browserName
}) => {
  test.skip(browserName !== "chromium");
  await page.goto(FIXTURE);

  const legacyName = LEGACY_CACHE;
  await page.evaluate(
    async ({ legacyName, scope }) => {
      const cache = await caches.open(legacyName);
      const body = JSON.stringify({ source: "x".repeat(65_523) });
      for (let entry = 0; entry < 256; entry++) {
        await cache.put(
          `${scope}maps/quota-${entry}.json`,
          new Response(body, {
            headers: {
              "Content-Type": "application/json",
              Date: new Date().toUTCString()
            }
          })
        );
      }
    },
    { legacyName, scope: SCOPE }
  );

  const cdp = await context.newCDPSession(page);
  const origin = new URL(page.url()).origin;
  const { usage } = await cdp.send("Storage.getUsageAndQuota", { origin });
  await cdp.send("Storage.overrideQuotaForOrigin", {
    origin,
    quotaSize: usage + 16 * 1024
  });

  await activateWorker(page);
  await context.setOffline(true);

  const lastPath = `${SCOPE}maps/quota-255.json`;
  const uncopied = await readJson(page, lastPath);
  expect(uncopied.source).toHaveLength(65_523);
  expect(await cachedJson(page, FIXED_CACHE, lastPath)).toBeUndefined();
  expect(
    await page.evaluate(
      async ({ legacyName, lastPath }) => {
        const cache = await caches.open(legacyName);
        return Boolean(await cache.match(new URL(lastPath, location.href)));
      },
      { legacyName, lastPath }
    )
  ).toBe(true);
});

test("an older worker in a sibling scope keeps using the shared legacy cache", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await activateWorker(page, `${SCOPE}legacy-service-worker.js`);
  expect(await readJson(page)).toEqual({ source: "legacy-runtime-cache" });

  const sibling = await context.newPage();
  await sibling.goto(FIXTURE);
  await activateWorker(sibling, `${SCOPE}legacy-service-worker.js`, MAPS_SCOPE);
  await context.setOffline(true);
  expect(await readJson(sibling)).toEqual({ source: "legacy-runtime-cache" });

  await context.setOffline(false);
  await activateWorker(page);
  expect(
    await sibling.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.scope ? new URL(registration.scope).pathname : null;
    })
  ).toBe(MAPS_SCOPE);
  expect(
    await sibling.evaluate(() =>
      navigator.serviceWorker.controller
        ? new URL(navigator.serviceWorker.controller.scriptURL).pathname
        : null
    )
  ).toBe(`${SCOPE}legacy-service-worker.js`);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "legacy-runtime-cache" });
  expect(await readJson(sibling)).toEqual({ source: "legacy-runtime-cache" });
  expect(
    await page.evaluate(
      async name => (await caches.keys()).includes(name),
      LEGACY_CACHE
    )
  ).toBe(true);
});

test("the newest dated response beats older duplicates and refreshes the fixed cache", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(page, FIXED_CACHE, RESOURCE, "fixed-old", 6 * 60 * 60 * 1000);
  await seed(page, OLDER_CACHE, RESOURCE, "legacy-old", 48 * 60 * 60 * 1000);
  await seed(page, NEWER_CACHE, RESOURCE, "legacy-new", 60 * 1000);

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "legacy-new" });
  expect(await cachedJson(page, FIXED_CACHE)).toEqual({ source: "legacy-new" });
});

test("an older legacy response never replaces a newer fixed-cache response", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(page, FIXED_CACHE, RESOURCE, "fixed-new", 60 * 1000);
  await seed(page, OLDER_CACHE, RESOURCE, "legacy-old", 48 * 60 * 60 * 1000);

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "fixed-new" });
  expect(await cachedJson(page, FIXED_CACHE)).toEqual({ source: "fixed-new" });
});

test("expired fixed and legacy responses are rejected by the same 24-hour rule", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(
    page,
    FIXED_CACHE,
    `${MAPS_SCOPE}expired-fixed.json`,
    "expired-fixed",
    48 * 60 * 60 * 1000
  );
  await seed(
    page,
    NEWER_CACHE,
    `${MAPS_SCOPE}expired-legacy.json`,
    "expired-legacy",
    48 * 60 * 60 * 1000
  );

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page, `${MAPS_SCOPE}expired-fixed.json`)).toMatch(
    /Failed to fetch|NetworkError|Load failed|no-response/
  );
  expect(await readJson(page, `${MAPS_SCOPE}expired-legacy.json`)).toMatch(
    /Failed to fetch|NetworkError|Load failed|no-response/
  );
});

test("a fixed cache response without a Date header follows Workbox's current behavior", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(page, FIXED_CACHE, RESOURCE, "fixed-without-date", null);
  await seed(page, NEWER_CACHE, RESOURCE, "dated-legacy", 0);

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "fixed-without-date" });
});

test("a legacy response without a Date header follows Workbox's current behavior", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(page, NEWER_CACHE, RESOURCE, "legacy-without-date", null);

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "legacy-without-date" });
});

test("a newer response Date beats an older cache-name date among legacy caches", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(page, OLDER_CACHE, RESOURCE, "older-name-newer-date", 60 * 1000);
  await seed(
    page,
    NEWER_CACHE,
    RESOURCE,
    "newer-name-older-date",
    3 * 60 * 60 * 1000
  );

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "older-name-newer-date" });
  expect(await cachedJson(page, FIXED_CACHE)).toEqual({
    source: "older-name-newer-date"
  });
});

test("without Date headers the newer cache-name date wins among legacy caches", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(page, OLDER_CACHE, RESOURCE, "older-name", null);
  await seed(page, NEWER_CACHE, RESOURCE, "newer-name", null);

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "newer-name" });
  expect(await cachedJson(page, FIXED_CACHE)).toEqual({ source: "newer-name" });
});
