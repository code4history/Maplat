import { test, expect } from "@playwright/test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// m1-t5 AC5 / AC6 / AC10: POI html の隔離を**実ブラウザ**で検証する。
//
// jsdom では Shadow DOM のスタイル適用・実スクロール・スクリプト実行の有無を
// 再現できないため、ここは実ブラウザでしか確認できない。
//
// 検証は m1-t4 と同じく事前バンドルした probe を使う。dev server の依存最適化と
// ページ読み込みが競合すると 504 (Outdated Optimize Dep) で不安定になるため
// （m1-t4 の finding5）、モジュールを動的 import しない構成にしている。

const PROBE = "/e2e/fixtures/poi-html-probe.html";
const PROBE_JS = "/e2e/fixtures/dist-probe/poi-html-probe.js";

// ---- probe の事前バンドルが古くないか（旧 UI の実装の削除の仕上げ）----
// probe は `pretest:e2e`（`vite build --config e2e/fixtures/vite.probe-t5.config.js`）で作るが、
// `playwright test` を直接流すとその手順が走らず、**消した旧の実装を焼き込んだままの古い束**を読んで落ちた
// （旧の class 名 `poi_html_host` が出た。2026-10-24 の実測）。probe が読むリポジトリの中のファイル
// （相対 import を辿ったもの）と設定のどれかが束より新しければ、ここで作り直す（作るのは probe の束だけ。
// `emptyOutDir: false` なので dist-probe の他のファイルには触れない）。
const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures");
const PROBE_ENTRY = resolve(FIXTURES, "poi-html-probe.ts");
const PROBE_CONFIG = resolve(FIXTURES, "vite.probe-t5.config.js");
const PROBE_BUNDLE = resolve(FIXTURES, "dist-probe/poi-html-probe.js");

/** 入口から相対 import（`./`・`../`）を辿り、probe に焼き込まれるリポジトリの中のファイルを集める */
function probeSources(entry: string): string[] {
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file) || !existsSync(file)) return;
    seen.add(file);
    const src = readFileSync(file, "utf-8");
    for (const m of src.matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+)["']/g)) {
      const base = resolve(dirname(file), m[1]);
      for (const cand of [base, `${base}.ts`, `${base}/index.ts`]) {
        if (existsSync(cand) && statSync(cand).isFile()) {
          visit(cand);
          break;
        }
      }
    }
  };
  visit(entry);
  return [...seen];
}

test.beforeAll(async () => {
  test.setTimeout(120_000);
  const inputs = [...probeSources(PROBE_ENTRY), PROBE_CONFIG];
  const newest = Math.max(...inputs.map(f => statSync(f).mtimeMs));
  if (existsSync(PROBE_BUNDLE) && statSync(PROBE_BUNDLE).mtimeMs >= newest) return;
  const { build } = await import("vite");
  await build({ configFile: PROBE_CONFIG, logLevel: "warn" });
});

// 最初に**配信元そのもの**を検証する。
// 別 worktree の Vite に繋がっていると probe asset の代わりに index.html が返り、
// 以降のテストが「window.__t5 が未定義」という分かりにくい timeout で落ちる
// （実装レビュー Phase 1 で判明した根本原因）。ここで先に落として原因を明示する。
test("前提: probe asset が この worktree から JavaScript として配信される", async ({
  request
}) => {
  const res = await request.get(PROBE_JS);
  expect(res.status()).toBe(200);
  const ct = res.headers()["content-type"] ?? "";
  expect(
    ct,
    `probe JS の Content-Type が ${ct}。別 worktree の Vite に繋がっている疑い`
  ).toContain("javascript");
  const body = await res.text();
  expect(
    body.startsWith("<!DOCTYPE"),
    "probe JS の応答が HTML である（index.html へのフォールバック）"
  ).toBe(false);
  expect(body.length).toBeGreaterThan(100000);
});

