// @vitest-environment jsdom
//
// 旧 `MaplatUi.translate`（多言語の値から今の言語を選ぶ）の単体テスト。
//
// 旧の実装（`src/index.legacy.ts`）を消したので、対象を互換層（`src/index.ts` の
// `MaplatUi`）へ移した。旧は i18next に断片を資源として登録し `exists()` で引いていたが、
// 互換層は i18next を持たず（`src/legacy/legacy_i18n.ts`）、断片の選び方は要素と共通の
// `pickLocalized` 1 本だけ（`src/element/i18n.ts`）になった。ここで固定するのは **選んだ値**:
//   今の言語 → en → 最初の非空。断片が全部空なら ""（旧 #251 の「辞書を壊さない」を含む）。
// 登録済みの語（`ui.t`）に鍵が在るときに訳を返す件は `spec/legacy-api.spec.ts`（凍結）が見る。
import { describe, it, expect } from "vitest";
import { MaplatUi } from "../src/index";

function newUi(lang: string): MaplatUi {
  // 起動しない（`<maplat-ui>` を作らない）: 旧の `translate` の選び方は起動前でも同じ
  return new MaplatUi({ lang });
}

describe("MaplatUi.translate（互換層）", () => {
  it("渡された文字列と undefined はそのまま返す", () => {
    const ui = newUi("ja");
    expect(ui.translate("as-is")).toBe("as-is");
    expect(ui.translate(undefined)).toBeUndefined();
  });

  it("多言語の断片は今の言語の値を選ぶ", () => {
    const ui = newUi("ja");
    expect(ui.translate({ en: "English Title", ja: "日本語題" })).toBe(
      "日本語題"
    );
  });

  it("今の言語が無ければ en へ落ちる", () => {
    const ui = newUi("ja");
    expect(ui.translate({ en: "English Title", de: "Deutscher Titel" })).toBe(
      "English Title"
    );
  });

  it("en も無ければ最初の非空の値", () => {
    const ui = newUi("ja");
    expect(ui.translate({ de: "Deutscher Titel", fr: "Titre" })).toBe(
      "Deutscher Titel"
    );
  });

  // 旧 #251: 全部空の断片（新しい MaplatEditor の appName 等）で "" を返す。旧は空キーを
  // 資源として登録して辞書の名前空間を壊していた。互換層は辞書を持たないので壊れようがないが、
  // 「"" を返す」「そのあともほかの断片は正しく選べる」をここで固定する
  it('全部空の断片は "" を返し、そのあとも断片の選択は壊れない', () => {
    const ui = newUi("ja");
    const result = ui.translate({
      ja: "",
      en: "",
      de: "",
      fr: "",
      es: "",
      ko: "",
      zh: "",
      "zh-TW": ""
    });
    expect(result).toBe("");
    expect(ui.translate({ ja: "地図名", en: "Map Name" })).toBe("地図名");
  });

  it("今の言語の値が空なら、ほかの言語の値へ落ちる", () => {
    const ui = newUi("ja");
    expect(ui.translate({ ja: "", en: "Fallback Title" })).toBe(
      "Fallback Title"
    );
  });

  it("何度呼んでも同じ値（旧の exists() の早道と同じ結果。資源の登録をしない）", () => {
    const ui = newUi("ja");
    expect(ui.translate({ ja: "地図名", en: "Map Name" })).toBe("地図名");
    expect(ui.translate({ ja: "地図名", en: "Map Name" })).toBe("地図名");
  });

  // 積み残し（再レビューの Info）: 起動前の `ui.lang = "en"` は**起動までの読み値だけ**。
  // 起動すると `#createHost` は `option.lang` しか流さないので、属性の言語（要素の選び方）に従う。
  it("起動前の lang の代入は、起動前の translate に効く（起動後の値は持たない）", () => {
    const ui = newUi("ja");
    expect(ui.translate({ ja: "地図名", en: "Map Name" })).toBe("地図名");
    ui.lang = "en";
    expect(ui.lang).toBe("en");
    expect(ui.translate({ ja: "地図名", en: "Map Name" })).toBe("Map Name");
  });
});
