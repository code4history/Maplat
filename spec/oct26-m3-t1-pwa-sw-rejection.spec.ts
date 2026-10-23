// oct26-m3-t1: Maplat #260 — Service Worker 登録の Promise 拒否の捕捉。
//
// Stage 4: 旧の実装（`src/pwa_init.ts`。Weiwudi.registerSW を呼ぶ）を消したので、対象を
// `src/element/pwa.ts` の `initPwa` へ移した。旧は `registerSW(...)` の戻り値を捨てていたので、
// 拒否が未捕捉のまま素通りしていた（#260 の本体）。要素の `register` はいま
// `navigator.serviceWorker.register(...).then(reg => reg, err => console.error)` で自分で受ける。
//
// ここで固定するのは、その**観測できる性質**:
//   AC1: 登録が拒否されても未捕捉 rejection にならず、`console.error` がちょうど 1 回呼ばれる
//   AC2: 登録が解決したら、manifest の link・既定値の解決・apple-touch-icon の生成という後続処理が残る
// 属性レベルの「pwa-manifest が無ければ何もしない」は `spec/element-share.spec.ts`（PWA の describe）が見る。
//
// AC1 で vi.fn の拒否を使わない理由（旧 spec から引き継ぐ）: vitest のモック結果追跡が拒否へ
// ハンドラを付けるため、未捕捉 rejection として process の unhandledRejection に届かなくなる
// （記録: spec/oct26-m3-t1-vitest-mock-rejection-semantics.spec.ts）。∴ AC1 は素の関数で差し替える。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initPwa, resetPwaRegistryForTest } from "../src/element/pwa";

// マイクロタスクを排出させたうえで unhandledRejection の発火を待つため、
// イベントループを1回（setTimeout 0）回す
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

// manifest fetch の stub（AC1 では中身を使わない。jsdom の fetch 有無という
// 環境差を排すため、fetch を呼ぶ試験ではすべて明示的に差し替える）
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

describe("initPwa: Service Worker 登録拒否の捕捉 (oct26-m3-t1)", () => {
  let unhandled: unknown[];
  const onUnhandled = (reason: unknown) => {
    unhandled.push(reason);
  };

  beforeEach(() => {
    document.head.innerHTML = "";
    unhandled = [];
    resetPwaRegistryForTest();
    process.on("unhandledRejection", onUnhandled);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.off("unhandledRejection", onUnhandled);
    delete (navigator as unknown as Record<string, unknown>).serviceWorker;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("AC1: 登録が拒否したら未捕捉 rejection にならず console.error が1回呼ばれる", async () => {
    const calls: Array<[string, unknown]> = [];
    const error = new Error("A bad HTTP response code (404) was received");
    stubServiceWorker((sw: string, swOptions?: unknown) => {
      calls.push([String(sw), swOptions]);
      return Promise.reject(error);
    });
    stubFetch({});

    const registration = initPwa({ manifest: "./pwa/m_manifest.json" });
    await flush();

    expect(calls).toEqual([["./service-worker.js", { scope: "./" }]]);
    // #260 の本体: 拒否が未捕捉のまま素通りしていないこと
    expect(unhandled).toEqual([]);
    // 定めた観測先（console.error）がちょうど1回呼ばれること
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Failed to register service worker:",
      error
    );
    // 失敗しても呼び出し側は解決を待てる（undefined に解決する）
    await expect(registration).resolves.toBeUndefined();
  });

  it("AC2: 登録が解決したら既存の manifest link 挿入・既定値解決・apple-touch-icon 生成が維持される", async () => {
    const register = vi.fn(() =>
      Promise.resolve({} as ServiceWorkerRegistration)
    );
    stubServiceWorker(register);
    const fetchMock = stubFetch({
      icons: [{ src: "icons/icon-192.png", sizes: "192x192" }]
    });

    initPwa({ manifest: "./pwa/oct26m3t1_manifest.json" });
    await flush();
    await flush();

    // 既定値解決の維持: pwa-worker / pwa-scope 未指定は ./service-worker.js / ./ へ落ちる
    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith("./service-worker.js", {
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

  it("AC2: manifest が http(s)/相対 URL でなければ登録も link 挿入もせず、警告する（既存ガードの維持）", async () => {
    const register = vi.fn(() => Promise.resolve({}));
    stubServiceWorker(register);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(initPwa({ manifest: "javascript:alert(1)" })).toBeUndefined();
    await flush();

    expect(register).not.toHaveBeenCalled();
    expect(document.head.querySelector('link[rel="manifest"]')).toBeNull();
    expect(console.error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      "<maplat-ui>: PWA was not enabled because pwa-manifest / pwa-worker / pwa-scope is not an http(s) or relative URL."
    );
  });
});
