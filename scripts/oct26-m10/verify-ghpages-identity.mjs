#!/usr/bin/env node
/**
 * verify-ghpages-identity.mjs — oct26-m10-t1 配信同一性検査（G 層・H 層）
 *
 * 識別語: OCT26-M10T1-IMPL-HOTARU（是正: OCT26-M10T1-FIX-TSUBAME）
 *
 * 正本: docs/superpowers/specs/2026-09-16-oct26-m10-design.md（v2）
 *   - §4.3  基準値マニフェスト（凍結証跡）の処遇
 *   - §4.5  自己参照 fix commit（allowlist が律する予期差分 2 件）
 *   - §4.6  配信同一性の機械検査の設計（G/H/P 3 層と fail-closed 契約）
 *   - §9.1  人間手順書（fix commit の機械採取手順）
 *
 * 層の構成（本スクリプトは G と H。P 層は verify-switch.mjs）:
 *   G 層 (--git)            : ghpages-tree-baseline.json（6975 blob SHA）と
 *                            PlatSeries 作業 clone の `git ls-tree -r gh-pages` を
 *                            全件比較する。差分が allowlist 内のみなら green。
 *                            追加専用エントリ（.nojekyll）も内容（blob SHA）を照合する。
 *   H 層 (--http)          : 旧 Maplat Pages と新 PlatSeries Pages を同時点で取得して
 *                            status・sha256(body)・content-type を比較する。
 *                            対象 = 52 HTML + apps/*.json 40 件 + 代表資産 6 件
 *                            + 安定抽出サンプル 100 件（path を sha256 昇順に並べ
 *                            先頭 100 件。決定的・乱数不使用）。
 *                            旧 == 新（byte 同一）は allowlist の如何に依らず PASS。
 *                            旧 != 新のとき初めて allowlist（fix 後期待値）を参照する
 *                            （G 層と同じ「差分があるときだけ allowlist を見る」構造。
 *                            §9.1 手順 6 の「AC3 が fix commit 前に green」を可能にする）。
 *
 * 基準値 baseline の生成コマンドの記録（§4.3「手書き禁止・機械変換」の履行）:
 *   node scripts/oct26-m10/verify-ghpages-identity.mjs --make-baseline
 *     → `git ls-tree -r -z origin/gh-pages`（作業リポジトリ = 本リポジトリで実行）
 *       の出力をそのまま機械変換して ghpages-tree-baseline.json へ書く。
 *       -z は NUL 区切り・パス無 quote の機械可読形式（手書きでは 1 行も書かない）。
 *       書き込みは整合検査（総数/HTML/apps/先端の設計期待値照合）に合格してから行う
 *       （検査 FAIL なら 1 バイトも書かない）。既存 baseline があるときは退避コピー
 *       （<path>.bak-<ISO8601>。既存ファイルは消さない）を作ってから書く。
 *   ※ baseline は凍結証跡（§4.3-1）。t4 の deploy 後は再生成しない。
 *
 * リダイレクトの扱い（§4.6-H・§1.3-5・v1 レビュー Major-2 の是正）:
 *   code4history.github.io/<Repo>/ への要求は org の custom domain により
 *   301 で http://code4history.dev/<Repo>/（https でない点に注意）へ飛び得る。
 *   本スクリプトは Node fetch を redirect:'manual' で呼び、**自前で** Location を
 *   追従し（上限 10 hop）、**最終応答の status とバイト**を比較対象とする。
 *   初段 301 と最終 200 を見分けられない「status line の目視一致」は使わない。
 *
 * 終了コード契約（fail-closed・§4.6「検査スクリプトの終了コード契約」）:
 *   0: 全検査を実行し、すべての期待と一致（成功のみが到達できる）
 *   2: 検査 FAIL（期待との不一致・status 非 200・sha256 不一致・content-type
 *      不一致・allowlist 外の差分・未採取（PENDING）のまま検査に使った・分母不足）
 *   3: 実行環境のエラー（git コマンド失敗・比較先リポジトリの欠損・ネットワーク
 *      例外・fetch の throw・DNS・タイムアウト・リダイレクト過多）
 *   4: 基準値ファイルの欠損・破損・パース失敗・引数・mode の誤り
 *   5: その他の内部例外（スクリプト自身のバグ）
 *   --selftest のみ別契約: 0 = 全ケース緑 / 1 = ケース不整合
 *
 *   「例外を catch して exit 0 にする」経路は存在しない。try/catch はログ整形の
 *   ためにだけ使い、catch 経路は必ず非ゼロで終了する。「例外＝検証できていない」
 *   であり、検証できていない状態は決して green ではない。
 *   分母が空（列挙 0 件・期待件数未満）も FAIL とする（無条件 green の排除）。
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---- 位置と定数（設計 §1.1・§4.3・§4.6 の実測値・設計値） ----

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const BASELINE_PATH = path.join(SCRIPT_DIR, "ghpages-tree-baseline.json");
const ALLOWLIST_PATH = path.join(SCRIPT_DIR, "allowlist.json");
const CAPTURES_DIR = path.join(SCRIPT_DIR, "captures");

const BASELINE_SCHEMA = "oct26-m10-ghpages-tree-baseline";
const ALLOWLIST_SCHEMA = "oct26-m10-allowlist";
const HTTP_CAPTURE_SCHEMA = "oct26-m10-http-live-live";

/** allowlist の「未採取」を表す明示値（null を使わない。§4.3・委任仕様） */
export const PENDING = "PENDING";

const DESIGN_EXPECT = {
  /** §1.1: gh-pages ファイル総数 */
  total: 6975,
  /** §1.1: HTML ファイル数（52 = 46 トップレベル + dist/index.html 等 6 件。§1.2-10） */
  html: 52,
  /** §1.1: apps/ 直下（全 40 件が apps/*.json） */
  appsJson: 40,
  /** §4.6-H: 安定抽出サンプル件数 */
  sample: 100,
  /** §9.1 手順 4 の確認値・§6.1 G2（baseline 生成時点の想定先端） */
  tip: "ee6f935a4ca0dbec374972b29dc3430782529bdf",
};

/** §4.6-H の代表資産（設計が列挙する 6 件） */
const REPRESENTATIVE_ASSETS = [
  "index.html",
  "service-worker.js",
  "assets/maplat.js",
  "assets/maplat.css",
  "appsIndex.json",
  "sitemap.xml",
];

/** §9.1 手順 1 で人間が作る PlatSeries 作業 clone のパス（--git の既定値） */
const DEFAULT_REPO = "/Users/kochizufan/zcode/NayutaProducts/PlatSeries";
/** §4.6-H の旧・新 Pages の URL 接頭辞 */
const OLD_BASE_DEFAULT = "https://code4history.github.io/Maplat/";
const NEW_BASE_DEFAULT = "https://code4history.github.io/PlatSeries/";

const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;

/** 終了コード（fail-closed 契約） */
export const EXIT = Object.freeze({
  PASS: 0,
  FAIL: 2,
  ENV: 3,
  USAGE: 4,
  INTERNAL: 5,
});

// ---- エラー分類（例外と条件偽を区別するための 2 クラス） ----

/** 引数・mode・基準値ファイルの誤り → exit 4 */
export class UsageError extends Error {}
/** 実行環境のエラー（git・ネットワーク・タイムアウト） → exit 3 */
export class EnvError extends Error {}

// ---- 小ユーティリティ ----

export const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const sha256Buf = (b) => createHash("sha256").update(b).digest("hex");

const isPending = (v) => v === PENDING;

function git(cwd, ...args) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    const stderr = (e.stderr ? Buffer.from(e.stderr).toString("utf8") : "").trim();
    throw new EnvError(
      `git ${args.join(" ")} が失敗（cwd=${cwd}）${stderr ? `: ${stderr.split("\n")[0]}` : `: ${e.message}`}`,
    );
  }
}

/** URL パスとして安全化（ASCII 木では無変換。非 ASCII が出ても破綻しない） */
const encodeTreePath = (p) => p.split("/").map(encodeURIComponent).join("/");

// ---- git ls-tree 出力の解析 ----

/**
 * `git ls-tree -r -z <ref>` の出力（NUL 区切り）をエントリ列へ機械変換する。
 * 手書きは一切行わない（§4.3）。形式: `<mode> SP <type> SP <sha>\t<path>`
 */
export function parseLsTreeZ(zText) {
  const entries = [];
  for (const rec of String(zText).split("\0")) {
    if (!rec) continue;
    const tab = rec.indexOf("\t");
    if (tab < 0) throw new EnvError(`ls-tree の行形式が読めない: ${rec.slice(0, 80)}`);
    const [mode, type, sha] = rec.slice(0, tab).split(" ");
    const p = rec.slice(tab + 1);
    if (!mode || !type || !HEX40.test(sha ?? "") || !p) {
      throw new EnvError(`ls-tree の行形式が読めない: ${rec.slice(0, 80)}`);
    }
    entries.push({ mode, type, sha, path: p });
  }
  return entries;
}

// ---- 基準値（baseline）の生成と解釈 ----

/**
 * baseline をディスクへ書く。tree は 1 エントリ 1 行（grep 可能・diff 可能な形式）。
 * タイムスタンプを含めないため、同じ木からは常にバイト同一のファイルが生成される
 * （生成器の決定性。shasum による再照合が可能）。
 */
function serializeBaseline(doc) {
  const { tree, ...head } = doc;
  // head 部（tree 以外の全フィールド）は通常の 2 スペース JSON。
  // 末尾の "\n}" を "," に置き換えて tree 配列を接続する。
  const headText = JSON.stringify(head, null, 2);
  const body = tree.map((e) => `    ${JSON.stringify(e)}`).join(",\n");
  return `${headText.slice(0, -2)},\n  "tree": [\n${body}\n  ]\n}\n`;
}

/**
 * --make-baseline: `git ls-tree -r -z origin/gh-pages` を機械変換して
 * ghpages-tree-baseline.json を書く。§4.3 の「コマンド出力の機械変換（手書き禁止）」。
 * 総数・先端が設計 §1.1/§9.1 の期待と食い違う場合は FAIL(2) する
 * （fail-closed: baseline は設計時点の木であることが前提）。
 *
 * 書き込み順序（実装レビュー Minor-3 の是正）:
 *   1. 整合検査（総数/html/apps/tip の設計期待値照合）を先に行う。
 *   2. 検査に失敗した場合は baseline を 1 バイトも書かず FAIL(2) で終了する
 *      （誤った木で凍結証跡を壊す経路を封じる）。
 *   3. 検査に合格した場合のみ、既存 baseline があれば退避コピー
 *      （<path>.bak-<ISO8601>。既存ファイルは消さない・上書きしない）を
 *      作ってから書く。
 *
 * io は自己テスト用の差し替え点（git・exists・copy・write・baselinePath・nowIso）。
 * 既定は本物の git・fs へ繋がる。
 */
