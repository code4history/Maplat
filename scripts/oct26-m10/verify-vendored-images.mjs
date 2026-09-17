#!/usr/bin/env node
/**
 * verify-vendored-images.mjs — oct26-m10-t3-p 同梱同一性検査（V 層）
 *
 * 識別語: IMPL-T3P-VENDOR-20260917
 *
 * 正本: docs/superpowers/specs/2026-09-16-oct26-m10-design.md（v4）
 *   - §1.4    同梱画像の全数と blob SHA（期待値の正本）
 *   - §4.6-V  同梱同一性検査（列挙源の pin・分母明示・fail-closed）
 *   - §6.2    画像同梱と README 相対参照化（t3-p の配置決定）
 *   - §6.5    AC11-同梱（受け入れ条件）
 *
 * 検査するもの（分母を明示。空を合格にしない）:
 *   (1) 同梱ファイル 23 件（Maplat 22 ＋ MaplatEditor 1）が、基準値 manifest
 *       vendored-baseline.json の期待 path に実在し、期待 blob SHA（git blob SHA・
 *       40 桁）と一致すること。1 件でも「不在」「SHA 不一致」があれば FAIL（exit 2）。
 *       この「期待 path に実在＋blob SHA 一致」が陽性対照である——同梱（移動・コピー）
 *       を怠れば期待 path（public/img/*・page_imgs/*・sponsor img/*）は存在しないため
 *       何も起きていなくても緑になることはない。
 *   (2) README 参照検査。列挙源を baseline の README 画像 7 path（Maplat 6 ＋
 *       MaplatEditor 1）に固定する（全 <img> タグを検査しない。README には対象外の
 *       外部 badge が 14 参照あり、全 <img> を見ると常時赤になる）。この 7 path の
 *       README 内出現が対象 14 箇所ちょうど（Maplat README.md/README.ja.md 各 6 ＝ 12
 *       ＋ MaplatEditor README.md/README.ja.md 各 1 ＝ 2）あり、各出現が repo-root
 *       相対パス（http を含まない）かつ参照先 path が同リポジトリに実在することを
 *       確認する。対象外（外部画像）14 参照は検査対象に含めないが、実測した件数を
 *       分母として出力に明記する。
 *
 * 終了コード契約（fail-closed・§4.6。verify-ghpages-identity.mjs / verify-switch.mjs
 * と同一契約）:
 *   0: 全検査を実行し、すべての期待と一致（成功のみが到達できる）
 *   2: 検査 FAIL（ファイル不在・blob SHA 不一致・README 参照が非相対/不在・
 *      分母が空〔対象参照 0 件〕・期待件数と不一致）
 *   3: 実行環境のエラー（同梱ファイルの読み込み例外）
 *   4: 基準値ファイルの欠損・破損・パース失敗・引数・repo 指定の誤り
 *   5: その他の内部例外（スクリプト自身のバグ）
 *
 *   「例外を catch して exit 0 にする」ことは禁止（§4.6）。catch 経路は必ず非ゼロで
 *   終了し、例外を握りつぶす空の catch(e){} を書かない。非 catch の throw・unhandled
 *   rejection は Node が自明に非ゼロで落とす。
 */

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EXIT, EnvError, UsageError } from "./verify-ghpages-identity.mjs";

// ---- 位置と定数 ----

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASELINE = path.join(SCRIPT_DIR, "vendored-baseline.json");
/** スクリプト自身が属するリポジトリ（Maplat）の repo-root */
const DEFAULT_MAPLAT = path.resolve(SCRIPT_DIR, "..", "..");

/**
 * 兄弟リポジトリ MaplatEditor（outer 直下。§6.2: 別リポジトリ）の既定 path。
 * 本スクリプトは main checkout（<outer>/Maplat/scripts/oct26-m10/）でも worktree
 * （<outer>/.worktrees/<name>/scripts/oct26-m10/）でも配置され得るため、どちらからも
 * outer 直下の MaplatEditor へ辿れる候補を複数試し、実在するものを使う。
 */
