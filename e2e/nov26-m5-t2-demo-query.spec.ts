import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CHECKS,
  READY_TIMEOUT_MS,
  SETTLE_MS,
  XSS_PAYLOAD,
  XSS_PAYLOAD_NUNJUCKS,
  isPayloadRenderIgnoredWarning,
  observeFire,
  runCheck,
  waitTerminalStatus
} from '../scripts/nov26-m5/demo-query-checks.mjs';

/**
 * 開発用デモが URL のクエリから受け付けるキーの許可リスト — 実 UI E2E
 *
 * - C1〜C3n: 配備後検査と同じ CHECKS・runCheck を手元のデモ（index.html → demo/dev.ts）へ当てる
 *   （C3 は lodash の記法の payload、C3n は Nunjucks の記法の payload）
 *   C3n では、陽性対照で数える「Nunjucks の payload が評価で拒まれた」警告が 0 件であることも確かめる
 *   （陽性対照の (2) と組にする。クエリの payload が評価まで届かなかったことの証拠で、警告が出ていれば
 *   C3n の緑は許可リストではなくテンプレートエンジンの拒否による空振りである）
 * - poiTemplate の陽性対照: クエリを通さずに poiTemplate を直接入れた fixture を lodash 用・Nunjucks 用の
 *   2 本開き、テンプレートが評価の経路に届いたことを確かめる（C3・C3n の緑が空振りでないことの陽性対照）。
 *   合格の形は解決した依存の版で 2 通りあり、版では選ばない:
 *   (1) テンプレートの評価を守る層が無い依存の組み合わせ: 観測窓の中でちょうど 1 本だけ payload が発火する
 *       （どちらが発火するかは解決した Core のテンプレートエンジンで決まる）
 *   (2) テンプレートエンジンが危険な式の評価を拒む依存の組み合わせ: どちらも発火せず、Nunjucks 用の
 *       fixture で Core の警告「failed to render and was ignored … First template: "{{range.constructor…」
 *       が 1 件以上出る（payload が評価まで
 *       届き、拒まれて捨てられたことの証拠）
 *   どちらの場合も #status は READY になる。どちらでもなければ（2 本とも発火、または発火も警告も無い）赤
 * - C4: 選択欄の回帰（#lang-select を en に変えると URL のクエリが lang=en になり #status が追随する）
 *
 * 各テストの結果は 1 行の JSON で標準出力へ出す（是正前の赤の記録に使う）。
 */

// runCheck は READY_TIMEOUT_MS まで待ち、C3 は SETTLE_MS を必ず待つ。
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
    console.log(`[demo-query] ${JSON.stringify(r)}`);
    expect(r.verdict, JSON.stringify(r)).toBe('pass');
    if (check.id === 'C3n') {
      // 陽性対照の (2) と組: クエリの payload は評価まで届かないので、拒否の警告も出ない
      expect(r.renderIgnoredWarnings, JSON.stringify(r)).toBe(0);
    }
  });
}

const CONTROLS = [
  { engine: 'lodash', file: 'nov26-m5-t2-poitemplate-control.html', payload: XSS_PAYLOAD },
  { engine: 'nunjucks', file: 'nov26-m5-t2-poitemplate-control-nunjucks.html', payload: XSS_PAYLOAD_NUNJUCKS }
] as const;

test('poiTemplate の陽性対照: 直接入れると lodash 用・Nunjucks 用のちょうど 1 本が発火するか、Nunjucks 用で評価の失敗の警告が出る', async ({
  browser
}) => {
  test.setTimeout(PER_LOAD_MS * CONTROLS.length);
  const results: {
    engine: string;
    status: string;
    fired: boolean;
    firedAfterReadyMs: number | null;
    renderIgnoredWarnings: number;
  }[] = [];
  for (const control of CONTROLS) {
    // fixture に直書きした payload が検査の定義と同一であること。Vite の開発サーバは inline の
    // module script を別の要求（html-proxy）へ移すので page.content() には残らない ∴ ファイル本文で照合する
    const fixtureSrc = fs.readFileSync(
      fileURLToPath(new URL(`./fixtures/${control.file}`, import.meta.url)),
      'utf8'
    );
    expect(fixtureSrc).toContain(`poiTemplate: '${control.payload}'`);
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      page.on('dialog', d => {
        d.dismiss().catch(() => {});
      });
      // 読み込みの前から warning を集める（評価は READY の前にも後にも起こりうる）
      const warnings: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'warning') warnings.push(msg.text());
      });
      await page.goto(`/e2e/fixtures/${control.file}`, { timeout: READY_TIMEOUT_MS });
      const status = await waitTerminalStatus(page);
      const obs = await observeFire(page);
      const renderIgnoredWarnings = warnings.filter(isPayloadRenderIgnoredWarning).length;
      results.push({ engine: control.engine, status, ...obs, renderIgnoredWarnings });
    } finally {
      await context.close();
    }
  }
  const fired = results.filter(r => r.fired);
  const nunjucks = results.find(r => r.engine === 'nunjucks');
  const rejectedInEvaluation = fired.length === 0 && (nunjucks?.renderIgnoredWarnings ?? 0) >= 1;
  console.log(
    `[demo-query] ${JSON.stringify({
      id: 'C3-control',
      fired: fired.length === 1 ? fired[0].engine : fired.map(r => r.engine),
      outcome: fired.length === 1 ? 'fired' : rejectedInEvaluation ? 'rejected-in-evaluation' : 'none',
      results
    })}`
  );
  for (const r of results) {
    expect(r.status, JSON.stringify(r)).toBe('READY appid=sample lang=ja');
  }
  if (fired.length === 1) {
    // (1) 評価を守る層が無い: ちょうど 1 本が観測窓の中で発火した
    expect(fired[0].firedAfterReadyMs).not.toBeNull();
    expect(fired[0].firedAfterReadyMs as number).toBeLessThanOrEqual(SETTLE_MS);
  } else {
    // (2) 評価で拒まれた: どちらも発火せず、Nunjucks 用で評価の失敗の警告が出た
    expect(fired.length, JSON.stringify(results)).toBe(0);
    expect(nunjucks?.renderIgnoredWarnings ?? 0, JSON.stringify(results)).toBeGreaterThanOrEqual(1);
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
