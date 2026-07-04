// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import i18next, { i18n } from "i18next";
import { MaplatUi } from "../src/index";

const JA_RESOURCES = {
  html: {
    cache_fetch: "一括ダウンロード",
    cache_delete: "キャッシュ削除"
  },
  control: {
    home: "ホーム位置復帰"
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
async function createUiStub(): Promise<any> {
  const ui = Object.create(MaplatUi.prototype) as any;
  const instance: i18n = i18next.createInstance();
  await instance.init({
    lng: "ja",
    fallbackLng: ["en"],
    resources: {
      ja: { translation: JA_RESOURCES },
      en: { translation: { html: { cache_fetch: "Bulk download" } } }
    }
  });
  ui.lang = "ja";
  ui.i18n = instance;
  ui._t = instance.t.bind(instance);
  return ui;
}

describe("MaplatUi.translate", () => {
  let ui: any;

  beforeEach(async () => {
    ui = await createUiStub();
  });

  it("passes through plain strings and undefined", () => {
    expect(ui.translate("as-is")).toBe("as-is");
    expect(ui.translate(undefined)).toBeUndefined();
  });

  it("prefers the current language of a multilingual fragment", () => {
    expect(ui.translate({ en: "English Title", ja: "日本語題" })).toBe(
      "日本語題"
    );
  });

  it("falls back to English when the current language is absent", () => {
    expect(ui.translate({ en: "English Title", de: "Deutscher Titel" })).toBe(
      "English Title"
    );
  });

  // #251 regression: all-empty fragments (e.g. blank appName of a new
  // MaplatEditor app) must not wipe the i18next translation namespace
  it("returns '' for an all-empty fragment without destroying the dictionary", () => {
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
    expect(ui.t("html.cache_fetch")).toBe("一括ダウンロード");
    expect(ui.t("control.home")).toBe("ホーム位置復帰");
  });

  it("skips empty current-language entries and falls back to other languages", () => {
    expect(ui.translate({ ja: "", en: "Fallback Title" })).toBe(
      "Fallback Title"
    );
  });

  it("does not register empty-string values as resources", () => {
    ui.translate({ ja: "", en: "Fallback Title" });
    // ja side must stay unregistered so the en fallback keeps working
    expect(ui.translate({ ja: "", en: "Fallback Title" })).toBe(
      "Fallback Title"
    );
    const jaStore = ui.i18n.store.data.ja.translation as Record<
      string,
      unknown
    >;
    expect(jaStore["Fallback Title"]).toBeUndefined();
  });

  it("registers and returns normal fragments idempotently", () => {
    expect(ui.translate({ ja: "地図名", en: "Map Name" })).toBe("地図名");
    // Second call goes through the exists() fast path
    expect(ui.translate({ ja: "地図名", en: "Map Name" })).toBe("地図名");
    ui.lang = "en";
    ui.i18n.changeLanguage("en");
    expect(ui.translate({ ja: "地図名", en: "Map Name" })).toBe("Map Name");
  });
});
