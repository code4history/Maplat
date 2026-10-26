#!/usr/bin/env node
/**
 * verify-demo-query-allowlist.mjs — nov26-m5-t2（NayutaProducts#28 B-UI-5）配備後検査
 *
 * 正本: docs/superpowers/specs/2026-10-11-nov26-m5-t2-task-design.md（v2）§3.4・§8
 *
 * 使い方: node scripts/nov26-m5/verify-demo-query-allowlist.mjs [baseUrl]
 *   baseUrl の既定は https://code4history.dev/Maplat/（"/" で終わり "?"・"#" を含まないこと）
 *
 * 公開デモ（または手元のデモ）に demo-query-checks.mjs の CHECKS（C1〜C3n）を当て、
 * 1 本ごとに 1 行の JSON を出し、最後に {"exit":N,...} を出して終了する。
 *
 * 終了コードの契約:
 *   0 = 全部合う（許可リストが効いている）
 *   1 = 検査が赤（許可リスト外のキーが効いた・payload が発火した・表示が期待と違う）
 *   2 = 走らせられなかった（ブラウザが無い・起動できない・ページが開けない・#status が終端状態に
 *       ならない・引数の誤り・内部例外・件数不足）。2 は緑ではない
 *   ※ oct26-m10 の検査（2 = FAIL・3 = 環境エラー）とは数の割り当てが違う
 *
 * ブラウザは共有の置き場にあるものを使うだけで、このスクリプトは用意しない（無ければ exit 2）。
 *
 * 最終行の calibration は観測窓の較正（C3 が発火した場合の firedAfterReadyMs が
 * SETTLE_MS / 2 以下か）を示す。是正前の記録で ok: false なら観測窓が足りる根拠が無い
 * （設計 §6 の 4・5、タスク設計レビュー MIN-3）。終了コードには影響しない。
 */
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";
import {
  CALIBRATION_MAX_MS,
  CHECKS,
  decideExit,
  isValidBaseUrl,
  runCheck
} from "./demo-query-checks.mjs";

const DEFAULT_BASE = "https://code4history.dev/Maplat/";

function out(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) {
    out({ error: "bad-args", detail: "引数は baseUrl の 1 つだけ" });
    return 2;
  }
  const base = args[0] ?? DEFAULT_BASE;
  if (!isValidBaseUrl(base)) {
    out({
      error: "bad-args",
      detail: `baseUrl は http(s) で "/" で終わり "?"・"#" を含まないこと: ${base}`
    });
    return 2;
  }
  let exe;
  try {
    exe = chromium.executablePath();
  } catch (e) {
    out({
      error: "browser-missing",
      detail: String(e && e.message ? e.message : e)
    });
    return 2;
  }
  if (!exe || !existsSync(exe)) {
    out({
      error: "browser-missing",
      path: exe ?? null,
      hint: "共有のブラウザ置き場に @playwright/test の版に合う chromium が無い。このスクリプトはブラウザを用意しない。用意は人間に依頼する"
    });
    return 2;
  }
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    out({
      error: "browser-launch-failed",
      detail: String(e && e.message ? e.message : e).split("\n")[0]
    });
    return 2;
  }
  const results = [];
  try {
    for (const check of CHECKS) {
      const r = await runCheck(browser, base, check);
      results.push(r);
      out(r);
    }
  } finally {
    await browser.close().catch(() => {});
  }
  const exit = decideExit(results);
  const c3 = results.find(r => r.id === "C3");
  const calibration =
    c3 && c3.fired === true
      ? {
          firedAfterReadyMs: c3.firedAfterReadyMs,
          max: CALIBRATION_MAX_MS,
          ok: c3.firedAfterReadyMs <= CALIBRATION_MAX_MS
        }
      : null;
  out({ exit, base, calibration });
  return exit;
}

main().then(
  code => process.exit(code),
  e => {
    out({ error: "internal", detail: String(e && e.message ? e.message : e) });
    process.exit(2);
  }
);
