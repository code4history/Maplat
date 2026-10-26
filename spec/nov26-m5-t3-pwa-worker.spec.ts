// nov26-m5-t3: MaplatEditor#106（viewer 側）— pwaWorker: false / null で Service Worker を登録しない。
// あわせて M5-SEC-I-1: <link rel="manifest">・<link rel="apple-touch-icon"> を HTML 文字列ではなく
// DOM の組み立て（createElement("link") + setAttribute）で作る。
// 設計: NayutaProducts docs/superpowers/specs/2026-10-11-nov26-m5-t3-task-design.md（v2）§3.2・§7 AC2・AC3
//
// 旧の実装（`src/pwa_init.ts`。Weiwudi の registerSW を呼ぶ・`resolvePwaWorker` を持つ）を
// 消したので、対象を `src/element/pwa.ts` の `initPwa` へ移した。
//   - 旧 `resolvePwaWorker` の表（undefined・"" → 既定 ./service-worker.js、false・null → 登録しない、
//     型の外の値 → 既定）は、要素の `initPwa` が同じ規則で行う（`worker === null` だけ登録しない・
//     それ以外は `safeWebUrl(worker ?? "./service-worker.js")`）。互換層が旧 API の
//     `pwaWorker: false / null` を `worker: null` に写すことは
//     `spec/legacy-finish.spec.ts` が見る（`disablePwaWorker` を呼ぶ）。
//   - 旧 API の `pwaManifest` 未指定 → 何もしない、は要素の属性のガードなので
//     `spec/element-share.spec.ts`（PWA の describe）が見る。ここでは `initPwa` 単体の契約だけを見る。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { initPwa, resetPwaRegistryForTest } from "../src/element/pwa";

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const stubFetch = (manifestJson: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(manifestJson)
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

/** navigator.serviceWorker を差し替える（jsdom には無い）。afterEach で外す。 */
const stubServiceWorker = (register: unknown) => {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    get: () => ({ register })
  });
};

const ICONS = [
  { src: "icons/icon-192.png", sizes: "192x192" },
  { src: "icons/icon-512.png", sizes: "512x512" }
];

// 実行して head の様子と登録の呼び出しを返す
const run = async (
  options: { manifest: string; worker?: string | null; scope?: string },
  manifestJson: unknown
) => {
  const register = vi.fn(() => Promise.resolve({}));
  stubServiceWorker(register);
  const fetchMock = stubFetch(manifestJson);
  initPwa(options);
  await flush();
  await flush();
  return {
    register,
    fetchMock,
    manifestLinks: document.head.querySelectorAll('link[rel="manifest"]'),
    iconLinks: document.head.querySelectorAll('link[rel="apple-touch-icon"]')
  };
};

const MANIFEST = "./pwa/nov26m5t3_manifest.json";

