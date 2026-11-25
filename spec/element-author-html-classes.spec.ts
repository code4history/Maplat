// @vitest-environment jsdom
// 地図の作り手が書いた HTML（POI の desc・地図のメタ情報・帰属表記の attr・汎用メニューの text）を
// <maplat-ui> の Shadow DOM に入れるとき、<maplat-ui> 自身の CSS が使う class（予約 class）は
// 付けたままにしない。作り手が自分で付けた、それ以外の class はそのまま残す。
// spec/element.spec.ts と同じく @maplat/core/conformance の模擬の層 A の上で動かす。
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  defineMockMaplatApp,
  getMockLayerAController
} from "@maplat/core/conformance";
import { MAPLAT_UI_TAG } from "@maplat/core/common";
import { type MaplatUiElement, defineMaplatUi } from "../src/element";
import { MAPLAT_UI_CSS } from "../src/element/styles";

defineMockMaplatApp();
defineMaplatUi();

/** <maplat-ui> の CSS が実際に使っている class（この試験が前提にする代表）。 */
const UI_CLASSES = [
  "splash",
  "modal",
  "dialog",
  "frame",
  "header",
  "body",
  "title",
  "close",
  "ctl",
  "sr-only",
  "poi-html",
  "scroll",
  "name",
  "icon"
];

/** 作り手の HTML。予約 class だけの要素・混ざった要素・作り手の class だけの要素・class の無い要素。 */
const AUTHOR_HTML =
  '<a href="https://example.com/" class="splash">only</a>' +
  '<span class="my-note modal  my-accent">mixed</span>' +
  '<span class="my-note my-accent">mine</span>' +
  "<b>plain</b>";

const setting = () => ({
  appName: "Test App",
  lang: "en",
  homePosition: [139.7, 35.7],
  defaultZoom: 14,
  startFrom: "old1",
  sources: [
    {
      mapID: "osm",
      label: "OSM",
      isBasemap: true,
      meta: { attr: AUTHOR_HTML }
    },
    {
      mapID: "old1",
      label: "Old map 1",
      isOldMap: true,
      meta: {
        title: "Old map title",
        author: AUTHOR_HTML,
        attr: AUTHOR_HTML
      }
    }
  ],
  pois: [
    {
      id: "p1",
      namespaceID: "main#p1",
      name: "Castle",
      desc: `${AUTHOR_HTML}\nline2`
    }
  ]
});

type Ui = MaplatUiElement & HTMLElement;

const part = (ui: Ui, name: string) =>
  ui.shadowRoot!.querySelector(`[part~="${name}"]`) as HTMLElement;

async function mountUi(): Promise<Ui> {
  const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
  ui.setting = setting() as any;
  document.body.appendChild(ui);
  await ui.ready;
  return ui;
}

/** 容器の中の要素に残った class の一覧（要素の順）。class 属性の無い要素は null。 */
const classesIn = (holder: Element) =>
  Array.from(holder.querySelectorAll("a, span, b"), el =>
    el.getAttribute("class")
  );

/** 予約 class は落ち、作り手の class と中身はそのまま。 */
function expectAuthorHtml(holder: Element) {
  expect(classesIn(holder)).toEqual([
    null,
    "my-note my-accent",
    "my-note my-accent",
    null
  ]);
  for (const name of UI_CLASSES)
    expect(holder.querySelector(`.${name}`)).toBeNull();
  // class のほかは変えない（文字・リンク・要素の並び）
  expect(
    Array.from(holder.querySelectorAll("a, span, b"), el => el.textContent)
  ).toEqual(["only", "mixed", "mine", "plain"]);
  expect(holder.querySelector("a")!.getAttribute("href")).toBe(
    "https://example.com/"
  );
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("作り手の HTML に <maplat-ui> の予約 class を残さない", () => {
  it("前提: 代表の class は <maplat-ui> の CSS が使っている", () => {
    for (const name of UI_CLASSES) expect(MAPLAT_UI_CSS).toContain(`.${name}`);
    expect(MAPLAT_UI_CSS).not.toContain(".my-note");
    expect(MAPLAT_UI_CSS).not.toContain(".my-accent");
  });

  it("POI の desc（改行の <br> は今までどおり）", async () => {
    const ui = await mountUi();
    const app = ui.app! as any;
    getMockLayerAController(app)!.fire("clickMarkers", [
      app.getMarker("main#p1")
    ]);
    const desc = part(ui, "poi-body").querySelector("p.poi-desc")!;
    expectAuthorHtml(desc);
    expect(desc.innerHTML).toMatch(/<br>line2$/);
    // 容器そのものの class（UI が付けたもの）は残る
    expect(desc.className).toBe("poi-desc");
  });

  it("地図のメタ情報と、古地図の attr の行", async () => {
    const ui = await mountUi();
    part(ui, "info").querySelector("button")!.click();
    expectAuthorHtml(part(ui, "map-meta-author"));
    expectAuthorHtml(part(ui, "map-meta-attr"));
  });

  it("表示中の現代の地図の帰属表記（attr）", async () => {
    const ui = await mountUi();
    await ui.app!.changeMap("osm");
    part(ui, "info").querySelector("button")!.click();
    const item = part(ui, "map-meta-attributions").querySelector(
      ".attribution-item"
    )!;
    expectAuthorHtml(item);
    // 容器そのものの class（UI が付けたもの）は残る
    expect(item.className).toBe("attribution-item");
  });

  it("汎用メニューの text（html: false の項目は文字のまま）", async () => {
    const ui = await mountUi();
    (ui as any).showMenu({
      items: [
        { text: AUTHOR_HTML, callback: () => {} },
        { text: AUTHOR_HTML, html: false, callback: () => {} }
      ]
    });
    const names = part(ui, "poi-menu").querySelectorAll(
      '[part="poi-menu-item"] .name'
    );
    expect(names).toHaveLength(2);
    expectAuthorHtml(names[0]);
    expect(names[1].textContent).toBe(AUTHOR_HTML);
    expect(names[1].children).toHaveLength(0);
  });
});