export function makeBaseline(print, printErr, io = {}) {
  const gitImpl = io.git ?? git;
  const existsImpl = io.exists ?? existsSync;
  const copyImpl = io.copy ?? copyFileSync;
  const writeImpl = io.write ?? writeFileSync;
  const baselinePath = io.baselinePath ?? BASELINE_PATH;
  const nowIso = io.nowIso ?? (() => new Date().toISOString());
  const tip = gitImpl(REPO_ROOT, "rev-parse", "origin/gh-pages").trim();
  const entries = parseLsTreeZ(gitImpl(REPO_ROOT, "ls-tree", "-r", "-z", "origin/gh-pages"));
  const html = entries.filter((e) => e.path.endsWith(".html")).length;
  const appsJson = entries.filter((e) => /^apps\/[^/]+\.json$/.test(e.path)).length;
  const doc = {
    schema: BASELINE_SCHEMA,
    version: 1,
    design_doc: "docs/superpowers/specs/2026-09-16-oct26-m10-design.md §4.3（v2）",
    generated_from: "origin/gh-pages",
    generated_with: "git ls-tree -r -z origin/gh-pages",
    generated_by:
      "node scripts/oct26-m10/verify-ghpages-identity.mjs --make-baseline（コマンド出力の機械変換。手書き 0 行）",
    tip_commit: tip,
    entry_count: entries.length,
    counts: { html, apps_json: appsJson, total: entries.length },
    tree: entries,
  };
  // ★ 整合検査を書き込みより先に行う（Minor-3 是正: 失敗時に凍結証跡を壊さない）。
  const problems = [];
  if (entries.length !== DESIGN_EXPECT.total) {
    problems.push(
      `総数が設計 §1.1 の実測（${DESIGN_EXPECT.total}）と不一致: ${entries.length}`,
    );
  }
  if (html !== DESIGN_EXPECT.html) {
    problems.push(`HTML 数が設計 §1.1 の実測（${DESIGN_EXPECT.html}）と不一致: ${html}`);
  }
  if (appsJson !== DESIGN_EXPECT.appsJson) {
    problems.push(
      `apps/*.json 数が設計 §1.1 の実測（${DESIGN_EXPECT.appsJson}）と不一致: ${appsJson}`,
    );
  }
  if (tip !== DESIGN_EXPECT.tip) {
    problems.push(
      `gh-pages 先端が設計 §9.1/§6.1 G2 の想定（${DESIGN_EXPECT.tip.slice(0, 8)}）と不一致: ${tip.slice(0, 8)}`,
    );
  }
  if (problems.length) {
    for (const p of problems) {
      printErr(`⚠ ${p}`);
    }
    printErr(
      "baseline は書かない（検査 FAIL。誤った木で凍結証跡を上書きしない）。" +
        "gh-pages が設計後に変わっていないか確認すること。",
    );
    return EXIT.FAIL;
  }
  // 既存 baseline の退避（既存ファイルは消さない・上書きしない）。
  if (existsImpl(baselinePath)) {
    const stamp = nowIso().replace(/[:.]/g, "-");
    const backup = `${baselinePath}.bak-${stamp}`;
    copyImpl(baselinePath, backup);
    print(`既存 baseline を退避した: ${backup}`);
  }
  writeImpl(baselinePath, serializeBaseline(doc), "utf8");
  print(`baseline を書いた: ${baselinePath}`);
  print(`  tip=${tip} entry_count=${entries.length} html=${html} apps/*.json=${appsJson}`);
  print("  設計 §1.1/§9.1 の期待値と一致。");
  return EXIT.PASS;
}

/**
 * baseline の解釈と整合検査。破損・矛盾はすべて exit 4 相当（problems）として返す。
 */
export function parseBaseline(text) {
  const problems = [];
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (e) {
    return { ok: false, problems: [`baseline を JSON として parse できない: ${e.message}`] };
  }
  if (doc?.schema !== BASELINE_SCHEMA) {
    problems.push(`schema が ${BASELINE_SCHEMA} でない（実: ${JSON.stringify(doc?.schema)}）`);
  }
  if (!Array.isArray(doc?.tree)) {
    problems.push("tree 配列が無い");
  } else {
    if (doc.tree.length === 0) problems.push("tree 配列が空（分母が空）");
    for (const e of doc.tree) {
      if (
        !e ||
        typeof e.path !== "string" ||
        !e.path ||
        !HEX40.test(e.sha ?? "") ||
        typeof e.mode !== "string" ||
        typeof e.type !== "string"
      ) {
        problems.push(
          `tree エントリの形式が不正: ${String(JSON.stringify(e)).slice(0, 120)}`,
        );
        break;
      }
    }
    if (doc.entry_count !== doc.tree.length) {
      problems.push(
        `entry_count（${JSON.stringify(doc.entry_count)}）が tree の実長（${doc.tree.length}）と不一致`,
      );
    }
    const html = doc.tree.filter((e) => e.path.endsWith(".html")).length;
    const apps = doc.tree.filter((e) => /^apps\/[^/]+\.json$/.test(e.path)).length;
    if (doc.counts?.html !== html) {
      problems.push(
        `counts.html（${JSON.stringify(doc.counts?.html)}）が実測（${html}）と不一致`,
      );
    }
    if (doc.counts?.apps_json !== apps) {
      problems.push(
        `counts.apps_json（${JSON.stringify(doc.counts?.apps_json)}）が実測（${apps}）と不一致`,
      );
    }
  }
  if (!HEX40.test(doc?.tip_commit ?? "")) {
    problems.push(`tip_commit が 40 桁 16 進でない: ${String(doc?.tip_commit)}`);
  }
  if (problems.length) return { ok: false, problems };
  return { ok: true, baseline: doc, problems: [] };
}

// ---- allowlist の解釈 ----

function validateAllowlistEntry(e, kind, problems, where) {
  if (!e || typeof e.path !== "string" || !e.path) {
    problems.push(`${where}: path が無効: ${String(JSON.stringify(e)).slice(0, 80)}`);
    return;
  }
  if (e.kind !== kind) {
    problems.push(`${where}: ${e.path} の kind が "${kind}" でない（実: ${JSON.stringify(e.kind)}）`);
  }
  if (!Number.isInteger(e.expected_change_sites) || e.expected_change_sites < 1) {
    problems.push(`${where}: ${e.path} の expected_change_sites が正の整数でない`);
  }
  if (!isPending(e.expected_blob_sha) && !HEX40.test(e.expected_blob_sha ?? "")) {
    problems.push(
      `${where}: ${e.path} の expected_blob_sha が "${PENDING}" でも 40 桁 16 進でもない（実: ${JSON.stringify(e.expected_blob_sha)}）`,
    );
  }
  if (!isPending(e.expected_sha256) && !HEX64.test(e.expected_sha256 ?? "")) {
    problems.push(
      `${where}: ${e.path} の expected_sha256 が "${PENDING}" でも 64 桁 16 進でもない（実: ${JSON.stringify(e.expected_sha256)}）`,
    );
  }
}

/**
 * allowlist.json の解釈と整合検査。期待値は fix commit 作成時に機械採取する
 * （§4.3）ため、この時点では "PENDING"。破損は exit 4 相当。
 */
export function parseAllowlist(text) {
  const problems = [];
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (e) {
    return { ok: false, problems: [`allowlist を JSON として parse できない: ${e.message}`] };
  }
  if (doc?.schema !== ALLOWLIST_SCHEMA) {
    return {
      ok: false,
      problems: [`schema が ${ALLOWLIST_SCHEMA} でない（実: ${JSON.stringify(doc?.schema)}）`],
    };
  }
  if (!Array.isArray(doc.expected_changes)) {
    problems.push("expected_changes 配列が無い");
  }
  if (!Array.isArray(doc.expected_additions)) {
    problems.push("expected_additions 配列が無い");
  }
  if (problems.length) return { ok: false, problems };

  for (const e of doc.expected_changes) validateAllowlistEntry(e, "modified", problems, "expected_changes");
  for (const e of doc.expected_additions) {
    validateAllowlistEntry(e, "add-only", problems, "expected_additions");
    if (e?.conditional !== true) {
      problems.push(`expected_additions: ${e?.path} は conditional: true でなければならない（対処時に限る特殊エントリ）`);
    }
  }
  const modifiedByPath = new Map(doc.expected_changes.map((e) => [e.path, e]));
  const addedByPath = new Map(doc.expected_additions.map((e) => [e.path, e]));
  for (const p of [...modifiedByPath.keys(), ...addedByPath.keys()]) {
    if (modifiedByPath.has(p) && addedByPath.has(p)) {
      problems.push(`path ${p} が expected_changes と expected_additions の両方にある`);
    }
  }
  if (problems.length) return { ok: false, problems };
  return {
    ok: true,
    allowlist: {
      raw: doc,
      modifiedByPath,
      addedByPath,
      /** H 層用: path → エントリ（変更・追加の全区） */
      httpByPath: new Map([...doc.expected_changes, ...doc.expected_additions].map((e) => [e.path, e])),
    },
    problems: [],
  };
}

// ---- H 層: 安定抽出サンプル（決定的） ----

/**
 * §4.6-H「tree の path を sha256 昇順に並べ先頭 100 件」。
 * sha256(path) の 16 進をキーに昇順ソートする（同値は path 辞書順）。
 * 乱数を使わないため、実行のたびに同じ 100 件が選ばれる。
 */
export function selectSample(paths, n = DESIGN_EXPECT.sample) {
  const keyed = paths.map((p) => ({ p, k: sha256Hex(p) }));
  keyed.sort((a, b) =>
    a.k < b.k ? -1 : a.k > b.k ? 1 : a.p < b.p ? -1 : a.p > b.p ? 1 : 0,
  );
  return keyed.slice(0, n).map((e) => e.p);
}

/**
 * H 層の対象 URL（tree 上の path）列挙。§4.6-H:
 *   52 HTML 全部 + apps/*.json 40 件全部（いずれも §1.1 の機械列挙に由来。
 *   手書きリストは作らない）+ 代表資産 6 件 + 安定抽出サンプル 100 件。
 * 列挙が設計の期待件数に満たない場合は problems を返す（分母不足 → FAIL）。
 */
