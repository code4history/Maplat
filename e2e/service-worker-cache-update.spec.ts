import { expect, test, type Page } from "@playwright/test";

const SCOPE = "/e2e/fixtures/";
const FIXTURE = `${SCOPE}service-worker-cache.html`;
const RESOURCE = `${SCOPE}maps/offline.json`;
const LEGACY_WORKER = `${SCOPE}legacy-service-worker.js`;
const UPDATED_WORKER = "/service-worker.js";
const EXPECTED_JSON = { source: "legacy-runtime-cache" };

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

async function readJson(page: Page) {
  return page.evaluate(async resource => {
    try {
      return await (await fetch(resource)).json();
    } catch (error) {
      return String(error);
    }
  }, RESOURCE);
}

test("keeps the real legacy worker's cached JSON available before and after update", async ({
  page,
  context
}) => {
  await page.goto(FIXTURE);
  await activateWorker(page, LEGACY_WORKER);

  expect(await readJson(page)).toEqual(EXPECTED_JSON);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual(EXPECTED_JSON);

  await context.setOffline(false);
  await activateWorker(page, UPDATED_WORKER);
  await context.setOffline(true);
  expect(await readJson(page)).toEqual(EXPECTED_JSON);
});
