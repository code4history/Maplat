// @vitest-environment jsdom
// <maplat-ui>（src/element/）の「残りの画面（後半）」の単体テスト: ヘルプ・スプラッシュ・
// プレゼンテーションモード・範囲外／GPS エラーのモーダル・トースト・操作ボタンの自動非表示・
// タッチ端末でズームボタンを隠す処理・mapsAt・app-envelope・地図メニューの色の印（N1）。
// spec/element.spec.ts と同じく @maplat/core/conformance の**模擬の層 A**（公開面だけを持つ
// <maplat-app>）の上で動かす＝ <maplat-ui> が層 A の公開面だけで動くことの確認（仕様 §4.6・§8.3）。
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  defineMockMaplatApp,
  getMockLayerAController
} from "@maplat/core/conformance";
import { MAPLAT_UI_TAG } from "@maplat/core/common";
import { MaplatUiElement } from "../src/element";

defineMockMaplatApp();

const SETTING = {
  appName: { ja: "テストアプリ", en: "Test App" },
  lang: "en",
  homePosition: [139.7, 35.7],
  defaultZoom: 14,
  startFrom: "old1",
  sources: [
    {
      mapID: "osm",
      label: { ja: "OSM（現在）", en: "OSM (now)" },
      isBasemap: true,
      thumbnail: "tmbs/osm.jpg"
    },
    {
      mapID: "old1",
      label: { ja: "古地図1", en: "Old map 1" },
      isOldMap: true,
      // 範囲（経緯度の多角形）。listMaps の hasEnvelope が真になる
      envelope: [
        [139, 35],
        [140, 35],
        [140, 36],
        [139, 36]
      ]
    },
    { mapID: "old2", label: "Old map 2", isOldMap: true }
  ]
};

type Ui = MaplatUiElement & HTMLElement;

const shadow = (ui: Ui) => ui.shadowRoot!;
const part = (ui: Ui, name: string) =>
  shadow(ui).querySelector(`[part~="${name}"]`) as HTMLElement;
const BASE = "http://localhost:3000/";

async function mountUi(
  setup?: (ui: Ui) => void,
  setting: typeof SETTING = SETTING
): Promise<Ui> {
  const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
  ui.setting = structuredClone(setting);
  setup?.(ui);
  document.body.appendChild(ui);
  await ui.ready;
  return ui;
}

function press(ui: Ui, name: string) {
  (part(ui, name).querySelector("button") as HTMLButtonElement).click();
}

beforeEach(() => {
  history.replaceState(null, "", BASE);
  try {
    localStorage.clear();
  } catch {
    // 使えない環境では何もしない
  }
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  history.replaceState(null, "", BASE);
});

describe("この spec の前提（登録）", () => {
  it("<maplat-ui> と模擬の層 A が登録されている", () => {
    expect(customElements.get(MAPLAT_UI_TAG)).toBe(MaplatUiElement);
    expect(customElements.get("maplat-app")).toBeTruthy();
  });
});

