// UIロケールリソースの整合性テスト。
// 新しい言語を追加したら assets/locales/{lang}/translation.json を置くだけで
// 本テストの対象に自動で含まれる(ロジック側は i18next-http-backend の動的ロード
// + fallbackLng: en のため、言語リストのコード変更は不要)。
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const localesDir = join(__dirname, "../assets/locales");
const langs = readdirSync(localesDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

type Json = { [key: string]: string | Json };

function loadLocale(lang: string): Json {
  return JSON.parse(
    readFileSync(join(localesDir, lang, "translation.json"), "utf8")
  );
}

function flattenKeys(obj: Json, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object"
      ? flattenKeys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  );
}

function valueOf(obj: Json, path: string): string {
  return path
    .split(".")
    .reduce((cur: Json | string, key) => (cur as Json)[key], obj) as string;
}

// 訳文中で保持されるべきプレースホルダ/マークアップを抽出する
function extractPlaceholders(value: string): string[] {
  const patterns = [
    /%\d+\$[sdf]/g, // sprintf位置指定子 (%1$s, %2$f 等)
    /<img src='\$\{[^}]+\}'>/gi, // コントロールアイコン差し込み
    /<a [^>]+>/g // リンクタグ(href/target保持)
  ];
  return patterns.flatMap(pattern => value.match(pattern) ?? []).sort();
}

describe("locale resources", () => {
  const en = loadLocale("en");
  const enKeys = flattenKeys(en).sort();

  it("has at least the historically supported languages", () => {
    for (const lang of [
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
    ]) {
      expect(langs).toContain(lang);
    }
  });

  for (const lang of langs) {
    describe(lang, () => {
      const data = loadLocale(lang);

      it("has exactly the same key set as en", () => {
        expect(flattenKeys(data).sort()).toEqual(enKeys);
      });

      it("has no empty values", () => {
        for (const key of enKeys) {
          expect(valueOf(data, key), `${lang}:${key}`).toBeTruthy();
        }
      });

      it("preserves placeholders and markup tokens", () => {
        for (const key of enKeys) {
          const enTokens = extractPlaceholders(valueOf(en, key));
          if (enTokens.length === 0) continue;
          // 大文字小文字の揺れ(<Img)はHTMLとして等価のため小文字比較
          const normalize = (tokens: string[]) =>
            tokens.map(token => token.toLowerCase()).sort();
          expect(
            normalize(extractPlaceholders(valueOf(data, key))),
            `${lang}:${key}`
          ).toEqual(normalize(enTokens));
        }
      });
    });
  }
});
