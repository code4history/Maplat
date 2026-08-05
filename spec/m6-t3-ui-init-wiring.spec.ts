// M6-T3 AC18: ui_init.ts が resolveLicenseFallback を配線していることのソーステキスト assert。
// license 分岐に限定できる目印のみを使う（ファイル全体の display:none は cache UI 等に残る）。
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const uiInitPath = resolve(__dirname, "../src/ui_init.ts");
const source = readFileSync(uiInitPath, "utf8");

describe("ui_init license fallback wiring (m6-t3 AC18)", () => {
  it("resolveLicenseFallback( が出現する", () => {
    expect(source).toContain("resolveLicenseFallback(");
  });

  it("effectiveLicense が出現する", () => {
    expect(source).toContain("effectiveLicense");
  });

  it("isWmts が出現する", () => {
    expect(source).toMatch(/\bisWmts\b/);
  });

  it("renderLicenseCell の第2引数が effectiveLicense である", () => {
    // 引数リストの位置を固定: contentEl, effectiveLicense, note, iconUrlFor
    expect(source).toMatch(
      /renderLicenseCell\(\s*contentEl as HTMLElement,\s*effectiveLicense,\s*note \|\| undefined,/
    );
  });

  it('license/dataLicense 分岐に if (val || note) … else display="none" 形が残っていない', () => {
    // 変更後は常に display = "block" で、val||note のガードと else の none を使わない
    const licenseBranch = source.match(
      /if \(key === "license" \|\| key === "dataLicense"\) \{([\s\S]*?)\n\s*return;/
    );
    expect(licenseBranch).toBeTruthy();
    const body = licenseBranch![1];
    expect(body).not.toMatch(/if\s*\(\s*val\s*\|\|\s*note\s*\)/);
    expect(body).not.toMatch(/style\.display\s*=\s*["']none["']/);
    expect(body).toMatch(/style\.display\s*=\s*["']block["']/);
    expect(body).toContain("effectiveLicense");
  });
});
