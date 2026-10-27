// <maplat-ui> の依存の規則（層 A の公開面だけを使う）の機械検査。
//   <maplat-ui> の入口（src/element/index.ts）から相対 import を再帰でたどり、
//   1. 外部のパッケージは @maplat/core/common と @c4h/quyuan（POI のメディアの表示部品。Chuci を同梱し、
//      Chuci は Quyuan の内側に隠す ∴ @c4h/chuci を直接 import すると赤）と qrcode（共有の QR の符号化）だけ
//      （@maplat/core の本体・@maplat/core/element・ほかの層 A の実装のパッケージ・OpenLayers・
//      Weiwudi 等の @c4h のほかのパッケージを含まない。パッケージの中の深いパスも許さない）。@c4h/quyuan と
//      qrcode は動的 import だけで読み（要素の読み込みで読まない）、それ自身も地図・層 A に依らない
//      （package.json の依存で確かめる。Quyuan の optional peer の @c4h/chuci は許す）
//   2. 旧 UI のうち @maplat/core・OpenLayers に触れるファイル（index.ts・ui_init.ts・maplat_control.ts 等）を含まない
//   3. ソースに層 A の内部（mapObject・cacheHash・from 等）への参照が無い
// 方式は MaplatCore の spec/common-entry.spec.ts と同じ（型だけの import・動的 import も数える）。
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";

const ROOT = resolve(__dirname, "..");
const ENTRY = "src/element/index.ts";
const ALLOWED_EXTERNAL = new Set([
  "@maplat/core/common",
  "@c4h/quyuan",
  "qrcode"
]);
/** 動的 import でしか読まないもの（静的な import・副作用 import を禁じる）。 */
const DYNAMIC_ONLY = new Set(["@c4h/quyuan", "qrcode"]);
/** 許した外部のパッケージが依ってはならないもの（地図・層 A・地図ライブラリ）。Quyuan の optional peer の Chuci は許す。 */
const FORBIDDEN_TRANSITIVE =
  /^(@maplat\/|ol$|ol-|maplibre-gl$|mapbox-gl$|@c4h\/(?!(?:chuci|quyuan)$)|@turf\/)/;
/** 層 A の内部（旧クラスのフィールド・試作の逃げ道）への参照。 */
const INTERNAL =
  /\.(mapObject|cacheHash|mapDivDocument|stateBuffer|waitReady)\b|(?<!Array)\.from\b|\bapp\.app\b|\.core\b/;
const FORBIDDEN =
  /^(@maplat\/core(\/(element|dist\/.*))?$|ol(\/|$)|maplibre-gl|mapbox-gl|@c4h\/(?!quyuan$)|@turf\/|i18next|bootstrap)/;