export function enumHttpTargets(baseline, opts = {}) {
  const limit = opts.limit ?? 0;
  const problems = [];
  const paths = baseline.tree.map((e) => e.path);
  const html = paths.filter((p) => p.endsWith(".html"));
  const apps = paths.filter((p) => /^apps\/[^/]+\.json$/.test(p));
  const reps = [];
  for (const r of REPRESENTATIVE_ASSETS) {
    if (paths.includes(r)) reps.push(r);
    else problems.push(`代表資産 ${r} が baseline の木に存在しない（設計 §4.6-H と baseline が不一致）`);
  }
  const sample = selectSample(paths, DESIGN_EXPECT.sample);
  const seen = new Set();
  const targets = [];
  for (const p of [...reps, ...html, ...apps, ...sample]) {
    if (!seen.has(p)) {
      seen.add(p);
      targets.push(p);
    }
  }
  if (!limit) {
    if (html.length < DESIGN_EXPECT.html) {
      problems.push(`HTML の列挙が ${html.length} 件で設計期待（${DESIGN_EXPECT.html}）に満たない`);
    }
    if (apps.length < DESIGN_EXPECT.appsJson) {
      problems.push(`apps/*.json の列挙が ${apps.length} 件で設計期待（${DESIGN_EXPECT.appsJson}）に満たない`);
    }
    if (sample.length < DESIGN_EXPECT.sample) {
      problems.push(`サンプル抽出が ${sample.length} 件で設計期待（${DESIGN_EXPECT.sample}）に満たない`);
    }
  }
  const finalTargets = limit > 0 ? targets.slice(0, limit) : targets;
  if (finalTargets.length === 0) problems.push("対象 URL の列挙が 0 件（分母が空）");
  return {
    targets: finalTargets,
    breakdown: {
      representatives: reps.length,
      html: html.length,
      apps_json: apps.length,
      sample: sample.length,
      unique_total: targets.length,
      limit: limit > 0 ? limit : null,
    },
    problems,
  };
}

// ---- HTTP 取得（リダイレクトを明示的に追従する） ----

/**
 * GET し、3xx なら自前で Location を追従して（上限 maxHops hop）最終応答の
 * status・sha256(body)・content-type を返す。
 *
 * 明示的な設計上の理由（§1.2・§4.6-H・§1.3-5）:
 *   - code4history.github.io/<Repo>/ は 301 で http://code4history.dev/<Repo>/ へ
 *     飛び得る（https でない点も含めて追従先の実測値を残す）。
 *   - 判定に使う status は「最終応答の status」のみ。初段 301 と最終 200 を
 *     区別できない status line 目視形式は採らない（v1 レビュー Major-2）。
 * fetchImpl は差し替え可能（自己テストは固定入力で判定ロジックを叩く）。
 */
export async function httpGet(url, opts = {}) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const maxHops = opts.maxHops ?? 10;
  let current = url;
  const hops = [current];
  let res;
  for (let hop = 0; ; hop++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(new Error(`タイムアウト(${timeoutMs}ms): ${current}`)), timeoutMs);
    try {
      res = await fetchImpl(current, {
        redirect: "manual",
        signal: ac.signal,
        headers: { "user-agent": "oct26-m10-verify/1.0" },
      });
    } finally {
      clearTimeout(timer);
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      // body を読み捨ててソケットを解放する
      try {
        await res.arrayBuffer();
      } catch {
        /* 3xx body の読み捨て失敗は追従に影響しない */
      }
      if (!loc) throw new EnvError(`リダイレクト（${res.status}）に Location ヘッダが無い: ${current}`);
      if (hop >= maxHops) {
        throw new EnvError(`リダイレクトが多すぎる（>${maxHops} hop）: ${current}`);
      }
      current = new URL(loc, current).toString();
      hops.push(current);
      continue;
    }
    break;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    status: res.status,
    sha256: sha256Buf(buf),
    content_type: res.headers.get("content-type"),
    cf_cache_status: res.headers.get("cf-cache-status"),
    final_url: current,
    hops,
    bytes: buf.length,
  };
}

// ---- G 層: 木比較 ----

/**
 * baseline 木と対象木を全件比較する（§4.6-G）。
 * PASS 条件: 差分が allowlist に列挙された変更のみ（path の増減は許容しない。
 * .nojekyll の「追加のみ・対処時に限る」のみ例外）。
 * allowlist の期待 blob SHA が未採取（PENDING）のまま diff に使われたら FAIL。
 * 追加専用エントリ（.nojekyll）も内容を照合する: 追加された blob SHA が
 * allowlist の expected_blob_sha と一致することを要求する（.nojekyll は空
 * ファイル（0 バイト）のため期待値は機械的に確定できる。任意の内容の追加が
 * green になる「追加のみ・内容不問」の穴を塞ぐ＝実装レビュー Minor-2 の是正）。
 * 分母（両木のエントリ列）が空なら FAIL。
 */
export function compareTrees(baselineEntries, targetEntries, allowlist) {
  const problems = [];
  const notes = [];
  if (!Array.isArray(baselineEntries) || baselineEntries.length === 0) {
    return {
      outcome: "fail",
      problems: ["baseline の tree が空（分母が空）"],
      notes,
      summary: "baseline 空",
    };
  }
  if (!Array.isArray(targetEntries) || targetEntries.length === 0) {
    return {
      outcome: "fail",
      problems: ["比較対象の木が空（分母が空。gh-pages branch が空・解決できない等）"],
      notes,
      summary: "対象木 空",
    };
  }
  const base = new Map(baselineEntries.map((e) => [e.path, e]));
  const tgt = new Map(targetEntries.map((e) => [e.path, e]));
  const removed = [...base.keys()].filter((p) => !tgt.has(p));
  const added = [...tgt.keys()].filter((p) => !base.has(p));
  const changed = [...base.keys()].filter((p) => {
    const b = base.get(p);
    const t = tgt.get(p);
    return t && (b.sha !== t.sha || b.mode !== t.mode || b.type !== t.type);
  });

  for (const p of removed) {
    problems.push(`削除されている（baseline に有り対象に無い）: ${p}`);
  }
  let addedInAllowlist = 0;
  for (const p of added) {
    const al = allowlist?.addedByPath?.get(p);
    if (!al) {
      problems.push(`追加されている（allowlist 外の追加）: ${p}`);
      continue;
    }
    // 追加も内容を照合する（Minor-2 是正: .nojekyll は空ファイルのため
    // 期待 blob SHA は確定値。任意の内容の追加を green にしない）。
    const to = tgt.get(p).sha;
    if (isPending(al.expected_blob_sha)) {
      problems.push(
        `allowlist 未採取: 追加 ${p} の期待 blob SHA が "${PENDING}" のまま検査に使われた。` +
          `expected_additions の期待値を採取してから再実行すること`,
      );
      continue;
    }
    if (al.expected_blob_sha !== to) {
      problems.push(
        `追加ファイルの blob SHA が allowlist の期待値と不一致: ${p}（期待 ${al.expected_blob_sha}・実測 ${to}）。` +
          `expected_additions は「追加のみ・対処時に限る」の特殊エントリであり内容まで律する`,
      );
      continue;
    }
    addedInAllowlist++;
    notes.push(`追加を許容（allowlist の「追加のみ・対処時に限る」特殊エントリ・期待 blob SHA と一致）: ${p}`);
  }
  let changedInAllowlist = 0;
  for (const p of changed) {
    const al = allowlist?.modifiedByPath?.get(p);
    const from = base.get(p).sha;
    const to = tgt.get(p).sha;
    if (!al) {
      problems.push(`allowlist 外の差分: ${p}（blob ${from} → ${to}）`);
      continue;
    }
    if (isPending(al.expected_blob_sha)) {
      problems.push(
        `allowlist 未採取: ${p} の fix 後期待 blob SHA が "${PENDING}" のまま検査に使われた。` +
          `§9.1 手順 7 の fix commit 作成時に git ls-tree で機械採取して allowlist.json を更新してから再実行すること`,
      );
      continue;
    }
    if (al.expected_blob_sha !== to) {
      problems.push(
        `blob SHA が allowlist の fix 後期待値と不一致: ${p}（期待 ${al.expected_blob_sha}・実測 ${to}）`,
      );
      continue;
    }
    changedInAllowlist++;
    notes.push(`差分は allowlist 内（fix 後期待 blob SHA と一致）: ${p}`);
  }
  // 診断（FAIL にはしない）: allowlist が予期する変更が本次の差分に現れていない場合。
  // t1-v（fix commit 前）の 0 差分は正当な green であるため、注記に留める。
  for (const al of allowlist?.raw?.expected_changes ?? []) {
    if (!changed.includes(al.path)) {
      notes.push(
        `allowlist は ${al.path} の変更を予期しているが、本次の差分には現れていない（fix commit 前の baseline 同一なら正当）`,
      );
    }
  }

  const matched = baselineEntries.length - removed.length - changed.length;
  const parts = [`${baselineEntries.length} エントリ中 ${matched} 一致`];
  if (removed.length) parts.push(`削除 ${removed.length}`);
  if (changed.length) {
    parts.push(
      `blob 差し替え ${changed.length}（allowlist 内 ${changedInAllowlist}${changedInAllowlist === changed.length ? "・すべて許容" : "・許容外あり"}）`,
    );
  }
  if (added.length) {
    parts.push(`追加 ${added.length}（allowlist 内 ${addedInAllowlist}）`);
  }
  const summary = parts.join("・");
  if (problems.length) return { outcome: "fail", problems, notes, summary };
  return { outcome: "pass", problems: [], notes, summary };
}

// ---- H 層: 判定 ----

/**
 * H 層の判定（§4.6-H・§9.1 手順 6）。
 *   - 全対象で status 200 かつ sha256 一致（かつ content-type 一致）。
 *   - 旧 == 新（byte 同一）なら allowlist の如何に依らず PASS。
 *     §9.1 手順 6 は「AC3 が green になってから手順 7（fix commit）へ進む」と定め、
 *     この時点の PlatSeries は Maplat gh-pages の完全コピー（全対象が byte 同一）であり、
 *     allowlist の期待値はまだ PENDING（fix commit 作成時に機械採取するため §4.3）。
 *     よって「allowlist に載っている path」というだけで PENDING 分岐へ落とすと、
 *     fix 前の正しい状態が常に赤になり設計が要求する pre-fix green が実行不能になる
 *     （実装レビュー Critical-1 の是正）。
 *   - 旧 != 新のとき初めて allowlist を参照する（G 層 compareTrees と同じ
 *     「差分があるときだけ allowlist を見る」構造）:
 *     - allowlist に載っていて期待 sha256 採取済み → 新側が期待値と一致すれば PASS
 *       （fix 後の新側は相対参照へ書き換わるため旧 origin 原件と byte 不一致になる予期差分）
 *     - allowlist に載っていて期待値が PENDING → FAIL（期待値が無く判定不能。
 *       PENDING を素通ししない fail-closed）
 *     - allowlist に載っていない → FAIL（予期差分の範囲外）
 *   - 例外（fetch の throw・タイムアウト）は条件偽と区別する: 例外が 1 件でも
 *     あれば outcome "error"（exit 3）。不一致のみなら "fail"（exit 2）。
 */
