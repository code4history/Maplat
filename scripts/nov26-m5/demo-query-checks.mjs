/**
 * demo-query-checks.mjs — nov26-m5-t2（NayutaProducts#28 B-UI-5）開発用デモのクエリ許可リストの検査の共通部
 *
 * 正本: docs/superpowers/specs/2026-10-11-nov26-m5-t2-task-design.md（v2）§3.3
 *
 * e2e（e2e/nov26-m5-t2-demo-query.spec.ts）と配備後検査（verify-demo-query-allowlist.mjs）が
 * 同じ判定を使うために、検査の定義と 1 本ごとの実行関数をここだけに置く。
 *
 * - URL は文字列の連結で作る（baseUrl + "?" + query）。クエリ組み立ての API を使うと payload の
 *   記号が percent-encode され、是正前のデモ（値をデコードしない）では発火しなくなり、検査が空になる
 * - 例外はすべて verdict "error" に落とし、"pass" には落とさない（fail-closed）
 * - 本モジュールはブラウザを用意しない。呼び出し側が起動済みの browser を渡す
 */

/** lodash.template の記法の payload（lodash の Core で評価されると発火する） */
export const XSS_PAYLOAD = "${Reflect.set(window,/__nov26m5t2/.source,1)}";
/**
 * Nunjucks の記法の payload（Nunjucks の Core で評価されると発火する。lodash の Core では発火しない）。
 * クエリに入れたときの "+"・"%20" の揺れを避けるため空白を含めない
 */
export const XSS_PAYLOAD_NUNJUCKS =
  '{{range.constructor("Reflect.set(window,/__nov26m5t2/.source,1)")()}}';
/** #status が終端状態になるまで待つ上限（公開デモは重い） */
export const READY_TIMEOUT_MS = 60_000;
/** 終端状態の後に payload の発火を待つ観測窓 */
export const SETTLE_MS = 10_000;
/** 観測窓の較正の上限（是正前の発火がこれ以内であること） */
export const CALIBRATION_MAX_MS = SETTLE_MS / 2;
const POLL_MS = 250;

export const CHECKS = [
  {
    id: "C1",
    query: "appid=..%2Fx",
    expectStatus: "READY appid=sample lang=ja",
    xss: false
  },
  {
    id: "C2",
    query: "appid=sample_old&lang=en",
    expectStatus: "READY appid=sample_old lang=en",
    xss: false
  },
  {
    id: "C3",
    query: `appid=sample&poiTemplate=${XSS_PAYLOAD}`,
    expectStatus: "READY appid=sample lang=ja",
    xss: true
  },
  {
    // C3 と同じ役を Nunjucks の Core で負う（Nunjucks の Core では C3 の payload は許可リストが
    // 壊れても発火せず、C3 の緑が空振りになるため）
    id: "C3n",
    query: `appid=sample&poiTemplate=${XSS_PAYLOAD_NUNJUCKS}`,
    expectStatus: "READY appid=sample lang=ja",
    xss: true
  }
];

/** baseUrl の形の検査: "/" で終わり "?"・"#" を含まない http(s) の URL */
export function isValidBaseUrl(baseUrl) {
  return (
    typeof baseUrl === "string" &&
    /^https?:\/\//.test(baseUrl) &&
    baseUrl.endsWith("/") &&
    !baseUrl.includes("?") &&
    !baseUrl.includes("#")
  );
}

/** 検査 1 本の URL（文字列の連結のみ） */
export function checkUrl(baseUrl, check) {
  return `${baseUrl}?${check.query}`;
}

/**
 * #status が終端状態（"READY " または "読み込み失敗" で始まる）になるまで待ち、その文字を返す。
 * 待ちが切れたら例外。
 */
export async function waitTerminalStatus(page, timeout = READY_TIMEOUT_MS) {
  const handle = await page.waitForFunction(
    () => {
      const el = document.getElementById("status");
      const t = el ? el.textContent || "" : "";
      return t.startsWith("READY ") || t.startsWith("読み込み失敗") ? t : false;
    },
    null,
    { timeout, polling: POLL_MS }
  );
  return handle.jsonValue();
}