function defaultEditorRoot() {
  const candidates = [
    path.resolve(SCRIPT_DIR, "..", "..", "..", "MaplatEditor"), // main checkout 兄弟
    path.resolve(SCRIPT_DIR, "..", "..", "..", "..", "MaplatEditor"), // worktree → outer 兄弟
  ];
  return candidates.find((c) => existsSync(c)) ?? candidates[0];
}

const BASELINE_SCHEMA = "oct26-m10-vendored-baseline";
const HEX40 = /^[0-9a-f]{40}$/;

// ---- git blob SHA（git hash-object と同一の値） ----

/** git の blob オブジェクトは "blob <byte長>\0" + 内容。その SHA-1（40 桁）を返す。 */
export function gitBlobSha(buf) {
  const h = createHash("sha1");
  h.update(`blob ${buf.length}\0`);
  h.update(buf);
  return h.digest("hex");
}

// ---- baseline 読み込み（欠損・破損は UsageError → exit 4） ----

/**
 * vendored-baseline.json の構造検証。schema・expect の各分母・repos の非空・
 * 各期待 SHA が 40 桁 16 進であることを確かめる。1 つでも欠ければ exit 4
 * （基準値ファイルの欠損・破損。手書きで 23 件に足りない状態を green にしない）。
 */
export function loadBaseline(file) {
  if (!existsSync(file)) {
    throw new UsageError(
      `vendored-baseline ファイルが無い: ${file}。scripts/oct26-m10/vendored-baseline.json を確認すること（§4.6-V）`,
    );
  }
  let doc;
  try {
    doc = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new UsageError(`vendored-baseline を JSON として parse できない: ${e.message}`);
  }
  if (doc?.schema !== BASELINE_SCHEMA) {
    throw new UsageError(
      `vendored-baseline の schema が ${BASELINE_SCHEMA} でない（実: ${JSON.stringify(doc?.schema)}）`,
    );
  }
  const expect = doc?.expect;
  if (!expect || expect.files_total !== 23 || expect.readme_target_refs !== 14) {
    throw new UsageError(
      `vendored-baseline の expect が不正（files_total=${expect?.files_total}・readme_target_refs=${expect?.readme_target_refs}。期待 23 / 14）`,
    );
  }
  for (const key of ["maplat", "maplat-editor"]) {
    const repo = doc?.repos?.[key];
    if (!repo || !repo.files || typeof repo.files !== "object" || Object.keys(repo.files).length === 0) {
      throw new UsageError(`vendored-baseline の repos.${key}.files が無い・または空（分母が空）`);
    }
    if (!Array.isArray(repo.readme?.paths) || repo.readme.paths.length === 0) {
      throw new UsageError(`vendored-baseline の repos.${key}.readme.paths が無い・または空`);
    }
    if (!Array.isArray(repo.readme?.files) || repo.readme.files.length === 0) {
      throw new UsageError(`vendored-baseline の repos.${key}.readme.files が無い・または空`);
    }
    for (const [p, sha] of Object.entries(repo.files)) {
      if (typeof sha !== "string" || !HEX40.test(sha)) {
        throw new UsageError(`vendored-baseline の repos.${key}.files[${p}] の期待 blob SHA が 40 桁 16 進でない: ${String(sha).slice(0, 40)}`);
      }
    }
  }
  const maplatCount = Object.keys(doc.repos.maplat.files).length;
  const editorCount = Object.keys(doc.repos["maplat-editor"].files).length;
  if (maplatCount !== 22 || editorCount !== 1) {
    throw new UsageError(
      `vendored-baseline のファイル数が期待と不一致（Maplat ${maplatCount}・Editor ${editorCount}。期待 22 / 1）`,
    );
  }
  return doc;
}

// ---- 同梱ファイルの実在・バイト同一性の判定 ----

/**
 * 基準値の files（path → 期待 SHA）を 1 件ずつ検査する。
 *   - 期待 path に実在しない → problems（FAIL・exit 2）
 *   - 実在するが読み込みに失敗 → errors（環境エラー・exit 3）
 *   - blob SHA が期待と不一致 → problems（FAIL・exit 2）
 * 戻り値 checked は「読み込んで SHA まで照合できた件数」。これが基準値の件数に
 * 満たない場合は problems が非空になるため、分母不足が素通りすることはない。
 */
