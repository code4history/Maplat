// 旧の実装の削除と二重実装の解消の完了（一本化）を機械で確かめる。
//
// 確かめること:
//   1. 旧 UI の実装ファイルが `src/` から消えている（git の履歴には残る）
//   2. 旧 UI の実装を import しているファイルが `src/`・`spec/`・`e2e/`・`demo/`・`scripts/` に無い
//   3. 受け入れ条件の grep:
//      - `swiper` の **import** が 0（`src/legacy/` の旧 API の名前は除く。下の ALLOWED に一覧）
//      - `ol/control` が 0
//      - `bootstrap.native`・`i18next`・`from "page"` が 0（src と package.json）
//   4. `package.json` から消した依存が本当に無い・残す依存（`@c4h/weiwudi` 等）がある
//   5. 同じ画面を描く経路が 1 つだけ: 旧 API のクラスは互換層にだけ在り、互換層は DOM を描かない。
//      画面を描くのは `<maplat-ui>` だけ
//   6. e2e の旧実装の fixture（`legacy-api-old-impl.html`）が無い
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

/** ディレクトリ以下のファイルを集める（拡張子で絞る）。 */
function filesUnder(dir: string, exts: readonly string[]): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const found: string[] = [];
  const walk = (path: string) => {
    for (const name of readdirSync(path)) {
      if (name === "node_modules" || name === "dist" || name === "out")
        continue;
      const child = join(path, name);
      if (statSync(child).isDirectory()) walk(child);
      else if (exts.some(ext => name.endsWith(ext))) found.push(child);
    }
  };
  walk(abs);
  return found;
}

const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

/** ソースから import の specifier を集める（`import x from "y"`・`import "y"`・`import("y")`）。 */
function importSpecifiers(source: string): string[] {
  const found: string[] = [];
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /^\s*import\s+["']([^"']+)["']/gm,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.push(match[1]);
  }
  return found;
}

/** コメントを除いたソース（コメント内の例は数えない）。 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

// ---- 1. 消したファイル ----

const DELETED = [
  "src/index.legacy.ts",
  "src/ui_init.ts",
  "src/ui_marker.ts",
  "src/ui_utils.ts",
  "src/maplat_control.ts",
  "src/swiper_ex.ts",
  "src/swiper_loop.ts",
  "src/swiper_augment.d.ts",
  "src/contextmenu.ts",
  "src/contextmenu/base.ts",
  "src/contextmenu/constants.ts",
  "src/contextmenu/cssVars.ts",
  "src/contextmenu/helpers/dom.ts",
  "src/contextmenu/helpers/mix.ts",
  "src/contextmenu/html.ts",
  "src/contextmenu/internal.ts",
  "src/pwa_init.ts",
  "src/pointer_images.ts",
  "src/function.ts"
] as const;

/** 旧 UI の実装（import してはならない）。`src/legacy/` の `legacy_*` は別物。 */
const OLD_IMPL =
  /(^|\/)(index\.legacy|ui_init|ui_marker|ui_utils|maplat_control|swiper_ex|swiper_loop|swiper_augment|contextmenu|pwa_init|pointer_images|function)(\/|\.|$)/;