test.describe("M1-T5: POI html の隔離（実ブラウザ）", () => {
  test("AC6: 悪性 HTML が親 DOM・親 localStorage へ到達できない", async ({
    page
  }) => {
    await page.goto(PROBE);
    await page.waitForFunction(() => !!(window as any).__t5);

    const result = await page.evaluate(() => {
      const w = window as any;
      w.__t5.marker = "untouched";
      localStorage.setItem("__t5_ls", "untouched");
      const host = w.__t5.renderHtml(
        `<script>window.__t5.marker="pwned";localStorage.setItem("__t5_ls","pwned")<\/script>` +
          `<img src=x onerror="window.__t5.marker='pwned2'">` +
          `<iframe src="javascript:parent.__t5.marker='pwned3'"></iframe>`
      );
      return {
        marker: w.__t5.marker,
        ls: localStorage.getItem("__t5_ls"),
        shadowHtml: host.shadowRoot ? host.shadowRoot.innerHTML : null,
        hasIframe: !!host.shadowRoot?.querySelector("iframe"),
        hasScript: !!host.shadowRoot?.querySelector("script")
      };
    });

    // スクリプトも on* も iframe も生き残らない
    expect(result.hasScript).toBe(false);
    expect(result.hasIframe).toBe(false);
    expect(result.shadowHtml).not.toContain("onerror");
    // 親の状態が書き換わっていない
    expect(result.marker).toBe("untouched");
    expect(result.ls).toBe("untouched");
  });

  test("AC6: 実データ相当の html は保持される", async ({ page }) => {
    await page.goto(PROBE);
    await page.waitForFunction(() => !!(window as any).__t5);
    const html = await page.evaluate(() => {
      const host = (window as any).__t5.renderHtml(
        '<img src="img/ishiwari_zakura.jpg"><br>郡山城の天守閣は<br><br>'
      );
      return host.shadowRoot.innerHTML;
    });
    expect(html).toContain("<img");
    expect(html).toContain("<br>");
    expect(html).toContain("郡山城");
  });

  test("AC5: noScroll=false のとき host 自身がスクロールする", async ({
    page
  }) => {
    await page.goto(PROBE);
    await page.waitForFunction(() => !!(window as any).__t5);
    const m = await page.evaluate(() => {
      const host = (window as any).__t5.renderHtml(
        "<p>" + "あ<br>".repeat(400) + "</p>",
        false
      );
      return {
        cls: host.className,
        scrollable: host.scrollHeight > host.clientHeight,
        overflowY: getComputedStyle(host).overflowY
      };
    });
    // 要素（<maplat-ui>）のクラス: 内部スクロールを持つ側は "poi-html scroll"
    expect(m.cls).toContain("poi-html");
    expect(m.cls).toContain("scroll");
    expect(m.overflowY).toBe("auto");
    expect(m.scrollable).toBe(true);
  });

  test("AC5: noScroll=true のとき host は内容の高さに伸びる", async ({
    page
  }) => {
    await page.goto(PROBE);
    await page.waitForFunction(() => !!(window as any).__t5);
    const m = await page.evaluate(() => {
      const host = (window as any).__t5.renderHtml(
        "<p>" + "あ<br>".repeat(400) + "</p>",
        true
      );
      return {
        cls: host.className,
        // 自然高＝スクロールが生じない（内容の高さがそのまま要素の高さ）
        scrollable: host.scrollHeight > host.clientHeight + 1
      };
    });
    // スクロールを持たない側は "poi-html" だけ
    expect(m.cls).toBe("poi-html");
    expect(m.scrollable).toBe(false);
  });

  test("AC10: url のみなら iframe が生成され、message リスナは登録されない", async ({
    page
  }) => {
    await page.goto(PROBE);
    await page.waitForFunction(() => !!(window as any).__t5);
    const m = await page.evaluate(() => {
      const div = (window as any).__t5.renderUrl("https://example.com/");
      const iframe = div.querySelector("iframe") as HTMLIFrameElement;
      return {
        hasIframe: !!iframe,
        src: iframe?.getAttribute("src"),
        onload: iframe?.getAttribute("onload"),
        hasHost: !!div.querySelector(".poi-html")
      };
    });
    expect(m.hasIframe).toBe(true);
    expect(m.src).toBe("https://example.com/");
    expect(m.onload).toBeNull();
    expect(m.hasHost).toBe(false);
  });

  test("AC10: html と url の両方があれば html を優先する", async ({ page }) => {
    await page.goto(PROBE);
    await page.waitForFunction(() => !!(window as any).__t5);
    const m = await page.evaluate(() => {
      const div = (window as any).__t5.renderBoth(
        "<b>html</b>",
        "https://example.com/"
      );
      return {
        hasHost: !!div.querySelector(".poi-html"),
        hasIframe: !!div.querySelector("iframe")
      };
    });
    expect(m.hasHost).toBe(true);
    expect(m.hasIframe).toBe(false);
  });
});
