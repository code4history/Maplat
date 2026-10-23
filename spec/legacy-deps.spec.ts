// 旧 API の互換層（`src/legacy/`）の依存の規則を機械的に確かめる（設計 v2 §6.4 Stage 3・
// 再レビュー D5・D10・差分 D1〜D10）。
//
// 互換層は「旧 UI のファイルを import しない」「地図ライブラリ（OpenLayers）には `ol/events/Target`
// だけ」「Swiper を import しない」で、層 B（`src/element/`）は「互換層を import しない」。
// 層 A の要素の登録は `core_bootstrap.ts` の literal specifier の動的 import だけに閉じる
// （変数の specifier にするとバンドラが解決できない）。
//
// 型だけの import（`import type`）は実行時に消えるので、公開型は互換層の `legacy_types.ts` に置く
// （Stage 4 で移した。`src/types.ts` は旧 API の型を再輸出しない）。
// 旧 UI の実装ファイルそのものが消えていることは `spec/stage4-removal.spec.ts` が確かめる。
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const LEGACY_DIR = join(ROOT, "src/legacy");
const ELEMENT_DIR = join(ROOT, "src/element");

/** ディレクトリ以下の `.ts` を集める（相対パスは `src/...` の形）。 */
function tsFiles(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...tsFiles(path));
    else if (name.endsWith(".ts")) found.push(path);
  }
  return found;
}

/** ソースから import の specifier を集める（`import x from "y"`・`import "y"`・`import("y")`）。 */
function importSpecifiers(source: string): string[] {
  const found: string[] = [];
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /^\s*import\s+["']([^"']+)["']/gm
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.push(match[1]);
  }
  return found;
}

/** 旧 UI の実装ファイル（互換層から読んではならない）。層 B の `../element` は別物なので除く。 */
const OLD_UI_FILE =
  /(^|\/)(index\.legacy|ui_init|ui_marker|maplat_control|ui_utils|function|swiper_ex|maplat_map|contextmenu|styles)(\/|\.|$)/;

const legacyFiles = tsFiles(LEGACY_DIR);
const legacySources = new Map(
  legacyFiles.map(path => [relative(ROOT, path), readFileSync(path, "utf8")])
);

describe("互換層（src/legacy/）の依存", () => {
  it("検査対象のファイルが在る（空回りしていない）", () => {
    expect(legacyFiles.length).toBeGreaterThanOrEqual(8);
    for (const name of [
      "src/legacy/maplat_ui_compat.ts",
      "src/legacy/core_bootstrap.ts"
    ]) {
      expect(legacySources.has(name), name).toBe(true);
    }
  });

  it("旧 UI の実装ファイルを import しない", () => {
    const bad: string[] = [];
    for (const [file, source] of legacySources) {
      for (const spec of importSpecifiers(source)) {
        if (OLD_UI_FILE.test(spec)) bad.push(`${file} ← ${spec}`);
      }
    }
    expect(bad).toEqual([]);
    // 検査そのものが働くこと（自己検査）
    expect(OLD_UI_FILE.test("./ui_init")).toBe(true);
    expect(OLD_UI_FILE.test("./index.legacy")).toBe(true);
    expect(OLD_UI_FILE.test("./contextmenu/internal")).toBe(true);
    expect(OLD_UI_FILE.test("./styles/ui.scss")).toBe(true);
    // 層 B（<maplat-ui>）と旧の公開型は読む
    expect(OLD_UI_FILE.test("../element")).toBe(false);
    expect(OLD_UI_FILE.test("../element/slider")).toBe(false);
    expect(OLD_UI_FILE.test("../types")).toBe(false);
  });

  it("ol の import は ol/events/Target だけ（ol/control・ol/proj・ol/ol.css を読まない）", () => {
    const bad: string[] = [];
    for (const [file, source] of legacySources) {
      for (const spec of importSpecifiers(source)) {
        if (!spec.startsWith("ol")) continue;
        if (spec !== "ol/events/Target" && spec !== "ol/events/Target.js")
          bad.push(`${file} ← ${spec}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("Swiper を import しない", () => {
    const bad: string[] = [];
    for (const [file, source] of legacySources) {
      for (const spec of importSpecifiers(source)) {
        if (/^swiper(\/|$)/.test(spec)) bad.push(`${file} ← ${spec}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("層 A の要素の登録は core_bootstrap.ts の literal specifier の動的 import だけ", () => {
    const bootstrap = legacySources.get("src/legacy/core_bootstrap.ts")!;
    const specifiers = importSpecifiers(bootstrap);
    expect(specifiers).toContain("@maplat/core/element");
    // 変数に入れた specifier で import していない（`import(specifier)` の形が無い）
    expect(/\bimport\s*\(\s*(?!["'])/.test(bootstrap)).toBe(false);
    for (const [file, source] of legacySources) {
      if (file === "src/legacy/core_bootstrap.ts") continue;
      const hit = importSpecifiers(source).filter(spec =>
        spec.startsWith("@maplat/core")
      );
      // @maplat/core の要素の入口（OL を全部含む）を互換層の他のファイルから読まない
      expect(hit, file).not.toContain("@maplat/core/element");
    }
  });

  it("層 B（src/element/）は互換層を import しない", () => {
    const bad: string[] = [];
    for (const path of tsFiles(ELEMENT_DIR)) {
      const source = readFileSync(path, "utf8");
      for (const spec of importSpecifiers(source)) {
        if (/(^|\/)legacy(\/|$)/.test(spec))
          bad.push(`${relative(ROOT, path)} ← ${spec}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
