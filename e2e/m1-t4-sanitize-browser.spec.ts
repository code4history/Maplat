// M1-T4 AC5b: サニタイズが**ブラウザでも**同じ結果になることの検証。
//
// なぜ必要か（設計書 §3.5(d)）:
//   jsdom（Vitest）での成功は、ブラウザでの安全性を証明しない。DOM の実装差
//   （エンティティ復号・パーサの挙動・属性の正規化）で結果が変わりうるためである。
//   **同じ fixture を両環境へ通す**ことでこの差を潰す。
//
// 実行: pnpm run test:e2e:m1-t4
import { expect, test } from "@playwright/test";
import {
  MUST_BE_NEUTRALIZED, MUST_BE_PRESERVED, TARGET_BLANK,
  MEDIA_ATTR_ATTACKS, ATTR_ROUNDTRIP_ATTACKS
} from "../../MaplatCore/spec/fixtures/xss-payloads";

// テスト専用のプローブページ経由で @maplat/core を**通常の読み込み経路**で import する。
// page.addScriptTag + /@fs の動的 import 方式は、dompurify が初回発見されるタイミングで
// Vite が依存最適化を走らせページを再読込するため、実行コンテキストが破棄されて落ちた
// （warm cache では偶然通っていた。実装レビュー Major-1）。
const PROBE = "/e2e/fixtures/sanitize-probe.html";

async function setup(page: import("@playwright/test").Page) {
  page.on("pageerror", (err) => console.log("PAGE ERR:", err.message));

  // Vite dev server は依存最適化を走らせると既存 URL を 504 (Outdated Optimize Dep) にし、
  // 読み込み途中のモジュールが評価されないことがある。最適化が確定するまで再読込する。
  // optimizeDeps.include で dompurify を事前指定しているが、初回起動時は
  // 最適化の完了とページ読み込みが競合しうるため、ここで確実に収束させる。
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.goto(PROBE, { waitUntil: "load" });
    try {
      await page.waitForFunction(() => !!window.__t4?.sanitizeHtml, undefined, { timeout: 8000 });
      return;
    } catch {
      await page.waitForTimeout(1000); // 最適化の完了を待って再試行
    }
  }
  throw new Error("sanitize-probe が読み込めませんでした（Vite の依存最適化が収束しない）");
}

test.describe("M1-T4: ブラウザでのサニタイズ（AC5b）", () => {
  test("攻撃ペイロードが無害化される（jsdom と同じ fixture）", async ({ page }) => {
    await setup(page);
    for (const { name, input, mustNotContain } of MUST_BE_NEUTRALIZED) {
      const out = await page.evaluate((s) => window.__t4!.sanitizeHtml(s), input);
      for (const needle of mustNotContain) {
        expect(String(out).toLowerCase(), `${name}: ${needle} が残っている`).not.toContain(needle.toLowerCase());
      }
      // 出力を実際に DOM へ入れても能動要素が生えないこと
      const active = await page.evaluate((html) => {
        const d = document.createElement("div");
        d.innerHTML = html as string;
        return d.querySelectorAll("script, iframe, object, embed").length;
      }, out);
      expect(active, `${name}: 能動要素が生えた`).toBe(0);
    }
  });

  test("実データ相当の HTML が保持される（AC4 / AC5c 正系）", async ({ page }) => {
    await setup(page);
    for (const { name, input, mustContain } of MUST_BE_PRESERVED) {
      const out = await page.evaluate((s) => window.__t4!.sanitizeHtml(s), input);
      for (const needle of mustContain) {
        expect(String(out), `${name}: ${needle} が失われた`).toContain(needle);
      }
    }
  });

  test("target=_blank に rel が付く（AC6）", async ({ page }) => {
    await setup(page);
    const out = await page.evaluate((s) => window.__t4!.sanitizeHtml(s), TARGET_BLANK.input);
    for (const needle of TARGET_BLANK.mustContain) expect(String(out)).toContain(needle);
  });

  test("属性名 allowlist がブラウザでも効く（AC2）", async ({ page }) => {
    await setup(page);
    for (const { name, media } of MEDIA_ATTR_ATTACKS) {
      const names = await page.evaluate((m) => {
        const el = document.createElement("div");
        el.innerHTML = `<cc-swiper-slide ${window.__t4!.buildSlideAttrs(m)}></cc-swiper-slide>`;
        return el.firstElementChild!.getAttributeNames().map((n) => n.toLowerCase());
      }, media);
      expect(names.filter((n: string) => n.startsWith("on")), `${name}: on* が生えた`).toHaveLength(0);
      expect(names, `${name}: style が生えた`).not.toContain("style");
      expect(names, `${name}: srcdoc が生えた`).not.toContain("srcdoc");
    }
  });

  test("属性の往復でも HTML に戻らない（§3.4・ブラウザの getAttribute で検証）", async ({ page }) => {
    await setup(page);
    for (const { name, media } of ATTR_ROUNDTRIP_ATTACKS) {
      const activeCount = await page.evaluate((m) => {
        const host = document.createElement("div");
        host.innerHTML = `<cc-swiper-slide ${window.__t4!.buildSlideAttrs(m)}></cc-swiper-slide>`;
        const slide = host.firstElementChild!;
        let n = 0;
        for (const attr of ["caption", "thumbnail-url", "image-url"]) {
          const back = slide.getAttribute(attr);
          if (back === null) continue;
          // 受け手（Chuci の cc-swiper.ts:229-241）と同じ補間を再現する
          const out = document.createElement("div");
          out.innerHTML = `<p class="slider-caption">${back}</p>`;
          n += out.querySelectorAll("img, script, svg, iframe").length;
          if (/on(error|load)\s*=/i.test(out.innerHTML)) n += 1;
        }
        return n;
      }, media);
      expect(activeCount, `${name}: 往復後に能動要素が生えた`).toBe(0);
    }
  });
});
