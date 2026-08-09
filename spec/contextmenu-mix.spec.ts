// m19-t9: src/contextmenu/helpers/mix.ts の未カバー中核ロジックを単体テストする。
// 全13エクスポート（設計書は「全11」と記載しているが実際は13本。INF-t9-1・件数表記のみのずれ）
// を対象とする。
import { describe, it, expect } from "vitest";
import {
  mergeOptions,
  assert,
  contains,
  getUniqueId,
  assertEqual,
  now,
  randomId,
  isNumeric,
  isEmpty,
  emptyArray,
  anyMatchInArray,
  everyMatchInArray,
  anyItemHasValue
} from "../src/contextmenu/helpers/mix";

describe("mergeOptions", () => {
  it("obj2の値でobj1を上書きし、obj2側の新規キーも追加した新規オブジェクトを返す", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 3, c: 4 };
    const merged = mergeOptions(obj1, obj2);
    expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    expect(merged).not.toBe(obj1);
    expect(merged).not.toBe(obj2);
  });
});

describe("assert", () => {
  it("条件がtrueなら何も投げない", () => {
    expect(() => assert(true)).not.toThrow();
  });

  it("条件がfalseで既定メッセージのErrorを投げる", () => {
    expect(() => assert(false)).toThrowError("Assertion failed");
  });

  it("条件がfalseでカスタムメッセージを渡すとそのメッセージのErrorを投げる", () => {
    expect(() => assert(false, "msg")).toThrowError("msg");
  });
});

describe("contains", () => {
  it("strにstr_testが含まれればtrue", () => {
    expect(contains("ab", "xaby")).toBe(true);
  });

  it("strにstr_testが含まれなければfalse", () => {
    expect(contains("z", "xaby")).toBe(false);
  });
});

describe("getUniqueId", () => {
  it("prefix省略時は既定の id_ で始まる", () => {
    expect(getUniqueId().startsWith("id_")).toBe(true);
  });

  it("カスタムprefixが反映される", () => {
    expect(getUniqueId("y_").startsWith("y_")).toBe(true);
  });
});

describe("assertEqual", () => {
  it("等しければ何も投げない", () => {
    expect(() => assertEqual(1, 1, "msg")).not.toThrow();
  });

  it("異なれば実引数を埋め込んだメッセージのErrorを投げる", () => {
    expect(() => assertEqual("a", "b", "msg")).toThrowError("msg mismatch: a != b");
  });
});

describe("now", () => {
  it("数値を返す", () => {
    expect(typeof now()).toBe("number");
  });

  it("連続呼び出しで非減少である", () => {
    const first = now();
    const second = now();
    expect(second).toBeGreaterThanOrEqual(first);
  });
});

describe("randomId", () => {
  it("prefixありはprefixで始まる文字列を返す", () => {
    expect(randomId("p_").startsWith("p_")).toBe(true);
  });

  it("prefixが空文字ならprefixなしで返す（分岐 prefix ? prefix+id : id の両方を通す）", () => {
    const id = randomId("");
    expect(id.startsWith("p_")).toBe(false);
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("isNumeric", () => {
  it("数字のみの文字列はtrue", () => {
    expect(isNumeric("123")).toBe(true);
  });

  it("数字以外を含む文字列はfalse", () => {
    expect(isNumeric("12a")).toBe(false);
  });

  it("number型もString()経由でtrue判定される", () => {
    expect(isNumeric(123)).toBe(true);
  });
});

describe("isEmpty", () => {
  it("undefinedはtrue", () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  it("nullはtrue", () => {
    expect(isEmpty(null)).toBe(true);
  });

  it("空文字はtrue", () => {
    expect(isEmpty("")).toBe(true);
  });

  it("非空文字はfalse", () => {
    expect(isEmpty("a")).toBe(false);
  });
});

describe("emptyArray", () => {
  // INF-t9-2: emptyArray(array) は while(array.length) array.pop(); のみで
  // 戻り値を返さない（undefined）。「同一参照であること」は渡した配列そのものが
  // in-place で空になることの意味で実装する（戻り値ではなく引数に対してassertする）。
  it("渡した配列そのものをin-placeで空にする", () => {
    const array = [1, 2, 3];
    const returnValue = emptyArray(array);
    expect(array.length).toBe(0);
    expect(returnValue).toBeUndefined();
  });
});

describe("anyMatchInArray", () => {
  it("交差があればtrue", () => {
    expect(anyMatchInArray([1, 2], [2, 3])).toBe(true);
  });

  it("交差がなければfalse", () => {
    expect(anyMatchInArray([1, 2], [3, 4])).toBe(false);
  });
});

describe("everyMatchInArray", () => {
  // 実装は arr2.every(x => arr1.includes(x)) であり、名前が示唆する引数順と
  // 逆に「arr2の全要素がarr1に含まれるか」を返す非対称性をテストで固定する。
  it("arr2の全要素がarr1に含まれればtrue", () => {
    expect(everyMatchInArray([1, 2, 3], [1, 2])).toBe(true);
  });

  it("arr1の全要素がarr2に含まれていてもarr2側が少なければfalse（引数順が逆であることの固定）", () => {
    expect(everyMatchInArray([1, 2], [1, 2, 3])).toBe(false);
  });
});

describe("anyItemHasValue", () => {
  it("文字列値が1つでも非空ならtrue", () => {
    expect(anyItemHasValue({ a: "", b: "x" })).toBe(true);
  });

  it("文字列値が全て空ならhasの既定値falseのまま", () => {
    expect(anyItemHasValue({ a: "", b: "" })).toBe(false);
  });

  it("数値などの非文字列値はisEmpty(null)経由でtrueとなり、hasの初期値がそのまま返る", () => {
    expect(anyItemHasValue({ a: 123 })).toBe(false);
  });

  it("has初期値にtrueを渡すとそのままtrueが返る", () => {
    expect(anyItemHasValue({ a: 123 }, true)).toBe(true);
  });
});
