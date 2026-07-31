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
import path from "node:path";

// Vite dev server が /@fs 経由で配信するソースの絶対パス
const SANITIZE_PATH = path.resolve(
  import.meta.dirname, "../../MaplatCore/src/sanitize.ts"
);

// デモページには @maplat/ui 経由で @maplat/core が読み込まれる。
// sanitize は MaplatCore の公開 API なので、そこから取り出して評価する。
async function setup(page: import("@playwright/test").Page) {
  await page.goto("/");
  // page.evaluate は Vite の変換を通らないため bare specifier を解決できない。
  // Vite dev server の /@fs/ でソースを直接読み込む（本番コードは変更しない）。
  await page.addScriptTag({
    type: "module",
    content: `import * as m from "/@fs${SANITIZE_PATH}"; window.__t4 = m;`
  });
  await page.waitForFunction(() => !!(window as any).__t4?.sanitizeHtml, undefined, { timeout: 30000 });
}

test.describe("M1-T4: ブラウザでのサニタイズ（AC5b）", () => {
  test("攻撃ペイロードが無害化される（jsdom と同じ fixture）", async ({ page }) => {
    await setup(page);
    for (const { name, input, mustNotContain } of MUST_BE_NEUTRALIZED) {
      const out = await page.evaluate((s) => (window as any).__t4.sanitizeHtml(s), input);
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
      const out = await page.evaluate((s) => (window as any).__t4.sanitizeHtml(s), input);
      for (const needle of mustContain) {
        expect(String(out), `${name}: ${needle} が失われた`).toContain(needle);
      }
    }
  });

  test("target=_blank に rel が付く（AC6）", async ({ page }) => {
    await setup(page);
    const out = await page.evaluate((s) => (window as any).__t4.sanitizeHtml(s), TARGET_BLANK.input);
    for (const needle of TARGET_BLANK.mustContain) expect(String(out)).toContain(needle);
  });

  test("属性名 allowlist がブラウザでも効く（AC2）", async ({ page }) => {
    await setup(page);
    for (const { name, media } of MEDIA_ATTR_ATTACKS) {
      const names = await page.evaluate((m) => {
        const el = document.createElement("div");
        el.innerHTML = `<cc-swiper-slide ${(window as any).__t4.buildSlideAttrs(m)}></cc-swiper-slide>`;
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
        host.innerHTML = `<cc-swiper-slide ${(window as any).__t4.buildSlideAttrs(m)}></cc-swiper-slide>`;
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