export function judgeHttp(results, allowlist) {
  const problems = [];
  const notes = [];
  const errors = [];
  if (!Array.isArray(results) || results.length === 0) {
    return {
      outcome: "fail",
      exit_code: EXIT.FAIL,
      problems: ["H 層の結果列が 0 件（分母が空）"],
      notes,
      errors,
    };
  }
  for (const r of results) {
    if (r.old?.error) errors.push(`旧側 取得失敗 ${r.path}: ${r.old.error}`);
    if (r.new?.error) errors.push(`新側 取得失敗 ${r.path}: ${r.new.error}`);
    if (r.old?.error || r.new?.error) continue; // 比較不能。例外は最後にまとめて exit 3。
    if (r.old.status !== 200) problems.push(`旧側 status 非 200（${r.old.status}）: ${r.old.final_url}`);
    if (r.new.status !== 200) problems.push(`新側 status 非 200（${r.new.status}）: ${r.new.final_url}`);
    if (r.old.status !== 200 || r.new.status !== 200) continue;
    // ★ 差分があるかを先に見る（G 層と同じ構造）。allowlist に載っている
    // というだけで PENDING 分岐へ落とさない（Critical-1 是正）。
    const al = allowlist?.httpByPath?.get(r.path);
    if (r.old.sha256 === r.new.sha256) {
      // 旧 == 新（byte 同一）: PASS。fix commit 前の正しい状態（§9.1 手順 6）。
      if (al) {
        notes.push(
          `${r.path} は byte 同一（旧 == 新）。allowlist 対象だが fix commit 前のため期待値を参照しない`,
        );
      }
    } else if (al && !isPending(al.expected_sha256)) {
      if (r.new.sha256 !== al.expected_sha256) {
        problems.push(
          `予期差分の範囲外: ${r.path} 新側 sha256=${r.new.sha256} が allowlist の fix 後期待値（${al.expected_sha256}）と不一致`,
        );
      }
    } else if (al) {
      // 旧 != 新 なのに期待値が未採取 → 判定不能のため FAIL（fail-closed）
      problems.push(
        `allowlist 未採取: ${r.path} は旧 != 新（byte 不一致）だが fix 後期待 sha256 が "${PENDING}" のまま。` +
          `§9.1 手順 7 の fix commit 作成時に機械採取して allowlist.json を更新してから再実行すること`,
      );
    } else {
      problems.push(
        `sha256 不一致: ${r.path}（旧=${r.old.sha256}・新=${r.new.sha256}）`,
      );
    }
    if (r.old.content_type !== r.new.content_type) {
      problems.push(
        `content-type 不一致: ${r.path}（旧=${JSON.stringify(r.old.content_type)}・新=${JSON.stringify(r.new.content_type)}）`,
      );
    }
  }
  // 例外による失敗を条件偽による失敗より優先する（exit 3 vs 2 の区別）。
  if (errors.length) return { outcome: "error", exit_code: EXIT.ENV, problems, notes, errors };
  if (problems.length) return { outcome: "fail", exit_code: EXIT.FAIL, problems, notes, errors };
  return { outcome: "pass", exit_code: EXIT.PASS, problems: [], notes, errors };
}

// ---- 使い方と mode 別前提（実行点を誤らせない） ----

const USAGE = `
verify-ghpages-identity.mjs — oct26-m10 配信同一性検査（G 層・H 層）

使い方:
  node scripts/oct26-m10/verify-ghpages-identity.mjs --make-baseline
      ghpages-tree-baseline.json を \`git ls-tree -r -z origin/gh-pages\` の
      出力から機械生成する（§4.3。手書き禁止。凍結証跡なので再生成は t4 後に行わない）。
      整合検査（総数/HTML/apps/先端の設計期待値照合）に合格してから書く。
      失敗した場合は 1 バイトも書かない。既存 baseline があるときは
      <path>.bak-<ISO8601> へ退避コピー（既存ファイルは消さない）を作ってから書く
  node scripts/oct26-m10/verify-ghpages-identity.mjs --git [--repo <platseries>]
      G 層: baseline 6975 blob SHA と PlatSeries 作業 clone の gh-pages 木を全件比較。
      追加専用エントリ（.nojekyll）の追加も内容（blob SHA = 空ファイルの確定値）を照合する
  node scripts/oct26-m10/verify-ghpages-identity.mjs --http [オプション]
      H 層: 旧 Maplat Pages と新 PlatSeries Pages の生・生 HTTP 比較（大量 HTTP。
      明示フラグ必須・CI には入れない）。旧 == 新（byte 同一）は allowlist の如何に
      依らず PASS（§9.1 手順 6: fix commit 前の全対象 byte 同一が green になる）。
      旧 != 新のとき初めて allowlist の fix 後期待値を参照する（PENDING なら FAIL）
  node scripts/oct26-m10/verify-ghpages-identity.mjs --selftest
      自己テスト（ネットワークに出ずに判定ロジックを固定入力で検査する）

オプション:
  --repo <path>         G 層の比較先（PlatSeries 作業 clone）。
                        既定: ${DEFAULT_REPO}（§9.1 手順 1 のパス）
  --baseline <file>     baseline のパス（既定: scripts/oct26-m10/ghpages-tree-baseline.json）
  --allowlist <file>    allowlist のパス（既定: scripts/oct26-m10/allowlist.json）
  --out <file>          H 層の証跡ファイル（既定: scripts/oct26-m10/captures/http-live-live.json）
  --old-base <url>      H 層の旧側接頭辞（既定: ${OLD_BASE_DEFAULT}）
  --new-base <url>      H 層の新側接頭辞（既定: ${NEW_BASE_DEFAULT}）
  --limit <n>           H 層の対象を列挙後の先頭 n 件へ絞る（試験用。本番には使わない）
  --timeout-ms <n>      1 要求のタイムアウト（既定: 30000）

mode 別前提（設計 §4.6「検査スクリプトの実行点のまとめ」。誤実行防止）:
  | 実行点            | 回す mode                    | 前提                                          |
  |-------------------|------------------------------|-----------------------------------------------|
  | t1-v（退避後・切替前） | --git と --http の両方    | Maplat gh-pages がまだ生きている（H の生・生比較のため）。
                        ※ fix commit 前は --git は 0 差分で green、
                          --http は全対象 byte 同一（旧 == 新）で green
                          （§9.1 手順 6: AC3 の green を確認してから
                          手順 7 の fix commit へ進む）、
                          fix commit 後は差分 = allowlist 内のみで green
  | t3 gate（削除前）  | --git と verify-switch.mjs --verify の再実行 | t2 の疎通 green 後
  | t2-c / t2-v       | verify-switch.mjs --capture / --verify | Workers 変更の前後
  | t3-v（削除後）     | verify-switch.mjs --verify のみ | 旧 Pages は消えているため --http は再実行しない
  両 mode 指定（--git --http）の実行順は G → H。G が環境エラー（exit 3）や引数の
  誤り（exit 4）で throw した場合は H を実行せずその非ゼロで終了する（fail-closed:
  例外経路が exit 0 を作らない。t1-v は個別 mode で回すのが設計前提）。
  再実行してはならないもの:
  - t4 完了後の --git : gh-pages が dist-demo に置換されるため baseline との全体一致は
    正当に成立しなくなる（§4.3-1「期待された赤」。baseline は移送時点の凍結記録として残す）
  - 旧 Pages 消失後の --http : 生・生比較ができない（§4.3-2）

リダイレクトの扱い:
  code4history.github.io/<Repo>/ は org の custom domain により 301 で
  http://code4history.dev/<Repo>/（https でない）へ飛び得る。本スクリプトは
  リダイレクトを自前で追従し（上限 10 hop）、最終応答の status とバイトを比較する。
  初段 301 を 200 と誤判定しない（判定は最終 status のみ）。

終了コード（fail-closed 契約・gate は exit 0 のみを green とみなす）:
  0 = 全検査を実行し、すべての期待と一致
  2 = 検査 FAIL（不一致・status 非 200・allowlist 外差分・未採取（PENDING）のまま使用・分母不足）
  3 = 実行環境のエラー（git 失敗・比較先リポジトリの欠損・ネットワーク例外・タイムアウト）
  4 = 基準値ファイルの欠損・破損・パース失敗・引数・mode の誤り
  5 = その他の内部例外
  ※ H 層の証跡（captures/http-live-live.json）は全取得が完了した場合のみ書く。
    例外で不完全なまま書かない（§4.6 の capture 契約と同じ規律）。
  ※ H・P 層の大量 HTTP は既定では実行しない。明示フラグ（--http / --capture / --verify）
    が必須で、CI・pre-commit からは呼ばれない（rule-0012 の到達可能性は
    package.json の scripts 結線で満たす。設計 §4.6）。
`.trim();

// ---- ファイル読み込み（run 内で使用。欠損・破損は UsageError → exit 4） ----

function loadBaseline(file) {
  if (!existsSync(file)) {
    throw new UsageError(
      `baseline ファイルが無い: ${file}。まず --make-baseline を実行すること（§4.3）`,
    );
  }
  const r = parseBaseline(readFileSync(file, "utf8"));
  if (!r.ok) {
    throw new UsageError(`baseline が破損・不整合（${file}）:\n  - ${r.problems.join("\n  - ")}`);
  }
  return r.baseline;
}

function loadAllowlist(file) {
  if (!existsSync(file)) {
    throw new UsageError(`allowlist ファイルが無い: ${file}（§4.3）`);
  }
  const r = parseAllowlist(readFileSync(file, "utf8"));
  if (!r.ok) {
    throw new UsageError(`allowlist が破損・不整合（${file}）:\n  - ${r.problems.join("\n  - ")}`);
  }
  return r.allowlist;
}

// ---- mode 実行部 ----

function runGit(o, print) {
  const baseline = loadBaseline(o.baseline);
  const allowlist = loadAllowlist(o.allowlist);
  if (!existsSync(o.repo)) {
    throw new EnvError(
      `比較先リポジトリ（--repo）が見つからない: ${o.repo}\n` +
        `  設計 §9.1 手順 1〜4（PlatSeries 作業 clone の作成・全履歴 push・Pages 有効化）が` +
        `完了してから再実行すること。PlatSeries がまだ存在しない時点でのこの FAIL は` +
        `fail-closed の期待どおりである（「まだ無いから合格」にはしない）`,
    );
  }
  let tip;
  try {
    tip = git(o.repo, "rev-parse", "gh-pages").trim();
  } catch (e) {
    throw new EnvError(
      `比較先リポジトリで gh-pages を解決できない（${o.repo}）。\n  ${e.message}`,
    );
  }
  const targetEntries = parseLsTreeZ(git(o.repo, "ls-tree", "-r", "-z", "gh-pages"));
  const verdict = compareTrees(baseline.tree, targetEntries, allowlist);
  print(`G 層（git 同一性）: 比較先 ${o.repo} の gh-pages（tip ${tip.slice(0, 8)}）`);
  print(`  baseline: tip ${baseline.tip_commit.slice(0, 8)}・${baseline.entry_count} エントリ`);
  print(`  判定: ${verdict.summary}`);
  for (const n of verdict.notes) print(`  注記: ${n}`);
  if (verdict.outcome === "fail") {
    for (const p of verdict.problems) print(`  FAIL: ${p}`);
    print(
      `  → 検査 FAIL。差分が allowlist（shizuoka.html・README.md・対処時の .nojekyll）の` +
        `範囲内であることを確認し、範囲外の差分は移送内容の破損・予期しない変更を意味する。`,
    );
    return EXIT.FAIL;
  }
  print(`  → G 層 green（exit 0 相当）`);
  return EXIT.PASS;
}

