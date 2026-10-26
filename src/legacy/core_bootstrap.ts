// 層 A（Core の `<maplat-app>`）の登録。
//
// 旧 API の互換層は、地図を司る Core の Custom Element（`<maplat-app>`）が登録されていることが前提。
// 登録は Core の `element` の入口（`@maplat/core/element`）が行う副作用なので、ここでは
// **literal specifier の動的 import** で読むだけにする（変数に入れた specifier で import すると
// バンドラが解決できず、`spec/legacy-deps.spec.ts` もこの形を検査する）。
//
// ここだけが Core の要素の入口を読む。UI の本体（`<maplat-ui>`）は `@maplat/core/common` にしか
// 依存しない（層 B の規則）ので、旧 API を使うときだけ層 A の実装が読み込まれる。
//
// Pro 対応はしない（人間決定 2026-10-23）。ただし、既に `<maplat-app>` が登録されている文書
// （Pro や、利用者が先に `@maplat/core/element` を読んだ場合）では何もしない。二重登録の警告を
// 出さず、先に登録された実装を尊重する（Core の `defineMaplatAppElementOnce` と同じ判断）。

import { MAPLAT_APP_TAG } from "@maplat/core/common";

let pending: Promise<void> | null = null;

/** `<maplat-app>` が使える状態にする（登録済みなら何もしない）。 */
export function ensureMaplatAppElement(): Promise<void> {
  if (typeof customElements === "undefined") return Promise.resolve();
  if (customElements.get(MAPLAT_APP_TAG)) return Promise.resolve();
  if (pending) return pending;
  pending = import("@maplat/core/element").then(
    () => {
      // 登録されなかった（同時に別の経路が登録した等）場合も、次の呼び出しでやり直さない
    },
    err => {
      // 読み込みに失敗したら、次の呼び出しでやり直せるようにする
      pending = null;
      throw err;
    }
  );
  return pending;
}
