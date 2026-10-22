// @vitest-environment jsdom
//
// NOV26-IM-M12-NOOPENER-0473: セキュリティレビュー SR-NOV26-B-3（Low）の是正
//
// 逆タブナビング（reverse tabnabbing）: window.open(href, "_blank") で開いた先の
// ページは window.opener 経由で元のタブを書き換えられる。外部 URL・外部由来の
// POI データを開く経路では noopener / noreferrer を付ける。
//
// 対象は次の 3 箇所（いずれも戻り値を使っていない＝noopener で null が返っても
// 既存の挙動は壊れない）:
// - src/ui_marker.ts の directgo（blank: true）
// - src/ui_init.ts の SNS 共有（tw / fb）
//
// ui_init 側は実経路で確かめる（uiInit → onUiDomReady → 委譲クリックリスナー）。
// @maplat/core の MaplatApp だけをスタンドインに差し替え、他は実物を残す。
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@maplat/core", async importOriginal => {
  const orig = await importOriginal<Record<string, unknown>>();
  return {
    ...orig,
    // uiInit が `ui.core = new Core(appOption)` で生成し、以降 mapDivDocument 等を読む。
    MaplatApp: class {
      mapDivDocument: HTMLElement;
      initialRestore: Record<string, unknown>;
      appData: Record<string, unknown>;
      appName: string;
      enableCache: boolean;
      waitReady: Promise<void>;
      mapObject: { on: () => void };
      constructor() {
        const div = document.createElement("div");
        div.innerHTML = [
          '<div class="modalBase"></div>',
          '<div class="modal_load_title"></div>',
          '<div class="splash_img"></div>',
          '<div class="splash_div hide"></div>',
          '<button class="share_button" data="tw_app">tw</button>',
          '<button class="share_button" data="fb_app">fb</button>'
        ].join("");
        this.mapDivDocument = div;
        this.initialRestore = {};
        this.appData = {};
        this.appName = "app.name";
        this.enableCache = false;
        this.waitReady = Promise.resolve();
        this.mapObject = { on: () => {} };
      }
      addEventListener() {}
    }
  };
});

// i18n は外部ライブラリなのでスタンドインにする（i18nLoader の完了だけを再現する）。
vi.mock("i18next", () => {
  const i18n = {
    use: () => i18n,
    init: (_opts: unknown, cb: (err: unknown, t: unknown) => void) =>
      cb(null, (key: string) => key),
    t: (key: string) => key
  };
  return { default: i18n };
});
vi.mock("i18next-http-backend", () => ({ default: {} }));

// prepareModal（bootstrap.native）だけを差し替える。実物は Bootstrap の DOM を要求する。
vi.mock("../src/ui_utils", async importOriginal => {
  const orig = await importOriginal<typeof import("../src/ui_utils")>();
  return {
    ...orig,
    prepareModal: () => ({ show: () => {}, hide: () => {} })
  };
});

import { uiInit } from "../src/ui_init";
import type { MaplatUi } from "../src/index";
import type { MaplatAppOption } from "../src/types";

function makeUi(): MaplatUi {
  return {
    lang: "ja",
    t: (key: string) => key,
    translate: (x: unknown) => x as string,
    getShareUrl: () => "https://maplat.example/app/",
    modalSetting: () => {},
    showToast: () => {}
  } as unknown as MaplatUi;
}

describe("SR-NOV26-B-3: SNS 共有の window.open は noopener 付きで呼ぶ", () => {
  let openSpy: ReturnType<typeof vi.fn>;
  let originalTitle: string | null;

  beforeEach(async () => {
    document.head.innerHTML = "<title></title>";
    document.body.innerHTML = "";
    originalTitle = document.title;
    openSpy = vi.fn(() => null);
    vi.stubGlobal("open", openSpy);

    const ui = makeUi();
    const appOption = {} as MaplatAppOption;
    await uiInit(ui, appOption);
    await appOption.uiHooks!.onUiConfigure!({});
    await appOption.uiHooks!.onUiDomReady!({});
    // uiInit が設定した core（スタンドイン）を mapDiv として使う
    document.body.innerHTML = "";
    document.body.appendChild(
      (
        ui.core as unknown as {
          mapDivDocument: HTMLElement;
        }
      ).mapDivDocument
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.head.innerHTML = originalTitle === null ? "" : "<title></title>";
  });

  it("テストの前提: 共有ボタンのクリックが window.open に到達する", () => {
    const btn = document.querySelector('[data="tw_app"]') as HTMLElement;
    expect(btn).not.toBeNull();
    btn.click();
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it("Twitter 共有は window.open(url, _blank, noopener,noreferrer) を呼ぶ", () => {
    (document.querySelector('[data="tw_app"]') as HTMLElement).click();
    const call = openSpy.mock.calls[0];
    expect(call[1]).toBe("_blank");
    expect(call[2]).toBe("noopener,noreferrer");
    expect(String(call[0])).toContain("https://twitter.com/intent/tweet");
  });

  it("Facebook 共有は window features を保ったまま noopener,noreferrer を渡す", () => {
    (document.querySelector('[data="fb_app"]') as HTMLElement).click();
    const call = openSpy.mock.calls[0];
    expect(call[1]).toBe("_blank");
    expect(String(call[2])).toContain("noopener");
    expect(String(call[2])).toContain("noreferrer");
    // 既存のポップアップ指定は失わない
    expect(String(call[2])).toContain("width=650");
    expect(String(call[2])).toContain("height=450");
    expect(String(call[0])).toContain(
      "https://www.facebook.com/sharer/sharer.php"
    );
  });
});
