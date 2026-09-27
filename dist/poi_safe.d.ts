/**
 * `value` が http/https の URL（相対 URL は現在の文書を基点に解決して判定）のときだけ
 * `value` をそのまま返す。それ以外（javascript:・data:・vbscript: など、文字列でない値、
 * 空文字、解析できない値）は undefined を返す。
 *
 * 判定には WHATWG URL パーサ（ブラウザが実際に遷移先を解釈するのと同じもの）を使うので、
 * 大文字混じり・前後の空白・途中のタブや改行によるスキームの偽装も同じ規則で正規化される。
 */
export declare function safeWebUrl(value: unknown): string | undefined;
/**
 * HTML のテキスト・属性値（二重引用符・単一引用符のどちらで囲んでも）へ
 * 補間するための実体参照化。文字列以外は、変更前のテンプレート補間と同じく String() で文字列にする。
 */
export declare function escapeHtml(value: unknown): string;
/**
 * POI 一覧（マーカーリスト）のレイヤ行。
 * テンプレートは変更前（src/ui_init.ts, 5a27bb77）と同一で、icon と label を実体参照化する点だけが違う。
 */
export declare function layerListItemHtml(icon: unknown, label: unknown, hide: boolean): string;
/**
 * POI 一覧（マーカーリスト）の POI 行。
 * テンプレートは変更前（src/ui_init.ts, 5a27bb77）と同一で、icon と label を実体参照化する点だけが違う。
 */
export declare function poiListItemHtml(icon: unknown, label: unknown): string;