/**
 * 終端状態の後、SETTLE_MS の間 window.__nov26m5t2 === 1 を待つ。
 * → { fired, firedAfterReadyMs }（終端状態の時点で既に 1 なら 0）
 */
export async function observeFire(page, settleMs = SETTLE_MS) {
  const t0 = Date.now();
  for (let first = true; ; first = false) {
    const v = await page.evaluate(() => window.__nov26m5t2);
    if (v === 1) {
      return { fired: true, firedAfterReadyMs: first ? 0 : Date.now() - t0 };
    }
    if (Date.now() - t0 >= settleMs) {
      return { fired: false, firedAfterReadyMs: null };
    }
    await page.waitForTimeout(POLL_MS);
  }
}

/**
 * 検査 1 本を走らせる。
 * → { id, verdict: "pass"|"red"|"error", status, fired, firedAfterReadyMs, detail }
 */
export async function runCheck(browser, baseUrl, check) {
  const result = {
    id: check && typeof check.id === "string" ? check.id : "?",
    verdict: "error",
    status: null,
    fired: null,
    firedAfterReadyMs: null,
    detail: ""
  };
  if (!isValidBaseUrl(baseUrl)) {
    result.detail = `baseUrl の形が不正: ${String(baseUrl)}`;
    return result;
  }
  if (!check || typeof check.query !== "string") {
    result.detail = "check の形が不正";
    return result;
  }
  let context;
  try {
    context = await browser.newContext();
    const page = await context.newPage();
    page.on("dialog", d => {
      d.dismiss().catch(() => {});
    });
    const url = checkUrl(baseUrl, check);
    const resp = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: READY_TIMEOUT_MS
    });
    if (!resp) {
      result.detail = `主文書の応答が無い: ${url}`;
      return result;
    }
    if (resp.status() >= 400) {
      result.detail = `主文書の応答が ${resp.status()}: ${url}`;
      return result;
    }
    let status;
    try {
      status = await waitTerminalStatus(page);
    } catch (e) {
      const now = await page
        .evaluate(() => document.getElementById("status")?.textContent ?? null)
        .catch(() => null);
      result.status = now;
      result.detail = `#status が終端状態にならない（${READY_TIMEOUT_MS} ms）: ${String(e && e.message ? e.message : e).split("\n")[0]}`;
      return result;
    }
    result.status = status;
    if (check.xss) {
      const obs = await observeFire(page);
      result.fired = obs.fired;
      result.firedAfterReadyMs = obs.firedAfterReadyMs;
    }
    const statusOk = status === check.expectStatus;
    const xssOk = !check.xss || result.fired === false;
    result.verdict = statusOk && xssOk ? "pass" : "red";
    const why = [];
    if (!statusOk) {
      why.push(`#status が期待と違う（期待: ${check.expectStatus}）`);
    }
    if (!xssOk) {
      why.push("payload が発火した");
    }
    result.detail = why.join("・");
    return result;
  } catch (e) {
    result.verdict = "error";
    result.detail = `例外: ${String(e && e.message ? e.message : e).split("\n")[0]}`;
    return result;
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
  }
}

/**
 * 終了コードの判定: error が 1 つでもあれば 2、無くて red があれば 1、
 * 全部 pass で件数が CHECKS.length と一致すれば 0。件数 0・不足・未知の verdict は 2。
 */
export function decideExit(results) {
  if (!Array.isArray(results) || results.length !== CHECKS.length) {
    return 2;
  }
  const verdicts = results.map(r =>
    r && typeof r === "object" ? r.verdict : undefined
  );
  if (verdicts.some(v => v !== "pass" && v !== "red")) {
    return 2;
  }
  if (verdicts.some(v => v === "red")) {
    return 1;
  }
  return 0;
}
