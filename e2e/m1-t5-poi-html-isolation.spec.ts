import { test, expect } from "@playwright/test";

// m1-t5 AC5 / AC6 / AC10: POI html の隔離を**実ブラウザ**で検証する。
//
// jsdom では Shadow DOM のスタイル適用・実スクロール・スクリプト実行の有無を
// 再現できないため、ここは実ブラウザでしか確認できない。
//
// 検証は m1-t4 と同じく事前バンドルした probe を使う。dev server の依存最適化と
// ページ読み込みが競合すると 504 (Outdated Optimize Dep) で不安定になるため
// （m1-t4 の finding5）、モジュールを動的 import しない構成にしている。

const PROBE = "/e2e/fixtures/poi-html-probe.html";

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
    expect(m.cls).toContain("poi_html_host--scroll");
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
    expect(m.cls).not.toContain("poi_html_host--scroll");
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
        hasHost: !!div.querySelector(".poi_html_host")
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
        hasHost: !!div.querySelector(".poi_html_host"),
        hasIframe: !!div.querySelector("iframe")
      };
    });
    expect(m.hasHost).toBe(true);
    expect(m.hasIframe).toBe(false);
  });
});
