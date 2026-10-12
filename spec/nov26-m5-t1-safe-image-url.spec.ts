// @vitest-environment jsdom
//
// nov26-m5-t1: 地図切り替えスワイパーのスライド（NayutaProducts#28 B-UI-4）と
// 画像の URL の許可リスト（safeImageUrl。Maplat#274 の受け口でも使う）の単体テスト。
//
// - AC3（単体分）: mapID の属性注入を断つ
// - AC4: thumbnail の注入・不正スキーム・継承キーを断つ
// - AC5 (a): 同梱サンプルの全値で、旧テンプレートの写しと文字列として完全一致する（外観を変えない）
// - AC6 (a): safeImageUrl の通す／通さない
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { safeImageUrl, swiperThumbUrl, swiperSlideHtml } from "../src/poi_safe";

function parse(html: string): HTMLElement {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.firstElementChild as HTMLElement;
}

// 変更前（26fbb36a）の src/ui_init.ts:524-527（base）・537-540（overlay）のテンプレートをそのまま写したもの。
// base は colorCss が ""、overlay は envelope のとき " " + envelopeColor。
function legacySlide(
  mapID: string,
  thumbUrl: string,
  label: string,
  colorCss: string
) {
  return (
    `<div class="swiper-slide${colorCss}" data="${mapID}">` +
    `<img crossorigin="anonymous" src="${
      thumbUrl
    }"><div> ${label}</div> </div> `
  );
}

describe("safeImageUrl（AC6 (a)）", () => {
  const PASS = [
    "x.png",
    "./x.png",
    "/x.png",
    "https://a/b.png",
    "http://a/b.png",
    "data:image/png;base64,AA",
    " DATA:image/svg+xml,<svg/>"
  ];
  const REJECT: unknown[] = [
    "javascript:alert(1)",
    "JaVaScRiPt:x",
    "\tjavascript:x",
    "data:text/html,x",
    "data:,x",
    "vbscript:x",
    "",
    null,
    undefined,
    123,
    {}
  ];

  it.each(PASS)("通す: %j（戻り値は引数そのもの）", value => {
    expect(safeImageUrl(value)).toBe(value);
  });

  it.each(REJECT)("通さない: %j", value => {
    expect(safeImageUrl(value)).toBeUndefined();
  });
});

describe("swiperThumbUrl（AC4）", () => {
  const NOIMG = "NOIMG";
  const images: Record<string, unknown> = {
    "osm.jpg": "data:image/jpeg;base64,OSM"
  };

  it.each([
    "javascript:alert(1)",
    "data:text/html,x",
    undefined,
    "",
    123
  ] as unknown[])("fallback になる: %j", value => {
    expect(swiperThumbUrl(value, images, NOIMG)).toBe(NOIMG);
  });

  // 継承キー（r1 INFO-2）: images の継承プロパティ（Object.prototype の値・関数）を使わない。
  // 設計 §3.1 の手順どおり、自身のキーでなければ thumbnail そのもの（相対 URL として safeImageUrl を通る）を使う。
  // 旧式 `pointer[key] || thumbnail` では "x/__proto__" が Object.prototype を返し src="[object Object]" になっていた。
  it.each(["x/__proto__", "x/constructor", "x/toString", "x/hasOwnProperty"])(
    "継承キー %j は images の継承値を使わず thumbnail の文字列になる",
    value => {
      const r = swiperThumbUrl(value, images, NOIMG);
      expect(typeof r).toBe("string");
      expect(r).toBe(value);
    }
  );

  it("継承キーで images に値があっても、自身のキーでなければ使わない", () => {
    const inherited = Object.create({
      "a.png": "data:image/png;base64,INHERITED"
    });
    expect(swiperThumbUrl("./tmbs/a.png", inherited, NOIMG)).toBe(
      "./tmbs/a.png"
    );
  });

  it("images の値が文字列でなければ使わない", () => {
    expect(swiperThumbUrl("./tmbs/b.png", { "b.png": 1 }, NOIMG)).toBe(
      "./tmbs/b.png"
    );
    expect(swiperThumbUrl("javascript:x/b.png", { "b.png": 1 }, NOIMG)).toBe(
      NOIMG
    );
  });

  it("images の自身のキーならその値", () => {
    expect(swiperThumbUrl("./tmbs/osm.jpg", images, NOIMG)).toBe(
      "data:image/jpeg;base64,OSM"
    );
    expect(swiperThumbUrl("osm.jpg", images, NOIMG)).toBe(
      "data:image/jpeg;base64,OSM"
    );
  });

  it.each([
    "data:image/jpeg;base64,/9j/AA",
    "./tmbs/a_menu.jpg",
    "https://a/b.jpg"
  ])("そのまま: %j", value => {
    expect(swiperThumbUrl(value, images, NOIMG)).toBe(value);
  });

  it('" onerror="x は相対 URL として通るが、実体参照化で属性注入にならない', () => {
    const value = '" onerror="x';
    const thumb = swiperThumbUrl(value, images, NOIMG);
    expect(thumb).toBe(value);
    const slide = parse(swiperSlideHtml("m", thumb, "L"));
    const img = slide.querySelector("img") as HTMLImageElement;
    expect(img.attributes.length).toBe(2);
    expect(img.hasAttribute("crossorigin")).toBe(true);
    expect(img.getAttribute("src")).toBe(value);
    expect(img.hasAttribute("onerror")).toBe(false);
  });
});

