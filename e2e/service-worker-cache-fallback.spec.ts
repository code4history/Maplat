import { expect, test, type Page } from "@playwright/test";

const SCOPE = "/e2e/fixtures/";
const FIXTURE = `${SCOPE}service-worker-cache.html`;
const MAPS_SCOPE = `${SCOPE}maps/`;
const RESOURCE = `${MAPS_SCOPE}offline.json`;
const WORKER = "/service-worker.js";
const LEGACY_CACHE = "resourcesCache-2026-11-18-22-41";
const FIXED_CACHE = "resourcesCache";
const NETWORK_JSON = { source: "legacy-runtime-cache" };
const OFFLINE_ERROR = /Failed to fetch|NetworkError|Load failed|no-response/;

function cacheNameAt(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `resourcesCache-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

const nameAgo = (ms: number) => cacheNameAt(new Date(Date.now() - ms));

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
  expect(await readJson(page)).toEqual(NETWORK_JSON);
  await expect
    .poll(() =>
      page.evaluate(
        async ({ cacheName, path }) => {
          const cache = await caches.open(cacheName);
          return Boolean(await cache.match(new URL(path, location.href)));
        },
        { cacheName: LEGACY_CACHE, path: RESOURCE }
      )
    )
    .toBe(true);

  const sibling = await context.newPage();
  await sibling.goto(FIXTURE);
  await activateWorker(sibling, `${SCOPE}legacy-service-worker.js`, MAPS_SCOPE);
  await context.setOffline(true);
  expect(await readJson(sibling)).toEqual(NETWORK_JSON);

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
  expect(await readJson(page)).toEqual(NETWORK_JSON);
  expect(await readJson(sibling)).toEqual(NETWORK_JSON);
  expect(
    await page.evaluate(
      async name => (await caches.keys()).includes(name),
      LEGACY_CACHE
    )
  ).toBe(true);
});

test("a fresh fixed-cache response is served without consulting the legacy caches", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(page, FIXED_CACHE, RESOURCE, "fixed-old", 6 * 60 * 60 * 1000);
  await seed(page, nameAgo(2 * 60 * 60 * 1000), RESOURCE, "legacy-new", 60_000);

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "fixed-old" });
  expect(await cachedJson(page, FIXED_CACHE)).toEqual({ source: "fixed-old" });
});

test("an older legacy response never replaces a newer fixed-cache response", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(page, FIXED_CACHE, RESOURCE, "fixed-new", 60_000);
  await seed(
    page,
    nameAgo(2 * 60 * 60 * 1000),
    RESOURCE,
    "legacy-old",
    48 * 60 * 60 * 1000
  );

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
    nameAgo(2 * 60 * 60 * 1000),
    `${MAPS_SCOPE}expired-legacy.json`,
    "expired-legacy",
    48 * 60 * 60 * 1000
  );

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page, `${MAPS_SCOPE}expired-fixed.json`)).toMatch(
    OFFLINE_ERROR
  );
  expect(await readJson(page, `${MAPS_SCOPE}expired-legacy.json`)).toMatch(
    OFFLINE_ERROR
  );
});

test("a fixed cache response without a Date header follows Workbox's current behavior", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(page, FIXED_CACHE, RESOURCE, "fixed-without-date", null);
  await seed(page, nameAgo(2 * 60 * 60 * 1000), RESOURCE, "dated-legacy", 0);

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "fixed-without-date" });
});

test("a Date-less legacy response within a day of its cache-name date is served", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(
    page,
    nameAgo(60 * 60 * 1000),
    RESOURCE,
    "legacy-without-date",
    null
  );

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "legacy-without-date" });
  await expect
    .poll(() => cachedJson(page, FIXED_CACHE))
    .toEqual({ source: "legacy-without-date" });
});

test("a Date-less legacy response older than a day by its cache-name date is not served", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(
    page,
    nameAgo(48 * 60 * 60 * 1000),
    RESOURCE,
    "ancient-without-date",
    null
  );

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toMatch(OFFLINE_ERROR);
  expect(await cachedJson(page, FIXED_CACHE)).toBeUndefined();
});

test("a newer response Date beats an older cache-name date among legacy caches", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(
    page,
    nameAgo(5 * 60 * 60 * 1000),
    RESOURCE,
    "older-name-newer-date",
    60_000
  );
  await seed(
    page,
    nameAgo(60 * 60 * 1000),
    RESOURCE,
    "newer-name-older-date",
    3 * 60 * 60 * 1000
  );

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "older-name-newer-date" });
  await expect
    .poll(() => cachedJson(page, FIXED_CACHE))
    .toEqual({ source: "older-name-newer-date" });
});

test("without Date headers the newer cache-name date wins among legacy caches", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await seed(page, nameAgo(5 * 60 * 60 * 1000), RESOURCE, "older-name", null);
  await seed(page, nameAgo(60 * 60 * 1000), RESOURCE, "newer-name", null);

  await activateWorker(page);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual({ source: "newer-name" });
  await expect
    .poll(() => cachedJson(page, FIXED_CACHE))
    .toEqual({ source: "newer-name" });
});

test("a newer network response is not overwritten by the legacy fallback copy", async ({
  page
}) => {
  await page.goto(FIXTURE);
  await page.evaluate(
    async ({ scope, path }) => {
      const body = JSON.stringify({ source: "x".repeat(4096) });
      for (let index = 1; index <= 40; index++) {
        const day = String((index % 28) + 1).padStart(2, "0");
        const hour = String(Math.floor(index / 28)).padStart(2, "0");
        const cache = await caches.open(
          `resourcesCache-2026-10-${day}-${hour}-00`
        );
        for (let filler = 0; filler < 20; filler++) {
          await cache.put(
            `${scope}maps/filler-${index}-${filler}.json`,
            new Response(body, {
              headers: {
                "Content-Type": "application/json",
                Date: new Date().toUTCString()
              }
            })
          );
        }
        if (index === 1) {
          await cache.put(
            new URL(path, location.href),
            new Response(JSON.stringify({ source: "legacy-stale" }), {
              headers: {
                "Content-Type": "application/json",
                Date: new Date(Date.now() - 60 * 60 * 1000).toUTCString()
              }
            })
          );
        }
      }
    },
    { scope: SCOPE, path: RESOURCE }
  );

  await activateWorker(page);
  expect(await readJson(page)).toEqual({ source: "legacy-stale" });
  await expect.poll(() => cachedJson(page, FIXED_CACHE)).toEqual(NETWORK_JSON);
  expect(await readJson(page)).toEqual(NETWORK_JSON);
});

test("a Date-less legacy entry does not resurrect after ExpirationPlugin deletes the expired fixed entry", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await activateWorker(page);

  const datelessPath = `${MAPS_SCOPE}dateless-resurrect.json`;
  const triggerPath = `${MAPS_SCOPE}trigger-expire.json`;

  await page.evaluate(
    async ({ datelessPath, triggerPath }) => {
      const oldLegacy = await caches.open("resourcesCache-2026-01-01-00-00");
      await oldLegacy.put(
        new URL(datelessPath, location.href),
        new Response(JSON.stringify({ source: "ancient-dateless-legacy" }), {
          headers: { "Content-Type": "application/json" }
        })
      );
      const fixed = await caches.open("resourcesCache");
      await fixed.put(
        new URL(datelessPath, location.href),
        new Response(JSON.stringify({ source: "ancient-dateless-legacy" }), {
          headers: { "Content-Type": "application/json" }
        })
      );
      await fixed.put(
        new URL(triggerPath, location.href),
        new Response(JSON.stringify({ source: "trigger" }), {
          headers: {
            "Content-Type": "application/json",
            Date: new Date().toUTCString()
          }
        })
      );
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("workbox-expiration", 1);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains("cache-entries")) {
            const store = database.createObjectStore("cache-entries", {
              keyPath: "id"
            });
            store.createIndex("cacheName", "cacheName", { unique: false });
            store.createIndex("timestamp", "timestamp", { unique: false });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const absolute = new URL(datelessPath, location.href).href;
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("cache-entries", "readwrite");
        transaction.objectStore("cache-entries").put({
          id: `resourcesCache|${absolute}`,
          cacheName: "resourcesCache",
          url: absolute,
          timestamp: Date.now() - 48 * 60 * 60 * 1000
        });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    },
    { datelessPath, triggerPath }
  );

  await context.setOffline(true);
  expect(await readJson(page, triggerPath)).toEqual({ source: "trigger" });
  await page.waitForTimeout(200);

  const stillInFixed = await page.evaluate(async datelessPath => {
    const cache = await caches.open("resourcesCache");
    return Boolean(await cache.match(new URL(datelessPath, location.href)));
  }, datelessPath);
  expect(stillInFixed).toBe(false);

  expect(String(await readJson(page, datelessPath))).toMatch(OFFLINE_ERROR);
});

test("fixed-cache hits do not scan the legacy caches", async ({
  page,
  browserName
}) => {
  test.skip(browserName !== "chromium");
  await page.goto(FIXTURE);
  await activateWorker(page);
  await seed(page, FIXED_CACHE, RESOURCE, "fixed-hit", 0);

  const measure = () =>
    page.evaluate(async path => {
      const times: number[] = [];
      for (let sample = 0; sample < 20; sample++) {
        const started = performance.now();
        await (await fetch(path)).json();
        times.push(performance.now() - started);
      }
      return times;
    }, RESOURCE);

  const withoutLegacy = await measure();

  await page.evaluate(
    async ({ scope }) => {
      const body = JSON.stringify({ source: "x".repeat(4096) });
      for (let index = 1; index <= 40; index++) {
        const day = String((index % 28) + 1).padStart(2, "0");
        const hour = String(Math.floor(index / 28)).padStart(2, "0");
        const cache = await caches.open(
          `resourcesCache-2026-10-${day}-${hour}-00`
        );
        for (let filler = 0; filler < 20; filler++) {
          await cache.put(
            `${scope}maps/perf-${index}-${filler}.json`,
            new Response(body, {
              headers: {
                "Content-Type": "application/json",
                Date: new Date().toUTCString()
              }
            })
          );
        }
      }
    },
    { scope: SCOPE }
  );

  const withLegacy = await measure();

  const average = (values: number[]) =>
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) / values.length) * 100
    ) / 100;
  const median = (values: number[]) => {
    const sorted = [...values].sort((left, right) => left - right);
    return sorted[Math.floor(sorted.length / 2)];
  };
  console.log(
    "fixed-cache hit latency ms (0 legacy caches):",
    average(withoutLegacy),
    "min/max:",
    Math.min(...withoutLegacy).toFixed(2),
    Math.max(...withoutLegacy).toFixed(2)
  );
  console.log(
    "fixed-cache hit latency ms (40 legacy caches / 800 entries):",
    average(withLegacy),
    "min/max:",
    Math.min(...withLegacy).toFixed(2),
    Math.max(...withLegacy).toFixed(2)
  );
  expect(median(withLegacy) - median(withoutLegacy)).toBeLessThan(3);
});
