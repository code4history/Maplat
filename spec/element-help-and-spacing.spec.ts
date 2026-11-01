// @vitest-environment jsdom
// <maplat-ui> の操作ボタンの間隔（左上・左下・右下で同じ）と、ヘルプの印・全体の図の単体テスト。
// spec/element-screens-b.spec.ts と同じく @maplat/core/conformance の模擬の層 A の上で動かす。
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineMockMaplatApp } from "@maplat/core/conformance";
import { MAPLAT_UI_TAG } from "@maplat/core/common";
import { MaplatUiElement } from "../src/element";
import { MAPLAT_UI_CSS } from "../src/element/styles";

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
      thumbnail: "tmbs/old1.jpg",
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

describe("操作ボタンの列の間隔", () => {
  it("左上・左下・右下の 3 つの列が、同じ CSS 変数の gap を使う", async () => {
    const css = MAPLAT_UI_CSS;
    // 間隔を決めるのは 1 か所（3 つの列は同じ .ctl-column の規則を使う）
    expect(css.match(/var\(--maplat-ui-control-gap/g)?.length).toBe(1);
    expect(css).toMatch(
      /\.ctl-column \{[^}]*gap: var\(--maplat-ui-control-gap, 7px\);/
    );
    // タッチ端末だけ別の値、にはしない
    expect(css).not.toMatch(/\.frame\.touch \.ctl-column \{[^}]*gap/);

    const ui = await mountUi(u => (u.enableShare = true));
    // import した要素の実装が登録されている（型だけの import にしない）
    expect(ui).toBeInstanceOf(MaplatUiElement);
    const root = shadow(ui);
    const topLeft = root.querySelector(".ctl-column-top-left")!;
    const bottomLeft = root.querySelector(".ctl-column-bottom-left")!;
    const bottomRight = root.querySelector(".ctl-column-bottom-right")!;
    for (const column of [topLeft, bottomLeft, bottomRight])
      expect(column.classList.contains("ctl-column")).toBe(true);
    expect(root.querySelectorAll(".ctl-column").length).toBe(3);
    // 左上は上から ズーム・GPS・ホーム。左下は下から ヘルプ・共有。
    expect([...topLeft.children]).toEqual([
      part(ui, "zoom"),
      part(ui, "gps"),
      part(ui, "home")
    ]);
    expect([...bottomLeft.children]).toEqual([
      part(ui, "help"),
      part(ui, "share")
    ]);
    // 右下は下から 地図情報・枠線・マーカーの非表示・マーカー一覧（DOM はこの順）
    expect([...bottomRight.children]).toEqual([
      part(ui, "info"),
      part(ui, "border"),
      part(ui, "hide-marker"),
      part(ui, "marker-list")
    ]);
  });
});

describe("ヘルプの印（実物のボタンに寄せる）", () => {
  it("アイコンと＋−は、実物のボタンと同じ背景色の 1.4em 角の小さな四角", async () => {
    const css = MAPLAT_UI_CSS;
    // 色は 1 か所（実物のボタン・ヘルプのアイコンと＋−・スライダーのつまみをまとめた規則）
    expect(css).not.toContain("--maplat-ui-control-bg");
    expect(css).toMatch(
      /\.ctl button,\s*\.help-modal \.help-icon,\s*\.help-modal \.help-key,\s*\.help-modal \.help-slider::after \{ background-color: rgba\(120, 5, 8, \.5\); \}/
    );
    // ヘルプの印は 1.4em 角・角の丸み 2px の小さな四角で、白いアイコンか文字
    expect(css).toMatch(
      /\.help-modal \.help-icon,\s*\.help-modal \.help-key \{[^}]*width: 1\.4em;[^}]*height: 1\.4em;[^}]*border-radius: 2px;[^}]*color: #fff;/
    );
    // 透過度のスライダーは、可動部分とつまみの両方に影を付ける
    expect(css).toMatch(/\.help-modal \.help-slider \{[^}]*box-shadow:/);
    expect(css).toMatch(/\.help-modal \.help-slider::after \{[^}]*box-shadow:/);

    const ui = await mountUi(u => (u.lang = "ja"));
    press(ui, "help");
    const body = part(ui, "help-body");
    const icon = body.querySelector(".help-icon") as HTMLElement;
    const key = body.querySelector(".help-key") as HTMLElement;
    expect(icon.classList.contains("help-icon")).toBe(true);
    expect(icon.querySelector("svg")).not.toBeNull();
    expect(key.classList.contains("help-key")).toBe(true);
    expect(key.textContent).toBe("+");
    const slider = body.querySelector(".help-slider") as HTMLElement;
    expect(slider.classList.contains("help-slider")).toBe(true);
  });
});

describe("ヘルプの冒頭の全体の図", () => {
  it("最初の説明文の後に組み立て、有効でないボタンは描かない（aria-hidden）", async () => {
    const ui = await mountUi();
    press(ui, "help");
    const body = part(ui, "help-body");
    const figure = body.querySelector(".help-figure") as HTMLElement;
    expect(figure).not.toBeNull();
    expect(figure.getAttribute("aria-hidden")).toBe("true");
    expect(figure.querySelector(".help-phone")).not.toBeNull();
    // 旧の fullscreen.png と同じ位置（はじめにの文の後、操作の見出しの前）
    const children = [...body.children];
    expect(children[0].className).toBe("help-text");
    expect(children[1]).toBe(figure);
    expect(children[2].tagName).toBe("H4");
    // 常に出すボタン
    for (const control of ["gps", "home", "compass", "help", "info"])
      expect(
        figure.querySelector(`[data-control="${control}"]`),
        control
      ).not.toBeNull();
    // enable-* が無いものは描かない
    expect(figure.querySelector('[data-control="share"]')).toBeNull();
    expect(figure.querySelector('[data-control="border"]')).toBeNull();
    expect(figure.querySelector('[data-control="hide-marker"]')).toBeNull();
    expect(figure.querySelector('[data-control="marker-list"]')).toBeNull();
    // ヘルプの印と同じ見た目（.help-icon）を使い回す
    expect(
      figure
        .querySelector('[data-control="gps"]')!
        .classList.contains("help-icon")
    ).toBe(true);

    // 開いたまま enable-share を付けると、その場で作り直して共有も描く
    ui.enableShare = true;
    const rebuilt = body.querySelector(".help-figure") as HTMLElement;
    expect(rebuilt).not.toBe(figure);
    expect(rebuilt.querySelector('[data-control="share"]')).not.toBeNull();
  });

  it("背景は今の地図の一覧の先頭の古地図のサムネイル。無いときは画像を敷かない", async () => {
    const ui = await mountUi(u => (u.lang = "ja"));
    press(ui, "help");
    const body = part(ui, "help-body");
    const map = body.querySelector(
      ".help-figure .help-phone-map"
    ) as HTMLImageElement;
    expect(map).not.toBeNull();
    expect(map.getAttribute("src")).toBe("tmbs/old1.jpg");
    expect(map.getAttribute("alt")).toBe("");

    // 先頭の古地図にサムネイルが無いときは無地（<img> を置かない）
    const noThumbSetting = structuredClone(SETTING);
    (noThumbSetting.sources[1] as { thumbnail: string | null }).thumbnail =
      null;
    const noThumb = await mountUi(undefined, noThumbSetting);
    press(noThumb, "help");
    expect(
      part(noThumb, "help-body").querySelector(".help-figure .help-phone-map")
    ).toBeNull();
  });
});
