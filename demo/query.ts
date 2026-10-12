// nov26-m5-t2（NayutaProducts#28 B-UI-5）: 開発用デモが URL のクエリから受け付けるキーの許可リスト。
// 以前は全キーを option へ入れており、?poiTemplate=${…} で反射型 XSS になった。
export interface DemoQuery {
  appid?: string;
  lang?: string;
}

/** apps/<appid>.json・pwa/<appid>_manifest.json のパスに入るので / . % を通さない */
export const DEMO_APPID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** BCP 47 の簡略形（ja・en・zh-TW 等） */
export const DEMO_LANG_PATTERN = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/;

/**
 * location.search から appid・lang だけを、値の形を検査して取り出す。
 * 他のキー・形の合わない値は黙って捨てる。例外は出さない。
 * 戻り値は明示の代入だけで作る（動的なキーの代入をしない）。
 */
export function parseDemoQuery(search: string): DemoQuery {
  const result: DemoQuery = {};
  if (typeof search !== "string" || search === "") {
    return result;
  }
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return result;
  }
  const appid = params.get("appid");
  if (appid !== null && DEMO_APPID_PATTERN.test(appid)) {
    result.appid = appid;
  }
  const lang = params.get("lang");
  if (lang !== null && DEMO_LANG_PATTERN.test(lang)) {
    result.lang = lang;
  }
  return result;
}
