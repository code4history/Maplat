import { MaplatUiElement } from '../element';
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
export declare function createLegacyI18n(host: () => MaplatUiElement | null): LegacyI18n;
