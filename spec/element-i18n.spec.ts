// @vitest-environment jsdom
// <maplat-ui> の全言語化（src/element/i18n.ts）の単体テスト。@maplat/core/conformance の模擬の層 A の上で、
// 旧 UI の assets/locales/<lng>/translation.json が言語ごとに読まれ、キーの合成が旧 UI と同じになることを確かめる。
import { describe, it, expect, afterEach, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { defineMockMaplatApp } from "@maplat/core/conformance";
import { MAPLAT_UI_TAG } from "@maplat/core/common";
import { defineMaplatUi, type MaplatUiElement } from "../src/element";

defineMockMaplatApp();
defineMaplatUi();

/** 旧 UI の 11 言語（assets/locales のディレクトリ）。 */
const LANGS = [
  "de",
  "en",
  "es",
  "fr",
  "id",
  "ja",
  "ko",
  "th",
  "vi",
  "zh",
  "zh-TW"
];

const SETTING = {
  appName: "Test App",
  lang: "en",
  homePosition: [139.7, 35.7],
  defaultZoom: 14,
  sources: [{ mapID: "osm", label: "OSM", isBasemap: true }],
  pois: []
};

type Ui = MaplatUiElement & HTMLElement;

function shadow(ui: Ui) {
  return ui.shadowRoot!;
}
function part(ui: Ui, name: string) {
  return shadow(ui).querySelector(`[part~="${name}"]`) as HTMLElement;
}

/** 旧 UI の言語ファイルを平らなキー（control.home 等）にする。 */
function locale(lang: string): Record<string, string> {
  const raw = JSON.parse(
    readFileSync(
      resolve(__dirname, `../assets/locales/${lang}/translation.json`),
      "utf-8"
    )
  ) as Record<string, unknown>;
  const out: Record<string, string> = {};
  const walk = (value: unknown, prefix: string) => {
    if (value == null || typeof value !== "object") return;
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>
    )) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (child != null && typeof child === "object") walk(child, path);
      else if (typeof child === "string") out[path] = child;
    }
  };
  walk(raw, "");
  return out;
}

/** <maplat-ui> を作って繋ぐ（子は UI が作る）。 */
async function mountUi(setup?: (ui: Ui) => void): Promise<Ui> {
  const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
  ui.setting = structuredClone(SETTING);
  setup?.(ui);
  document.body.appendChild(ui);
  await ui.ready;
  return ui;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("11 言語の言語ファイル", () => {
  it.each(LANGS)(
    "%s は control.home 等が旧 UI の言語ファイルの訳になる",
    async lang => {
      const ui = await mountUi(u => u.setAttribute("lang", lang));
      const dict = locale(lang);
      expect(ui.currentLang).toBe(lang);
      for (const key of [
        "control.home",
        "control.help",
        "html.share_title",
        "html.help_title",
        "app.copy_toast"
      ])
        expect(ui.t(key), `${lang}: ${key}`).toBe(dict[key]);
    }
  );

  it("代表の訳（言語ファイルの中身そのもの）を返す", async () => {
    const de = await mountUi(u => u.setAttribute("lang", "de"));
    expect(de.t("control.home")).toBe("Zur Startposition");
    expect(de.t("app.copy_toast")).toBe("In die Zwischenablage kopiert");
    const es = await mountUi(u => u.setAttribute("lang", "es"));
    expect(es.t("control.home")).toBe("Volver a la posición inicial");
    const ko = await mountUi(u => u.setAttribute("lang", "ko"));
    expect(ko.t("control.home")).toBe("홈 위치로 이동");
    const viLang = await mountUi(u => u.setAttribute("lang", "vi"));
    expect(viLang.t("control.home")).toBe("Về vị trí chính");
  });
});

describe("言語の選び方（旧 UI の i18nLoader と同じ）", () => {
  it("zh-hk と zh-hant は zh-TW に寄せる", async () => {
    for (const lang of ["zh-hk", "zh-hant"]) {
      const ui = await mountUi(u => u.setAttribute("lang", lang));
      expect(ui.currentLang).toBe("zh-TW");
      expect(ui.t("control.home")).toBe("回到起始位置");
      expect(ui.t("app.copy_toast")).toBe("已複製到剪貼簿");
    }
  });

  it("無い言語は en に落ちる（言語ファイルの en と内蔵の en）", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "pt"));
    expect(ui.currentLang).toBe("pt");
    expect(ui.t("control.home")).toBe("Go Home Position");
    expect(ui.t("app.copy_toast")).toBe("Copied to clipboard");
    // 言語ファイルに無いキーは内蔵の en
    expect(ui.t("control.zoom_in")).toBe("Zoom in");
  });

  it("言語の基底にも落ちる（en-US は en、de-DE は de）", async () => {
    const en = await mountUi(u => u.setAttribute("lang", "en-US"));
    expect(en.t("control.home")).toBe("Go Home Position");
    const de = await mountUi(u => u.setAttribute("lang", "de-DE"));
    expect(de.t("control.home")).toBe("Zur Startposition");
  });
});