/** コメントを除いたソース（コメント内の import の例は数えない）。 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** 入口から相対 import をたどり、[ファイル, 外部の import 先] を集める。 */
function walk(entry: string) {
  const files = new Set<string>();
  const external = new Map<string, Set<string>>();
  // 静的な import（型だけの import・副作用 import を含む）で読む外部のパッケージ
  const staticExternal = new Set<string>();
  const stack = [resolve(ROOT, entry)];
  while (stack.length) {
    const file = stack.pop()!;
    if (files.has(file)) continue;
    files.add(file);
    if (!/\.(ts|js)$/.test(file)) continue;
    const src = stripComments(readFileSync(file, "utf-8"));
    const staticSpecs = [
      // import … from "x" / export … from "x"（型だけの import を含む）
      ...[
        ...src.matchAll(/(?:import|export)\s[^;]*?from\s*["']([^"']+)["']/g)
      ].map(m => m[1]),
      // import "x"（副作用だけの import）
      ...[...src.matchAll(/import\s*["']([^"']+)["']/g)].map(m => m[1])
    ];
    for (const spec of staticSpecs)
      if (!spec.startsWith(".")) staticExternal.add(spec);
    const specs = [
      ...staticSpecs,
      // import("x")（動的 import）・require("x")
      ...[
        ...src.matchAll(/(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g)
      ].map(m => m[1])
    ];
    for (const spec of specs) {
      if (spec.startsWith(".")) {
        const base = resolve(dirname(file), spec);
        const hit = [base, `${base}.ts`, `${base}/index.ts`].find(
          c => existsSync(c) && /\.(ts|js|json|css|scss|png|jpg|svg)$/.test(c)
        );
        if (!hit) throw new Error(`cannot resolve ${spec} from ${file}`);
        stack.push(hit);
      } else {
        if (!external.has(spec)) external.set(spec, new Set());
        external.get(spec)!.add(file.replace(`${ROOT}/`, ""));
      }
    }
  }
  return {
    files: [...files].map(f => f.replace(`${ROOT}/`, "")).sort(),
    external,
    staticExternal
  };
}

describe("<maplat-ui> は <maplat-app> の公開面と @maplat/core/common だけに依る", () => {
  const { files, external, staticExternal } = walk(ENTRY);

  it("外部の import は @maplat/core/common と @c4h/quyuan と qrcode だけ", () => {
    const bad = [...external.keys()].filter(
      s => !ALLOWED_EXTERNAL.has(s) || FORBIDDEN.test(s)
    );
    expect(
      bad,
      `forbidden imports: ${bad.map(b => `${b} ← ${[...external.get(b)!]}`).join(", ")}`
    ).toEqual([]);
    expect([...external.keys()].sort()).toEqual([
      "@c4h/quyuan",
      "@maplat/core/common",
      "qrcode"
    ]);
  });

  it("@c4h/quyuan と qrcode は動的 import だけで読む（要素の読み込みで表示部品・QR の符号化を読まない）", () => {
    for (const spec of DYNAMIC_ONLY) {
      expect(staticExternal.has(spec), `${spec} is imported statically`).toBe(
        false
      );
    }
  });

  it("許した外部のパッケージ（@c4h/quyuan・qrcode）は地図・層 A・地図ライブラリに依らない", () => {
    for (const name of [...ALLOWED_EXTERNAL].filter(
      n => !n.startsWith("@maplat/core/")
    )) {
      const pkg = JSON.parse(
        readFileSync(
          resolve(ROOT, "node_modules", name, "package.json"),
          "utf-8"
        )
      );
      const deps = Object.keys({
        ...(pkg.dependencies ?? {}),
        ...(pkg.peerDependencies ?? {}),
        ...(pkg.optionalDependencies ?? {})
      });
      const bad = deps.filter(d => FORBIDDEN_TRANSITIVE.test(d));
      expect(bad, `${name} depends on ${bad.join(", ")}`).toEqual([]);
    }
  });

  it("qrcode はブラウザでは lib/browser.js（符号化と描画だけ）に解決される（サーバー向けの依存 yargs・fs を読まない）", () => {
    const pkg = JSON.parse(
      readFileSync(
        resolve(ROOT, "node_modules", "qrcode", "package.json"),
        "utf-8"
      )
    );
    expect(pkg.browser?.["./lib/index.js"]).toBe("./lib/browser.js");
    expect(pkg.browser?.fs).toBe(false);
    const browser = stripComments(
      readFileSync(
        resolve(ROOT, "node_modules", "qrcode", "lib", "browser.js"),
        "utf-8"
      )
    );
    const required = [...browser.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)]
      .map(m => m[1])
      .filter(spec => !spec.startsWith("."));
    expect(required).toEqual([]);
  });

  it("たどるファイルの一覧（意図しない連鎖の増加に気づくため）", () => {
    expect(files).toEqual([
      "assets/locales/de/translation.json",
      "assets/locales/en/translation.json",
      "assets/locales/es/translation.json",
      "assets/locales/fr/translation.json",
      "assets/locales/id/translation.json",
      "assets/locales/ja/translation.json",
      "assets/locales/ko/translation.json",
      "assets/locales/th/translation.json",
      "assets/locales/vi/translation.json",
      "assets/locales/zh-TW/translation.json",
      "assets/locales/zh/translation.json",
      "assets/parts/Maplat.png",
      "assets/parts/all_right_reserved.png",
      "assets/parts/attr.png",
      "assets/parts/cc0.png",
      "assets/parts/cc_by-nc-nd.png",
      "assets/parts/cc_by-nc-sa.png",
      "assets/parts/cc_by-nc.png",
      "assets/parts/cc_by-nd.png",
      "assets/parts/cc_by-sa.png",
      "assets/parts/cc_by.png",
      "assets/parts/odbl.png",
      "assets/parts/pd.png",
      "src/absolute_url.ts",
      "src/browserlanguage.ts",
      "src/element/i18n.ts",
      "src/element/index.ts",
      "src/element/license_images.ts",
      "src/element/maplat-ui.ts",
      "src/element/poi-html.ts",
      "src/element/pwa.ts",
      "src/element/share.ts",
      "src/element/slider.ts",
      "src/element/state-url.ts",
      "src/element/styles.ts",
      "src/icons.ts",
      "src/poi_safe.ts",
      "src/shared/geo.ts",
      "src/shared/text.ts"
    ]);
  });

  it("旧 UI の @maplat/core・OpenLayers に触れるファイルを含まない", () => {
    for (const f of files) {
      expect(f).not.toMatch(
        /^src\/(index|ui_init|ui_marker|ui_utils|maplat_control|pointer_images|function|pwa_init|contextmenu|swiper_ex|swiper_loop)\.ts$/
      );
    }
  });

  it("ソースに層 A の内部（mapObject・cacheHash・from・mapDivDocument・stateBuffer・試作の逃げ道 app.app）への参照が無い", () => {
    for (const f of files.filter(f => f.startsWith("src/element/"))) {
      const src = stripComments(readFileSync(resolve(ROOT, f), "utf-8"));
      const hits = src.split("\n").filter(line => INTERNAL.test(line));
      expect(hits, `${f}: ${hits.join(" | ")}`).toEqual([]);
    }
  });

  it("検査そのものが禁止の import を見つけられる（自己検査）", () => {
    expect(FORBIDDEN.test("@maplat/core")).toBe(true);
    expect(FORBIDDEN.test("@maplat/core/element")).toBe(true);
    expect(FORBIDDEN.test("@maplat/core/dist/functions")).toBe(true);
    expect(FORBIDDEN.test("ol")).toBe(true);
    expect(FORBIDDEN.test("ol/control")).toBe(true);
    expect(FORBIDDEN.test("@maplat/core/common")).toBe(false);
    // UI が読むのは Quyuan だけ（Chuci は Quyuan の内側）。Chuci を直接 import すると赤
    expect(FORBIDDEN.test("@c4h/chuci")).toBe(true);
    expect(FORBIDDEN.test("@c4h/quyuan")).toBe(false);
    expect(FORBIDDEN.test("@c4h/quyuan/template")).toBe(true);
    expect(FORBIDDEN_TRANSITIVE.test("@c4h/chuci")).toBe(false);
    expect(FORBIDDEN.test("qrcode")).toBe(false);
    // 許すのはパッケージの入口だけ（qrcode の server 側の深いパス等は許さない）
    expect(ALLOWED_EXTERNAL.has("qrcode/lib/server.js")).toBe(false);
    expect(FORBIDDEN_TRANSITIVE.test("dijkstrajs")).toBe(false);
    expect(FORBIDDEN_TRANSITIVE.test("@c4h/weiwudi")).toBe(true);
    expect(FORBIDDEN.test("@c4h/weiwudi")).toBe(true);
    expect(FORBIDDEN.test("@c4h/chuci/dist/chuci.js")).toBe(true);
    expect(FORBIDDEN_TRANSITIVE.test("ol")).toBe(true);
    expect(FORBIDDEN_TRANSITIVE.test("@maplat/core")).toBe(true);
    expect(FORBIDDEN_TRANSITIVE.test("swiper")).toBe(false);
    expect(FORBIDDEN_TRANSITIVE.test("three")).toBe(false);
    expect(INTERNAL.test("ui.app.mapObject.getView()")).toBe(true);
    expect(INTERNAL.test("core.from.mapID")).toBe(true);
    expect(INTERNAL.test("Array.from(list)")).toBe(false);
    // 旧 UI の入口からたどると @maplat/core と ol が見つかる（たどり方が働いていることの確認）。
    // 旧 UI の実装（src/index.legacy.ts 等）を消したので、たどり方の確認は互換層の入口で行う。
    // 互換層は層 A の公開面（@maplat/core/common）と `ol/events/Target.js` だけを読む。
    const legacy = walk("src/legacy/maplat_ui_compat.ts");
    expect([...legacy.external.keys()]).toEqual(
      expect.arrayContaining(["@maplat/core/common", "ol/events/Target.js"])
    );
    expect([...legacy.external.keys()]).not.toContain("ol/control");
    // 消えた旧 UI のファイルは、たどった先にもう無い
    expect(
      legacy.files.filter(f =>
        /^src\/(index\.legacy|ui_init|ui_marker|ui_utils|maplat_control|function|pwa_init|contextmenu|swiper_ex|swiper_loop)\.ts$/.test(
          f
        )
      )
    ).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 地図切替スライダー（`src/element/slider.ts`）の依存の規則。
//
// 上の再帰（`src/element/index.ts` の入口）とは**別に**たどる。最初の版ではスライダーを
// `src/element/index.ts` から出さない（画面に配線しない）ので、入口の一覧（`files`）を
// 変えずに、スライダー自身の依存だけを固定する。
describe("地図切替スライダーは層 A と地図ライブラリ（ol・swiper）に依らない", () => {
  const SLIDER_ENTRY = "src/element/slider.ts";
  const { files: sliderFiles, external: sliderExternal } = walk(SLIDER_ENTRY);
  /** スライダーが読んでよい外部（`Localized` の型だけ） */
  const SLIDER_ALLOWED_EXTERNAL = new Set(["@maplat/core/common"]);
  /** 旧 UI・地図ライブラリ・スワイパー（どれも読んではならない） */
  const SLIDER_FORBIDDEN =
    /^(ol(\/|$)|swiper(\/|$)|swiper-|maplibre-gl|mapbox-gl|@c4h\/|@turf\/|i18next|bootstrap|@maplat\/(?!core\/common$))/;

  it("外部の import は @maplat/core/common だけ", () => {
    const bad = [...sliderExternal.keys()].filter(
      s => !SLIDER_ALLOWED_EXTERNAL.has(s) || SLIDER_FORBIDDEN.test(s)
    );
    expect(
      bad,
      `forbidden imports: ${bad
        .map(b => `${b} ← ${[...sliderExternal.get(b)!].join(",")}`)
        .join(", ")}`
    ).toEqual([]);
    expect([...sliderExternal.keys()].sort()).toEqual(["@maplat/core/common"]);
  });

  it("検査そのものが ol・swiper・旧 UI の import を見つけられる（自己検査）", () => {
    expect(SLIDER_FORBIDDEN.test("ol")).toBe(true);
    expect(SLIDER_FORBIDDEN.test("ol/control")).toBe(true);
    expect(SLIDER_FORBIDDEN.test("swiper")).toBe(true);
    expect(SLIDER_FORBIDDEN.test("swiper/modules")).toBe(true);
    expect(SLIDER_FORBIDDEN.test("@maplat/core")).toBe(true);
    expect(SLIDER_FORBIDDEN.test("@maplat/core/dist/functions")).toBe(true);
    expect(SLIDER_FORBIDDEN.test("@maplat/core/common")).toBe(false);
  });

  it("旧 UI（src/index.ts・src/ui_init.ts・src/legacy）を読まない", () => {
    const legacy = sliderFiles.filter(f =>
      /^src\/(index|ui_init|ui_marker|maplat_control|function|ui_utils)\.ts$|^src\/legacy\//.test(
        f
      )
    );
    expect(legacy).toEqual([]);
  });

  it("ソースに ol・swiper・層 A の内部への参照が無い", () => {
    // 旧: 「`from ol…`」と「`require(ol…)`」を AND で重ねていたので、**常に空配列**になり
    // 検査が空回りしていた。OR にし、名前どおり「層 A の内部」（`INTERNAL`）も見る。
    const IMPORT_LINE =
      /\bfrom\s*["'](ol|swiper)[^"']*["']|require\(\s*["'](ol|swiper)/;
    // 検査そのものが働くこと（自己検査）
    expect(IMPORT_LINE.test(`import Map from "ol/Map"`)).toBe(true);
    expect(IMPORT_LINE.test(`const m = require("swiper")`)).toBe(true);
    expect(
      IMPORT_LINE.test(`import type { Localized } from "@maplat/core/common"`)
    ).toBe(false);
    for (const f of sliderFiles.filter(f => f.startsWith("src/"))) {
      const src = stripComments(readFileSync(resolve(ROOT, f), "utf-8"));
      const hits = src
        .split("\n")
        .filter(line => IMPORT_LINE.test(line) || INTERNAL.test(line));
      expect(hits, `${f}: ${hits.join(" | ")}`).toEqual([]);
    }
  });

  it("たどるファイルの一覧（意図しない連鎖の増加に気づくため）", () => {
    expect(sliderFiles).toEqual([
      "src/element/slider.ts",
      "src/poi_safe.ts",
      "src/shared/text.ts"
    ]);
  });
});