describe("ヘルプ（旧 maplat_control.ts の Maplat・ui_init.ts の modal_help・html.help_*）", () => {
  it("ヘルプのボタンは準備後に出て、押すとモーダルが開く（enable-* に関係なく常に出す）", async () => {
    const ui = await mountUi();
    const button = part(ui, "help").querySelector("button")!;
    expect(part(ui, "help-modal").hidden).toBe(true);
    expect(button.title).toBe("Show Help");
    press(ui, "help");
    const modal = part(ui, "help-modal");
    expect(modal.hidden).toBe(false);
    expect(part(ui, "help-title").textContent).toBe("Maplat Help");
  });

  it("本文は旧と同じ並び（はじめに→操作→地図の変更→現在地→スポット→その他）と締めのクレジット", async () => {
    const ui = await mountUi(u => (u.lang = "ja"));
    press(ui, "help");
    const body = part(ui, "help-body");
    const text = body.textContent ?? "";
    expect(text).toContain("このサイトはオープンソース絵地図");
    for (const heading of [
      "地図の操作方法",
      "地図の変更方法",
      "地図上への現在地表示",
      "スポット情報の表示",
      "その他"
    ])
      expect(text).toContain(heading);
    // 旧と同じく Maplat のサイトへのリンク（target="_blank" には sanitizeHtml が rel を付ける）
    const link = body.querySelector("a[href='https://www.maplat.jp/']")!;
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(text).toContain("© 2015- Kohei Otsuka, Code for History");
    // 旧の ${xxx.png} は画像・アイコンに置き換わる（文字のまま残らない）
    expect(text).not.toContain("${");
    expect(body.querySelectorAll(".help-icon").length).toBeGreaterThan(0);
    expect(body.querySelector(".help-key")!.textContent).toBe("+");
    // 地図の変更方法は層 B の画面に合わせる（上の中央の地図名のボタンで開くメニュー。旧 UI の
    // 言語ファイルの「左下と右下のサムネイル付きスライダ」は層 B の上書きで置き換わる）
    expect(text).toContain("画面上の地図名のボタンで開くメニュー");
    expect(text).toContain("「背景地図」はベースマップ");
    expect(text).not.toContain("画面の左下と右下に");
    expect(text).not.toContain("サムネイル付きのスライダ");
  });

  it("付随の行は enable-* のときだけ出す（旧 CSS の .share_help 等と同じ規則・起動後の変更も効く）", async () => {
    const ui = await mountUi();
    press(ui, "help");
    const items = () =>
      Array.from(part(ui, "help-body").querySelectorAll(".help-list li")).map(
        li => li.textContent ?? ""
      );
    // 既定は「地図情報」「ヘルプ」「スライダ」の 3 行（旧も share/border/hide/marker は隠れていた）
    expect(items().length).toBe(3);
    expect(items().some(t => t.includes("SNS"))).toBe(false);
    // 開いたまま属性を変えると、その場で本文を作り直す（旧は class の付け替えで出し入れしていた）
    ui.enableShare = true;
    ui.enableBorder = true;
    ui.enableHideMarker = true;
    ui.enableMarkerList = true;
    expect(items().length).toBe(7);
    expect(items().some(t => t.includes("SNS"))).toBe(true);
    expect(items().some(t => t.includes("map border lines"))).toBe(true);
    expect(items().some(t => t.includes("Toggles the display"))).toBe(true);
    expect(items().some(t => t.includes("for each marker layer"))).toBe(true);
    ui.enableShare = false;
    ui.enableBorder = false;
    ui.enableHideMarker = false;
    ui.enableMarkerList = false;
    expect(items().length).toBe(3);
  });

  it("閉じるボタン・背景の押下・Escape で閉じる", async () => {
    const ui = await mountUi();
    press(ui, "help");
    part(ui, "help-close").click();
    expect(part(ui, "help-modal").hidden).toBe(true);
    press(ui, "help");
    part(ui, "help-modal").dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );
    expect(part(ui, "help-modal").hidden).toBe(true);
    press(ui, "help");
    shadow(ui).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(part(ui, "help-modal").hidden).toBe(true);
    // 開いていないときは何も起きない
    shadow(ui).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    expect(part(ui, "help-modal").hidden).toBe(true);
  });

  it("言語を変えると本文を作り直す（ja・en）", async () => {
    const ui = await mountUi(u => (u.lang = "ja"));
    press(ui, "help");
    expect(part(ui, "help-title").textContent).toBe("Maplat ヘルプ");
    ui.lang = "en";
    await vi.waitFor(() =>
      expect(part(ui, "help-title").textContent).toBe("Maplat Help")
    );
    expect(part(ui, "help-body").textContent).toContain(
      "How to operate the map"
    );
    // 地図の変更方法は層 B の画面に合わせる（旧 UI の言語ファイルのスライダーの説明は上書きで置き換わる）
    expect(part(ui, "help-body").textContent).toContain(
      "at the top of the screen"
    );
    expect(part(ui, "help-body").textContent).not.toContain(
      "The two sliders with thumbnail"
    );
  });

  it("ヘルプを開く前に開いていたモーダルは閉じる", async () => {
    const ui = await mountUi(u => u.setAttribute("enable-share", ""));
    press(ui, "share");
    expect(part(ui, "share-modal").hidden).toBe(false);
    press(ui, "help");
    expect(part(ui, "share-modal").hidden).toBe(true);
    expect(part(ui, "help-modal").hidden).toBe(false);
  });
});