describe("内蔵の辞書と旧 UI の言語ファイルの合成", () => {
  it("言語ファイルにあるキーは、内蔵の辞書と食い違っても言語ファイルが正", async () => {
    const ja = await mountUi(u => u.setAttribute("lang", "ja"));
    // 内蔵の ja は ${plus.png} ${minus.png}。旧 UI の ja は <img src='${plus.png}'> の囲み。
    expect(ja.t("html.help_operation_content")).toContain(
      "<img src='${plus.png}'> <img src='${minus.png}'>ボタン"
    );
    expect(ja.t("html.help_operation_content")).not.toContain(
      "${plus.png} ${minus.png}"
    );
    const en = await mountUi(u => u.setAttribute("lang", "en"));
    expect(en.t("html.help_operation_content")).toContain(
      "<img src='${plus.png}'> <img src='${minus.png}'> buttons"
    );
    // 言語ファイルにしか無いキー（今の画面では使わないもの）も引ける
    expect(ja.t("control.zoom")).toBe("地図ズーム変更");
    expect(ja.t("app.acquiring_gps_desc")).toBe("GPSデータ取得中です。");
  });

  it("内蔵の辞書にしか無いキーは ja・en は内蔵、ほかの 9 言語はその言語の訳", async () => {
    const ja = await mountUi(u => u.setAttribute("lang", "ja"));
    expect(ja.t("control.zoom_in")).toBe("拡大");
    expect(ja.t("control.zoom_out")).toBe("縮小");
    expect(ja.t("menu.base_maps")).toBe("背景地図");
    expect(ja.t("html.share_qr")).toBe("QR コード");
    const en = await mountUi(u => u.setAttribute("lang", "en"));
    expect(en.t("control.zoom_in")).toBe("Zoom in");
    expect(en.t("menu.overlay_maps")).toBe("Old maps / overlays");
    // 内蔵の辞書にしか無い 8 キー
    const builtinOnly: Record<string, string> = {
      "control.zoom_in": "Zoom in",
      "control.zoom_out": "Zoom out",
      "control.compass_north": "Turn North Up",
      "control.map_menu": "Switch maps",
      "menu.base_maps": "Base maps",
      "menu.overlay_maps": "Old maps / overlays",
      "menu.poi_candidates": "Choose a spot",
      "html.share_qr": "QR code"
    };
    for (const lang of LANGS.filter(l => l !== "ja" && l !== "en")) {
      const ui = await mountUi(u => u.setAttribute("lang", lang));
      for (const [key, english] of Object.entries(builtinOnly))
        expect(ui.t(key), `${lang}: ${key}`).not.toBe(english);
    }
    // 代表（言語ファイルの近いキーの用語に合わせた訳）
    const de = await mountUi(u => u.setAttribute("lang", "de"));
    expect(de.t("control.zoom_in")).toBe("Vergrößern");
    expect(de.t("control.compass_north")).toBe("Norden nach oben drehen");
    expect(de.t("menu.base_maps")).toBe("Basiskarten");
    expect(de.t("html.share_qr")).toBe("QR-Code");
    const fr = await mountUi(u => u.setAttribute("lang", "fr"));
    expect(fr.t("control.zoom_in")).toBe("Zoom avant");
    expect(fr.t("menu.overlay_maps")).toBe(
      "Cartes historiques / superpositions"
    );
    expect(fr.t("html.share_qr")).toBe("Code QR");
    const zhTW = await mountUi(u => u.setAttribute("lang", "zh-TW"));
    expect(zhTW.t("control.zoom_in")).toBe("放大");
    expect(zhTW.t("control.compass_north")).toBe("北方朝上");
    expect(zhTW.t("html.share_qr")).toBe("QR 碼");
  });

  it("旧 UI の <img src='${...}'> の囲みは、ヘルプのアイコンに置き換わる", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "ja"));
    part(ui, "help").querySelector("button")!.click();
    const body = part(ui, "help-body");
    const text = body.textContent ?? "";
    expect(text).not.toContain("${");
    expect(text).not.toContain("<img");
    expect(body.querySelectorAll(".help-icon").length).toBeGreaterThan(0);
    expect(body.querySelector(".help-key")!.textContent).toBe("+");
  });
});

