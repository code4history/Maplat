import { test, expect, type Page } from '@playwright/test';

/**
 * m18-t6: Maplat レイヤ ON/OFF の namespaceID 対応 — 実 UI E2E
 *
 * 設計書 §6.3 の E-1〜E-4 を検証する。
 * fixture: e2e/fixtures/marker-list.html（mode=nocollision / collision）
 */

async function waitForReady(page: Page) {
  await page.waitForFunction(
    () => document.getElementById('status')?.textContent === 'READY',
    { timeout: 20000 }
  );
  await page.waitForFunction(
    () => (window as any).__maplatApp?.mapObject?.getSource("marker"),
    { timeout: 20000 }
  );
}

async function openMarkerList(page: Page) {
  // Click the MarkerList control button (ol-marker-list class)
  const btn = page.locator('.ol-marker-list button').first();
  await btn.click();
  // Wait for the layer list items to appear inside the modal
  await page.waitForSelector('.modal_marker_list_content .list-group-item.layer', {
    timeout: 10000
  });
}

async function getLayers(page: Page): Promise<{ id: string; namespaceID: string }[]> {
  return await page.evaluate(() => {
    const app = (window as any).__maplatApp;
    return app.listPoiLayers(false, true).map((l: any) => ({
      id: l.id,
      namespaceID: l.namespaceID
    }));
  });
}

async function getHiddenLayerNamespaceIDs(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const app = (window as any).__maplatApp;
    return app.listPoiLayers(true).map((l: any) => l.namespaceID).sort();
  });
}

async function getLayerHide(page: Page, namespaceID: string): Promise<boolean | undefined> {
  return await page.evaluate((nsID) => {
    const app = (window as any).__maplatApp;
    const layer = app.getPoiLayer(nsID);
    return layer ? layer.hide : undefined;
  }, namespaceID);
}

async function toggleLayerByIndex(page: Page, layerIndex: number) {
  const labels = page.locator('.modal_marker_list_content .list-group-item.layer label.check');
  await labels.nth(layerIndex).click();
  await page.waitForTimeout(300);
}

test.describe('m18-t6: Marker list layer toggle (namespaceID)', () => {
  test.describe.configure({ mode: 'serial' });

  test('E-1: Marker list shows app-level and map-derived layers (no collision)', async ({ page }) => {
    await page.goto('/e2e/fixtures/marker-list.html?mode=nocollision');
    await waitForReady(page);
    await openMarkerList(page);

    const layers = await getLayers(page);
    expect(layers.length).toBeGreaterThanOrEqual(2);

    const nsIDs = layers.map(l => l.namespaceID);
    expect(nsIDs).toContain('app_layer_a');
    expect(nsIDs).toContain('morioka_ndl2#map_layer_b');
  });

  test('E-2: Toggling map-derived layer OFF hides only that layer', async ({ page }) => {
    await page.goto('/e2e/fixtures/marker-list.html?mode=nocollision');
    await waitForReady(page);
    await openMarkerList(page);

    const layers = await getLayers(page);
    const mapLayerIndex = layers.findIndex(l => l.namespaceID === 'morioka_ndl2#map_layer_b');
    expect(mapLayerIndex).toBeGreaterThanOrEqual(0);

    // Toggle OFF the map-derived layer
    await toggleLayerByIndex(page, mapLayerIndex);

    // (a) map-derived layer hide === true
    const mapHide = await getLayerHide(page, 'morioka_ndl2#map_layer_b');
    expect(mapHide).toBe(true);

    // (b) listPoiLayers(true) namespaceIDs = ["morioka_ndl2#map_layer_b"] (only)
    const hiddenIDs = await getHiddenLayerNamespaceIDs(page);
    expect(hiddenIDs).toEqual(['morioka_ndl2#map_layer_b']);

    // (c) app-level layer hide is still falsy
    const appHide = await getLayerHide(page, 'app_layer_a');
    expect(appHide).toBeFalsy();
  });

  test('E-3: Toggling map-derived layer back ON restores state', async ({ page }) => {
    await page.goto('/e2e/fixtures/marker-list.html?mode=nocollision');
    await waitForReady(page);
    await openMarkerList(page);

    const layers = await getLayers(page);
    const mapLayerIndex = layers.findIndex(l => l.namespaceID === 'morioka_ndl2#map_layer_b');

    // Toggle OFF then ON
    await toggleLayerByIndex(page, mapLayerIndex);
    await toggleLayerByIndex(page, mapLayerIndex);

    // hide should be gone
    const mapHide = await getLayerHide(page, 'morioka_ndl2#map_layer_b');
    expect(mapHide).toBeFalsy();

    // listPoiLayers(true) should be empty
    const hiddenIDs = await getHiddenLayerNamespaceIDs(page);
    expect(hiddenIDs).toEqual([]);
  });

  test('E-4: Collision mode — toggling map-derived "main" does not affect app-level "main"', async ({ page }) => {
    await page.goto('/e2e/fixtures/marker-list.html?mode=collision');
    await waitForReady(page);
    await openMarkerList(page);

    // Verify both layers exist
    const layers = await getLayers(page);
    const nsIDs = layers.map(l => l.namespaceID);
    expect(nsIDs).toContain('main');
    expect(nsIDs).toContain('morioka_ndl2#main');

    const mapLayerIndex = layers.findIndex(l => l.namespaceID === 'morioka_ndl2#main');
    expect(mapLayerIndex).toBeGreaterThanOrEqual(0);

    // Toggle OFF the map-derived layer
    await toggleLayerByIndex(page, mapLayerIndex);

    // Map-derived layer hide === true
    const mapHide = await getLayerHide(page, 'morioka_ndl2#main');
    expect(mapHide).toBe(true);

    // App-level main layer hide is still falsy (not affected)
    const appHide = await getLayerHide(page, 'main');
    expect(appHide).toBeFalsy();

    // listPoiLayers(true) should only contain morioka_ndl2#main, not main
    const hiddenIDs = await getHiddenLayerNamespaceIDs(page);
    expect(hiddenIDs).toContain('morioka_ndl2#main');
    expect(hiddenIDs).not.toContain('main');
  });
});