async function runHttp(o, print, printErr) {
  const baseline = loadBaseline(o.baseline);
  const allowlist = loadAllowlist(o.allowlist);
  const { targets, breakdown, problems } = enumHttpTargets(baseline, { limit: o.limit });
  print(
    `H 層（HTTP 同一性）: 対象 = 代表 ${breakdown.representatives} + HTML ${breakdown.html} +` +
      ` apps/*.json ${breakdown.apps_json} + サンプル ${breakdown.sample}` +
      ` → ユニーク ${breakdown.unique_total} 件${o.limit ? `（--limit ${o.limit} で先頭 ${targets.length} 件へ試験縮小）` : ""}`,
  );
  if (problems.length) {
    for (const p of problems) printErr(`FAIL: ${p}`);
    return EXIT.FAIL; // 分母不足・baseline 不整合は FAIL（exit 2）
  }
  const results = [];
  let done = 0;
  for (const p of targets) {
    const oldUrl = o.oldBase + encodeTreePath(p);
    const newUrl = o.newBase + encodeTreePath(p);
    const rec = { path: p, old_url: oldUrl, new_url: newUrl };
    try {
      rec.old = await httpGet(oldUrl, { timeoutMs: o.timeoutMs });
    } catch (e) {
      rec.old = { error: e.message };
    }
    try {
      rec.new = await httpGet(newUrl, { timeoutMs: o.timeoutMs });
    } catch (e) {
      rec.new = { error: e.message };
    }
    results.push(rec);
    done++;
    const brief = rec.old?.error
      ? `旧側エラー: ${rec.old.error.split("\n")[0]}`
      : rec.new?.error
        ? `新側エラー: ${rec.new.error.split("\n")[0]}`
        : rec.old.status !== rec.new.status
          ? `status 不一致（旧 ${rec.old.status}・新 ${rec.new.status}）`
          : rec.old.sha256 === rec.new.sha256
            ? `一致（両側 200・sha256 同一）`
            : `sha256 不一致（旧 ${rec.old.sha256.slice(0, 12)}…・新 ${rec.new.sha256.slice(0, 12)}…）`;
    print(`  [${done}/${targets.length}] ${p}: ${brief}`);
  }
  const verdict = judgeHttp(results, allowlist);
  // 証跡の書き出しは「全取得が完了」の場合のみ（例外が 1 件でもあれば書かない）。
  if (verdict.outcome !== "error") {
    for (const n of verdict.notes) print(`  注記: ${n}`);
    const capFile = o.out;
    mkdirSync(path.dirname(capFile), { recursive: true });
    writeFileSync(
      capFile,
      JSON.stringify(
        {
          schema: HTTP_CAPTURE_SCHEMA,
          version: 1,
          design_doc: "2026-09-16-oct26-m10-design.md §4.6-H（v2）",
          generated_at: new Date().toISOString(),
          old_base: o.oldBase,
          new_base: o.newBase,
          breakdown,
          summary: {
            total: targets.length,
            outcome: verdict.outcome,
            problems: verdict.problems,
            notes: verdict.notes,
          },
          results: results.map((r) => ({
            path: r.path,
            old: r.old?.error
              ? { error: r.old.error }
              : {
                  url: r.old_url,
                  status: r.old.status,
                  sha256: r.old.sha256,
                  content_type: r.old.content_type,
                  final_url: r.old.final_url,
                  hops: r.old.hops,
                  bytes: r.old.bytes,
                },
            new: r.new?.error
              ? { error: r.new.error }
              : {
                  url: r.new_url,
                  status: r.new.status,
                  sha256: r.new.sha256,
                  content_type: r.new.content_type,
                  final_url: r.new.final_url,
                  hops: r.new.hops,
                  bytes: r.new.bytes,
                },
          })),
        },
        null,
        1,
      ),
      "utf8",
    );
    print(`  証跡を書いた: ${capFile}`);
  }
  if (verdict.outcome === "error") {
    for (const e of verdict.errors) printErr(`環境エラー: ${e}`);
    for (const p of verdict.problems) printErr(`FAIL: ${p}`);
    printErr(
      `  → 環境エラー（exit 3）。取得例外は条件偽（exit 2）と区別される。` +
        `例外＝検証できていない。ネットワーク・DNS・タイムアウトを確認して再実行すること。`,
    );
    return EXIT.ENV;
  }
  if (verdict.outcome === "fail") {
    for (const p of verdict.problems) printErr(`FAIL: ${p}`);
    printErr(`  → 検査 FAIL（exit 2）。上記の URL・期待・実測を確認すること。`);
    return EXIT.FAIL;
  }
  print(`  → H 層 green: ${targets.length} 件すべて期待と一致（exit 0 相当）`);
  return EXIT.PASS;
}

// ---- 自己テスト（ネットワークに出ない。固定入力で判定関数を叩く） ----

/** 合否を表す値: true か「不一致の説明文字列」を返すケース関数の形 */
function ok(cond, detail) {
  return cond ? true : detail;
}

function syntheticTree() {
  return [
    { mode: "100644", type: "blob", sha: "a".repeat(40), path: "aizumap.html" },
    { mode: "100644", type: "blob", sha: "b".repeat(40), path: "apps/aizu.json" },
    { mode: "100644", type: "blob", sha: "c".repeat(40), path: "index.html" },
  ];
}

function syntheticAllowlist() {
  return parseAllowlist(
    JSON.stringify({
      schema: ALLOWLIST_SCHEMA,
      expected_changes: [
        {
          path: "aizumap.html",
          kind: "modified",
          expected_change_sites: 2,
          expected_blob_sha: "9".repeat(40),
          expected_sha256: "8".repeat(64),
        },
        {
          path: "shizuoka.html",
          kind: "modified",
          expected_change_sites: 2,
          expected_blob_sha: PENDING,
          expected_sha256: PENDING,
        },
      ],
      expected_additions: [
        {
          path: ".nojekyll",
          kind: "add-only",
          conditional: true,
          expected_change_sites: 1,
          // .nojekyll は空ファイル（0 バイト）のため期待 blob SHA は確定値
          // （git hash-object /dev/null の実測。Minor-2 是正で内容照合に使う）
          expected_blob_sha: "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391",
          expected_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        },
      ],
    }),
  ).allowlist;
}

/** Minor-2 の fail-closed 検証用: .nojekyll の期待値が PENDING のままの allowlist */
function syntheticAllowlistPendingAddition() {
  return parseAllowlist(
    JSON.stringify({
      schema: ALLOWLIST_SCHEMA,
      expected_changes: [],
      expected_additions: [
        {
          path: ".nojekyll",
          kind: "add-only",
          conditional: true,
          expected_change_sites: 1,
          expected_blob_sha: PENDING,
          expected_sha256: PENDING,
        },
      ],
    }),
  ).allowlist;
}

function resp200(body, headers = {}) {
  return new Response(body, { status: 200, headers });
}