describe("一本化: 旧の実装のファイル", () => {
  it("消したファイルがもう無い", () => {
    for (const file of DELETED)
      expect(existsSync(join(ROOT, file)), file).toBe(false);
    // ディレクトリごと消えている
    expect(existsSync(join(ROOT, "src/contextmenu"))).toBe(false);
  });

  it("そのファイルを import しているファイルがもう無い（src・spec・e2e・demo・scripts）", () => {
    const roots: Array<[string, readonly string[]]> = [
      ["src", [".ts", ".js"]],
      ["spec", [".ts"]],
      ["e2e", [".ts", ".js"]],
      ["demo", [".ts", ".js"]],
      ["scripts", [".js", ".mjs", ".ts"]]
    ];
    const bad: string[] = [];
    for (const [dir, exts] of roots) {
      for (const path of filesUnder(dir, exts)) {
        const file = relative(ROOT, path);
        for (const spec of importSpecifiers(read(file))) {
          if (OLD_IMPL.test(spec)) bad.push(`${file} ← ${spec}`);
        }
      }
    }
    expect(bad).toEqual([]);
    // 検査そのものが働くこと（自己検査）
    expect(OLD_IMPL.test("../src/ui_init")).toBe(true);
    expect(OLD_IMPL.test("./index.legacy")).toBe(true);
    expect(OLD_IMPL.test("../src/legacy/legacy_swiper")).toBe(false);
    expect(OLD_IMPL.test("../src/element/slider")).toBe(false);
  });

  it("e2e の旧実装の fixture が無い", () => {
    expect(
      existsSync(join(ROOT, "e2e/fixtures/legacy-api-old-impl.html"))
    ).toBe(false);
    expect(
      existsSync(join(ROOT, "e2e/element/maplat-ui-legacy-side-by-side.pw.ts"))
    ).toBe(false);
    // 生きている e2e のどれも、消した fixture を開かない
    const hits = filesUnder("e2e", [".ts", ".js"]).filter(file =>
      read(relative(ROOT, file)).includes("legacy-api-old-impl")
    );
    // 説明のコメントにだけ残っているのは許す（開く文字列は無い）
    for (const file of hits) {
      const source = read(relative(ROOT, file));
      expect(
        /["'`][^"'`]*legacy-api-old-impl[^"'`]*["'`]/.test(
          source.replace(/^\s*\/\/.*$/gm, "")
        ),
        relative(ROOT, file)
      ).toBe(false);
    }
  });
});

// ---- 2. 受け入れ条件の grep ----

/** `src/legacy/` に残してよい「旧 API の名前」（受け入れ条件の例外）。 */
const ALLOWED_SWIPER_IN_LEGACY = [
  "src/legacy/legacy_swiper.ts",
  "src/legacy/legacy_types.ts",
  "src/legacy/maplat_ui_compat.ts"
];

describe("一本化: 受け入れ条件の grep", () => {
  const srcFiles = filesUnder("src", [".ts", ".js"]);
  const pkgSource = read("package.json");
  const viteSource = existsSync(join(ROOT, "vite.config.js"))
    ? read("vite.config.js")
    : "";

  it("`swiper` の import が 0（src・package.json・vite.config.js）", () => {
    const bad: string[] = [];
    for (const path of srcFiles) {
      const file = relative(ROOT, path);
      // 動的 import の specifier はコメントではないので、コメントを除いてから見る
      for (const spec of importSpecifiers(stripComments(read(file)))) {
        if (/^swiper(\/|$)/.test(spec)) bad.push(`${file} ← ${spec}`);
      }
    }
    expect(bad).toEqual([]);
    // package.json・vite の設定にも名前が無い（依存から消した）
    expect(pkgSource).not.toMatch(/"swiper"/);
    expect(viteSource).not.toContain("swiper");
  });

  it("`swiper` の語が src に残るのは、旧 API の名前と旧の見た目の注記だけ（一覧を固定する）", () => {
    // 受け入れ条件は「src 全体で 0」だが、次の 3 種は消せない:
    //   (a) `src/legacy/` の旧 API の公開名（`swipers`・`baseSwiper`・`overlaySwiper`・`SwiperInstance`）
    //   (b) Chuci の要素名 `cc-swiper`・`cc-swiper-slide`（地図のメディアの表示部品。旧 UI とは無関係）
    //   (c) 旧 CSS のクラス名を説明する注記（`.base-swiper`・`.swiper-slide` 等）
    //   （`poi_safe.ts` の旧の組み立て関数は旧 UI の実装の削除の仕上げで消したので、ここには入らない）
    // 増えたら気づけるよう、ファイルの一覧を固定する（新しいファイルに `swiper` を持ち込ませない）。
    const legacy = ALLOWED_SWIPER_IN_LEGACY.slice();
    // 受け入れ条件の grep と同じく**大文字小文字を区別する**（`Swiper` は説明の文なので数えない）
    const others = srcFiles
      .map(path => relative(ROOT, path))
      .filter(file => !legacy.includes(file))
      .filter(file => read(file).includes("swiper"));
    expect(others.sort()).toEqual([
      "src/element/maplat-ui.ts",
      "src/element/slider.ts",
      "src/element/styles.ts"
    ]);
  });

  it("`ol/control` が src に無い", () => {
    const bad = srcFiles
      .map(path => relative(ROOT, path))
      .filter(file => read(file).includes("ol/control"));
    expect(bad).toEqual([]);
  });

  it.each(["bootstrap.native", "i18next", 'from "page"'])(
    "%s が src と package.json に無い",
    pattern => {
      const bad = srcFiles
        .map(path => relative(ROOT, path))
        .filter(file => read(file).includes(pattern));
      expect(bad).toEqual([]);
      expect(pkgSource).not.toContain(pattern);
    }
  );

  it("package.json から消した依存が無く、残す依存がある", () => {
    const pkg = JSON.parse(pkgSource) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const name of [
      "swiper",
      "@turf/turf",
      "bootstrap.native",
      "i18next",
      "i18next-http-backend",
      "page",
      "@types/page"
    ]) {
      expect(all, name).not.toHaveProperty(name);
    }
    // 残すもの: 地図（層 A）・地図ライブラリ・Chuci・QR・Service Worker の土台・タイルキャッシュの受け口
    for (const name of [
      "@maplat/core",
      "@c4h/chuci",
      "qrcode",
      "@c4h/weiwudi",
      "workbox-core",
      "workbox-precaching",
      "workbox-routing",
      "workbox-strategies",
      "workbox-expiration"
    ]) {
      expect(pkg.dependencies, name).toHaveProperty(name);
    }
  });

  it("@c4h/weiwudi は Service Worker のビルドで使うので残す（旧 UI 専用ではない）", () => {
    // 当初の設計は @c4h/weiwudi を「旧 UI の依存」として挙げていたが、実際は
    // src/service-worker/index.ts が `@c4h/weiwudi/sw` を読む（タイルキャッシュの受け口）。∴ 残す。
    const sw = read("src/service-worker/index.ts");
    expect(sw).toContain('import "@c4h/weiwudi/sw"');
    // <maplat-ui> 側は Weiwudi を読まない（PWA は navigator.serviceWorker を直接使う）
    expect(read("src/element/pwa.ts")).not.toContain('from "@c4h/weiwudi"');
  });
});

