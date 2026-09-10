// oct26-m3-t1: Maplat #260 — Weiwudi.registerSW の Promise 拒否の捕捉。
// ui_init.ts の initDom から抽出される initPwa（src/pwa_init.ts）を直接呼び、
// AC1: registerSW が rejected Promise を返すとき、未捕捉 rejection にならず
//      観測先（console.error）がちょうど1回呼ばれること、
// AC2: resolved Promise を返すとき、manifest link 挿入・既定値解決・
//      apple-touch-icon 生成という既存の後続処理が維持されること、
// を試験する（マイルストーン設計 §3.1 oct26-m3-t1/AC1・AC2 相当）。
//
// AC1 の registerSW 差し替えに vi.fn を使わない理由: vitest のモック結果追跡が
// モックの返す拒否へハンドラを付けるため、未捕捉 rejection として process の
// unhandledRejection に届かなくなる（設計段階に実測。記録:
// oct26-m3-t1-vitest-mock-rejection-semantics.spec.ts）。∴ AC1 は素の関数で
// 差し替え、未捕捉軸を直接観測する。
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

// マイクロタスクを排出させたうえで unhandledRejection の発火を待つため、
// イベントループを1回（setTimeout 0）回す
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const core = { appid: "oct26m3t1" } as unknown as MaplatApp;

// manifest fetch の stub（AC1 では中身を使わない。jsdom の fetch 有無という
// 環境差を排すため、fetch を呼ぶ試験ではすべて明示的に差し替える）
const stubFetch = (manifestJson: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(manifestJson)
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("initPwa: Service Worker 登録拒否の捕捉 (oct26-m3-t1)", () => {
  let unhandled: unknown[];
  const onUnhandled = (reason: unknown) => {
    unhandled.push(reason);
  };

  beforeEach(() => {
    document.head.innerHTML = "";
    unhandled = [];
    process.on("unhandledRejection", onUnhandled);
    vi.spyOn(console, "error").mockImplementation(() => {});
    registerSW.mockReset();
  });

  afterEach(() => {
    process.off("unhandledRejection", onUnhandled);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("AC1: registerSW が拒否したら未捕捉 rejection にならず console.error が1回呼ばれる", async () => {
    const calls: Array<[string, unknown]> = [];
    const original = Weiwudi.registerSW;
    Weiwudi.registerSW = ((_sw: string | URL, _swOptions?: unknown) => {
      calls.push([String(_sw), _swOptions]);
      return Promise.reject(
        new Error("A bad HTTP response code (404) was received")
      );
    }) as typeof Weiwudi.registerSW;
    try {
      stubFetch({});
      const appOption: MaplatAppOption = { pwaManifest: true };

      initPwa(core, appOption);
      await flush();

      expect(calls).toHaveLength(1);
      // #260 の本体: 拒否が未捕捉のまま素通りしていないこと
      expect(unhandled).toEqual([]);
      // 定めた観測先（console.error）がちょうど1回呼ばれること
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        "Failed to register service worker:",
        expect.any(Error)
      );
    } finally {
      Weiwudi.registerSW = original;
    }
  });

  it("AC2: registerSW が解決したら既存の manifest link 挿入・既定値解決・apple-touch-icon 生成が維持される", async () => {
    registerSW.mockResolvedValueOnce({} as ServiceWorkerRegistration);
    const fetchMock = stubFetch({
      icons: [{ src: "icons/icon-192.png", sizes: "192x192" }]
    });
    const appOption: MaplatAppOption = { pwaManifest: true };

    initPwa(core, appOption);
    await flush();
    await flush();

    // 既定値解決の維持: pwaManifest=true は ./pwa/<appid>_manifest.json、
    // pwaWorker / pwaScope 未指定は ./service-worker.js / ./ へ落ちる
    expect(registerSW).toHaveBeenCalledTimes(1);
    expect(registerSW).toHaveBeenCalledWith("./service-worker.js", {
      scope: "./"
    });
    // manifest link の既存生成
    const manifestLink = document.head.querySelector(
      'link[rel="manifest"]'
    ) as HTMLLinkElement | null;
    expect(manifestLink).not.toBeNull();
    expect(manifestLink!.getAttribute("href")).toBe(
      "./pwa/oct26m3t1_manifest.json"
    );
    // manifest は1回 fetch され、apple-touch-icon が挿入される
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("./pwa/oct26m3t1_manifest.json");
    const iconLink = document.head.querySelector(
      'link[rel="apple-touch-icon"]'
    ) as HTMLLinkElement | null;
    expect(iconLink).not.toBeNull();
    expect(iconLink!.getAttribute("sizes")).toBe("192x192");
    // absoluteUrl("./pwa/oct26m3t1_manifest.json", "icons/icon-192.png")
    expect(iconLink!.getAttribute("href")).toBe("./pwa/icons/icon-192.png");
    // 成功経路では error 観測先を呼ばない
    expect(console.error).not.toHaveBeenCalled();
  });

  it("AC2: pwaManifest が無効値なら registerSW も manifest link 挿入も行わない（既存ガードの維持）", async () => {
    const appOption: MaplatAppOption = {};
    initPwa(core, appOption);
    await flush();

    expect(registerSW).not.toHaveBeenCalled();
    expect(document.head.querySelector('link[rel="manifest"]')).toBeNull();
    expect(console.error).not.toHaveBeenCalled();
  });
});
