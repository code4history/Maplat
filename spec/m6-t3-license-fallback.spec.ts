// @vitest-environment jsdom
// M6-T3: resolveLicenseFallback 純関数 (AC5–AC8)
import { describe, it, expect } from "vitest";
import { resolveLicenseFallback } from "../src/ui_utils";

describe("resolveLicenseFallback (m6-t3)", () => {
  it('AC5: ベースマップ (isWmts=true) の空 license → "All right reserved"', () => {
    expect(resolveLicenseFallback("license", "", true)).toBe(
      "All right reserved"
    );
    expect(resolveLicenseFallback("license", undefined, true)).toBe(
      "All right reserved"
    );
  });

  it('AC6: Maplat 地図 (isWmts=false) の空 dataLicense → "CC BY-SA"', () => {
    expect(resolveLicenseFallback("dataLicense", "", false)).toBe("CC BY-SA");
    expect(resolveLicenseFallback("dataLicense", undefined, false)).toBe(
      "CC BY-SA"
    );
  });

  it('AC7: ベースマップ (isWmts=true) の空 dataLicense → "All right reserved"', () => {
    expect(resolveLicenseFallback("dataLicense", "", true)).toBe(
      "All right reserved"
    );
  });

  it("AC8: 値が設定済みならフォールバックせず設定値を返す", () => {
    expect(resolveLicenseFallback("license", "CC BY", true)).toBe("CC BY");
    expect(resolveLicenseFallback("dataLicense", "ODbL", false)).toBe("ODbL");
    expect(resolveLicenseFallback("license", "Custom", false)).toBe("Custom");
  });

  it('Maplat 地図の空 license も "All right reserved"', () => {
    expect(resolveLicenseFallback("license", "", false)).toBe(
      "All right reserved"
    );
  });
});