// ---- 3. 同じ画面を描く経路は 1 つ ----

describe("同じ画面を描く経路が 1 つだけ", () => {
  const srcTs = filesUnder("src", [".ts"]).map(path => relative(ROOT, path));

  it("旧 API のクラスは互換層にだけ在る", () => {
    const declared = srcTs.filter(file =>
      /\bclass MaplatUi\s+extends\b/.test(read(file))
    );
    expect(declared).toEqual(["src/legacy/maplat_ui_compat.ts"]);
    // 入口は互換層を出す（旧 API の名前と型）
    const entry = read("src/index.ts");
    expect(entry).toContain(
      'export { MaplatUi } from "./legacy/maplat_ui_compat"'
    );
    expect(entry).toContain("./legacy/legacy_types");
  });

  it("互換層は DOM を描かない（要素へ委譲するだけ）", () => {
    const compat = read("src/legacy/maplat_ui_compat.ts");
    // 中身（画面）を組み立てない: innerHTML も HTML 文字列も無い
    expect(compat).not.toMatch(/innerHTML|outerHTML|<div class=/);
    // 画面を描くのは <maplat-ui> の 1 実装だけ
    expect(compat).toContain("../element");
  });

  it("画面の組み立て（HTML・CSS）は src/element/ の 1 実装だけ", () => {
    // 旧 UI の画面の組み立て（`class="ol-...` を組み立てる場所）は消えている
    const builders = srcTs.filter(file => /class="ol-/.test(read(file)));
    expect(builders).toEqual([]);
    // 要素の CSS は styles.ts の 1 か所
    const css = srcTs.filter(file => /\bMAPLAT_UI_CSS\b\s*=/.test(read(file)));
    expect(css).toEqual(["src/element/styles.ts"]);
    // 要素の定義（customElements.define）も 1 か所
    const defined = srcTs.filter(file =>
      /customElements\.define\(/.test(read(file))
    );
    expect(defined).toEqual(["src/element/index.ts"]);
  });

  it("旧 API の互換層が <maplat-ui> を 1 つだけ作る（二重に描かない）", () => {
    const compat = read("src/legacy/maplat_ui_compat.ts");
    const hosts = compat.match(/createElement\(MAPLAT_UI_TAG\)/g) ?? [];
    expect(hosts.length).toBe(1);
    // 互換層が文書へ繋ぐのは、その 1 つを作った後だけ（旧の `div` の器へ入れる）
    const appended = compat.match(/\.appendChild\(/g) ?? [];
    expect(appended.length).toBe(2); // 器の用意（#map_div）と、<maplat-ui> を器へ入れる 1 か所
  });
});
