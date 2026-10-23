// 旧 `ui.i18n` の限定 facade（設計 v2 §3 L8・L9・§2.3.6 (7)）。
//
// 旧 UI は翻訳ライブラリのインスタンスを公開していた。互換層はそれを持たず（層 B の辞書は
// `src/element/i18n.ts` が読む）、旧 API が使っていた口だけを要素へ委譲する。
// 使えない口は**警告を 1 回だけ**出して undefined を返す（黙って壊れないため）。
//
// 旧 UI のファイル（`ui_init.ts` 等）は Stage 4 で消したので、ここから import しようがない
// （互換層が旧 UI を読まないことを `spec/legacy-deps.spec.ts` が機械で確かめる）。

import type { MaplatUiElement } from "../element";

export interface LegacyI18n {
  /** 今の言語（旧 `i18n.language`） */
  readonly language: string;
  /** 訳（旧 `i18n.t`） */
  t: (key: string, option?: object) => string;
  /** 訳があるか（旧 `i18n.exists`。キーのままなら訳が無いとみなす） */
  exists: (key: string) => boolean;
  /** 言語を変える（旧 `i18n.changeLanguage`。辞書を読み終えてから解決する） */
  changeLanguage: (lang: string) => Promise<void>;
  /** 言語が変わったとき（旧の翻訳ライブラリの "languageChanged"）。互換層が自前で配る */
  on: (type: "languageChanged", handler: (lang: string) => void) => void;
  off: (type: "languageChanged", handler: (lang: string) => void) => void;
}

/** 旧 UI のコードが呼んでいた翻訳ライブラリの口（使えないものは警告して undefined を返す）。 */
const UNSUPPORTED_METHODS = new Set([
  "init",
  "use",
  "services",
  "store",
  "addResource",
  "addResources",
  "addResourceBundle",
  "hasResourceBundle",
  "getResourceBundle",
  "getDataByLanguage",
  "loadNamespaces",
  "loadLanguages",
  "reloadResources",
  "isInitialized",
  "isInitializing",
  "format",
  "dir",
  "languages",
  "resolvedLanguage"
]);

export function createLegacyI18n(
  host: () => MaplatUiElement | null
): LegacyI18n {
  const listeners = new Set<(lang: string) => void>();
  const warned = new Set<string>();

  const current = (): MaplatUiElement | null => host();

  const changeLanguage = async (lang: string): Promise<void> => {
    const el = current();
    if (!el) return;
    el.setAttribute("lang", lang);
    // 属性の変更は要素が非同期に読む（#reloadLang）。読み終えてから解決する
    await el.whenI18nReady();
    const actual = el.currentLang;
    for (const listener of [...listeners]) listener(actual);
  };

  const facade: LegacyI18n = {
    get language() {
      const el = current();
      return el ? el.currentLang : "";
    },
    t: (key, option) => {
      const el = current();
      return el ? el.t(key, option) : key;
    },
    exists: key => {
      const el = current();
      return el ? el.hasTranslation(key) : false;
    },
    changeLanguage,
    on: (type, handler) => {
      if (type === "languageChanged") listeners.add(handler);
      else warnOnce(warned, type);
    },
    off: (type, handler) => {
      if (type === "languageChanged") listeners.delete(handler);
    }
  };

  // 旧 UI が呼んでいた翻訳ライブラリの口のうち、対応していないものは警告して undefined を返す。
  // `then` を返すと `await ui.i18n` が永遠に待つので、関数を返すのは既知のメソッドだけにする。
  return new Proxy(facade, {
    get(target, prop, receiver) {
      if (prop in target) return Reflect.get(target, prop, receiver);
      // 記号（Symbol.toStringTag 等）は素通しする（undefined を返すと調べる側が壊れる）
      if (typeof prop !== "string" || !UNSUPPORTED_METHODS.has(prop))
        return Reflect.get(target, prop, receiver);
      warnOnce(
        warned,
        prop,
        `ui.i18n.${prop}() is not available on the compatibility layer (backed by <maplat-ui>).`
      );
      return () => undefined;
    }
  });
}

function warnOnce(warned: Set<string>, key: string, message?: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(
    message ??
      `ui.i18n: "${key}" is not supported by the compatibility layer; ignored.`
  );
}
