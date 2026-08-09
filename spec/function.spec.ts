// m19-t9: src/function.ts の未カバー中核ロジック（getUniqueId / normalizeArg）を単体テストする。
// normalizeArg は内部で @maplat/core の同名関数（未公開サブパス "./dist/functions"）へ委譲するが、
// vitest.config.ts の resolve.alias でテスト専用スタブへ差し替えている（設計書 §5）。
import { describe, it, expect } from "vitest";
import { getUniqueId, normalizeArg } from "../src/function";

describe("getUniqueId", () => {
  it("prefix省略時は既定の id_ で始まる文字列を返す", () => {
    const id = getUniqueId();
    expect(id.startsWith("id_")).toBe(true);
  });

  it("prefixを指定すればその文字列で始まる", () => {
    const id = getUniqueId("x_");
    expect(id.startsWith("x_")).toBe(true);
  });

  it("2回呼ぶと異なる値を返す（衝突耐性の健全性チェック）", () => {
    const a = getUniqueId();
    const b = getUniqueId();
    expect(a).not.toBe(b);
  });
});

describe("normalizeArg", () => {
  it("旧キーを含まない場合はそのまま返す", () => {
    expect(normalizeArg({ foo: "bar" })).toEqual({ foo: "bar" });
  });

  const oldKeyTable: Array<[string, string]> = [
    ["state_url", "stateUrl"],
    ["restore_session", "restoreSession"],
    ["enable_share", "enableShare"],
    ["mobile_if", "mobileIF"],
    ["pwa_manifest", "pwaManifest"],
    ["pwa_worker", "pwaWorker"],
    ["pwa_scope", "pwaScope"],
    ["presentation_mode", "presentationMode"]
  ];

  it.each(oldKeyTable)(
    "旧キー %s は Error(旧キー -> %s への読み替え指示) を投げる",
    (oldKey, newKey) => {
      expect(() => normalizeArg({ [oldKey]: 1 })).toThrowError(
        `Invalid Maplat option key: ${oldKey}. Use "${newKey}" instead.`
      );
    }
  );
});
