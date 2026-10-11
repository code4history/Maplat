// <maplat-ui> の文言。旧 UI は i18next と assets/locales/<lang>/translation.json を使うが、
// 今の版は操作ボタン・切り替えメニュー・吹き出し・マーカー一覧・選択メニュー・共有に要る文言だけを持つ
// （ja・en。ほかの言語は en に落ちる。全言語化は後のまとまり）。文言は旧 UI の assets/locales の
// control.*・html.*・app.* に合わせた（menu.*・html.share_qr は旧 UI に無い。旧はスワイパーで、選択メニューに見出しが無かった）。
//
// import は @maplat/core/common の型だけ（<maplat-ui> の依存の規則。spec/element-deps.spec.ts）。
import type { Localized } from "@maplat/core/common";

type Dict = Record<string, string>;

const STRINGS: Record<string, Dict> = {
  ja: {
    "control.zoom_in": "拡大",
    "control.zoom_out": "縮小",
    "control.home": "ホーム位置復帰",
    "control.compass": "回転解除",
    "control.compass_north": "北を上にする",
    "control.gps": "GPS位置取得",
    "control.trans": "地図透明度変更",
    "control.map_menu": "地図の切り替え",
    "menu.base_maps": "背景地図",
    "menu.overlay_maps": "古地図・重ね地図",
    "menu.poi_candidates": "スポットを選ぶ",
    "control.marker_list": "マーカー一覧表示",
    "html.marker_list_title": "マーカー一覧表示",
    "html.close": "閉じる",
    "control.share": "共有",
    "html.share_title": "共有",
    "html.share_app_title": "このアプリを共有",
    "html.share_state_title": "現在の表示場所を共有",
    "html.share_copy": "コピー",
    "html.share_qr": "QR コード",
    "app.copy_toast": "クリップボードにコピーされました"
  },
  en: {
    "control.zoom_in": "Zoom in",
    "control.zoom_out": "Zoom out",
    "control.home": "Go Home Position",
    "control.compass": "Reset Rotation",
    "control.compass_north": "Turn North Up",
    "control.gps": "Acquire GPS Position",
    "control.trans": "Change Map Transparency",
    "control.map_menu": "Switch maps",
    "menu.base_maps": "Base maps",
    "menu.overlay_maps": "Old maps / overlays",
    "menu.poi_candidates": "Choose a spot",
    "control.marker_list": "Marker list",
    "html.marker_list_title": "Marker list",
    "html.close": "Close",
    "control.share": "Share",
    "html.share_title": "Share",
    "html.share_app_title": "Share this application",
    "html.share_state_title": "Share current viewpoint",
    "html.share_copy": "Copy",
    "html.share_qr": "QR code",
    "app.copy_toast": "Copied to clipboard"
  }
};

/** 旧 UI と同じ正規化（ui_init.ts の i18nLoader: zh-hk・zh-hant は zh-TW）。 */
export function normalizeLang(lang: string): string {
  const lower = lang.toLowerCase();
  if (lower === "zh-hk" || lower === "zh-hant") return "zh-TW";
  return lang;
}

/** 文言のキー → 文字列（言語 → 言語の基底（en-US → en）→ en → キー）。{{name}} を option で埋める。 */
export function translateKey(
  lang: string,
  key: string,
  option?: Record<string, unknown>
): string {
  const base = lang.split("-")[0];
  const text =
    STRINGS[lang]?.[key] ?? STRINGS[base]?.[key] ?? STRINGS.en[key] ?? key;
  if (!option) return text;
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, name: string) =>
    option[name] === undefined ? m : String(option[name])
  );
}

/**
 * 多言語の文字列（{ja: "…", en: "…"}）から lang の値を選ぶ（旧 MaplatUi.translate の選び方:
 * 現在の言語 → en → 最初の空でない言語。空文字の言語は候補にしない。全部空なら ""）。
 */
export function pickLocalized(
  fragment: Localized | undefined | null,
  lang: string
): string | undefined {
  if (fragment == null) return undefined;
  if (typeof fragment === "string") return fragment;
  if (typeof fragment !== "object") return String(fragment);
  let first: string | undefined;
  let en: string | undefined;
  for (const [key, value] of Object.entries(fragment)) {
    if (!value) continue;
    if (key === lang) return value;
    if (key === "en" && en === undefined) en = value;
    if (first === undefined) first = value;
  }
  return en ?? first ?? "";
}
