import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CHECKS,
  READY_TIMEOUT_MS,
  SETTLE_MS,
  XSS_PAYLOAD,
  observeFire,
  runCheck,
  waitTerminalStatus
} from '../scripts/nov26-m5/demo-query-checks.mjs';

/**
 * nov26-m5-t2（NayutaProducts#28 B-UI-5）: 開発用デモが URL のクエリから受け付けるキーの許可リスト — 実 UI E2E
 *
 * 設計書: docs/superpowers/specs/2026-10-11-nov26-m5-t2-task-design.md v2 §3.3・§3.5・AC3
 *
 * - C1〜C3: 配備後検査と同じ CHECKS・runCheck を手元のデモ（index.html → demo/dev.ts）へ当てる
 * - C3-control: クエリを通さずに poiTemplate を直接入れた fixture で、同じ観測窓の中で payload が
 *   発火することを確かめる（C3 の緑が空振りでないことの陽性対照。是正の前でも後でも緑）
 * - C4: 選択欄の回帰（#lang-select を en に変えると URL のクエリが lang=en になり #status が追随する）
 *
 * 各テストの結果は 1 行の JSON で標準出力へ出す（是正前の赤の記録に使う）。
 */

// タスク設計レビュー MIN-4: runCheck は READY_TIMEOUT_MS まで待ち、C3 は SETTLE_MS を必ず待つ。
// 既定の 30 秒では高負荷時に落ちるので、各テストの上限を明示する
const PER_LOAD_MS = READY_TIMEOUT_MS + SETTLE_MS + 30_000;

const baseOf = (baseURL: string | undefined) => {
  const b = baseURL ?? 'http://localhost:5176';
  return b.endsWith('/') ? b : `${b}/`;
};

for (const check of CHECKS) {
  test(`${check.id}: ?${check.query} → ${check.expectStatus}${check.xss ? '・payload が発火しない' : ''}`, async ({
    browser,
    baseURL
  }) => {
    test.setTimeout(PER_LOAD_MS);
    const r = await runCheck(browser, baseOf(baseURL), check);
    console.log(`[nov26-m5-t2] ${JSON.stringify(r)}`);
    expect(r.verdict, JSON.stringify(r)).toBe('pass');
  });
}

test('C3-control: poiTemplate を直接入れると観測窓の中で payload が発火する（陽性対照）', async ({ browser }) => {
  test.setTimeout(PER_LOAD_MS);
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    page.on('dialog', d => {
      d.dismiss().catch(() => {});
    });
    // fixture に直書きした payload が検査の定義と同一であること。Vite の開発サーバは inline の
    // module script を別の要求（html-proxy）へ移すので page.content() には残らない ∴ ファイル本文で照合する
    const fixtureSrc = fs.readFileSync(
      fileURLToPath(new URL('./fixtures/nov26-m5-t2-poitemplate-control.html', import.meta.url)),
      'utf8'
    );
    expect(fixtureSrc).toContain(`poiTemplate: '${XSS_PAYLOAD}'`);
    await page.goto('/e2e/fixtures/nov26-m5-t2-poitemplate-control.html', { timeout: READY_TIMEOUT_MS });
    const status = await waitTerminalStatus(page);
    const obs = await observeFire(page);
    console.log(`[nov26-m5-t2] ${JSON.stringify({ id: 'C3-control', status, ...obs })}`);
    expect(status).toBe('READY appid=sample lang=ja');
    expect(obs.fired).toBe(true);
    expect(obs.firedAfterReadyMs).not.toBeNull();
    expect(obs.firedAfterReadyMs as number).toBeLessThanOrEqual(SETTLE_MS);
  } finally {
    await context.close();
  }
});

test('C4: #lang-select を en に変えると URL のクエリが lang=en になり #status が追随する', async ({ browser }) => {
  test.setTimeout(PER_LOAD_MS * 2);
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto('/', { timeout: READY_TIMEOUT_MS });
    expect(await waitTerminalStatus(page)).toBe('READY appid=sample lang=ja');
    await Promise.all([
      page.waitForURL(u => new URL(u).search.includes('lang=en'), { timeout: READY_TIMEOUT_MS }),
      page.selectOption('#lang-select', 'en')
    ]);
    const search = new URL(page.url()).search;
    expect(search).toContain('lang=en');
    expect(search).toContain('appid=sample');
    expect(await waitTerminalStatus(page)).toBe('READY appid=sample lang=en');
    await expect(page.locator('#lang-select')).toHaveValue('en');
    await expect(page.locator('#app-select')).toHaveValue('sample');
  } finally {
    await context.close();
  }
});