// 層 B の上書き（<maplat-ui> の画面の作りが旧 UI と違うために意味が変わった文言）。旧 UI の言語ファイルより
// 後に重なる。
describe("層 B の上書き（画面の作りが旧 UI と違う文言）", () => {
  /** 言語 → [層 B の文言にだけ出る語, 旧 UI の言語ファイルにだけ出る語]。 */
  const SELECTION: Record<string, [string, string]> = {
    ja: ["画面上の地図名のボタン", "サムネイル付き"],
    en: ["at the top of the screen", "sliders with thumbnail"],
    de: ["Kartennamen oben auf dem Bildschirm", "Schieberegler"],
    es: ["nombre del mapa en la parte superior", "controles deslizantes"],
    fr: ["nom de la carte en haut de l'écran", "curseurs"],
    id: ["nama peta di bagian atas layar", "penggeser"],
    ko: ["지도 이름 버튼", "슬라이더"],
    th: ["ปุ่มชื่อแผนที่", "แถบเลื่อน"],
    vi: ["nút tên bản đồ", "thanh trượt"],
    zh: ["地图名按钮", "缩略图"],
    "zh-TW": ["地圖名稱按鈕", "縮圖"]
  };

  /** 言語 → [除く一文, 残る一文（パソコン・スマホの切り替え）]。 */
  const BORDER: Record<string, [string, string]> = {
    ja: ["境界の内側をクリック", "パソコンではマウスオーバーで地図を選び"],
    en: ["clicking inside the boundary", "select a map with a mouse over"],
    de: ["innerhalb der Grenze", "wählen Sie eine Karte mit der Maus aus"],
    es: ["dentro de un límite", "seleccione un mapa pasando el ratón"],
    fr: [
      "à l'intérieur d'une limite",
      "sélectionnez une carte en la survolant"
    ],
    id: ["bagian dalam batas", "pilih peta dengan mengarahkan mouse"],
    ko: ["경계 안쪽을 클릭", "마우스 오버로 지도를 선택합니다"],
    th: ["ภายในขอบเขต", "เลื่อนเมาส์ไปเลือกแผนที่แล้วคลิก"],
    vi: ["bên trong đường biên", "chọn bản đồ bằng cách di chuột"],
    zh: ["在边界内点击", "可以用鼠标在地图上上移动选择"],
    "zh-TW": ["邊界內側", "以滑鼠移到想看的地圖上並點擊切換"]
  };

  it("html.help_selection_content は 11 言語とも層 B の文言（上の中央の地図名のボタンで開くメニュー）", async () => {
    expect(Object.keys(SELECTION).sort()).toEqual([...LANGS].sort());
    for (const lang of LANGS) {
      const ui = await mountUi(u => u.setAttribute("lang", lang));
      const text = ui.t("html.help_selection_content");
      expect(text, lang).toContain(SELECTION[lang][0]);
      expect(text, lang).not.toContain(SELECTION[lang][1]);
    }
  });

  it("html.help_etc_border は 11 言語とも「境界の内側をクリックして切り替える」を除いた文言", async () => {
    expect(Object.keys(BORDER).sort()).toEqual([...LANGS].sort());
    for (const lang of LANGS) {
      const ui = await mountUi(u => u.setAttribute("lang", lang));
      const text = ui.t("html.help_etc_border");
      expect(text, lang).toContain("<img src='${border.png}'>");
      expect(text, lang).not.toContain(BORDER[lang][0]);
      expect(text, lang).toContain(BORDER[lang][1]);
    }
    // 画面のヘルプにも、その一文は出ない（ja）
    const ja = await mountUi(u => {
      u.setAttribute("lang", "ja");
      u.enableBorder = true;
    });
    part(ja, "help").querySelector("button")!.click();
    const body = part(ja, "help-body");
    expect(body.textContent).not.toContain("境界の内側をクリック");
    expect(body.textContent).toContain("地図の境界を表示します");
  });
});

describe("読み込みと描画の順序", () => {
  it("読み込み中に言語を切り替えても、最後の言語で描かれる", async () => {
    const ui = document.createElement(MAPLAT_UI_TAG) as Ui;
    ui.setting = structuredClone(SETTING);
    // 1 回目の読み込み（de）が終わる前に fr へ切り替える
    ui.setAttribute("lang", "de");
    ui.setAttribute("lang", "fr");
    document.body.appendChild(ui);
    await ui.ready;
    expect(ui.t("control.home")).toBe("Revenir à la position d'accueil");
    expect(part(ui, "home").querySelector("button")!.title).toBe(
      "Revenir à la position d'accueil"
    );
  });

  it("ready の時点で言語ファイルを読み終えている", async () => {
    const ui = await mountUi(u => u.setAttribute("lang", "ko"));
    expect(ui.t("control.home")).toBe("홈 위치로 이동");
    expect(part(ui, "home").querySelector("button")!.title).toBe(
      "홈 위치로 이동"
    );
  });
});