export function checkRepoFiles(files, repoRoot, label) {
  const problems = [];
  const errors = [];
  let checked = 0;
  for (const [p, expectedSha] of Object.entries(files)) {
    const abs = path.join(repoRoot, p);
    if (!existsSync(abs)) {
      problems.push(`${label}: ${p} が期待 path に実在しない（同梱されていない）`);
      continue;
    }
    let buf;
    try {
      buf = readFileSync(abs);
    } catch (e) {
      errors.push(`${label}: ${p} を読み込めない（${e.message}）。検証できていない`);
      continue;
    }
    checked++;
    const actual = gitBlobSha(buf);
    if (actual !== expectedSha) {
      problems.push(
        `${label}: ${p} の blob SHA 不一致（期待 ${expectedSha}・実測 ${actual}）。` +
          `同梱した内容が PlatSeries HEAD（§1.4）の byte と異なるか、入れ替わっている`,
      );
    }
  }
  return { problems, errors, checked };
}

// ---- README 参照の抽出 ----

/**
 * README 本文から画像参照（<img src="…"> と markdown ![alt](…)）を全数抽出する。
 * 返す要素は { url, kind }。alt は判定に使わない。
 */
export function extractImageRefs(text) {
  const refs = [];
  const imgRe = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = imgRe.exec(text)) !== null) {
    refs.push({ url: m[1], kind: "img" });
  }
  const mdRe = /!\[[^\]]*\]\(([^)\s]+)\)/g;
  while ((m = mdRe.exec(text)) !== null) {
    refs.push({ url: m[1], kind: "markdown" });
  }
  return refs;
}

/**
 * 参照 URL が baseline path P を指しているか（相対形・./ 形・旧絶対形のどれでも
 * 一致させる）。旧絶対形（https://code4history.github.io/Maplat/…）を拾うのは、
 * 相対化を怠った場合に「出現 0 件 → 分母が空 → FAIL」で済ませず「出現はあるが
 * 非相対 → FAIL」と、より具体的に報告するため（fail-closed）。
 */
export function refMatchesPath(url, p) {
  return url === p || url === `./${p}` || url.endsWith(`/${p}`);
}

/**
 * README 参照検査（列挙源は baseline の readme.paths に固定）。1 リポジトリ分。
 *   - 各 README file・各 baseline path について、出現数がちょうど 1 であること
 *     （不足＝出現無しは FAIL、過剰＝2 回以上は FAIL）。
 *   - 各出現は repo-root 相対（http を含まない）かつ参照先 path が実在すること。
 *   - 対象外参照（baseline path を指さない画像参照）は件数を数えるだけで、
 *     FAIL の判定には使わない（全 <img> を検査しない。§4.6-V）。
 */
export function checkReadme(repoRoot, label, readmeSpec) {
  const problems = [];
  const errors = [];
  const perFile = [];
  let totalTarget = 0;
  let totalNonTarget = 0;

  for (const fname of readmeSpec.files) {
    const abs = path.join(repoRoot, fname);
    if (!existsSync(abs)) {
      problems.push(`${label}: README ${fname} が実在しない`);
      continue;
    }
    let text;
    try {
      text = readFileSync(abs, "utf8");
    } catch (e) {
      errors.push(`${label}: README ${fname} を読み込めない（${e.message}）。検証できていない`);
      continue;
    }
    const refs = extractImageRefs(text);
    const matchedPaths = new Set();
    let fileTarget = 0;
    let fileNonTarget = 0;
    for (const r of refs) {
      const hit = readmeSpec.paths.find((p) => refMatchesPath(r.url, p));
      if (!hit) {
        fileNonTarget++;
        continue;
      }
      fileTarget++;
      matchedPaths.add(hit);
      if (r.url.includes("http")) {
        problems.push(
          `${label}: README ${fname} の ${hit} 参照が repo-root 相対でない（http を含む）: ${r.url}`,
        );
      }
      if (!existsSync(path.join(repoRoot, hit))) {
        problems.push(`${label}: README ${fname} の参照先 path が実在しない: ${hit}`);
      }
    }
    for (const p of readmeSpec.paths) {
      if (!matchedPaths.has(p)) {
        problems.push(`${label}: README ${fname} に baseline path ${p} の参照が無い（出現 0 件）`);
      }
    }
    if (fileTarget !== readmeSpec.expect_refs_per_file) {
      problems.push(
        `${label}: README ${fname} の対象参照が ${fileTarget} 箇所（期待 ${readmeSpec.expect_refs_per_file} 箇所）`,
      );
    }
    totalTarget += fileTarget;
    totalNonTarget += fileNonTarget;
    perFile.push({ file: fname, target: fileTarget, nonTarget: fileNonTarget });
  }

  return { problems, errors, totalTarget, totalNonTarget, perFile };
}

