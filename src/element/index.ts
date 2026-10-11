// <maplat-ui> の登録の入口（副作用 import で <maplat-ui> を登録する）。
//
//   import "@maplat/core/element";   // 層 A（Core）。別の層 A の実装ならその要素の入口。どれかをページが選ぶ
//   import "<この入口>";              // 層 B（<maplat-ui>）
//
// この入口は層 A を import しない（どの層 A と組むかはページが決める。仕様 §4.1・§7）。
// 外部の import は @maplat/core/common だけ（spec/element-deps.spec.ts が機械的に確かめる）。
import { MAPLAT_UI_TAG } from "@maplat/core/common";
import { MaplatUiElement } from "./maplat-ui";

export { MaplatUiElement, MAPLAT_UI_VERSION } from "./maplat-ui";
export type { CompassAction } from "./maplat-ui";

/**
 * <maplat-ui> を登録する。既に登録済みなら上書きせず、英語で警告する（1 文書に載る層 B の実装は 1 つ）。
 * @returns 登録したら true
 */
export function defineMaplatUi(tagName: string = MAPLAT_UI_TAG): boolean {
  if (typeof customElements === "undefined") return false;
  const existing = customElements.get(tagName);
  if (existing) {
    console.warn(
      existing === MaplatUiElement
        ? `<${tagName}> is already defined; it was not redefined.`
        : `<${tagName}> is already defined by another implementation; this implementation did not redefine it.`
    );
    return false;
  }
  customElements.define(tagName, MaplatUiElement);
  return true;
}

defineMaplatUi();
