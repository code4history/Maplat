// nov26-m5-t3: MaplatEditor#106（viewer 側）— pwaWorker: false / null で Service Worker を登録しない。
// あわせて M5-SEC-I-1: <link rel="manifest">・<link rel="apple-touch-icon"> を HTML 文字列ではなく
// DOM の組み立て（createElement("link") + setAttribute）で作る。
// 設計: NayutaProducts docs/superpowers/specs/2026-10-11-nov26-m5-t3-task-design.md（v2）§3.2・§7 AC2・AC3
//
// resolvePwaWorker は是正前に存在しない。静的 import にすると是正前は spec 全体が収集前に落ち、
// initPwa に対する個別の赤（false で既定を登録する・href が注入値で切れる）を記録できない。
// ∴ resolvePwaWorker だけを describe の中で動的 import に分けた（設計 §6 の 2）。
//
// タスク設計レビュー r1 MIN-6: 是正前の createElement（@maplat/core）は div に innerHTML で入れて
// 先頭の要素（<link>）だけを返すため、注入された <img> は jsdom の head には入らない。∴ 是正前の赤は
// 「img が増える」ではなく「href / sizes が注入値そのものにならない（x で切れる）」で出る。判別の主役は
// href・sizes の完全一致と、AC3 (a) の静的検査（pwa_init.ts に HTML 文字列から要素を作る箇所が無い）。
// なお実ブラウザでは、切り離された <img> でも読み込みが始まり onerror が走りうる（脆弱性の本体）。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { MaplatApp } from "@maplat/core";
import type { MaplatAppOption } from "../src/types";

vi.mock("@c4h/weiwudi", () => ({
  default: {
    registerSW: vi.fn()
  }
}));

import Weiwudi from "@c4h/weiwudi";
import { initPwa } from "../src/pwa_init";

const registerSW = vi.mocked(Weiwudi.registerSW);

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const core = { appid: "nov26m5t3" } as unknown as MaplatApp;

const stubFetch = (manifestJson: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(manifestJson)
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const ICONS = [
  { src: "icons/icon-192.png", sizes: "192x192" },
  { src: "icons/icon-512.png", sizes: "512x512" }
];

// 実行して head の様子と registerSW の呼び出しを返す
const run = async (appOption: MaplatAppOption, manifestJson: unknown) => {
  const fetchMock = stubFetch(manifestJson);
  initPwa(core, appOption);
  await flush();
  await flush();
  return {
    fetchMock,
    manifestLinks: document.head.querySelectorAll('link[rel="manifest"]'),
    iconLinks: document.head.querySelectorAll('link[rel="apple-touch-icon"]')
  };
};

beforeEach(() => {
  document.head.innerHTML = "";
  vi.spyOn(console, "error").mockImplementation(() => {});
  registerSW.mockReset();
  registerSW.mockResolvedValue({} as ServiceWorkerRegistration);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AC2 (a): resolvePwaWorker の表（設計 §3.2 の 7 行）", () => {
  const table: Array<[string, unknown, string | null]> = [
    ["undefined", undefined, "./service-worker.js"],
    ['""', "", "./service-worker.js"],
    ['"x/sw.js"', "x/sw.js", "x/sw.js"],
    ["false", false, null],
    ["null", null, null],
    ["true（型の外・実行時）", true, "./service-worker.js"],
    ["数値（型の外）", 1, "./service-worker.js"],
    ["オブジェクト（型の外）", {}, "./service-worker.js"]
  ];
  it.each(table)("%s → 期待値", async (_label, input, expected) => {
    const { resolvePwaWorker } = await import("../src/pwa_init");
    expect(resolvePwaWorker(input)).toBe(expected);
  });
});

describe("AC2 (b): initPwa と pwaWorker の値", () => {
  it.each([
    ["false", false],
    ["null", null]
  ])(
    "pwaWorker: %s → registerSW を呼ばない。manifest link 1 件・fetch 1 回・apple-touch-icon は icons の数",
    async (_label, worker) => {
      const r = await run(
        {
          pwaManifest: true,
          pwaWorker: worker as unknown as MaplatAppOption["pwaWorker"]
        },
        { icons: ICONS }
      );
      expect(registerSW).not.toHaveBeenCalled();
      expect(r.manifestLinks).toHaveLength(1);
      expect(r.manifestLinks[0].getAttribute("href")).toBe(
        "./pwa/nov26m5t3_manifest.json"
      );
      expect(r.fetchMock).toHaveBeenCalledTimes(1);
      expect(r.iconLinks).toHaveLength(ICONS.length);
      expect(console.error).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["undefined", undefined],
    ['""', ""]
  ])(
    'pwaWorker: %s → registerSW("./service-worker.js", { scope: "./" }) を 1 回',
    async (_label, worker) => {
      await run(
        {
          pwaManifest: true,
          pwaWorker: worker as unknown as MaplatAppOption["pwaWorker"]
        },
        { icons: ICONS }
      );
      expect(registerSW).toHaveBeenCalledTimes(1);
      expect(registerSW).toHaveBeenCalledWith("./service-worker.js", {
        scope: "./"
      });
    }
  );

  it('pwaWorker: "sw/x.js" → registerSW("sw/x.js", { scope: "./" })', async () => {
    await run({ pwaManifest: true, pwaWorker: "sw/x.js" }, { icons: ICONS });
    expect(registerSW).toHaveBeenCalledTimes(1);
    expect(registerSW).toHaveBeenCalledWith("sw/x.js", { scope: "./" });
  });

  it('pwaWorker: true（型の外）→ registerSW("./service-worker.js", …)', async () => {
    await run(
      { pwaManifest: true, pwaWorker: true as unknown as string },
      { icons: ICONS }
    );
    expect(registerSW).toHaveBeenCalledTimes(1);
    expect(registerSW).toHaveBeenCalledWith("./service-worker.js", {
      scope: "./"
    });
  });
});

describe("AC2 (c): pwaManifest なしなら pwaWorker: false でも何もしない", () => {
  it("registerSW・fetch・<link> が 0", async () => {
    const r = await run({ pwaWorker: false }, { icons: ICONS });
    expect(registerSW).not.toHaveBeenCalled();
    expect(r.fetchMock).not.toHaveBeenCalled();
    expect(document.head.querySelectorAll("link")).toHaveLength(0);
  });
});

describe("AC3 (b): M5-SEC-I-1 — 注入値は属性の値として入り、要素にならない", () => {
  const PAYLOAD = 'x"><img src=y onerror=window.__nov26m5t3=1>';

  it("pwaManifest に注入値 → manifest link の href がその文字列そのもの・head は link だけ", async () => {
    await run({ pwaManifest: PAYLOAD, pwaWorker: false }, {});
    const head = document.head;
    expect(head.querySelectorAll("img")).toHaveLength(0);
    const manifest = head.querySelector('link[rel="manifest"]');
    expect(manifest).not.toBeNull();
    // 是正前は href が "x" で切れる（MIN-6: 是正前の赤はここで出る）
    expect(manifest!.getAttribute("href")).toBe(PAYLOAD);
    for (const el of Array.from(head.children)) {
      expect(el.tagName).toBe("LINK");
    }
  });

  it("manifest の icons[].sizes に注入値 → apple-touch-icon の sizes がその文字列そのもの", async () => {
    await run(
      { pwaManifest: "./pwa/m.json", pwaWorker: false },
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