// ---- 使い方 ----

const USAGE = `
verify-vendored-images.mjs — oct26-m10-t3-p 同梱同一性検査（V 層）

使い方:
  node scripts/oct26-m10/verify-vendored-images.mjs
      t3-p 同梱後の検査（§4.6-V・AC11-同梱）: Maplat 22 ＋ MaplatEditor 1 の
      計 23 ファイルが期待 path に実在し期待 blob SHA と一致すること、および
      README 参照検査（列挙源は baseline の README 画像 7 path に固定）で
      対象 14 参照（Maplat 12 ＋ MaplatEditor 2）が repo-root 相対で解決できることを
      確認する。gate・AC は exit 0 のみを green とみなす（文言で判定しない）。
  node scripts/oct26-m10/verify-vendored-images.mjs --selftest
      自己テスト（ネットワークに出ず、判定ロジックを固定入力で検査する）

オプション:
  --baseline <file>  vendored-baseline のパス（既定: scripts/oct26-m10/vendored-baseline.json）
  --maplat <path>    Maplat repo-root（既定: 本スクリプトを含むリポジトリ = ../..）
  --editor <path>    MaplatEditor repo-root（既定: 兄弟リポジトリ ../../../MaplatEditor）
  -h, --help         この使い方を表示

mode 別前提（設計 §4.6「検査スクリプトの実行点のまとめ」より V 層の分）:
  | 実行点           | 回す mode       | 前提                                      |
  |------------------|----------------|-------------------------------------------|
  | t3 gate（削除前）| （既定の verify） | t3-p の同梱 commit 後。G + P verify 再実行とともに green であること
  | t3-v（削除後）   | 再実行         | 旧 Pages は消えているが、同梱画像はリポジトリ内で閉じるため本検査はそのまま green になる

判定の要点（§4.6-V）:
  - 23 ファイル（Maplat 22 ＋ MaplatEditor 1）が期待 path に実在し、期待 blob SHA
    （git blob SHA・40 桁）と一致すること。1 件でも不在・不一致なら FAIL。
  - README 参照検査は列挙源を baseline の README 画像 7 path に固定する（全 <img> を
    検査しない。README の外部 badge 等は対象外）。対象 14 参照が repo-root 相対
    （http を含まない）で参照先 path が実在すること。
  - 分母は「対象 14 参照 / 対象外 14 参照」と明示する。対象 0 件（分母が空）は FAIL。

終了コード（fail-closed 契約・gate は exit 0 のみを green とみなす）:
  0 = 全検査を実行し、すべての期待と一致
  2 = 検査 FAIL（ファイル不在・blob SHA 不一致・README 非相対/不在・分母が空・期待件数不一致）
  3 = 実行環境のエラー（同梱ファイル・README の読み込み例外）
  4 = 基準値ファイルの欠損・破損・パース失敗・引数・repo 指定の誤り
  5 = その他の内部例外
`.trim();

// ---- repo-root の解決 ----

function resolveRepoRoot(o) {
  for (const [flag, dir, key] of [
    ["--maplat", o.maplat, "maplat"],
    ["--editor", o.editor, "maplat-editor"],
  ]) {
    if (!existsSync(dir)) {
      throw new UsageError(`${flag} が指す repo-root が実在しない: ${dir}`);
    }
  }
  return o;
}