describe("スプラッシュ（旧 ui_init.ts の initSplash・設定ファイルの splash）", () => {
  it("起動時に題名と読み込み中の文言を出し、200 ms で隠す（splash 無し）", async () => {
    vi.useFakeTimers();
    try {
      const ui = await mountUi();
      const splash = part(ui, "splash");
      // jsdom は getBoundingClientRect が 0 でも、表示の入れ物は作る（画像が無いので中身は文言だけ）
      expect(splash.hidden).toBe(false);
      expect(part(ui, "splash-title").textContent).toBe("Test App");
      expect(part(ui, "splash-loading").textContent).toBe(
        "Now loading application..."
      );
      expect(part(ui, "splash-image").hidden).toBe(true);
      vi.advanceTimersByTime(199);
      expect(splash.hidden).toBe(false);
      vi.advanceTimersByTime(1);
      expect(splash.hidden).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("設定ファイルの splash を img/ の下の画像として出し、1000 ms で隠す", async () => {
    vi.useFakeTimers();
    try {
      const setting = { ...structuredClone(SETTING), splash: "splash.png" };
      const ui = await mountUi(undefined, setting as typeof SETTING);
      expect(part(ui, "splash").hidden).toBe(false);
      expect(part(ui, "splash-image").hidden).toBe(false);
      expect(
        (part(ui, "splash-img") as HTMLImageElement).getAttribute("src")
      ).toBe("img/splash.png");
      vi.advanceTimersByTime(999);
      expect(part(ui, "splash").hidden).toBe(false);
      vi.advanceTimersByTime(1);
      expect(part(ui, "splash").hidden).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("地図の準備ができるまでは隠さない（旧 ui_init.ts:501 は準備の後に隠す）", async () => {
    vi.useFakeTimers();
    try {
      const setting = { ...structuredClone(SETTING), splash: "splash.png" };
      const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
      ui.setting = setting as typeof SETTING;
      // 模擬の層 A の準備（core-ready）を 1500 ms 遅らせる
      ui.uiHooks = {
        onCoreReady: () =>
          new Promise<void>(resolve => {
            setTimeout(resolve, 1500);
          })
      };
      document.body.appendChild(ui);
      let ready = false;
      void ui.ready.then(() => {
        ready = true;
      });
      const splash = part(ui, "splash");
      // appdata-ready（core-ready の手前）で出る
      await vi.advanceTimersByTimeAsync(0);
      expect(splash.hidden).toBe(false);
      // 画像ありの 1000 ms を過ぎても、準備ができていなければ出たまま
      await vi.advanceTimersByTimeAsync(1100);
      expect(ready).toBe(false);
      expect(splash.hidden).toBe(false);
      // 1500 ms で準備ができたら、その後に隠す
      await vi.advanceTimersByTimeAsync(401);
      expect(ready).toBe(true);
      expect(splash.hidden).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("復元する地図があるとき（restore の mapID・map-id 属性）は出さない（旧 enableSplash と同じ）", async () => {
    const restored = await mountUi(u => {
      u.restore = { mapID: "old1" };
    });
    expect(part(restored, "splash").hidden).toBe(true);
    // map-id 属性も層 A の initialRestore に mapID として載る
    const mapped = await mountUi(u => (u.mapId = "old1"));
    expect(part(mapped, "splash").hidden).toBe(true);
  });
});

describe("プレゼンテーションモード（presentation-mode。旧 enableOutOfMap）", () => {
  it("範囲外（outOfMap）のモーダルは既定で出し、presentation-mode のときは出さない", async () => {
    const ui = await mountUi();
    const controller = getMockLayerAController(ui.app!)!;
    controller.fire("outOfMap", {});
    expect(part(ui, "gps-modal").hidden).toBe(false);
    expect(part(ui, "gps-title").textContent).toBe("Out of map");
    expect(part(ui, "gps-message").textContent).toBe(
      "Showing area is out of map. The area moves to default position."
    );
    part(ui, "gps-close").click();
    expect(part(ui, "gps-modal").hidden).toBe(true);

    // presentation-mode は起動後に反映する（ii）
    ui.presentationMode = true;
    controller.fire("outOfMap", {});
    expect(part(ui, "gps-modal").hidden).toBe(true);
    ui.presentationMode = false;
    controller.fire("outOfMap", {});
    expect(part(ui, "gps-modal").hidden).toBe(false);
  });

  it("presentation-mode は GPS のエラー（gps_error・gps_result）のモーダルは止めない（旧と同じ）", async () => {
    const ui = await mountUi(u => (u.presentationMode = true));
    const controller = getMockLayerAController(ui.app!)!;
    controller.fire("gps_error", "gps_miss");
    expect(part(ui, "gps-modal").hidden).toBe(false);
    expect(part(ui, "gps-title").textContent).toBe(
      "Location information is not available"
    );
  });
});

describe("範囲外・GPS エラーのモーダル（旧 initGpsHandlers の modal_gpsD）", () => {
  it("gps_error は種類ごとの文言を出す（知らない種類は app.gps_error）", async () => {
    const ui = await mountUi();
    const controller = getMockLayerAController(ui.app!)!;
    controller.fire("gps_error", "user_gps_deny");
    expect(part(ui, "gps-title").textContent).toBe(
      "Location information is not available"
    );
    expect(part(ui, "gps-message").textContent).toContain("Use Location");
    controller.fire("gps_error", "gps_timeout");
    expect(part(ui, "gps-message").textContent).toContain("timed out");
    controller.fire("gps_error", "something_else");
    expect(part(ui, "gps-message").textContent).toBe(
      "Location information is not available"
    );
  });

  it("gps_result の gps_out は範囲外、ほかのエラーは GPS のエラー、gps_off・成功は出さない", async () => {
    const ui = await mountUi();
    const controller = getMockLayerAController(ui.app!)!;
    controller.fire("gps_result", { error: "gps_out" });
    expect(part(ui, "gps-title").textContent).toBe("Out of map");
    part(ui, "gps-close").click();
    controller.fire("gps_result", { error: "gps_miss" });
    expect(part(ui, "gps-title").textContent).toBe(
      "Location information is not available"
    );
    expect(part(ui, "gps-message").textContent).toContain(
      "System failed to acquire location"
    );
    part(ui, "gps-close").click();
    controller.fire("gps_result", { error: "gps_off" });
    expect(part(ui, "gps-modal").hidden).toBe(true);
    controller.fire("gps_result", { lnglat: [139.7, 35.7], acc: 10 });
    expect(part(ui, "gps-modal").hidden).toBe(true);
  });

  it("always-gps-on のときの gps_out_hide は出さず、GPS のボタンで出し直す（旧 SetGPS）", async () => {
    const ui = await mountUi(u => (u.alwaysGpsOn = true));
    const controller = getMockLayerAController(ui.app!)!;
    // 実物の層 A（Core・Pro）は always-gps-on の範囲外で gps_out_hide を送る
    controller.fire("gps_result", { error: "gps_out_hide" });
    expect(part(ui, "gps-modal").hidden).toBe(true);
    press(ui, "gps");
    expect(part(ui, "gps-modal").hidden).toBe(false);
    expect(part(ui, "gps-title").textContent).toBe("Out of map");
    // gps_off で最後のエラーを忘れる
    part(ui, "gps-close").click();
    controller.fire("gps_result", { error: "gps_off" });
    press(ui, "gps");
    expect(part(ui, "gps-modal").hidden).toBe(true);
  });

  it("always-gps-on でないときの gps_out_hide も出さない（範囲外は黙って覚えるだけ）", async () => {
    const ui = await mountUi();
    const controller = getMockLayerAController(ui.app!)!;
    controller.fire("gps_result", { error: "gps_out_hide" });
    expect(part(ui, "gps-modal").hidden).toBe(true);
    // ほかのエラー（この型を知らない実装の取りこぼし）は今までどおり出す
    controller.fire("gps_result", { error: "gps_miss" });
    expect(part(ui, "gps-title").textContent).toBe(
      "Location information is not available"
    );
  });

  it("開いたまま言語を変えると、題名と本文を今の言語で描き直す（範囲外とエラーの種類は覚えている）", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "ja"));
    const controller = getMockLayerAController(ui.app!)!;
    controller.fire("gps_result", { error: "gps_out" });
    expect(part(ui, "gps-title").textContent).toBe("地図範囲外");
    ui.lang = "en";
    await vi.waitFor(() =>
      expect(part(ui, "gps-title").textContent).toBe("Out of map")
    );
    expect(part(ui, "gps-message").textContent).toContain(
      "Showing area is out of map"
    );
    // エラーの種類も覚えている（種類ごとの本文がその言語で出る）
    part(ui, "gps-close").click();
    controller.fire("gps_result", { error: "gps_miss" });
    expect(part(ui, "gps-message").textContent).toContain(
      "System failed to acquire location"
    );
    ui.lang = "ja";
    await vi.waitFor(() =>
      expect(part(ui, "gps-message").textContent).toContain(
        "位置取得に失敗しました"
      )
    );
  });

  it("地図の準備前のイベントでは出さない（旧も core-ready の後に購読していた）", async () => {
    const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
    ui.setting = structuredClone(SETTING);
    document.body.appendChild(ui);
    const app = ui.app!;
    app.dispatchEvent(new CustomEvent("gps_error", { detail: "gps_miss" }));
    await ui.ready;
    expect(part(ui, "gps-modal").hidden).toBe(true);
  });
});

describe("トースト（既存の showToast。旧 showToast を使う画面の土台）", () => {
  it("Shadow DOM の中に文言を出し、1.5 秒で消す", async () => {
    vi.useFakeTimers();
    try {
      const ui = await mountUi();
      ui.showToast("Copied to clipboard");
      const toast = part(ui, "toast");
      expect(toast.textContent).toBe("Copied to clipboard");
      expect(toast.classList.contains("show")).toBe(true);
      expect(ui.shadowRoot!.contains(toast)).toBe(true);
      vi.advanceTimersByTime(1499);
      expect(toast.classList.contains("show")).toBe(true);
      vi.advanceTimersByTime(1);
      expect(toast.classList.contains("show")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("操作ボタンの自動非表示（tap-duration / tap-ui-vanish。旧 setMapOnOff）", () => {
  const faded = (ui: Ui) =>
    Array.from(shadow(ui).querySelectorAll(".ctl, .slider")).every(c =>
      c.classList.contains("fade")
    );

  it("既定は tap-ui-vanish が偽なので、地図を押しても隠さない", async () => {
    const ui = await mountUi();
    (ui.app as HTMLElement).click();
    expect(faded(ui)).toBe(false);
  });

  it("tap-ui-vanish が真なら地図の押下で隠し、tap-duration（既定 3000 ms）で戻す", async () => {
    vi.useFakeTimers();
    try {
      const ui = await mountUi(u => u.setAttribute("tap-ui-vanish", ""));
      // 起動時の視点の移動（模擬の moveEnd）を先に片付ける（moveEnd も戻しのタイマーを張る）
      vi.advanceTimersByTime(200);
      (ui.app as HTMLElement).click();
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(2999);
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(1);
      expect(faded(ui)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tap-duration を変えると次の自動非表示から効く（0 も有効）", async () => {
    vi.useFakeTimers();
    try {
      const ui = await mountUi(u => {
        u.setAttribute("tap-ui-vanish", "");
        u.setAttribute("tap-duration", "100");
      });
      vi.advanceTimersByTime(200);
      (ui.app as HTMLElement).click();
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(100);
      expect(faded(ui)).toBe(false);
      // 0 なら次の押下で隠れた直後に戻る（旧も setTimeout(…, 0) で戻していた）
      ui.setAttribute("tap-duration", "0");
      (ui.app as HTMLElement).click();
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(0);
      expect(faded(ui)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("隠れているときにもう一度押すと、すぐに戻す（旧 hasFade の分岐）", async () => {
    vi.useFakeTimers();
    try {
      const ui = await mountUi(u => u.setAttribute("tap-ui-vanish", ""));
      vi.advanceTimersByTime(200);
      (ui.app as HTMLElement).click();
      expect(faded(ui)).toBe(true);
      (ui.app as HTMLElement).click();
      expect(faded(ui)).toBe(false);
      // タイマーは残らないので、時間が経っても状態は変わらない
      vi.advanceTimersByTime(4000);
      expect(faded(ui)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("地図のドラッグで隠し、ドラッグ後の click では戻さず、moveEnd の後に tap-duration で戻す", async () => {
    vi.useFakeTimers();
    try {
      const ui = await mountUi(u => {
        u.setAttribute("tap-ui-vanish", "");
        u.setAttribute("tap-duration", "100");
      });
      const app = ui.app as HTMLElement;
      // 起動時の視点の移動（模擬の moveEnd）とスプラッシュのタイマーを先に片付ける
      vi.advanceTimersByTime(200);
      app.dispatchEvent(
        new MouseEvent("pointerdown", {
          bubbles: true,
          clientX: 10,
          clientY: 10
        })
      );
      app.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          clientX: 40,
          clientY: 40
        })
      );
      expect(faded(ui)).toBe(true);
      // 実ブラウザはマウスのドラッグの後に pointerup → click も出す。
      // 層 B は click で戻さない（旧 OL の click はドラッグの後には出ない）
      app.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
      app.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(faded(ui)).toBe(true);
      // ドラッグが止まった（層 A の moveEnd）
      app.dispatchEvent(new CustomEvent("moveEnd", { detail: {} }));
      vi.advanceTimersByTime(99);
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(1);
      expect(faded(ui)).toBe(false);
      // ドラッグの後の、ドラッグでない押下は今までどおり（down で印を戻す）
      app.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      app.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(100);
      expect(faded(ui)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ドラッグとみなしたのに moveEnd が来なくても、tap-duration の後に戻す（n2）", async () => {
    vi.useFakeTimers();
    try {
      const ui = await mountUi(u => {
        u.setAttribute("tap-ui-vanish", "");
        u.setAttribute("tap-duration", "100");
      });
      const app = ui.app as HTMLElement;
      // 起動時の視点の移動（模擬の moveEnd）とスプラッシュのタイマーを先に片付ける
      vi.advanceTimersByTime(200);
      app.dispatchEvent(
        new MouseEvent("pointerdown", {
          bubbles: true,
          clientX: 10,
          clientY: 10
        })
      );
      app.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          clientX: 40,
          clientY: 40
        })
      );
      expect(faded(ui)).toBe(true);
      // 地図が動かないドラッグ（moveEnd は来ない）。pointerup の後の click でも戻さない
      app.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
      app.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(99);
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(1);
      expect(faded(ui)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("設定ファイルの tapDuration / tapUIVanish（旧名のまま）は読まない（属性だけ。§10.1 U1 追補）", async () => {
    vi.useFakeTimers();
    try {
      const setting = {
        ...structuredClone(SETTING),
        tapUIVanish: true,
        tapDuration: 100
      };
      const ui = await mountUi(undefined, setting as typeof SETTING);
      vi.advanceTimersByTime(200);
      // 設定ファイルにあっても、属性が無ければ消えない（要素は設定ファイルの機能系キーを読まない）
      (ui.app as HTMLElement).click();
      expect(faded(ui)).toBe(false);
      vi.advanceTimersByTime(4000);
      expect(faded(ui)).toBe(false);
      // 属性を付ければ属性の値で動く（設定ファイルの 100 ではなく 500）
      ui.setAttribute("tap-ui-vanish", "");
      ui.setAttribute("tap-duration", "500");
      (ui.app as HTMLElement).click();
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(100);
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(399);
      expect(faded(ui)).toBe(true);
      vi.advanceTimersByTime(1);
      expect(faded(ui)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("タッチ端末でズームのボタンを隠す（旧 ol-touch・.ol-zoom）", () => {
  it('"ontouchstart" in window のときだけ .frame に touch を付ける（CSS で .ctl-zoom を隠す）', async () => {
    Object.defineProperty(window, "ontouchstart", {
      configurable: true,
      value: null
    });
    try {
      const touch = await mountUi();
      expect(
        shadow(touch).querySelector(".frame")!.classList.contains("touch")
      ).toBe(true);
      expect(part(touch, "zoom-in")).not.toBeNull();
      expect(part(touch, "zoom-out")).not.toBeNull();
    } finally {
      delete (window as unknown as Record<string, unknown>).ontouchstart;
    }
    const plain = await mountUi();
    expect(
      shadow(plain).querySelector(".frame")!.classList.contains("touch")
    ).toBe(false);
  });

  it("タッチ端末では GPS とホームを上へ詰め、ボタンを 1.5 倍にする（旧 ol-touch）", async () => {
    Object.defineProperty(window, "ontouchstart", {
      configurable: true,
      value: null
    });
    try {
      const touch = await mountUi(u => (u.enableShare = true));
      const frame = shadow(touch).querySelector(".frame")!;
      expect(frame.classList.contains("touch")).toBe(true);
      const gps = part(touch, "gps");
      const home = part(touch, "home");
      const button = gps.querySelector("button") as HTMLButtonElement;
      // em の基準（親から継承する文字の大きさ。jsdom は layout をしないので、計算後の px で比べる）
      const base = parseFloat(getComputedStyle(gps).fontSize);
      // 旧: .ol-touch .gps { top: .5em }・.ol-touch .home { top: calc(.5em + 50px) } 相当
      expect(parseFloat(getComputedStyle(gps).top)).toBeCloseTo(base * 0.5);
      expect(parseFloat(getComputedStyle(home).top)).toBeCloseTo(base * 3.5);
      // 旧 ol.css: .ol-touch .ol-control button { font-size: 1.5em }
      expect(parseFloat(getComputedStyle(button).fontSize)).toBeCloseTo(
        base * 1.5
      );
      // n1: 左下の共有は、大きくなったボタンの高さの分だけヘルプの上へずれる（重ならない）。
      // jsdom は env() を含む calc() を解かないので、calc() の px の項を取り出して比べる。
      const share = part(touch, "share");
      const help = part(touch, "help");
      const helpButton = help.querySelector("button") as HTMLButtonElement;
      const bottom = (el: Element) => {
        const raw = getComputedStyle(el).bottom;
        const calc = /^calc\(\s*([\d.]+)px/.exec(raw);
        return calc ? parseFloat(calc[1]) : parseFloat(raw);
      };
      expect(bottom(share)).toBeGreaterThanOrEqual(
        bottom(help) + parseFloat(getComputedStyle(helpButton).height)
      );
    } finally {
      delete (window as unknown as Record<string, unknown>).ontouchstart;
    }
    // タッチでない端末では今までどおり（GPS 6.2em・ホーム 9.2em・ボタン 1.14em）
    const plain = await mountUi();
    const gps = part(plain, "gps");
    const home = part(plain, "home");
    const button = gps.querySelector("button") as HTMLButtonElement;
    const base = parseFloat(getComputedStyle(gps).fontSize);
    expect(parseFloat(getComputedStyle(gps).top)).toBeCloseTo(base * 6.2);
    expect(parseFloat(getComputedStyle(home).top)).toBeCloseTo(base * 9.2);
    expect(parseFloat(getComputedStyle(button).fontSize)).toBeCloseTo(
      base * 1.14
    );
  });
});

describe("mapsAt（重なり判定。旧 ui_marker.ts の xyToMapIDs）", () => {
  const withEnvelopes = () =>
    ({
      ...structuredClone(SETTING),
      startFrom: "osm",
      sources: [
        structuredClone(SETTING.sources[0]),
        {
          mapID: "old1",
          label: "Old map 1",
          isOldMap: true,
          envelope: [
            [139, 35],
            [141, 35],
            [141, 36],
            [139, 36]
          ]
        },
        {
          mapID: "old2",
          label: "Old map 2",
          isOldMap: true,
          envelope: [
            [139.5, 35.25],
            [140.5, 35.25],
            [140.5, 35.75],
            [139.5, 35.75]
          ]
        }
      ]
    }) as typeof SETTING;

  const viewExtent = () => [
    { longitude: 138, latitude: 34 },
    { longitude: 142, latitude: 34 },
    { longitude: 142, latitude: 37 },
    { longitude: 138, latitude: 37 }
  ];

  const stubView = (ui: Ui) =>
    vi.spyOn(ui.app!, "getViewExtent").mockReturnValue(viewExtent());

  it("重なる地図を範囲の狭い順に返し、重ならない点では空", async () => {
    const ui = await mountUi(undefined, withEnvelopes());
    stubView(ui);
    // 範囲の狭い順（旧と同じ並べ替え）
    expect(await ui.mapsAt({ longitude: 139.7, latitude: 35.5 })).toEqual([
      "old2",
      "old1"
    ]);
    expect(await ui.mapsAt({ longitude: 138.5, latitude: 35.5 })).toEqual([]);
  });

  it("今の地図は候補から外す（旧 from.mapID の除外）", async () => {
    const ui = await mountUi(undefined, withEnvelopes());
    stubView(ui);
    await ui.app!.changeMap("old2");
    expect(await ui.mapsAt({ longitude: 139.7, latitude: 35.5 })).toEqual([
      "old1"
    ]);
  });

  it("threshold は「範囲の面積 / 画面の面積」の上限（旧と同じ既定 10）", async () => {
    const ui = await mountUi(undefined, withEnvelopes());
    stubView(ui);
    // old2 は 0.25 / 12 = 0.0208、old1 は 2 / 12 = 0.167
    expect(await ui.mapsAt({ longitude: 139.7, latitude: 35.5 }, 0.05)).toEqual(
      ["old2"]
    );
    expect(await ui.mapsAt({ longitude: 139.7, latitude: 35.5 }, 10)).toEqual([
      "old2",
      "old1"
    ]);
  });

  it("画面の 4 隅（getViewExtent）が取れないときは空（旧の areaIndex 0 と同じ）", async () => {
    const ui = await mountUi(undefined, withEnvelopes());
    vi.spyOn(ui.app!, "getViewExtent").mockReturnValue(null);
    expect(await ui.mapsAt({ longitude: 139.7, latitude: 35.5 })).toEqual([]);
  });

  it("公開面だけを使う（層 A に mapsAt が無くても動く）", async () => {
    const ui = await mountUi(undefined, withEnvelopes());
    stubView(ui);
    expect("mapsAt" in (ui.app as object)).toBe(false);
    // 範囲の狭い順（旧と同じ並べ替え）
    expect(await ui.mapsAt({ longitude: 139.7, latitude: 35.5 })).toEqual([
      "old2",
      "old1"
    ]);
  });
});

describe("app-envelope（開発用。旧 ui_init.ts の appBbox）", () => {
  const withEnvelopes = () =>
    ({
      ...structuredClone(SETTING),
      sources: [
        {
          mapID: "old1",
          label: "Old map 1",
          isOldMap: true,
          envelope: [
            [139, 35],
            [140, 35],
            [140, 36],
            [139, 36]
          ]
        },
        {
          mapID: "old2",
          label: "Old map 2",
          isOldMap: true,
          envelope: [
            [140, 35],
            [141, 35],
            [141, 36],
            [140, 36]
          ]
        }
      ]
    }) as typeof SETTING;

  it("起動時に範囲を持つ全地図の包囲矩形を 1 回だけ console に出す", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await mountUi(u => u.setAttribute("app-envelope", ""), withEnvelopes());
    const lines = log.mock.calls
      .map(args => String(args[0]))
      .filter(text => text.includes("envelope"));
    expect(lines).toEqual(["This app's envelope is: 139,35,141,36"]);
  });

  it("app-envelope が無ければ出さない・起動後の変更は警告して無視する（i'）", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const ui = await mountUi(undefined, withEnvelopes());
    expect(
      log.mock.calls.some(args => String(args[0]).includes("envelope"))
    ).toBe(false);
    ui.setAttribute("app-envelope", "");
    expect(warn).toHaveBeenCalledWith(
      '<maplat-ui>: attribute "app-envelope" is fixed at startup and cannot be changed after the UI has started; the change was ignored.'
    );
    expect(
      log.mock.calls.some(args => String(args[0]).includes("envelope"))
    ).toBe(false);
  });
});

describe("地図の切り替えメニューの色の印（N1。旧 .show-border のスライドの枠）", () => {
  const withEnvelopes = () =>
    ({
      ...structuredClone(SETTING),
      sources: [
        structuredClone(SETTING.sources[0]),
        {
          mapID: "old1",
          label: "Old map 1",
          isOldMap: true,
          envelope: [
            [139, 35],
            [140, 35],
            [140, 36],
            [139, 36]
          ]
        },
        {
          mapID: "old2",
          label: "Old map 2",
          isOldMap: true,
          envelope: [
            [140, 35],
            [141, 35],
            [141, 36],
            [140, 36]
          ]
        }
      ]
    }) as typeof SETTING;

  it("枠線のオン・オフでメニューの show-border を付け外しする（印は表示中だけ）", async () => {
    const ui = await mountUi(
      u => u.setAttribute("enable-border", ""),
      withEnvelopes()
    );
    const menu = shadow(ui).querySelector(".map-menu")!;
    const swatches = () =>
      Array.from(menu.querySelectorAll<HTMLElement>(".swatch"));
    // 色は範囲を持つ地図に割り当て済み（要素はある）
    expect(swatches().map(s => s.style.backgroundColor)).toEqual([
      "rgb(128, 0, 0)",
      "rgb(255, 20, 147)"
    ]);
    // 枠線を出していないときは show-border が無い（CSS が印を隠す）
    expect(menu.classList.contains("show-border")).toBe(false);
    const display = () => getComputedStyle(swatches()[0]).display;
    expect(display()).toBe("none");
    press(ui, "border");
    expect(menu.classList.contains("show-border")).toBe(true);
    expect(display()).toBe("block");
    press(ui, "border");
    expect(menu.classList.contains("show-border")).toBe(false);
    expect(display()).toBe("none");
  });

  it("状態 URL・restore で枠線が出ている状態から始めても印を出す", async () => {
    const ui = await mountUi(u => {
      u.setAttribute("enable-border", "");
      u.restore = { mapID: "old1", showBorder: 1 };
    }, withEnvelopes());
    expect(
      shadow(ui).querySelector(".map-menu")!.classList.contains("show-border")
    ).toBe(true);
    ui.setShowBorder(false);
    expect(
      shadow(ui).querySelector(".map-menu")!.classList.contains("show-border")
    ).toBe(false);
  });
});