function buildSelfTestCases() {
  const cases = [];
  const t = (name, fn) => cases.push({ name, fn });

  // ===== selectSample: 決定性（設計 §4.6-H・委任仕様「乱数を使わない」） =====
  t("sample-1: 同じ入力からは常に同じ 100 件が選ばれる（2 回実行で一致）", async () => {
    const paths = Array.from({ length: 300 }, (_, i) => `tiles/t${i}/x.png`);
    const a = selectSample(paths, 100);
    const b = selectSample(paths, 100);
    return ok(JSON.stringify(a) === JSON.stringify(b), "2 回の抽出結果が不一致");
  });
  t("sample-2: 入力順を変えても同じ 100 件が選ばれる（sha256 順が選択を決める）", async () => {
    const paths = Array.from({ length: 300 }, (_, i) => `tiles/t${i}/x.png`);
    const shuffled = [...paths].reverse();
    const a = selectSample(paths, 100);
    const b = selectSample(shuffled, 100);
    return ok(
      JSON.stringify(a) === JSON.stringify(b),
      `入力順を変えたら結果が変わった（乱数・入力順依存の恐れ）`,
    );
  });
  t("sample-3: 先頭要素の sha256 は全 path の sha256 の最小値（昇順の検証）", async () => {
    const paths = Array.from({ length: 50 }, (_, i) => `p${i}.html`);
    const keys = paths.map((p) => sha256Hex(p)).sort();
    const first = selectSample(paths, 10)[0];
    return ok(
      sha256Hex(first) === keys[0],
      `先頭 ${first} の sha256 が最小値でない`,
    );
  });
  t("sample-4: 実 baseline からの抽出も決定的（2 回一致・件数 100）", async () => {
    if (!existsSync(BASELINE_PATH)) return "実 baseline が無い（--make-baseline を先に実行）";
    const b = parseBaseline(readFileSync(BASELINE_PATH, "utf8"));
    if (!b.ok) return `実 baseline が破損: ${b.problems[0]}`;
    const paths = b.baseline.tree.map((e) => e.path);
    const a = selectSample(paths, 100);
    const c = selectSample(paths, 100);
    return ok(
      a.length === 100 && JSON.stringify(a) === JSON.stringify(c),
      `件数 ${a.length}・2 回一致=${JSON.stringify(a) === JSON.stringify(c)}`,
    );
  });

  // ===== compareTrees: G 層判定 =====
  t("git-1: 完全一致する木は PASS（0 差分）", async () => {
    const v = compareTrees(syntheticTree(), syntheticTree(), syntheticAllowlist());
    return ok(v.outcome === "pass", `PASS になるべき: ${v.problems.join(" / ")}`);
  });
  t("git-2: baseline にあって対象に無い path（削除）は FAIL", async () => {
    const tgt = syntheticTree().filter((e) => e.path !== "apps/aizu.json");
    const v = compareTrees(syntheticTree(), tgt, syntheticAllowlist());
    return ok(v.outcome === "fail" && v.problems.some((p) => p.includes("削除")), `削除が検出されていない: ${JSON.stringify(v.problems)}`);
  });
  t("git-3: allowlist 外の追加 path は FAIL", async () => {
    const tgt = [
      ...syntheticTree(),
      { mode: "100644", type: "blob", sha: "d".repeat(40), path: "extra.html" },
    ];
    const v = compareTrees(syntheticTree(), tgt, syntheticAllowlist());
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("allowlist 外の追加")),
      `allowlist 外追加が検出されていない: ${JSON.stringify(v.problems)}`,
    );
  });
  t("git-4: allowlist の特殊エントリ（.nojekyll）の追加のみは許容される（内容＝空 blob SHA も照合）", async () => {
    // Minor-2 是正: 追加は「path が .nojekyll」だけでなく内容（blob SHA）も照合される。
    // .nojekyll は空ファイルなので空 blob SHA（git hash-object /dev/null の実測値）。
    const NOJEKYLL_EMPTY_BLOB = "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391";
    const tgt = [
      ...syntheticTree(),
      { mode: "100644", type: "blob", sha: NOJEKYLL_EMPTY_BLOB, path: ".nojekyll" },
    ];
    const v = compareTrees(syntheticTree(), tgt, syntheticAllowlist());
    return ok(v.outcome === "pass", `追加許容のはずが FAIL: ${v.problems.join(" / ")}`);
  });
  t("git-5: allowlist 外の blob 差し替えは FAIL", async () => {
    const tgt = syntheticTree().map((e) =>
      e.path === "index.html" ? { ...e, sha: "f".repeat(40) } : e,
    );
    const v = compareTrees(syntheticTree(), tgt, syntheticAllowlist());
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("allowlist 外の差分")),
      `allowlist 外差分が検出されていない: ${JSON.stringify(v.problems)}`,
    );
  });
  t("git-6: allowlist 内の差し替えが fix 後期待 blob SHA と一致すれば PASS", async () => {
    const tgt = syntheticTree().map((e) =>
      e.path === "aizumap.html" ? { ...e, sha: "9".repeat(40) } : e,
    );
    const v = compareTrees(syntheticTree(), tgt, syntheticAllowlist());
    return ok(v.outcome === "pass", `期待どおりの差し替えが FAIL: ${v.problems.join(" / ")}`);
  });
  t("git-7: allowlist 内でも期待 blob SHA が PENDING のまま検査に使われたら FAIL", async () => {
    const base = [
      ...syntheticTree(),
      { mode: "100644", type: "blob", sha: "6".repeat(40), path: "shizuoka.html" },
    ];
    const tgt = base.map((e) =>
      e.path === "shizuoka.html" ? { ...e, sha: "7".repeat(40) } : e,
    );
    const v = compareTrees(base, tgt, syntheticAllowlist());
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes(PENDING)),
      `未採取（PENDING）のまま検査に使われても FAIL になっていない: ${JSON.stringify(v.problems)}`,
    );
  });
  t("git-8: allowlist 内でも実測 blob SHA が期待値と不一致なら FAIL", async () => {
    const tgt = syntheticTree().map((e) =>
      e.path === "aizumap.html" ? { ...e, sha: "5".repeat(40) } : e,
    );
    const v = compareTrees(syntheticTree(), tgt, syntheticAllowlist());
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("期待値と不一致")),
      `期待値との不一致が検出されていない: ${JSON.stringify(v.problems)}`,
    );
  });
  t("git-9: 対象の木が空（分母 0）なら FAIL", async () => {
    const v = compareTrees(syntheticTree(), [], syntheticAllowlist());
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("分母が空")),
      `分母空が FAIL になっていない: ${JSON.stringify(v.problems)}`,
    );
  });
  t("git-10: baseline 側が空（分母 0）なら FAIL", async () => {
    const v = compareTrees([], syntheticTree(), syntheticAllowlist());
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("分母が空")),
      `分母空が FAIL になっていない: ${JSON.stringify(v.problems)}`,
    );
  });
  t("git-11: 【Critical と同観点・G 層】allowlist 対象（期待値 PENDING）が blob 同一なら差分に入らず PASS（fix 前 0 差分）", async () => {
    // H 層 Critical-1 と同じ観点の G 層側: shizuoka.html（期待値 PENDING）が
    // baseline と対象で同一 blob なら changed に入らず、PENDING 分岐に到達しない。
    const tree = [
      ...syntheticTree(),
      { mode: "100644", type: "blob", sha: "6".repeat(40), path: "shizuoka.html" },
    ];
    const v = compareTrees(tree, tree, syntheticAllowlist());
    return ok(
      v.outcome === "pass",
      `blob 同一の allowlist 対象（PENDING）が FAIL になっている: ${JSON.stringify(v.problems)}`,
    );
  });
  t("git-12: .nojekyll の追加でも内容（blob SHA）が allowlist の期待値と不一致なら FAIL", async () => {
    // Minor-2 是正の検出側: 「.nojekyll という path なら何を入れても green」の穴が塞がったことの検証。
    const tgt = [
      ...syntheticTree(),
      { mode: "100644", type: "blob", sha: "9".repeat(40), path: ".nojekyll" },
    ];
    const v = compareTrees(syntheticTree(), tgt, syntheticAllowlist());
    return ok(
      v.outcome === "fail" &&
        v.problems.some((p) => p.includes("追加ファイルの blob SHA") && p.includes("期待値と不一致")),
      `任意の内容の .nojekyll 追加が green になっている: ${JSON.stringify(v.problems)}`,
    );
  });
  t("git-13: .nojekyll の追加で期待 blob SHA が PENDING のままなら FAIL（fail-closed）", async () => {
    const tgt = [
      ...syntheticTree(),
      { mode: "100644", type: "blob", sha: "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391", path: ".nojekyll" },
    ];
    const v = compareTrees(syntheticTree(), tgt, syntheticAllowlistPendingAddition());
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes(PENDING)),
      `追加エントリの期待値が PENDING でも FAIL になっていない: ${JSON.stringify(v.problems)}`,
    );
  });

  // ===== httpGet: リダイレクトの扱い（v1 レビュー Major-2 の回帰） =====
  t("http-1: 301 → 200 の追従: 最終 status 200・最終 URL は追従先（hop 記録あり）", async () => {
    const fake = async (url) =>
      url.includes("github.io")
        ? new Response(null, {
            status: 301,
            headers: { location: url.replace("https://code4history.github.io", "http://code4history.dev") },
          })
        : resp200("hello", { "content-type": "text/html" });
    const r = await httpGet("https://code4history.github.io/Maplat/index.html", { fetchImpl: fake });
    return ok(
      r.status === 200 &&
        r.final_url === "http://code4history.dev/Maplat/index.html" &&
        r.hops.length === 2 &&
        r.sha256 === sha256Hex("hello"),
      `status=${r.status} final_url=${r.final_url} hops=${r.hops.length}`,
    );
  });
  t("http-2: 301 → 404 の追従: 最終 status 404 がそのまま出る（初段 301 は 200 と誤判定されない）", async () => {
    const fake = async (url) =>
      url.includes("github.io")
        ? new Response(null, { status: 301, headers: { location: "http://code4history.dev/x" } })
        : new Response("not found", { status: 404 });
    const r = await httpGet("https://code4history.github.io/Maplat/missing.html", { fetchImpl: fake });
    return ok(r.status === 404, `最終 status が 404 のはず（実: ${r.status}）`);
  });
  t("http-3: リダイレクトループは例外（環境エラー）になる", async () => {
    const fake = async () => new Response(null, { status: 301, headers: { location: "https://loop.example/x" } });
    try {
      await httpGet("https://loop.example/x", { fetchImpl: fake, maxHops: 5 });
    } catch {
      return true;
    }
    return "リダイレクト過多で例外にならなかった";
  });
  t("http-4: 相対 Location の追従（new URL(loc, current) による解決）", async () => {
    const fake = async (url) =>
      url.endsWith("/a/") ? new Response(null, { status: 301, headers: { location: "b/" } }) : resp200("rel");
    const r = await httpGet("https://example.jp/a/", { fetchImpl: fake });
    return ok(
      r.status === 200 && r.final_url === "https://example.jp/a/b/",
      `final_url=${r.final_url}`,
    );
  });
  t("http-5: タイムアウトは例外（環境エラー）になる", async () => {
    const fake = (url, init) =>
      new Promise((_, rej) => {
        init.signal.addEventListener("abort", () => rej(init.signal.reason));
      });
    try {
      await httpGet("https://slow.example/", { fetchImpl: fake, timeoutMs: 50 });
    } catch {
      return true;
    }
    return "タイムアウトで例外にならなかった";
  });

  // ===== judgeHttp: H 層判定（例外と条件偽の区別が核心） =====
  const mk = (path, oldS, newS, extra = {}) => ({
    path,
    old: { status: 200, sha256: oldS, content_type: "text/html" },
    new: { status: 200, sha256: newS, content_type: "text/html" },
    ...extra,
  });
  const H = sha256Hex("hello");

  t("judge-1: 全対象が両側 200・sha256 一致なら PASS（exit 0）", async () => {
    const v = judgeHttp([mk("a.html", H, H), mk("apps/a.json", H, H)], syntheticAllowlist());
    return ok(v.outcome === "pass" && v.exit_code === 0, `outcome=${v.outcome}`);
  });
  t("judge-2: sha256 不一致は FAIL（exit 2）", async () => {
    const v = judgeHttp([mk("a.html", H, sha256Hex("tampered"))], syntheticAllowlist());
    return ok(v.outcome === "fail" && v.exit_code === 2, `outcome=${v.outcome} code=${v.exit_code}`);
  });
  t("judge-3: 新側 status 非 200 は FAIL（exit 2）", async () => {
    const v = judgeHttp(
      [{ path: "a.html", old: { status: 200, sha256: H, content_type: "text/html" }, new: { status: 404, sha256: H, content_type: "text/html" } }],
      syntheticAllowlist(),
    );
    return ok(v.outcome === "fail" && v.exit_code === 2, `outcome=${v.outcome} code=${v.exit_code}`);
  });
  t("judge-4: allowlist 対象（fix 後 sha256 採取済み）は新側が期待値と一致すれば PASS（旧≠新は許容）", async () => {
    const exp = "8".repeat(64);
    const v = judgeHttp(
      [mk("aizumap.html", sha256Hex("old-bytes"), exp)],
      syntheticAllowlist(),
    );
    return ok(v.outcome === "pass" && v.exit_code === 0, `outcome=${v.outcome} problems=${v.problems}`);
  });
  t("judge-5: allowlist 対象でも新側が期待値と不一致なら FAIL", async () => {
    const v = judgeHttp(
      [mk("aizumap.html", H, sha256Hex("wrong-fix"))],
      syntheticAllowlist(),
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("予期差分の範囲外")),
      `予期差分の範囲外が検出されていない: ${JSON.stringify(v.problems)}`,
    );
  });
  t("judge-6: allowlist の期待 sha256 が PENDING のまま検査に使われたら FAIL（旧 != 新のとき）", async () => {
    // Critical-1 是正に伴う修正: 旧 == 新 + PENDING は fix commit 前の正当状態なので
    // PASS にする（judge-11）。PENDING が FAIL になるのは旧 != 新のときに限る。
    const v = judgeHttp(
      [mk("shizuoka.html", H, sha256Hex("changed-bytes"))],
      syntheticAllowlist(),
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes(PENDING)),
      `未採取（PENDING）のまま検査に使われても FAIL になっていない: ${JSON.stringify(v.problems)}`,
    );
  });
  t("judge-7: content-type 不一致は FAIL", async () => {
    const v = judgeHttp(
      [
        {
          path: "a.html",
          old: { status: 200, sha256: H, content_type: "text/html" },
          new: { status: 200, sha256: H, content_type: "application/json" },
        },
      ],
      syntheticAllowlist(),
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("content-type")),
      `content-type 不一致が検出されていない: ${JSON.stringify(v.problems)}`,
    );
  });
  t("judge-8: 【核心】fetch が throw した 1 件は、他が全一致でも FAIL(2) にならず環境エラー(3)になる", async () => {
    const v = judgeHttp(
      [
        mk("a.html", H, H),
        { path: "b.html", old: { error: "getaddrinfo ENOTFOUND github.io" }, new: { status: 200, sha256: H, content_type: "text/html" } },
      ],
      syntheticAllowlist(),
    );
    return ok(
      v.outcome === "error" && v.exit_code === 3,
      `例外は exit 3 でなければならない（実: outcome=${v.outcome} code=${v.exit_code}）。` +
        `例外を条件偽と同扱いにすると false-green の素通り経路になる`,
    );
  });
  t("judge-9: 【核心】例外と不一致が両方ある場合は例外（exit 3）を優先する", async () => {
    const v = judgeHttp(
      [
        mk("a.html", H, sha256Hex("diff")),
        { path: "b.html", old: { error: "timeout" }, new: { error: "timeout" } },
      ],
      syntheticAllowlist(),
    );
    return ok(v.outcome === "error" && v.exit_code === 3, `outcome=${v.outcome} code=${v.exit_code}`);
  });
  t("judge-10: 結果列が 0 件（分母 0）なら FAIL", async () => {
    const v = judgeHttp([], syntheticAllowlist());
    return ok(v.outcome === "fail" && v.exit_code === 2, `outcome=${v.outcome} code=${v.exit_code}`);
  });
  // ===== judgeHttp: Critical-1 是正の 4 ケース（委任指定。byte 同一と allowlist の順序） =====
  // 正しい論理: 「旧 == 新 なら allowlist の如何に依らず PASS／旧 != 新 のとき
  // 初めて allowlist（期待値）を参照する」。PENDING を素通しする緩和ではない
  // （差分があるときだけ allowlist を見る = fail-closed 契約は維持）。
  t("judge-11: 【Critical 是正】allowlist 対象が byte 同一（旧==新）・期待値 PENDING → PASS（fix commit 前の正しい状態）", async () => {
    // §9.1 手順 6: AC3 は fix commit の前に green になる必要がある。この時点の
    // PlatSeries は Maplat gh-pages の完全コピーであり、shizuoka.html を含む
    // 全対象が byte 同一。allowlist 期待値は fix commit 時の機械採取（§4.3）なので
    // この時点では PENDING しかありえない。よってこの状態が PASS にならなければ
    // 設計が要求する pre-fix green が実行不能になる（旧実装のCritical の再現ケース）。
    const v = judgeHttp([mk("shizuoka.html", H, H)], syntheticAllowlist());
    return ok(
      v.outcome === "pass" && v.exit_code === 0,
      `byte 同一（旧==新）+ PENDING が FAIL になっている（Critical 未解消）: outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("judge-12: allowlist 対象が byte 不一致・期待値 PENDING → FAIL（期待値が無く判定不能）", async () => {
    const v = judgeHttp(
      [mk("shizuoka.html", H, sha256Hex("diverted-bytes"))],
      syntheticAllowlist(),
    );
    return ok(
      v.outcome === "fail" &&
        v.exit_code === 2 &&
        v.problems.some((p) => p.includes(PENDING)),
      `旧 != 新 + PENDING が FAIL になっていない: outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("judge-13: allowlist 対象が byte 不一致・期待値採取済みで新側が一致 → PASS", async () => {
    const exp = "8".repeat(64);
    const v = judgeHttp(
      [mk("aizumap.html", sha256Hex("old-bytes"), exp)],
      syntheticAllowlist(),
    );
    return ok(
      v.outcome === "pass" && v.exit_code === 0,
      `期待値との一致で PASS になるはず: outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("judge-14: allowlist 対象が byte 不一致・期待値採取済みで新側が不一致 → FAIL", async () => {
    // syntheticAllowlist の aizumap.html は期待 sha256 = "8"*64（採取済み）。
    // 新側を期待値以外へずらして FAIL になることを検証する。
    const v = judgeHttp(
      [mk("aizumap.html", sha256Hex("old-bytes"), sha256Hex("wrong-fix"))],
      syntheticAllowlist(),
    );
    return ok(
      v.outcome === "fail" &&
        v.exit_code === 2 &&
        v.problems.some((p) => p.includes("予期差分の範囲外")),
      `期待値との不一致が FAIL になっていない: outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });

  // ===== enumHttpTargets: 分母の検査 =====
  t("enum-1: 実 baseline から 52 HTML + 40 apps + 代表 6 + サンプル 100 が列挙される", async () => {
    if (!existsSync(BASELINE_PATH)) return "実 baseline が無い";
    const b = parseBaseline(readFileSync(BASELINE_PATH, "utf8"));
    if (!b.ok) return `実 baseline が破損: ${b.problems[0]}`;
    const e = enumHttpTargets(b.baseline);
    return ok(
      e.problems.length === 0 &&
        e.breakdown.html === 52 &&
        e.breakdown.apps_json === 40 &&
        e.breakdown.representatives === 6 &&
        e.breakdown.sample === 100 &&
        e.targets.length === e.breakdown.unique_total,
      `breakdown=${JSON.stringify(e.breakdown)} problems=${JSON.stringify(e.problems)}`,
    );
  });
  t("enum-2: 代表資産を欠く baseline は分母不足で FAIL 要素を返す", async () => {
    const base = {
      schema: BASELINE_SCHEMA,
      version: 1,
      tip_commit: "0".repeat(40),
      entry_count: 2,
      counts: { html: 1, apps_json: 1, total: 2 },
      tree: [
        { mode: "100644", type: "blob", sha: "a".repeat(40), path: "a.html" },
        { mode: "100644", type: "blob", sha: "b".repeat(40), path: "apps/a.json" },
      ],
    };
    const e = enumHttpTargets(base);
    return ok(
      e.problems.length >= 3 &&
        e.problems.some((p) => p.includes("index.html")) &&
        e.problems.some((p) => p.includes("に満たない")),
      `代表資産の欠落・件数不足が検出されていない: ${JSON.stringify(e.problems)}`,
    );
  });
  t("enum-3: HTML 0 件の baseline は期待件数未満として FAIL 要素を返す", async () => {
    const base = {
      schema: BASELINE_SCHEMA,
      version: 1,
      tip_commit: "0".repeat(40),
      entry_count: 1,
      counts: { html: 0, apps_json: 1, total: 1 },
      tree: [{ mode: "100644", type: "blob", sha: "b".repeat(40), path: "apps/a.json" }],
    };
    const e = enumHttpTargets(base);
    return ok(
      e.problems.some((p) => p.includes("HTML の列挙が 0 件")),
      `HTML 0 件が分母不足として検出されていない: ${JSON.stringify(e.problems)}`,
    );
  });

  // ===== parseBaseline / parseAllowlist: 基準値ファイルの破損検出 =====
  t("parse-1: baseline が JSON でないなら不成立（exit 4 相当）", async () => {
    const r = parseBaseline("this is not json");
    return ok(!r.ok && r.problems[0].includes("parse できない"), `ok=${r.ok}`);
  });
  t("parse-2: baseline の schema が違うなら不成立", async () => {
    const r = parseBaseline(JSON.stringify({ schema: "other", tree: [] }));
    return ok(!r.ok, `ok=${r.ok}`);
  });
  t("parse-3: entry_count と tree 長が不一致なら不成立", async () => {
    const doc = {
      schema: BASELINE_SCHEMA,
      version: 1,
      tip_commit: "0".repeat(40),
      entry_count: 5,
      counts: { html: 0, apps_json: 0, total: 1 },
      tree: [{ mode: "100644", type: "blob", sha: "a".repeat(40), path: "x" }],
    };
    const r = parseBaseline(JSON.stringify(doc));
    return ok(!r.ok && r.problems.some((p) => p.includes("entry_count")), `ok=${r.ok} problems=${JSON.stringify(r.problems)}`);
  });
  t("parse-4: allowlist の期待値が PENDING でも 40 桁 16 進でもなければ不成立", async () => {
    const bad = JSON.stringify({
      schema: ALLOWLIST_SCHEMA,
      expected_changes: [
        { path: "a.html", kind: "modified", expected_change_sites: 1, expected_blob_sha: "手書きの値", expected_sha256: PENDING },
      ],
      expected_additions: [],
    });
    const r = parseAllowlist(bad);
    return ok(!r.ok && r.problems.some((p) => p.includes("expected_blob_sha")), `ok=${r.ok}`);
  });
  t("parse-5: 実 allowlist.json は PENDING を保持したまま正当に parse できる", async () => {
    if (!existsSync(ALLOWLIST_PATH)) return "実 allowlist が無い";
    const r = parseAllowlist(readFileSync(ALLOWLIST_PATH, "utf8"));
    if (!r.ok) return `実 allowlist が破損: ${r.problems[0]}`;
    const shizuoka = r.allowlist.httpByPath.get("shizuoka.html");
    const readme = r.allowlist.modifiedByPath.get("README.md");
    const nojekyll = r.allowlist.addedByPath.get(".nojekyll");
    // Minor-2 是正: .nojekyll の期待値は空ファイルの確定値（PENDING ではない）。
    const EMPTY_BLOB_SHA = "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391";
    return ok(
      shizuoka &&
        isPending(shizuoka.expected_sha256) &&
        readme &&
        isPending(readme.expected_blob_sha) &&
        readme.expected_change_sites === 9 &&
        nojekyll?.conditional === true &&
        nojekyll.expected_blob_sha === EMPTY_BLOB_SHA,
      `allowlist の中身が設計 §4.3/§4.5 と不一致: shizuoka=${JSON.stringify(shizuoka?.expected_sha256)} readme sites=${readme?.expected_change_sites} nojekyll=${JSON.stringify(nojekyll?.expected_blob_sha)}`,
    );
  });

  // ===== makeBaseline: 書き込み順序（Minor-3 是正。仮想 IO で実ファイルに触れない） =====
  // 設計期待値と一致する仮想木: total 6975 = HTML 52 + apps 40 + その他 6883。
  const V_TIP = DESIGN_EXPECT.tip;
  const V_SHA = "1".repeat(40);
  const makeVirtualEntries = (total) => {
    const entries = [];
    for (let i = 0; i < DESIGN_EXPECT.html; i++) {
      entries.push({ mode: "100644", type: "blob", sha: V_SHA, path: `page${i}.html` });
    }
    for (let i = 0; i < DESIGN_EXPECT.appsJson; i++) {
      entries.push({ mode: "100644", type: "blob", sha: V_SHA, path: `apps/app${i}.json` });
    }
    const rest = total - DESIGN_EXPECT.html - DESIGN_EXPECT.appsJson;
    for (let i = 0; i < rest; i++) {
      entries.push({ mode: "100644", type: "blob", sha: V_SHA, path: `tiles/t${i}.png` });
    }
    return entries;
  };
  const makeVirtualGit = (entries) => (cwd, ...args) => {
    if (args[0] === "rev-parse") return `${V_TIP}\n`;
    if (args[0] === "ls-tree") {
      return `${entries.map((e) => `100644 blob ${e.sha}\t${e.path}`).join("\0")}\0`;
    }
    throw new Error(`仮想 git が未知の呼び出しを受けた: ${args.join(" ")}`);
  };
  const makeVirtualIo = (entries, exists) => {
    const writes = [];
    const copies = [];
    return {
      io: {
        git: makeVirtualGit(entries),
        exists: () => exists,
        copy: (from, to) => copies.push({ from, to }),
        write: (file, text) => writes.push({ file, text }),
        baselinePath: "/virtual/ghpages-tree-baseline.json",
        nowIso: () => "2026-09-17T00:00:00.000Z",
      },
      writes,
      copies,
    };
  };
  const sinkLines = () => {
    const lines = [];
    return {
      print: (...a) => lines.push(a.join(" ")),
      printErr: (...a) => lines.push(a.join(" ")),
      text: () => lines.join("\n"),
    };
  };
  t("make-1: 整合検査に失敗する木では baseline を 1 バイトも書かない（凍結証跡を誤った木で壊さない）", async () => {
    // 総数 6974（設計期待 6975 に 1 件欠ける）→ 整合検査 FAIL → exit 2・書き込み 0 回
    const v = makeVirtualEntries(DESIGN_EXPECT.total - 1);
    const { io, writes, copies } = makeVirtualIo(v, false);
    const sink = sinkLines();
    const code = makeBaseline(sink.print, sink.printErr, io);
    return ok(
      code === EXIT.FAIL && writes.length === 0 && copies.length === 0,
      `検査 FAIL 時に書き込みが発生していないか退出コードが違う: code=${code} writes=${writes.length} copies=${copies.length}`,
    );
  });
  t("make-2: 整合検査に合格する木では baseline を書く（内容は parseBaseline を通る）", async () => {
    const v = makeVirtualEntries(DESIGN_EXPECT.total);
    const { io, writes, copies } = makeVirtualIo(v, false);
    const sink = sinkLines();
    const code = makeBaseline(sink.print, sink.printErr, io);
    const parsed = writes.length === 1 ? parseBaseline(writes[0].text) : { ok: false, problems: ["書き込み無し"] };
    return ok(
      code === EXIT.PASS &&
        writes.length === 1 &&
        parsed.ok === true &&
        parsed.baseline.entry_count === DESIGN_EXPECT.total &&
        parsed.baseline.tip_commit === DESIGN_EXPECT.tip,
      `検査合格時に正しく書けていない: code=${code} writes=${writes.length} parsed.ok=${parsed.ok} problems=${JSON.stringify(parsed.problems ?? [])}`,
    );
  });
  t("make-3: 既存 baseline があるときは退避コピーを作ってから書く（既存ファイルは消さない・上書きしない）", async () => {
    const v = makeVirtualEntries(DESIGN_EXPECT.total);
    const { io, writes, copies } = makeVirtualIo(v, true);
    const sink = sinkLines();
    const code = makeBaseline(sink.print, sink.printErr, io);
    return ok(
      code === EXIT.PASS &&
        copies.length === 1 &&
        copies[0].from === io.baselinePath &&
        copies[0].to === `${io.baselinePath}.bak-2026-09-17T00-00-00-000Z` &&
        writes.length === 1,
      `退避コピーの挙動が期待と違う: code=${code} copies=${JSON.stringify(copies)} writes=${writes.length}`,
    );
  });

  // ===== run() CLI: 終了コードの区別の実地確認 =====
  const runLines = async (argv) => {
    const lines = [];
    const sink = (...a) => lines.push(a.join(" "));
    const code = await run(argv, { print: sink, printErr: sink });
    return { code, text: lines.join("\n") };
  };
  t("cli-1: mode 無し（素の起動）は exit 4（使い方を表示。green にしない）", async () => {
    const r = await runLines([]);
    return ok(r.code === 4 && r.text.includes("使い方"), `code=${r.code}`);
  });
  t("cli-2: --help は exit 0 で mode 別前提を表示する", async () => {
    const r = await runLines(["--help"]);
    return ok(
      r.code === 0 && r.text.includes("mode 別前提") && r.text.includes("t1-v") && r.text.includes("再実行してはならない"),
      `code=${r.code}`,
    );
  });
  t("cli-3: --git で比較先（PlatSeries）がまだ存在しなければ exit 3 と読めるメッセージ", async () => {
    const missing = path.join(SCRIPT_DIR, "no-such-repo-for-selftest");
    const r = await runLines(["--git", "--repo", missing]);
    return ok(
      r.code === 3 && r.text.includes("見つからない") && r.text.includes("§9.1"),
      `code=${r.code} text=${r.text.slice(0, 200)}`,
    );
  });
  t("cli-4: 【実データ】--git を本 worktree（ローカル gh-pages = baseline の親）に当てると exit 2", async () => {
    // baseline は origin/gh-pages（tip ee6f935a）。本 worktree のローカル gh-pages は
    // その親 bbc8331 であり、pois/19mapcon_gp.geojson が allowlist 外で差し替わっている。
    // ∴ 現実の木差分に対して「allowlist 外の差分」で FAIL することの実地確認になる。
    const r = await runLines(["--git", "--repo", REPO_ROOT]);
    return ok(
      r.code === 2 &&
        r.text.includes("allowlist 外の差分") &&
        r.text.includes("pois/19mapcon_gp.geojson"),
      `code=${r.code} text=${r.text.slice(0, 400)}`,
    );
  });
  t("cli-5: baseline に存在しないファイルを指定すると exit 4", async () => {
    const r = await runLines(["--git", "--repo", REPO_ROOT, "--baseline", path.join(SCRIPT_DIR, "absent.json")]);
    return ok(r.code === 4 && r.text.includes("baseline ファイルが無い"), `code=${r.code}`);
  });
  t("cli-6: baseline として不整合なファイル（allowlist を指定）を渡すと exit 4", async () => {
    const r = await runLines(["--git", "--repo", REPO_ROOT, "--baseline", ALLOWLIST_PATH]);
    return ok(r.code === 4 && r.text.includes("破損"), `code=${r.code}`);
  });
  t("cli-7: 未知のフラグは exit 4", async () => {
    const r = await runLines(["--git", "--nonsense"]);
    return ok(r.code === 4, `code=${r.code}`);
  });
  t("cli-8: --limit は正の整数でなければ exit 4", async () => {
    const r = await runLines(["--http", "--limit", "abc"]);
    return ok(r.code === 4, `code=${r.code}`);
  });

  return cases;
}

async function runSelfTest(print, printErr) {
  const cases = buildSelfTestCases();
  print(`===== verify-ghpages-identity.mjs 自己テスト（${cases.length} ケース） =====`);
  let pass = 0;
  for (const c of cases) {
    let detail = null;
    try {
      const r = await c.fn();
      if (r !== true) detail = r || "（説明無しの失敗）";
    } catch (e) {
      detail = `ケース内例外: ${e.message}`;
    }
    if (detail === null) {
      pass++;
      print(`  OK   ${c.name}`);
    } else {
      printErr(`  NG   ${c.name}`);
      printErr(`       ${detail}`);
    }
  }
  print(`===== 結果: ${pass}/${cases.length} =====`);
  return pass === cases.length;
}

// ---- CLI ----

/**
 * CLI 本体。終了コードを返す（process.exit は呼ばない。自己テストから叩ける形）。
 * print / printErr は差し替え可能（自己テストは出力を拾って判定する）。
 */
export async function run(argv, io = {}) {
  const print = io.print ?? ((s) => console.log(s));
  const printErr = io.printErr ?? ((s) => console.error(s));
  try {
    const o = {
      mode: null,
      repo: DEFAULT_REPO,
      baseline: BASELINE_PATH,
      allowlist: ALLOWLIST_PATH,
      out: path.join(CAPTURES_DIR, "http-live-live.json"),
      oldBase: OLD_BASE_DEFAULT,
      newBase: NEW_BASE_DEFAULT,
      limit: 0,
      timeoutMs: 30_000,
    };
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      const take = () => {
        const v = argv[++i];
        if (v === undefined) throw new UsageError(`${a} の値が無い`);
        return v;
      };
      if (a === "--make-baseline") o.mode = "make-baseline";
      else if (a === "--git") o.mode = o.mode === "http" ? "both" : "git";
      else if (a === "--http") o.mode = o.mode === "git" ? "both" : "http";
      else if (a === "--selftest") o.mode = "selftest";
      else if (a === "-h" || a === "--help") o.mode = "help";
      else if (a === "--repo") o.repo = take();
      else if (a === "--baseline") o.baseline = take();
      else if (a === "--allowlist") o.allowlist = take();
      else if (a === "--out") o.out = take();
      else if (a === "--old-base") o.oldBase = take();
      else if (a === "--new-base") o.newBase = take();
      else if (a === "--limit") {
        const v = Number(take());
        if (!Number.isInteger(v) || v < 1) throw new UsageError(`--limit は正の整数で指定する（実: ${v}）`);
        o.limit = v;
      } else if (a === "--timeout-ms") {
        const v = Number(take());
        if (!Number.isInteger(v) || v < 1) throw new UsageError(`--timeout-ms は正の整数で指定する（実: ${v}）`);
        o.timeoutMs = v;
      } else {
        throw new UsageError(`未知の引数: ${a}`);
      }
    }

    if (o.mode === "help") {
      print(USAGE);
      return EXIT.PASS;
    }
    if (o.mode === null) {
      print(USAGE);
      printErr("mode（--make-baseline / --git / --http / --selftest）を指定すること");
      return EXIT.USAGE;
    }
    if (o.mode === "selftest") {
      return (await runSelfTest(print, printErr)) ? EXIT.PASS : 1;
    }
    if (o.mode === "make-baseline") {
      return makeBaseline(print, printErr);
    }
    if (o.mode === "git") {
      return runGit(o, print);
    }
    if (o.mode === "http") {
      return await runHttp(o, print, printErr);
    }
    if (o.mode === "both") {
      const g = runGit(o, print);
      print("");
      const h = await runHttp(o, print, printErr);
      return g === EXIT.PASS && h === EXIT.PASS ? EXIT.PASS : Math.max(g, h);
    }
    throw new UsageError(`内部: 未処理の mode ${o.mode}`);
  } catch (e) {
    if (e instanceof UsageError) {
      printErr(`引数・基準値の誤り: ${e.message}`);
      return EXIT.USAGE;
    }
    if (e instanceof EnvError) {
      printErr(`実行環境のエラー: ${e.message}`);
      return EXIT.ENV;
    }
    printErr(`内部例外（スクリプトのバグの可能性）: ${e.stack}`);
    return EXIT.INTERNAL;
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  run(process.argv.slice(2)).then((code) => process.exit(code));
}