beforeEach(() => {
  document.head.innerHTML = "";
  resetPwaRegistryForTest();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  delete (navigator as unknown as Record<string, unknown>).serviceWorker;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// 旧 API の `pwaWorker` の 4 つの値は 2 つの層に分かれる（`initPwa` が受けるのは後半だけ）:
//   false・null → 互換層が `disablePwaWorker()` を呼び、`initPwa` には `worker: null` が渡る
//                  （`spec/legacy-finish.spec.ts` が spy で確かめる）
//   undefined・"" → 互換層は何も渡さない（空文字は属性へ流さない）。∴ `initPwa` には undefined が渡り、
//                  既定の ./service-worker.js になる（旧 `resolvePwaWorker` の表と同じ結果）
// ここでは `initPwa` が受ける値の表を固定する。
describe("AC2 (a)+(b): worker の値と Service Worker の登録", () => {
  it("worker: null（旧 pwaWorker: false / null）→ 登録しない。manifest link 1 件・fetch 1 回・apple-touch-icon は icons の数", async () => {
    const r = await run({ manifest: MANIFEST, worker: null }, { icons: ICONS });
    expect(r.register).not.toHaveBeenCalled();
    expect(r.manifestLinks).toHaveLength(1);
    expect(r.manifestLinks[0].getAttribute("href")).toBe(MANIFEST);
    expect(r.fetchMock).toHaveBeenCalledTimes(1);
    expect(r.iconLinks).toHaveLength(ICONS.length);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('worker: undefined（旧 pwaWorker: undefined / ""）→ 既定の "./service-worker.js" を scope "./" で登録する', async () => {
    const r = await run({ manifest: MANIFEST }, { icons: ICONS });
    expect(r.register).toHaveBeenCalledTimes(1);
    expect(r.register).toHaveBeenCalledWith("./service-worker.js", {
      scope: "./"
    });
  });

  it('worker: "" は initPwa では URL でないので登録しない（空文字を既定へ寄せるのは互換層の仕事）', async () => {
    const r = await run({ manifest: MANIFEST, worker: "" }, { icons: ICONS });
    expect(r.register).not.toHaveBeenCalled();
    expect(r.manifestLinks).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(
      "<maplat-ui>: PWA was not enabled because pwa-manifest / pwa-worker / pwa-scope is not an http(s) or relative URL."
    );
  });

  it('pwaWorker: "sw/x.js" → その URL を scope "./" で登録する', async () => {
    const r = await run(
      { manifest: MANIFEST, worker: "sw/x.js" },
      { icons: ICONS }
    );
    expect(r.register).toHaveBeenCalledTimes(1);
    expect(r.register).toHaveBeenCalledWith("sw/x.js", { scope: "./" });
  });

  it("worker: true（型の外）は URL でないので登録しない（互換層は文字列しか渡さない）", async () => {
    const r = await run(
      { manifest: MANIFEST, worker: true as unknown as string },
      { icons: ICONS }
    );
    expect(r.register).not.toHaveBeenCalled();
    expect(r.manifestLinks).toHaveLength(0);
    expect(console.warn).toHaveBeenCalled();
  });

  it('pwaWorker: "javascript:…"（URL でない）→ 登録せず警告する（旧の許可リストと同じ）', async () => {
    const r = await run(
      { manifest: MANIFEST, worker: "javascript:alert(1)" },
      { icons: ICONS }
    );
    expect(r.register).not.toHaveBeenCalled();
    // manifest の link も足さない（入口で断る）
    expect(r.manifestLinks).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(
      "<maplat-ui>: PWA was not enabled because pwa-manifest / pwa-worker / pwa-scope is not an http(s) or relative URL."
    );
  });
});

describe("AC3 (a): 要素を作るのに HTML 文字列を使わない（静的な検査）", () => {
  it("src/element/pwa.ts に innerHTML・insertAdjacentHTML・outerHTML が無い", () => {
    const source = readFileSync(
      resolve(__dirname, "../src/element/pwa.ts"),
      "utf-8"
    ).replace(/\/\/.*$/gm, "");
    expect(source).not.toMatch(/innerHTML|insertAdjacentHTML|outerHTML/);
    // 組み立ては createElement + setAttribute
    expect(source).toContain('createElement("link")');
    expect(source).toContain("setAttribute");
  });
});

describe("AC3 (b): M5-SEC-I-1 — 注入値は属性の値として入り、要素にならない", () => {
  const PAYLOAD = 'x"><img src=y onerror=window.__nov26m5t3=1>';

  it("pwaManifest に注入値 → manifest link の href がその文字列そのもの・head は link だけ", async () => {
    await run({ manifest: PAYLOAD, worker: null }, {});
    const head = document.head;
    expect(head.querySelectorAll("img")).toHaveLength(0);
    const manifest = head.querySelector('link[rel="manifest"]');
    expect(manifest).not.toBeNull();
    // 文字列の HTML から作ると href が "x" で切れる
    expect(manifest!.getAttribute("href")).toBe(PAYLOAD);
    for (const el of Array.from(head.children)) {
      expect(el.tagName).toBe("LINK");
    }
  });

  it("manifest の icons[].sizes に注入値 → apple-touch-icon の sizes がその文字列そのもの", async () => {
    await run(
      { manifest: "./pwa/m.json", worker: null },
      { icons: [{ src: "a.png", sizes: PAYLOAD.slice(1) }] }
    );
    const head = document.head;
    expect(head.querySelectorAll("img")).toHaveLength(0);
    const icon = head.querySelector('link[rel="apple-touch-icon"]');
    expect(icon).not.toBeNull();
    expect(icon!.getAttribute("sizes")).toBe(PAYLOAD.slice(1));
    expect(icon!.getAttribute("href")).toBe("./pwa/a.png");
    for (const el of Array.from(head.children)) {
      expect(el.tagName).toBe("LINK");
    }
  });
});