describe("swiperSlideHtml（AC3・AC2 の単体分）", () => {
  it("mapID の属性注入: 属性は class・data の 2 つだけで data は元の文字列", () => {
    const M = 'm5t1" onmouseover="window.__nov26m5t1m=1';
    const slide = parse(swiperSlideHtml(M, "x.png", "L"));
    expect(slide.attributes.length).toBe(2);
    expect(slide.getAttribute("class")).toBe("swiper-slide");
    expect(slide.getAttribute("data")).toBe(M);
  });

  it("label の HTML はタグにならず文字のまま", () => {
    const P = "<img src=x onerror=window.__nov26m5t1=1>";
    const slide = parse(swiperSlideHtml("m", "x.png", P));
    expect(slide.querySelectorAll("img").length).toBe(1);
    expect(slide.querySelector("img[onerror]")).toBeNull();
    expect((slide.querySelector("div") as HTMLElement).textContent).toBe(
      ` ${P}`
    );
  });

  it("extraClass は空白で区切ってクラスに足す", () => {
    const slide = parse(swiperSlideHtml("m", "x.png", "L", "royalblue"));
    expect(slide.getAttribute("class")).toBe("swiper-slide royalblue");
  });
});

describe("外観を変えない（AC5 (a)）: 同梱サンプルの全値で旧テンプレートと完全一致", () => {
  const KEYS = new Set(["label", "mapID", "thumbnail", "title"]);
  const root = resolve(__dirname, "..");
  const files = ["public/apps", "public/maps"].flatMap(dir =>
    readdirSync(resolve(root, dir))
      .filter(f => f.endsWith(".json"))
      .map(f => resolve(root, dir, f))
  );

  // KEYS のキーの値（文字列、または多言語のオブジェクトの各文字列）を全件集める
  const values: string[] = [];
  const collect = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(collect);
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (KEYS.has(k)) {
          if (typeof v === "string") values.push(v);
          else if (v && typeof v === "object" && !Array.isArray(v)) {
            Object.values(v as Record<string, unknown>).forEach(s => {
              if (typeof s === "string") values.push(s);
            });
          }
        }
        collect(v);
      }
    }
  };
  files.forEach(f => collect(JSON.parse(readFileSync(f, "utf8"))));

  const THUMBS = [
    "data:image/png;base64,AA",
    "./tmbs/x_menu.jpg",
    "https://a/b.jpg"
  ];
  const COLORS = ["", "royalblue"];

  it("集めた値が 0 でなく、どの値にも & < > \" ' が無い（あれば外観不変の前提が崩れる）", () => {
    // 実行時の件数を記録に残す
    console.log(
      `[nov26-m5-t1 AC5] files=${files.length} values=${values.length}`
    );
    expect(values.length).toBeGreaterThan(0);
    expect(values.filter(v => /[&<>"']/.test(v))).toEqual([]);
  });

  it("全値 × サムネイル 3 形 × 色 2 形で swiperSlideHtml === legacySlide", () => {
    let n = 0;
    for (const v of values) {
      for (const t of THUMBS) {
        for (const c of COLORS) {
          expect(swiperSlideHtml(v, t, v, c)).toBe(
            legacySlide(v, t, v, c ? ` ${c}` : "")
          );
          n++;
        }
      }
    }
    expect(n).toBe(values.length * THUMBS.length * COLORS.length);
  });
});
