// @vitest-environment jsdom
//
// oct26-m16-t1: セキュリティレビュー B の B-UI-1〜3 の是正
//
// 前提（m1-t4 の脅威モデル）: 外から取ってくる POI の JSON は信頼できない。
//
// - B-UI-1: POI 一覧（マーカーリスト）が POI／レイヤの name・icon を無害化せずに
//           HTML 文字列へ補間していた（src/ui_init.ts）。
// - B-UI-2: POI の url をスキーム検査なしで iframe の src へ入れていた（src/ui_marker.ts）。
// - B-UI-3: POI の directgo をスキーム検査なしで location.href / window.open へ
//           渡していた（src/ui_marker.ts）。
//
// 本ファイルはヘルパー（src/poi_safe.ts）の単体テストを扱う。
//
// 旧の実装（`src/ui_init.ts`・`src/ui_marker.ts`）を消したので、
//   - B-UI-1 の配線（POI 一覧の name・icon）は `<maplat-ui>` のマーカー一覧が担う。
//     回帰は `spec/element.spec.ts` の「マーカー一覧」describe が見る（名前は textContent・
//     アイコンは safeImageUrl）。ここにあった `ui_init.ts` のソーステキスト検査は対象が消えたので外した。
//   - B-UI-2/3 の挙動（url の iframe・directgo）は `spec/element.spec.ts` の POI の describe が見る
//     （旧 `oct26-m16-t1-ui-marker-url.spec.ts` の URL の一覧をそのまま移した）。
//   - 旧 UI の実装の削除の仕上げ: 旧の一覧の HTML を組み立てる `escapeHtml`・`layerListItemHtml`・`poiListItemHtml` は
//     呼び手が無くなったので `poi_safe.ts` から消し、その単体（B-UI-1 の部分）もここから消した。
//     残るのは `safeWebUrl` の許可リストの単体（B-UI-2/3）。
import { describe, it, expect } from "vitest";

import { safeWebUrl } from "../src/poi_safe";

const REJECTED_URLS = [
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "  javascript:alert(1)  ",
  "\tjava\nscript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "DATA:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
  "vbscript:msgbox(1)",
  " VBScript:msgbox(1)",
  "blob:https://example.com/uuid",
  "file:///etc/passwd"
];

const ACCEPTED_URLS = [
  "https://example.com/",
  "http://example.com/a?b=c#d",
  "HTTPS://EXAMPLE.COM/",
  "./poi/1.html",
  "poi/1.html",
  "/abs/path.html",
  "?q=1",
  "//example.com/x"
];

describe("B-UI-2/B-UI-3: safeWebUrl（http/https の許可リスト）", () => {
  it.each(REJECTED_URLS)("%s を拒否する", url => {
    expect(safeWebUrl(url)).toBeUndefined();
  });

  it.each(ACCEPTED_URLS)("%s を通し、値は変えない", url => {
    expect(safeWebUrl(url)).toBe(url);
  });

  it("文字列以外・空文字は拒否する", () => {
    expect(safeWebUrl(undefined)).toBeUndefined();
    expect(safeWebUrl(null)).toBeUndefined();
    expect(safeWebUrl({ href: "https://example.com/" })).toBeUndefined();
    expect(safeWebUrl("")).toBeUndefined();
  });

  it("解析できない URL は拒否する", () => {
    expect(safeWebUrl("http://[::1")).toBeUndefined();
  });
});
