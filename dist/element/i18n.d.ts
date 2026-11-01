import { Localized } from '@maplat/core/common';
type Dict = Record<string, string>;
/** 使う言語ファイルの言語。無い言語は基底（en-US → en）→ en。 */
export declare function resolveLanguage(lang: string): string;
/**
 * 言語の辞書を読む（内蔵の辞書 + 言語ファイル。言語ファイルが正）。読み込みに失敗したら en に落ちる。
 * 戻り値はその言語だけで使う平らな辞書（translateKey に渡す）。
 */
export declare function loadLanguage(lang: string): Promise<Dict>;
/** 旧 UI と同じ正規化（ui_init.ts の i18nLoader: zh-hk・zh-hant は zh-TW）。 */
export declare function normalizeLang(lang: string): string;
/**
 * 文言のキー → 文字列。strings（loadLanguage の戻り値）があればそれを、無ければ内蔵の辞書（層 B の上書きを
 * 重ねたもの）を使う。キーが無ければ en → キー。旧の辞書の入れ子（$t）と差し込み（{{name}}）を解く。
 */
export declare function translateKey(lang: string, key: string, option?: Record<string, unknown>, strings?: Dict): string;
/**
 * 多言語の文字列（{ja: "…", en: "…"}）から lang の値を選ぶ（旧 MaplatUi.translate の選び方:
 * 現在の言語 → en → 最初の空でない言語。空文字の言語は候補にしない。全部空なら ""）。
 */
export declare function pickLocalized(fragment: Localized | undefined | null, lang: string): string | undefined;
export {};