// ---- 検査本体（戻り値は終了コード。process.exit は呼ばない） ----

export async function run(argv, io = {}) {
  const print = io.print ?? ((s) => console.log(s));
  const printErr = io.printErr ?? ((s) => console.error(s));
  try {
    const o = {
      baseline: DEFAULT_BASELINE,
      maplat: DEFAULT_MAPLAT,
      editor: defaultEditorRoot(),
      mode: "verify",
    };
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      const take = () => {
        const v = argv[++i];
        if (v === undefined) throw new UsageError(`${a} の値が無い`);
        return v;
      };
      if (a === "--baseline") o.baseline = take();
      else if (a === "--maplat") o.maplat = take();
      else if (a === "--editor") o.editor = take();
      else if (a === "--selftest") o.mode = "selftest";
      else if (a === "-h" || a === "--help") o.mode = "help";
      else throw new UsageError(`未知の引数: ${a}`);
    }

    if (o.mode === "help") {
      print(USAGE);
      return EXIT.PASS;
    }
    if (o.mode === "selftest") {
      return (await runSelfTest(print, printErr)) ? EXIT.PASS : 1;
    }

    const baseline = loadBaseline(o.baseline);
    resolveRepoRoot(o);

    const repoRootByKey = { maplat: o.maplat, "maplat-editor": o.editor };
    const allProblems = [];
    const allErrors = [];
    let totalChecked = 0;
    let totalExpected = 0;

    // ---- (1) 同梱ファイル 23 件の実在・バイト同一性 ----
    print(`V 層 同梱同一性（t3-p）: baseline = ${o.baseline}`);
    for (const [key, repo] of Object.entries(baseline.repos)) {
      const root = repoRootByKey[key];
      const expected = Object.keys(repo.files).length;
      totalExpected += expected;
      const r = checkRepoFiles(repo.files, root, repo.label);
      allProblems.push(...r.problems);
      allErrors.push(...r.errors);
      totalChecked += r.checked;
      print(`  ${repo.label}（${root}）: ${r.checked}/${expected} 件を blob SHA 照合`);
    }

    // ---- (2) README 参照検査（列挙源を baseline の readme.paths に固定） ----
    const readmeResults = {};
    let totalTarget = 0;
    let totalNonTarget = 0;
    for (const [key, repo] of Object.entries(baseline.repos)) {
      const root = repoRootByKey[key];
      const r = checkReadme(root, repo.label, repo.readme);
      allProblems.push(...r.problems);
      allErrors.push(...r.errors);
      totalTarget += r.totalTarget;
      totalNonTarget += r.totalNonTarget;
      readmeResults[key] = r;
      for (const pf of r.perFile) {
        print(`  README 検査 ${repo.label}/${pf.file}: 対象 ${pf.target} 参照 / 対象外 ${pf.nonTarget} 参照`);
      }
    }

    // ---- 分母の明示（§4.6-V） ----
    print(
      `  分母: 同梱ファイル ${totalExpected} 件（照合 ${totalChecked} 件）・` +
        `README 対象 ${totalTarget} 参照 / 対象外 ${totalNonTarget} 参照`,
    );
    if (totalTarget !== baseline.expect.readme_target_refs) {
      allProblems.push(
        `README 対象参照が ${totalTarget} 箇所（期待 ${baseline.expect.readme_target_refs} 箇所）`,
      );
    }
    if (totalTarget === 0) {
      allProblems.push("README 対象参照が 0 件（分母が空）。同梱・相対参照化が行われていない");
    }

    // ---- 集約（H-2: 検査群を && で連ねず、全部走らせてから集約する） ----
    if (allErrors.length) {
      for (const e of allErrors) printErr(`環境エラー: ${e}`);
      for (const p of allProblems) printErr(`FAIL: ${p}`);
      printErr("  → 環境エラー（exit 3）。読み込み例外＝検証できていない（fail-closed）。");
      return EXIT.ENV;
    }
    if (allProblems.length) {
      for (const p of allProblems) printErr(`FAIL: ${p}`);
      printErr("  → 検査 FAIL（exit 2）。1 件でも不一致・不在・非相対参照があれば exit 0 にならない。");
      return EXIT.FAIL;
    }
    print(
      `  → V 層 green: 同梱ファイル ${totalChecked}/${totalExpected} 件が期待 blob SHA と一致、` +
        `README 対象 ${totalTarget} 参照（対象外 ${totalNonTarget} 参照は検査対象外）が repo-root 相対で解決`,
    );
    return EXIT.PASS;
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

// ---- 自己テスト（ネットワークに出ない。固定入力で判定関数を叩く） ----

function ok(cond, detail) {
  return cond ? true : detail;
}

/** 64 桁を切るダミー（blob SHA 判定は文字列比較のみに依存）を 40 桁へ整える */
const S = (s) => s.padEnd(40, "0").slice(0, 40);

function buildSelfTestCases() {
  const cases = [];
  const t = (name, fn) => cases.push({ name, fn });

  t("blob-1: gitBlobSha が git hash-object と同一（空 blob = e69de29b…）", async () => {
    return ok(
      gitBlobSha(Buffer.alloc(0)) === "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391",
      `空 blob の SHA が違う: ${gitBlobSha(Buffer.alloc(0))}`,
    );
  });
  t("blob-2: gitBlobSha が git hash-object と同一（既知内容 'hello'）", async () => {
    return ok(
      gitBlobSha(Buffer.from("hello")) === "b6fc4c620b67d95f953a5c1c1230aaab5db5a1b0",
      `'hello' の blob SHA が違う: ${gitBlobSha(Buffer.from("hello"))}`,
    );
  });

  t("files-1: 実在＋SHA 一致は PASS（checked = 件数）", async () => {
    const dir = fsTmpDir();
    fsWrite(dir, "img/a.png", "aaa");
    const v = checkRepoFiles({ "img/a.png": gitBlobSha(Buffer.from("aaa")) }, dir, "X");
    return ok(
      v.problems.length === 0 && v.errors.length === 0 && v.checked === 1,
      `problems=${JSON.stringify(v.problems)} errors=${JSON.stringify(v.errors)} checked=${v.checked}`,
    );
  });
  t("files-2: 期待 path に実在しない場合は FAIL（同梱されていない）", async () => {
    const dir = fsTmpDir();
    const v = checkRepoFiles({ "img/absent.png": S("1") }, dir, "X");
    return ok(
      v.problems.length === 1 && v.problems[0].includes("実在しない") && v.checked === 0,
      `problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("files-3: blob SHA 不一致は FAIL（入れ替わりを検出する陽性対照）", async () => {
    const dir = fsTmpDir();
    fsWrite(dir, "img/a.png", "tampered");
    const v = checkRepoFiles({ "img/a.png": gitBlobSha(Buffer.from("original")) }, dir, "X");
    return ok(
      v.problems.length === 1 && v.problems[0].includes("blob SHA 不一致"),
      `problems=${JSON.stringify(v.problems)}`,
    );
  });

  t("ref-1: 相対形・./ 形・旧絶対形のいずれも baseline path として照合される", async () => {
    return ok(
      refMatchesPath("page_imgs/maplat.png", "page_imgs/maplat.png") &&
        refMatchesPath("./page_imgs/maplat.png", "page_imgs/maplat.png") &&
        refMatchesPath("https://code4history.github.io/Maplat/page_imgs/maplat.png", "page_imgs/maplat.png") &&
        !refMatchesPath("img/locazing.png", "page_imgs/maplat.png"),
      "refMatchesPath の照合が不整合",
    );
  });

  t("readme-1: 相対参照かつ参照先実在は PASS（対象数が正しく数えられる）", async () => {
    const dir = fsTmpDir();
    fsWrite(dir, "page_imgs/maplat.png", "x");
    fsWrite(dir, "README.md", `<img src="page_imgs/maplat.png" />`);
    const v = checkReadme(dir, "X", {
      files: ["README.md"],
      paths: ["page_imgs/maplat.png"],
      expect_refs_per_file: 1,
    });
    return ok(
      v.problems.length === 0 && v.errors.length === 0 && v.totalTarget === 1 && v.totalNonTarget === 0,
      `problems=${JSON.stringify(v.problems)} target=${v.totalTarget}`,
    );
  });
  t("readme-2: http を含む（非相対）参照は FAIL（相対化を怠ったことを検出する陽性対照）", async () => {
    const dir = fsTmpDir();
    fsWrite(dir, "page_imgs/maplat.png", "x");
    fsWrite(dir, "README.md", `<img src="https://code4history.github.io/Maplat/page_imgs/maplat.png" />`);
    const v = checkReadme(dir, "X", {
      files: ["README.md"],
      paths: ["page_imgs/maplat.png"],
      expect_refs_per_file: 1,
    });
    return ok(
      v.problems.some((p) => p.includes("http")),
      `非相対が検出されていない: problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("readme-3: baseline path の参照が 0 件なら FAIL（分母が空を合格にしない）", async () => {
    const dir = fsTmpDir();
    fsWrite(dir, "README.md", `本文のみ。画像参照なし。`);
    const v = checkReadme(dir, "X", {
      files: ["README.md"],
      paths: ["page_imgs/maplat.png"],
      expect_refs_per_file: 1,
    });
    return ok(
      v.problems.some((p) => p.includes("0 件")) && v.problems.some((p) => p.includes("0 箇所")),
      `出現 0 件が検出されていない: problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("readme-4: 参照先 path が実在しない場合は FAIL", async () => {
    const dir = fsTmpDir();
    fsWrite(dir, "README.md", `<img src="page_imgs/maplat.png" />`);
    const v = checkReadme(dir, "X", {
      files: ["README.md"],
      paths: ["page_imgs/maplat.png"],
      expect_refs_per_file: 1,
    });
    return ok(
      v.problems.some((p) => p.includes("実在しない")),
      `参照先不在が検出されていない: problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("readme-5: 対象外（外部 badge）は件数に数えるが FAIL にしない", async () => {
    const dir = fsTmpDir();
    fsWrite(dir, "page_imgs/maplat.png", "x");
    fsWrite(
      dir,
      "README.md",
      `<img src="page_imgs/maplat.png" /><img src="https://img.shields.io/badge/x-y.svg" />`,
    );
    const v = checkReadme(dir, "X", {
      files: ["README.md"],
      paths: ["page_imgs/maplat.png"],
      expect_refs_per_file: 1,
    });
    return ok(
      v.problems.length === 0 && v.totalTarget === 1 && v.totalNonTarget === 1,
      `対象外の扱いが不整合: problems=${JSON.stringify(v.problems)} target=${v.totalTarget} non=${v.totalNonTarget}`,
    );
  });

  t("baseline-1: 実 vendored-baseline.json は 23 ファイル（Maplat 22 ＋ Editor 1）を読める", async () => {
    const doc = loadBaseline(path.join(SCRIPT_DIR, "vendored-baseline.json"));
    const mc = Object.keys(doc.repos.maplat.files).length;
    const ec = Object.keys(doc.repos["maplat-editor"].files).length;
    return ok(
      mc === 22 && ec === 1 && doc.expect.files_total === 23 && doc.expect.readme_target_refs === 14,
      `maplat=${mc} editor=${ec} expect=${JSON.stringify(doc.expect)}`,
    );
  });

  return cases;
}

// ---- 自己テスト用の一時ディレクトリ（/var/folders 等の書き込み可能領域） ----

function fsTmpDir() {
  return mkdtempSync(path.join(os.tmpdir(), "verify-vendored-"));
}
function fsWrite(dir, rel, content) {
  const abs = path.join(dir, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

async function runSelfTest(print, printErr) {
  const cases = buildSelfTestCases();
  print(`===== verify-vendored-images.mjs 自己テスト（${cases.length} ケース） =====`);
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

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  run(process.argv.slice(2)).then((code) => process.exit(code));
}
