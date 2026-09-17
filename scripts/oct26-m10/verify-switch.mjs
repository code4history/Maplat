#!/usr/bin/env node
/**
 * verify-switch.mjs — oct26-m10-t1 配信同一性検査（P 層: s.maplat.jp の切替前後）
 *
 * 識別語: OCT26-M10T1-IMPL-HOTARU（是正: OCT26-M10T1-FIX-TSUBAME・追加: OCT26-M10T2-POSCTRL-HIBARI）
 *
 * 正本: docs/superpowers/specs/2026-09-16-oct26-m10-design.md（v2）
 *   - §4.6-P  proxy 同一性（capture モードと verify モード）
 *   - §4.3-2  基準値マニフェストの処遇（proxy-baseline-pre.json = t2 切替前採取）
 *   - §5.3    AC6（--capture）・AC7（--verify）
 *   - §9.2    人間手順（Workers 向け先変更・cache purge）
 *
 * 層の構成:
 *   capture（t2-c・切替直前）: 52 枚の {name}.html に対する本番形式
 *     https://s.maplat.jp/r/{name}/（appsIndex.json の URL 形式に同じ）と代表資産
 *     （aizumap 1 地図分: apps/aizu.json・assets/maplat.css）の status・sha256 を
 *     採取し captures/proxy-baseline-pre.json へ書く。
 *     403/404 で応じる map 名（Workers が route していない等）は「応答しない集合」として
 *     基準値に記録する（route 表は Workers 側にあり本設計からは見えないため、
 *     「切替前に 200 だったものが切替後も同じ内容で 200」を検査基準にする）。
 *   verify（t2-v・切替後）: 同じ URL 群に ?_=<ISO8601> の cache-bust クエリを
 *     付けて再取得する（CDN キャッシュの回避。CloudFlare の cache key は通常
 *     クエリを含むため、bust によって origin まで届く）。判定は §4.6-P どおり:
 *     基準値で 200 のものは全て 200 かつ sha256 一致。
 *     基準値で 200 以外のものは現状維持（新たに 200 になっても FAIL にしない。
 *     内容は H 層〔verify-ghpages-identity.mjs --http〕で保証済み）。
 *     cf-cache-status が HIT の場合は FAIL（origin まで届いておらず検査に
 *     なっていないため §9.2 の cache purge をやり直す）。HIT 判定は trim +
 *     大文字化の正規化比較で行う（"hit"・"Hit" 等の表記ゆれも HIT として検出）。
 *   positive-control（--positive-control・--verify 内でも必須）: AC7 の false-green
 *     を塞ぐ陽性対照。fix commit（PlatSeries ea2fcb7）で中身が変わった
 *     allowlist.json の expected_changes（shizuoka.html・README.md）を
 *     https://s.maplat.jp/r/<path>（拡張子付き raw path）から cache-bust 付きで
 *     取得し、中身が PlatSeries 側の期待値（allowlist の expected_sha256・機械採取済み）
 *     と一致することを確かめる。上流がまだ Maplat（切替が効いていない）なら中身が
 *     旧側と一致して FAIL になる。--verify はこの陽性対照も green でないと
 *     exit 0 にならない（詳細は判定関数のコメント参照）。
 *
 * map 名の列挙は手書きリストを作らず、ghpages-tree-baseline.json（§4.3 の凍結証跡）
 * の tree から機械導出する。name = 拡張子を除いた path。トップレベルの地図ページ
 * （aizumap.html 等）は appsIndex.json の URL 形式と一致する。tree に含まれる
 * 非トップレベルの HTML（dist/index.html 等）はプロキシが応じない可能性が
 * あるが、その場合は 403/404 として「応答しない集合」へ記録され、検査の
 * 分母（基準値で 200 の URL）からは除外される。
 *
 * 終了コード契約（fail-closed・§4.6。verify-ghpages-identity.mjs と同一契約）:
 *   0: 全検査を実行し、すべての期待と一致（成功のみが到達できる）
 *   2: 検査 FAIL（基準値 200 の URL が非 200・sha256 不一致・cf-cache-status=HIT・
 *      分母が空〔応答 200 が 0 件〕・陽性対照不一致・陽性対照の期待値が未採取）
 *   3: 実行環境のエラー（ネットワーク例外・fetch の throw・DNS・タイムアウト）
 *   4: 基準値ファイルの欠損・破損・パース失敗・引数・mode の誤り
 *   5: その他の内部例外（スクリプト自身のバグ）
 *   --selftest のみ別契約: 0 = 全ケース緑 / 1 = ケース不整合
 *
 *   capture モードも同じ契約に従う（§4.6）: 採取中のネットワーク例外・内部例外が
 *   あれば基準値ファイルを書かずに非ゼロで終了する（不完全な基準値は verify を
 *   無条件 green にし得るため、書き出しは全採取成功の後のみ）。
 *   なお 403/404 の「応答しない map 名」の記録は応答として正しく、例外とは区別する。
 *   応答 200 が 1 件も無い場合は基準値として意味が無いため FAIL とする
 *   （「0 件検査して全合格」の無条件 green を機械的に不可能にする）。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  EXIT,
  EnvError,
  PENDING,
  UsageError,
  httpGet,
  parseAllowlist,
  parseBaseline,
} from "./verify-ghpages-identity.mjs";

// ---- 位置と定数（設計 §4.6-P・§4.3 の値） ----

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TREE_BASELINE_PATH = path.join(SCRIPT_DIR, "ghpages-tree-baseline.json");
const CAPTURES_DIR = path.join(SCRIPT_DIR, "captures");
const PROXY_BASELINE_PATH = path.join(CAPTURES_DIR, "proxy-baseline-pre.json");
const ALLOWLIST_PATH = path.join(SCRIPT_DIR, "allowlist.json");

const PROXY_CAPTURE_SCHEMA = "oct26-m10-proxy-baseline-pre";

/** §4.6-P: 本番形式（appsIndex.json の URL 形式に同じ） */
const PAGE_BASE = "https://s.maplat.jp/r/";
/** §4.6-P: 代表資産（例示の aizumap 1 地図分。ページ URL からの相対解決で
 * プロキシが透過する資材） */
const REPRESENTATIVE_ASSETS = [
  "https://s.maplat.jp/r/aizumap/apps/aizu.json",
  "https://s.maplat.jp/r/aizumap/assets/maplat.css",
];
/** §4.6-P・§1.1: {name}.html は 52 枚 */
const EXPECT_HTML = 52;

const HEX64 = /^[0-9a-f]{64}$/;

// ---- 列挙: tree baseline から map 名を機械導出する ----

/**
 * §4.6-P capture の対象 URL を組み立てる。
 * 52 枚の {name}.html（name = 拡張子を除いた tree 上の path）+ 代表資産 2 件。
 */
export function buildProxyTargets(treeBaseline, opts = {}) {
  const limit = opts.limit ?? 0;
  const problems = [];
  const html = (treeBaseline.tree ?? []).filter((e) => e.path.endsWith(".html"));
  const pages = html.map((e) => {
    const name = e.path.replace(/\.html$/, "");
    return { url: `${PAGE_BASE}${name}/`, kind: "page", path: e.path };
  });
  const assets = REPRESENTATIVE_ASSETS.map((u) => ({ url: u, kind: "asset", path: null }));
  let targets = [...pages, ...assets];
  if (!limit) {
    if (pages.length < EXPECT_HTML) {
      problems.push(
        `map 名（{name}.html）の列挙が ${pages.length} 件で設計期待（${EXPECT_HTML}）に満たない`,
      );
    }
  }
  if (limit > 0) targets = targets.slice(0, limit);
  if (targets.length === 0) problems.push("対象 URL の列挙が 0 件（分母が空）");
  return {
    targets,
    breakdown: { pages: pages.length, assets: assets.length, total: targets.length },
    problems,
  };
}

/** verify モードの cache-bust クエリ（§4.6-P: ?_=<ISO8601>） */
export function withBust(url, bust) {
  const u = new URL(url);
  u.searchParams.set("_", bust);
  return u.toString();
}

// ---- 判定: capture ----

/**
 * capture の判定。例外（応答の取得に失敗）は「応答しない集合」（403/404 等）と
 * 区別する: 例外は outcome "error"（exit 3）・基準値ファイルを書かない。
 * 全採取が完了しても応答 200 が 0 件なら FAIL（分母が空）。
 */
export function judgeCapture(results) {
  const errors = [];
  const problems = [];
  if (!Array.isArray(results) || results.length === 0) {
    return { outcome: "fail", problems: ["対象列挙が 0 件（分母が空）"], errors, responded_200: 0 };
  }
  let ok200 = 0;
  let non200 = 0;
  for (const r of results) {
    if (r.error) {
      errors.push(`${r.url}: ${r.error}`);
      continue;
    }
    if (r.status === 200) ok200++;
    else non200++;
  }
  if (ok200 === 0) {
    problems.push(
      "応答 200 の URL が 0 件（分母が空）。全滅状態の基準値は verify を無条件 green にし得るため書かない",
    );
  }
  if (errors.length) return { outcome: "error", problems, errors, responded_200: ok200, non_200: non200 };
  if (problems.length) return { outcome: "fail", problems, errors, responded_200: ok200, non_200: non200 };
  return { outcome: "pass", problems: [], errors, responded_200: ok200, non_200: non200 };
}

// ---- 判定: verify ----

/**
 * verify の判定（§4.6-P）。
 *   - 基準値で 200 の URL: 全て 200 かつ sha256 一致が必須（cf-cache-status が
 *     HIT なら FAIL: origin まで届いていない＝検査になっていない）。
 *     HIT 判定は大小文字を正規化して行う（実装レビュー Minor-1 の是正:
 *     CloudFlare の cf-cache-status は大文字固定が既知だが、防御的に
 *     "hit"・"Hit" 等の小文字・混在表記も HIT として検出する）。
 *   - 基準値で 200 以外の URL: 現状維持（新たに 200 になっても FAIL にしない）。
 *   - 例外（fetch の throw・タイムアウト）は 1 件でもあれば outcome "error"
 *     （exit 3）。条件偽（exit 2）と区別する。
 *   - 基準値で 200 の URL が 0 件なら FAIL（分母が空）。
 */
export function judgeVerify(proxyBaseline, results) {
  const problems = [];
  const errors = [];
  const byUrl = new Map(results.map((r) => [r.url, r]));
  const compared = [];
  let heldNon200 = 0;
  for (const u of proxyBaseline.urls) {
    const r = byUrl.get(u.url);
    if (!r) {
      problems.push(`基準値の URL が今回の結果に無い（列挙漏れ）: ${u.url}`);
      continue;
    }
    if (r.fresh?.error) {
      errors.push(`${u.url}: ${r.fresh.error}`);
      continue;
    }
    if (u.status === 200) {
      compared.push(u.url);
      if (r.fresh.status !== 200) {
        problems.push(`基準値 200 の URL が非 200（${r.fresh.status}）: ${u.url}`);
        continue;
      }
      if (r.fresh.sha256 !== u.sha256) {
        problems.push(
          `sha256 不一致: ${u.url}（基準値 ${u.sha256.slice(0, 12)}…・実測 ${r.fresh.sha256.slice(0, 12)}…）`,
        );
        continue;
      }
      // HIT 判定は trim + 大文字化して比較する（Minor-1 是正: "hit"/"Hit" の素通りを防ぐ）
      if (String(r.fresh.cf_cache_status ?? "").trim().toUpperCase() === "HIT") {
        problems.push(
          `cf-cache-status=HIT（origin まで届いていない）: ${u.url}。` +
            `§9.2 の cache purge をやり直してから再実行すること`,
        );
      }
    } else {
      heldNon200++;
    }
  }
  if (compared.length === 0) {
    problems.push(
      "基準値で 200 の URL が 0 件（分母が空）。--capture の採取結果を確認すること",
    );
  }
  // 例外による失敗を条件偽による失敗より優先する（exit 3 vs 2 の区別）。
  if (errors.length) return { outcome: "error", exit_code: EXIT.ENV, problems, errors, compared, held_non_200: heldNon200 };
  if (problems.length) return { outcome: "fail", exit_code: EXIT.FAIL, problems, errors, compared, held_non_200: heldNon200 };
  return { outcome: "pass", exit_code: EXIT.PASS, problems: [], errors, compared, held_non_200: heldNon200 };
}

// ---- 陽性対照（positive control）: 切替が実際に効いていることの検出 ----

/**
 * 陽性対照の対象 URL を allowlist の expected_changes から機械導出する
 * （§4.3 手書き禁止: 対象 path も期待値も手書きせず allowlist から読む）。
 *
 * なぜ expected_changes だけが判別点になるか（AC7 の false-green の本質）:
 *   PlatSeries は Maplat gh-pages の完全コピーであるため、/r/ 経由で配信される
 *   中身は旧・新で同一。--verify（基準値との自己比較）だけでは「上流が実際に
 *   PlatSeries へ切り替わったか」を検出できない。上流を切り替えても配信内容が
 *   変わらないからである。中身が変わるのは §4.5 の fix commit（ea2fcb7）で
 *   書き換えた expected_changes の 2 ファイル（shizuoka.html・README.md）だけ。
 *   ∴ この 2 ファイルを s.maplat.jp から引いて「どちらの側の中身が返るか」を
 *   見れば、切替の実効を検出できる。expected_additions（.nojekyll）は
 *   「追加のみ・対処時に限る」特殊エントリで、切替前の Maplat にも存在せず
 *   判別点にならないため対象に含めない。
 *
 * URL は拡張子付きの raw path（https://s.maplat.jp/r/<path>）を使う。
 *   拡張子付き raw path は CDN/Worker の path 透過（例: /r/aizumap/apps/aizu.json）
 *   で原ファイルそのものを返す。trailing slash のページ形式 /r/shizuoka/ は
 *   shizuoka に限って 404 を返す（実測: /r/shizuoka/ → 404）ため判別に使わない。
 *   /r/shizuoka.html・/r/README.md は 200 を返す（実測済み）。
 *
 * fail-closed の考え方（委任の「Maplat 側と比較するか期待値一致だけか」への回答）:
 *   「s.maplat.jp の中身 == PlatSeries 側期待値（allowlist の expected_sha256）」
 *   だけを PASS 条件にする。Maplat 側の期待値は allowlist に存在しない
 *   （allowlist は fix 後期待値のみを機械採取する。§4.3）。実行時に旧 origin
 *   （https://code4history.github.io/Maplat/<path>）を取得して比較対象にする方式は
 *   採らない。理由:
 *     (1) 旧 origin は t3（gh-pages 削除）で消える。そこへの取得を陽性対照の
 *         前提にすると、切替が正しく完了したあとの t3 以降（旧 Pages が消えた後）
 *         --verify を再実行（gate G7・§6.3 t3-v）した際に、旧 origin の 404 が
 *         環境エラー（exit 3）となって「正しい切替が緑にならない」失敗を作る。
 *     (2) 「== PlatSeries 期待値」は「!= Maplat 側」より強い条件である。上流が
 *         Maplat のまま（切替未達）でも、中身が第 3 の値（想定外の改変・破損）でも、
 *         いずれも PlatSeries 期待値と一致せず FAIL になる。Maplat 側との不一致
 *         「だけ」を条件にすると、第 3 の値が素通りする余地が残る。
 *   ∴ 「PlatSeries 側期待値と完全一致すること」だけを PASS 条件にするのが
 *     fail-closed として正しい（期待値は §9.1 手順 7 の fix commit から機械採取済み。
 *     PENDING のままなら期待値が無く判定不能として FAIL する）。
 */
export function planPositiveControl(allowlist) {
  const problems = [];
  const changes = allowlist?.raw?.expected_changes;
  if (!Array.isArray(changes) || changes.length === 0) {
    return {
      targets: [],
      problems: [
        "陽性対照の対象（allowlist の expected_changes）が 0 件（分母が空）。切替の実効を判定できない",
      ],
    };
  }
  const targets = changes.map((e) => ({
    url: `${PAGE_BASE}${e.path}`,
    path: e.path,
    expected_sha256: e.expected_sha256,
  }));
  for (const t of targets) {
    // 期待値は機械採取済みであることが前提（§4.3）。PENDING のまま（未採取）は
    // 判定不能なので fail-closed で FAIL にする（手書きで期待値を補わない）。
    if (t.expected_sha256 === PENDING || !HEX64.test(t.expected_sha256 ?? "")) {
      problems.push(
        `${t.path} の期待値（expected_sha256）が "${PENDING}"（未採取）か 64 桁 16 進でない。` +
          `陽性対照は期待値が無ければ判定できない（fail-closed）。§9.1 手順 7 で機械採取してから再実行すること`,
      );
    }
  }
  return { targets, problems };
}

/**
 * 陽性対照の判定（judgeVerify と同じ fail-closed 契約）。
 *   - 対象（allowlist の expected_changes）各 path を PlatSeries 側期待値
 *     （expected_sha256）と照合する。status 200 かつ sha256 一致が必須。
 *   - 上流が Maplat のまま（切替が効いていない）なら sha256 が旧側と一致し、
 *     期待値と不一致になるため FAIL になる（これが陽性対照の目的）。
 *   - 取得例外は outcome "error"（exit 3）。条件偽（exit 2）と区別する。
 *   - cf-cache-status=HIT は FAIL（origin まで届いていない）。
 *   - 対象 0 件（分母が空）なら FAIL。
 */
export function judgePositiveControl(targets, results) {
  const problems = [];
  const errors = [];
  const byUrl = new Map(results.map((r) => [r.url, r]));
  const compared = [];
  if (!Array.isArray(targets) || targets.length === 0) {
    return {
      outcome: "fail",
      exit_code: EXIT.FAIL,
      problems: ["陽性対照の対象が 0 件（分母が空）"],
      errors,
      compared,
    };
  }
  for (const t of targets) {
    const r = byUrl.get(t.url);
    if (!r) {
      problems.push(`陽性対照の URL が今回の結果に無い（列挙漏れ）: ${t.url}`);
      continue;
    }
    if (r.fresh?.error) {
      errors.push(`${t.url}: ${r.fresh.error}`);
      continue;
    }
    compared.push(t.url);
    if (r.fresh.status !== 200) {
      problems.push(
        `陽性対照が非 200（${r.fresh.status}）: ${t.url}。切替の実効を判定できない`,
      );
      continue;
    }
    if (r.fresh.sha256 !== t.expected_sha256) {
      problems.push(
        `陽性対照不一致: ${t.url} の中身が PlatSeries 側の期待値と一致しない` +
          `（期待 ${t.expected_sha256.slice(0, 12)}…・実測 ${r.fresh.sha256.slice(0, 12)}…）。` +
          `上流がまだ Maplat（切替が効いていない）か、内容が想定と異なる`,
      );
      continue;
    }
    if (String(r.fresh.cf_cache_status ?? "").trim().toUpperCase() === "HIT") {
      problems.push(
        `cf-cache-status=HIT（origin まで届いていない）: ${t.url}。` +
          `§9.2 の cache purge をやり直してから再実行すること`,
      );
    }
  }
  if (errors.length) {
    return { outcome: "error", exit_code: EXIT.ENV, problems, errors, compared };
  }
  if (problems.length) {
    return { outcome: "fail", exit_code: EXIT.FAIL, problems, errors, compared };
  }
  return { outcome: "pass", exit_code: EXIT.PASS, problems: [], errors, compared };
}

// ---- 使い方と mode 別前提（実行点を誤らせない） ----

const USAGE = `
verify-switch.mjs — oct26-m10 配信同一性検査（P 層: s.maplat.jp の切替前後）

使い方:
  node scripts/oct26-m10/verify-switch.mjs --capture
      t2-c（切替直前）: 52 map 名 + 代表資産の status・sha256 を採取して
      captures/proxy-baseline-pre.json へ書く（§4.6-P・AC6）
  node scripts/oct26-m10/verify-switch.mjs --verify
      t2-v（切替後）: 基準値で 200 の URL が全て 200 かつ sha256 一致することを
      確認する（§4.6-P・AC7）。cf-cache-status を検査ログに記録する。加えて
      「陽性対照」（下記 --positive-control）も必須で内包し、切替が実際に効いて
      いること（上流が PlatSeries になっていること）まで確認する
  node scripts/oct26-m10/verify-switch.mjs --positive-control
      陽性対照（単独実行）: allowlist の expected_changes（切替で中身が変わる
      shizuoka.html・README.md）を s.maplat.jp 経由で取得し、中身が PlatSeries 側の
      期待値と一致することを確認する。--verify はこの検査を必ず内包する
  node scripts/oct26-m10/verify-switch.mjs --selftest
      自己テスト（ネットワークに出ずに判定ロジックを固定入力で検査する）

オプション:
  --tree-baseline <file>  --capture が map 名列挙に使う tree baseline
                           （既定: scripts/oct26-m10/ghpages-tree-baseline.json）
  --out <file>            proxy 基準値のパス（--capture の書き先・--verify の読み元。
                          既定: scripts/oct26-m10/captures/proxy-baseline-pre.json）
  --allowlist <file>      allowlist のパス（--positive-control と --verify 内の陽性対照が
                          読み、期待値 expected_sha256 を機械採取済みの値として使う。
                          既定: scripts/oct26-m10/allowlist.json）
  --limit <n>             --capture の対象を先頭 n 件へ絞る（試験用。本番には使わない）
  --timeout-ms <n>        1 要求のタイムアウト（既定: 30000）
  --bust                  --verify の cache-bust は既定で on（明示用。意味は既定と同じ）

mode 別前提（設計 §4.6「検査スクリプトの実行点のまとめ」より P 層の分）:
  | 実行点           | 回す mode   | 前提                                        |
  |------------------|-------------|---------------------------------------------|
  | t2-c（切替直前） | --capture   | Workers の向け先変更の前（t1 の AC1〜AC5 全 green 後）
  | t2-v（切替後）   | --verify    | §9.2 の人間手順（purge 含む）完了後。陽性対照で「上流が PlatSeries に切り替わったこと」も検出
  | t3 gate（削除前）| --verify を再実行 | --git とともに green であること
  | t3-v（削除後）   | --verify を再実行 | 旧 Pages は消えているため H 層
                                      （verify-ghpages-identity.mjs --http）は再実行しない

  ※ --verify は陽性対照（allowlist の expected_changes を PlatSeries 側期待値と照合）
    を必ず内包する。t3 gate・t3-v の --verify 再実行でもこの内包検査が効き、
    「切替の疎通」と「切替の実効」の両方が green でない限り exit 0 にならない。

判定の要点（§4.6-P）:
  - 陽性対照: allowlist の expected_changes（shizuoka.html・README.md）を
    https://s.maplat.jp/r/<path> から cache-bust 付きで取得し、中身が PlatSeries 側の
    期待値（expected_sha256）と一致すること。--verify は常にこれを内包し、一致し
    なければ FAIL（上流がまだ Maplat のまま等を検出する）。期待値が未採取（PENDING）
    のまま使われたら FAIL（fail-closed）
  - 基準値（--capture の結果）で 200 だった URL は、切替後も全て 200 かつ
    sha256 一致であること。
  - 基準値で 200 以外（403/404 等の「応答しない集合」）は現状維持とし、新たに
    200 になっても FAIL にしない（内容は H 層で保証済みのため）。
  - 基準値で 200 の URL に cf-cache-status: HIT が残る場合は FAIL とする
    （origin まで届いておらず sha256 一致の意味が消えるため。
    §9.2 の cache purge をやり直して再実行すること。HIT 判定は大小文字を
    正規化して行う: "hit"・"Hit" 等も HIT として検出する）。
  - --verify は ?_=<ISO8601> の cache-bust クエリを付けて再取得する
    （CDN キャッシュの回避。静的配信はクエリを無視するが CloudFlare の
    cache key は通常クエリを含むため、bust によって origin まで届く）。
  - --capture は 403/404 を「応答しない集合」として基準値に記録する
    （例外〔タイムアウト・DNS 等〕とは区別する。例外なら基準値を書かない）。

終了コード（fail-closed 契約・gate は exit 0 のみを green とみなす）:
  0 = 全検査を実行し、すべての期待と一致
  2 = 検査 FAIL（非 200・sha256 不一致・cf-cache-status=HIT・分母が空〔応答 200 が 0 件〕・
      陽性対照不一致・陽性対照の期待値が未採取（PENDING））
  3 = 実行環境のエラー（ネットワーク例外・タイムアウト）
  4 = 基準値ファイルの欠損・破損・パース失敗・引数・mode の誤り
  5 = その他の内部例外
  ※ 本層は大量 HTTP を伴うため既定では実行しない。--capture / --verify の
    明示フラグが必須で、CI・pre-commit からは呼ばれない
    （rule-0012 の到達可能性は package.json の scripts 結線で満たす。設計 §4.6）。
`.trim();

// ---- ファイル読み込み（欠損・破損は UsageError → exit 4） ----

function loadTreeBaseline(file) {
  if (!existsSync(file)) {
    throw new UsageError(
      `tree baseline ファイルが無い: ${file}。scripts/oct26-m10/verify-ghpages-identity.mjs --make-baseline を先に実行すること（§4.3）`,
    );
  }
  const r = parseBaseline(readFileSync(file, "utf8"));
  if (!r.ok) {
    throw new UsageError(
      `tree baseline が破損・不整合（${file}）:\n  - ${r.problems.join("\n  - ")}`,
    );
  }
  return r.baseline;
}

function loadProxyBaseline(file) {
  if (!existsSync(file)) {
    throw new UsageError(
      `proxy 基準値ファイルが無い: ${file}。先に --capture（t2-c・切替直前）を実行すること（§4.6-P・AC6）`,
    );
  }
  let doc;
  try {
    doc = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new UsageError(`proxy 基準値を JSON として parse できない: ${e.message}`);
  }
  if (doc?.schema !== PROXY_CAPTURE_SCHEMA) {
    throw new UsageError(
      `proxy 基準値の schema が ${PROXY_CAPTURE_SCHEMA} でない（実: ${JSON.stringify(doc?.schema)}）`,
    );
  }
  if (!Array.isArray(doc?.urls) || doc.urls.length === 0) {
    throw new UsageError("proxy 基準値の urls 配列が無い・または空");
  }
  for (const u of doc.urls) {
    if (!u?.url || typeof u.url !== "string" || !Number.isInteger(u.status)) {
      throw new UsageError(
        `proxy 基準値の urls エントリが不整合: ${String(JSON.stringify(u)).slice(0, 120)}`,
      );
    }
    if (u.status === 200 && !HEX64.test(u.sha256 ?? "")) {
      throw new UsageError(
        `proxy 基準値の 200 エントリに sha256（64 桁）が無い: ${u.url}`,
      );
    }
  }
  return doc;
}

/**
 * allowlist.json の読み込み（欠損・破損は UsageError → exit 4）。期待値は
 * fix commit 作成時に機械採取済み（§4.3）であることが契約。
 */
function loadAllowlist(file) {
  if (!existsSync(file)) {
    throw new UsageError(
      `allowlist ファイルが無い: ${file}。scripts/oct26-m10/allowlist.json（期待値は機械採取済み。§4.3）を確認すること`,
    );
  }
  const r = parseAllowlist(readFileSync(file, "utf8"));
  if (!r.ok) {
    throw new UsageError(
      `allowlist が破損・不整合（${file}）:\n  - ${r.problems.join("\n  - ")}`,
    );
  }
  return r.allowlist;
}

// ---- mode 実行部 ----

async function runCapture(o, print, printErr) {
  const treeBaseline = loadTreeBaseline(o.treeBaseline);
  const { targets, breakdown, problems } = buildProxyTargets(treeBaseline, {
    limit: o.limit,
  });
  print(
    `P 層 capture（t2-c・切替直前）: 対象 = map 名 ${breakdown.pages} 件 + 代表資産 ${breakdown.assets} 件` +
      `${o.limit ? `（--limit ${o.limit} で先頭 ${targets.length} 件へ試験縮小）` : ""}`,
  );
  if (problems.length) {
    for (const p of problems) printErr(`FAIL: ${p}`);
    return EXIT.FAIL; // 分母不足は FAIL（exit 2）
  }
  const results = [];
  for (const t of targets) {
    const rec = { ...t };
    try {
      const r = await httpGet(t.url, { timeoutMs: o.timeoutMs });
      Object.assign(rec, {
        status: r.status,
        sha256: r.sha256,
        content_type: r.content_type,
        cf_cache_status: r.cf_cache_status,
        final_url: r.final_url,
        bytes: r.bytes,
      });
    } catch (e) {
      rec.error = e.message;
    }
    results.push(rec);
    const brief = rec.error
      ? `エラー: ${rec.error.split("\n")[0]}`
      : `${rec.status} sha256=${rec.sha256.slice(0, 12)}… cf=${rec.cf_cache_status ?? "-"}`;
    print(`  [${results.length}/${targets.length}] ${t.url}: ${brief}`);
  }
  const verdict = judgeCapture(results);
  if (verdict.outcome === "error") {
    for (const e of verdict.errors) printErr(`環境エラー: ${e}`);
    printErr(
      "  → 基準値ファイルは書かない（採取中の例外＝不完全な基準値。§4.6 の capture 契約）",
    );
    return EXIT.ENV;
  }
  if (verdict.outcome === "fail") {
    for (const p of verdict.problems) printErr(`FAIL: ${p}`);
    printErr("  → 基準値ファイルは書かない");
    return EXIT.FAIL;
  }
  // 全採取成功（例外 0 件・応答 200 が 1 件以上）のみ書き出す（§4.6 capture 契約）
  mkdirSync(path.dirname(o.out), { recursive: true });
  const cap = {
    schema: PROXY_CAPTURE_SCHEMA,
    version: 1,
    design_doc: "docs/superpowers/specs/2026-09-16-oct26-m10-design.md §4.6-P（v2）",
    generated_at: new Date().toISOString(),
    mode: "capture",
    page_base: PAGE_BASE,
    breakdown,
    summary: {
      total: results.length,
      responded_200: verdict.responded_200,
      non_200: verdict.non_200,
      note: "403/404 等は「応答しない集合」として記録する（§4.6-P）。verify は responded_200 のみを分母とする",
    },
    urls: results.map((r) => ({
      url: r.url,
      kind: r.kind,
      path: r.path,
      status: r.status,
      sha256: r.sha256,
      content_type: r.content_type,
      cf_cache_status: r.cf_cache_status,
      final_url: r.final_url,
      bytes: r.bytes,
      ...(r.error ? { error: r.error } : {}),
    })),
  };
  writeFileSync(o.out, JSON.stringify(cap, null, 1) + "\n", "utf8");
  print(
    `  → capture green: 応答 200 が ${verdict.responded_200} 件・応答しない集合（非 200）が ${verdict.non_200} 件。` +
      `基準値を書いた: ${o.out}`,
  );
  return EXIT.PASS;
}

/**
 * 陽性対照の取得（cache-bust 付き）+ 判定。plan.targets を逐次取得して
 * judgePositiveControl へ渡した verdict を返す。進捗は print へ書く。
 */
async function fetchPositiveControl(targets, bust, timeoutMs, print) {
  const results = [];
  for (const t of targets) {
    const bustedUrl = withBust(t.url, bust);
    const rec = { url: t.url, path: t.path, expected_sha256: t.expected_sha256 };
    try {
      const r = await httpGet(bustedUrl, { timeoutMs });
      rec.fresh = {
        status: r.status,
        sha256: r.sha256,
        cf_cache_status: r.cf_cache_status,
        final_url: r.final_url,
      };
    } catch (e) {
      rec.fresh = { error: e.message };
    }
    results.push(rec);
    const brief = rec.fresh.error
      ? `エラー: ${rec.fresh.error.split("\n")[0]}`
      : `${rec.fresh.status} sha256=${rec.fresh.sha256.slice(0, 12)}… cf=${rec.fresh.cf_cache_status ?? "-"}`;
    const mark =
      rec.fresh.error || rec.fresh.status !== 200
        ? ""
        : rec.fresh.sha256 === t.expected_sha256
          ? "（一致）"
          : "（不一致）";
    print(`  [${results.length}/${targets.length}] ${t.url}: ${brief}${mark}`);
  }
  return judgePositiveControl(targets, results);
}

/**
 * 陽性対照を単独で実行する（--positive-control）。fail-closed 契約どおりの
 * 終了コードを返す。
 */
async function runPositiveControl(o, print, printErr) {
  const allowlist = loadAllowlist(o.allowlistPath);
  const plan = planPositiveControl(allowlist);
  const bust = new Date().toISOString();
  print(
    `陽性対照（切替が実際に効いていることの検出）: allowlist ${o.allowlistPath} の ` +
      `expected_changes ${plan.targets.length} 件を s.maplat.jp 経由で取得`,
  );
  print(`  cache-bust クエリ: ?_=${bust}`);
  if (plan.problems.length) {
    for (const p of plan.problems) printErr(`FAIL: ${p}`);
    printErr(
      "  → 検査 FAIL（exit 2）。期待値が未採取（PENDING）か対象が空で、切替の実効を判定できない（fail-closed）",
    );
    return EXIT.FAIL;
  }
  const verdict = await fetchPositiveControl(plan.targets, bust, o.timeoutMs, print);
  if (verdict.outcome === "error") {
    for (const e of verdict.errors) printErr(`環境エラー: ${e}`);
    for (const p of verdict.problems) printErr(`FAIL: ${p}`);
    printErr("  → 環境エラー（exit 3）。取得例外は条件偽（exit 2）と区別される。");
    return EXIT.ENV;
  }
  if (verdict.outcome === "fail") {
    for (const p of verdict.problems) printErr(`FAIL: ${p}`);
    printErr(
      "  → 検査 FAIL（exit 2）。上流がまだ Maplat のまま（切替が効いていない）等。§2.3 の戻し方を参照",
    );
    return EXIT.FAIL;
  }
  print(
    `  → 陽性対照 green: ${verdict.compared.length} 件が PlatSeries 側の期待値と一致（切替が効いている）`,
  );
  return EXIT.PASS;
}

async function runVerify(o, print, printErr) {
  const proxyBaseline = loadProxyBaseline(o.out);
  const allowlist = loadAllowlist(o.allowlistPath);
  const bust = new Date().toISOString();
  const compared200 = proxyBaseline.urls.filter((u) => u.status === 200).length;
  print(
    `P 層 verify（t2-v・切替後疎通）: 基準値 ${o.out}（200 が ${compared200} 件・非 200 が ${proxyBaseline.urls.length - compared200} 件）`,
  );
  print(`  cache-bust クエリ: ?_=${bust}`);

  // ---- 1) 既存の proxy 同一性（基準値で 200 の URL が全て 200 かつ sha256 一致） ----
  const results = [];
  for (const u of proxyBaseline.urls) {
    const bustedUrl = withBust(u.url, bust);
    const rec = { url: u.url, kind: u.kind, path: u.path, status: u.status, sha256: u.sha256 };
    try {
      const r = await httpGet(bustedUrl, { timeoutMs: o.timeoutMs });
      rec.fresh = {
        status: r.status,
        sha256: r.sha256,
        cf_cache_status: r.cf_cache_status,
        final_url: r.final_url,
      };
    } catch (e) {
      rec.fresh = { error: e.message };
    }
    results.push(rec);
    const brief = rec.fresh.error
      ? `エラー: ${rec.fresh.error.split("\n")[0]}`
      : `${rec.fresh.status} sha256=${rec.fresh.sha256.slice(0, 12)}… cf=${rec.fresh.cf_cache_status ?? "-"}`;
    const mark =
      rec.fresh.error || rec.fresh.status !== 200
        ? ""
        : rec.fresh.sha256 === u.sha256
          ? "（一致）"
          : "（sha256 不一致）";
    print(`  [${results.length}/${proxyBaseline.urls.length}] ${u.url}: ${brief}${u.status === 200 ? mark : "（基準値 非 200・現状維持）"}`);
  }
  const verdict = judgeVerify(proxyBaseline, results);

  // proxy 層の判定をまず表示する（early return はせず、陽性対照も必ず実行してから
  // 集約する。skill H-2「検査群を && で連ねない」に対応）。
  if (verdict.outcome === "error") {
    for (const e of verdict.errors) printErr(`環境エラー: ${e}`);
    for (const p of verdict.problems) printErr(`FAIL: ${p}`);
    printErr(
      "  → 環境エラー（exit 3）。取得例外は条件偽（exit 2）と区別される。例外＝検証できていない。",
    );
  } else if (verdict.outcome === "fail") {
    for (const p of verdict.problems) printErr(`FAIL: ${p}`);
    printErr("  → 検査 FAIL（exit 2）。§2.3 の戻し方（Worker の上流を /Maplat/ へ戻す）を参照のこと。");
  } else {
    print(
      `  → P 層 green: 基準値 200 の ${verdict.compared.length} 件がすべて 200 かつ sha256 一致` +
        `（非 200 基準 ${verdict.held_non_200} 件は現状維持・cf-cache-status は上記ログのとおり記録）`,
    );
  }

  // ---- 2) 陽性対照（--verify 単独でも必須）: 切替が実際に効いていることの検出 ----
  print(
    `陽性対照（--verify に必ず内包。--positive-control と同一の検査）: allowlist の ` +
      `expected_changes を PlatSeries 側期待値と照合`,
  );
  const plan = planPositiveControl(allowlist);
  let posVerdict;
  if (plan.problems.length) {
    for (const p of plan.problems) printErr(`FAIL: ${p}`);
    printErr(
      "  → 検査 FAIL（exit 2）。期待値が未採取（PENDING）か対象が空で、切替の実効を判定できない（fail-closed）",
    );
    posVerdict = {
      outcome: "fail",
      exit_code: EXIT.FAIL,
      problems: plan.problems,
      errors: [],
      compared: [],
    };
  } else {
    posVerdict = await fetchPositiveControl(plan.targets, bust, o.timeoutMs, print);
    if (posVerdict.outcome === "error") {
      for (const e of posVerdict.errors) printErr(`環境エラー: ${e}`);
      for (const p of posVerdict.problems) printErr(`FAIL: ${p}`);
      printErr("  → 環境エラー（exit 3）。取得例外は条件偽（exit 2）と区別される。");
    } else if (posVerdict.outcome === "fail") {
      for (const p of posVerdict.problems) printErr(`FAIL: ${p}`);
      printErr("  → 検査 FAIL（exit 2）。上流がまだ Maplat のまま（切替が効いていない）等。§2.3 の戻し方を参照");
    } else {
      print(
        `  → 陽性対照 green: ${posVerdict.compared.length} 件が PlatSeries 側の期待値と一致（切替が効いている）`,
      );
    }
  }

  // ---- 集約（fail-closed: どちらか一方でも環境エラーなら 3・条件偽なら 2） ----
  const codes = [verdict.exit_code, posVerdict.exit_code];
  if (codes.includes(EXIT.ENV)) {
    printErr(
      "  → 総合判定: 環境エラー（exit 3）。--verify は「切替の疎通」と「切替の実効」の両方を検証できていない。",
    );
    return EXIT.ENV;
  }
  if (codes.includes(EXIT.FAIL)) {
    printErr(
      "  → 総合判定: 検査 FAIL（exit 2）。--verify は「疎通」と「切替の実効」の両方が green でなければ exit 0 にならない。",
    );
    return EXIT.FAIL;
  }
  print("  → 総合判定: P 層 green（疎通も切替の実効も確認済み）。");
  return EXIT.PASS;
}

// ---- 自己テスト（ネットワークに出ない。固定入力で判定関数を叩く） ----

function ok(cond, detail) {
  return cond ? true : detail;
}

function syntheticTreeBaseline() {
  return {
    schema: "oct26-m10-ghpages-tree-baseline",
    version: 1,
    tip_commit: "0".repeat(40),
    entry_count: 3,
    counts: { html: 3, apps_json: 0, total: 3 },
    tree: [
      { mode: "100644", type: "blob", sha: "a".repeat(40), path: "aizumap.html" },
      { mode: "100644", type: "blob", sha: "b".repeat(40), path: "dist/index.html" },
      { mode: "100644", type: "blob", sha: "c".repeat(40), path: "apps/aizu.json" },
    ],
  };
}

const S = (s) => {
  // sha256 の代用（判定は文字列比較のみに依存するため任意の 64 桁でよい）
  return s.padEnd(64, "0").slice(0, 64);
};

function proxyCaptureDoc(urls) {
  return {
    schema: PROXY_CAPTURE_SCHEMA,
    version: 1,
    mode: "capture",
    urls,
  };
}

function buildSelfTestCases() {
  const cases = [];
  const t = (name, fn) => cases.push({ name, fn });

  // ===== buildProxyTargets: 列挙（手書きリストではなく機械導出） =====
  t("enum-1: {name}.html → https://s.maplat.jp/r/{name}/ の URL 形式（入れ子も機械変換）", async () => {
    const { targets } = buildProxyTargets(syntheticTreeBaseline(), { limit: 999 });
    const urls = targets.map((x) => x.url);
    return ok(
      urls.includes("https://s.maplat.jp/r/aizumap/") &&
        urls.includes("https://s.maplat.jp/r/dist/index/") &&
        urls.includes("https://s.maplat.jp/r/aizumap/apps/aizu.json") &&
        urls.includes("https://s.maplat.jp/r/aizumap/assets/maplat.css"),
      `urls=${JSON.stringify(urls)}`,
    );
  });
  t("enum-2: HTML の列挙が設計期待（52）に満たない場合は分母不足として検出される", async () => {
    const { problems } = buildProxyTargets(syntheticTreeBaseline());
    return ok(
      problems.some((p) => p.includes("に満たない")),
      `分母不足が検出されていない: ${JSON.stringify(problems)}`,
    );
  });
  t("enum-3: 実 baseline（52 HTML）からは問題無く 54 対象が列挙される", async () => {
    if (!existsSync(TREE_BASELINE_PATH)) return "実 baseline が無い（--make-baseline を先に実行）";
    const r = parseBaseline(readFileSync(TREE_BASELINE_PATH, "utf8"));
    if (!r.ok) return `実 baseline が破損: ${r.problems[0]}`;
    const { targets, breakdown, problems } = buildProxyTargets(r.baseline);
    return ok(
      problems.length === 0 &&
        breakdown.pages === 52 &&
        breakdown.assets === 2 &&
        targets.length === 54,
      `breakdown=${JSON.stringify(breakdown)} problems=${JSON.stringify(problems)}`,
    );
  });

  // ===== withBust =====
  t("bust-1: cache-bust クエリ ?_=<ISO8601> が付く（既存 URL 部は保存される）", async () => {
    const busted = withBust("https://s.maplat.jp/r/aizumap/", "2026-10-26T00:00:00.000Z");
    const u = new URL(busted);
    return ok(
      u.origin === "https://s.maplat.jp" &&
        u.pathname === "/r/aizumap/" &&
        u.searchParams.get("_") === "2026-10-26T00:00:00.000Z",
      `busted=${busted}`,
    );
  });

  // ===== judgeCapture =====
  t("cap-1: 全 200 は PASS・200 の件数を数える", async () => {
    const v = judgeCapture([
      { url: "u1", status: 200, sha256: S("x") },
      { url: "u2", status: 200, sha256: S("y") },
    ]);
    return ok(v.outcome === "pass" && v.responded_200 === 2, `outcome=${v.outcome}`);
  });
  t("cap-2: 200 と 403/404 の混在は PASS（非 200 は「応答しない集合」として記録される）", async () => {
    const v = judgeCapture([
      { url: "u1", status: 200, sha256: S("x") },
      { url: "u2", status: 404 },
      { url: "u3", status: 403 },
    ]);
    return ok(
      v.outcome === "pass" && v.responded_200 === 1 && v.non_200 === 2,
      `outcome=${v.outcome} 200=${v.responded_200} non200=${v.non_200}`,
    );
  });
  t("cap-3: 応答 200 が 0 件は FAIL（分母が空・基準値を書かない）", async () => {
    const v = judgeCapture([
      { url: "u1", status: 404 },
      { url: "u2", status: 403 },
    ]);
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("0 件")),
      `outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("cap-4: 【核心】1 件でも例外（タイムアウト等）があれば FAIL(2) でなく環境エラー(3)", async () => {
    const v = judgeCapture([
      { url: "u1", status: 200, sha256: S("x") },
      { url: "u2", error: "タイムアウト(30000ms)" },
    ]);
    return ok(
      v.outcome === "error",
      `outcome=${v.outcome}（例外を条件偽と同扱いにすると不完全な基準値を書く素通り経路になる）`,
    );
  });
  t("cap-5: 対象列挙が 0 件は FAIL", async () => {
    const v = judgeCapture([]);
    return ok(v.outcome === "fail", `outcome=${v.outcome}`);
  });

  // ===== judgeVerify =====
  const base200 = (url, sha) => ({ url, kind: "page", path: null, status: 200, sha256: sha });
  const fresh = (status, sha, cf) => ({ fresh: { status, sha256: sha, cf_cache_status: cf } });

  t("ver-1: 基準値 200 → 200・sha256 一致は PASS", async () => {
    const v = judgeVerify(
      proxyCaptureDoc([base200("u1", S("x"))]),
      [{ url: "u1", ...fresh(200, S("x"), "MISS") }],
    );
    return ok(v.outcome === "pass" && v.exit_code === 0, `outcome=${v.outcome} code=${v.exit_code}`);
  });
  t("ver-2: 基準値 200 が非 200 になれば FAIL", async () => {
    const v = judgeVerify(
      proxyCaptureDoc([base200("u1", S("x"))]),
      [{ url: "u1", ...fresh(404, S("x"), null) }],
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("非 200")),
      `outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("ver-3: sha256 不一致は FAIL", async () => {
    const v = judgeVerify(
      proxyCaptureDoc([base200("u1", S("x"))]),
      [{ url: "u1", ...fresh(200, S("tampered"), "MISS") }],
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("sha256 不一致")),
      `outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("ver-4: cf-cache-status=HIT は FAIL（origin まで届いていない＝検査になっていない）", async () => {
    const v = judgeVerify(
      proxyCaptureDoc([base200("u1", S("x"))]),
      [{ url: "u1", ...fresh(200, S("x"), "HIT") }],
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("HIT") && p.includes("purge")),
      `outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("ver-9: 【Minor-1 是正】cf-cache-status が小文字 \"hit\" でも FAIL と検出される", async () => {
    const v = judgeVerify(
      proxyCaptureDoc([base200("u1", S("x"))]),
      [{ url: "u1", ...fresh(200, S("x"), "hit") }],
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("HIT") && p.includes("purge")),
      `小文字 "hit" が素通りしている: outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("ver-10: 【Minor-1 是正】cf-cache-status が混在 \"Hit\" でも FAIL と検出される（前後の空白も許容）", async () => {
    const v = judgeVerify(
      proxyCaptureDoc([base200("u1", S("x"))]),
      [{ url: "u1", ...fresh(200, S("x"), " Hit ") }],
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("HIT") && p.includes("purge")),
      `混在 "Hit" が素通りしている: outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("ver-5: 基準値 非 200 は現状維持（404 のままでも・200 になっても FAIL にしない）", async () => {
    const doc = proxyCaptureDoc([
      base200("u0", S("x")),
      { url: "u1", kind: "page", path: null, status: 404 },
      { url: "u2", kind: "page", path: null, status: 403 },
    ]);
    const v = judgeVerify(doc, [
      { url: "u0", ...fresh(200, S("x"), "MISS") },
      { url: "u1", ...fresh(404, S("e"), null) },
      { url: "u2", ...fresh(200, S("new"), "MISS") },
    ]);
    return ok(
      v.outcome === "pass" && v.held_non_200 === 2 && v.compared.length === 1,
      `outcome=${v.outcome} held=${v.held_non_200} compared=${v.compared.length} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("ver-6: 【核心】fetch が throw した URL が 1 件でもあれば FAIL(2) でなく環境エラー(3)", async () => {
    const v = judgeVerify(
      proxyCaptureDoc([base200("u1", S("x")), base200("u2", S("y"))]),
      [
        { url: "u1", ...fresh(200, S("x"), "MISS") },
        { url: "u2", fresh: { error: "getaddrinfo ENOTFOUND s.maplat.jp" } },
      ],
    );
    return ok(
      v.outcome === "error" && v.exit_code === 3,
      `outcome=${v.outcome} code=${v.exit_code}（例外＝検証できていない。false-green の素通り経路を封じる）`,
    );
  });
  t("ver-7: 基準値で 200 の URL が 0 件なら FAIL（分母が空）", async () => {
    const doc = proxyCaptureDoc([{ url: "u1", kind: "page", path: null, status: 404 }]);
    const v = judgeVerify(doc, [{ url: "u1", ...fresh(404, S("e"), null) }]);
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("0 件")),
      `outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("ver-8: 基準値に有って今回の結果に無い URL は FAIL（列挙漏れ）", async () => {
    const v = judgeVerify(
      proxyCaptureDoc([base200("u1", S("x")), base200("u2", S("y"))]),
      [{ url: "u1", ...fresh(200, S("x"), "MISS") }],
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("列挙漏れ")),
      `outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });

  // ===== 陽性対照（positive control）: judgePositiveControl / planPositiveControl =====
  const posTarget = (url, sha) => ({
    url,
    path: url.split("/").pop(),
    expected_sha256: sha,
  });
  const pFresh = (status, sha, cf) => ({
    fresh: { status, sha256: sha, cf_cache_status: cf },
  });

  t("pos-1: PlatSeries 側の値が返れば PASS", async () => {
    const v = judgePositiveControl(
      [posTarget("https://s.maplat.jp/r/shizuoka.html", S("plat"))],
      [{ url: "https://s.maplat.jp/r/shizuoka.html", ...pFresh(200, S("plat"), "MISS") }],
    );
    return ok(v.outcome === "pass" && v.exit_code === 0, `outcome=${v.outcome} code=${v.exit_code}`);
  });
  t("pos-2: Maplat 側（旧）の値が返れば FAIL（切替が効いていないことを検出する）", async () => {
    const v = judgePositiveControl(
      [posTarget("https://s.maplat.jp/r/shizuoka.html", S("plat"))],
      [{ url: "https://s.maplat.jp/r/shizuoka.html", ...pFresh(200, S("maplat-old"), "MISS") }],
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("陽性対照不一致")),
      `outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("pos-3: どちらとも違う値（想定外の改変）が返れば FAIL", async () => {
    const v = judgePositiveControl(
      [posTarget("https://s.maplat.jp/r/README.md", S("plat"))],
      [{ url: "https://s.maplat.jp/r/README.md", ...pFresh(200, S("third-value"), "MISS") }],
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("陽性対照不一致")),
      `outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("pos-4: 取得例外は環境エラー（exit 3）で条件偽（exit 2）と区別される", async () => {
    const v = judgePositiveControl(
      [
        posTarget("https://s.maplat.jp/r/shizuoka.html", S("plat")),
        posTarget("https://s.maplat.jp/r/README.md", S("readme")),
      ],
      [
        { url: "https://s.maplat.jp/r/shizuoka.html", ...pFresh(200, S("plat"), "MISS") },
        { url: "https://s.maplat.jp/r/README.md", fresh: { error: "getaddrinfo ENOTFOUND s.maplat.jp" } },
      ],
    );
    return ok(v.outcome === "error" && v.exit_code === 3, `outcome=${v.outcome} code=${v.exit_code}`);
  });
  t("pos-5: 期待値が allowlist から読めない・PENDING なら FAIL", async () => {
    const plan = planPositiveControl({
      raw: { expected_changes: [{ path: "shizuoka.html", expected_sha256: PENDING }] },
    });
    return ok(
      plan.problems.some((p) => p.includes("PENDING") || p.includes("未採取")),
      `problems=${JSON.stringify(plan.problems)}`,
    );
  });
  t("pos-6: 対象（expected_changes）が 0 件なら FAIL（分母が空を合格にしない）", async () => {
    const plan = planPositiveControl({ raw: { expected_changes: [] } });
    return ok(
      plan.problems.some((p) => p.includes("0 件")),
      `problems=${JSON.stringify(plan.problems)}`,
    );
  });
  t("pos-7: 実 allowlist から 2 対象（shizuoka.html・README.md）が PlatSeries 期待値で導出される", async () => {
    if (!existsSync(ALLOWLIST_PATH)) return "実 allowlist が無い";
    const r = parseAllowlist(readFileSync(ALLOWLIST_PATH, "utf8"));
    if (!r.ok) return `実 allowlist が破損: ${r.problems[0]}`;
    const plan = planPositiveControl(r.allowlist);
    const urls = plan.targets.map((t) => t.url);
    const shiz = plan.targets.find((t) => t.path === "shizuoka.html");
    const readme = plan.targets.find((t) => t.path === "README.md");
    // 以下の期待値は委任・allowlist の機械採取値（§4.3）そのもの。この assert は
    // 「導出の正しさ」の検算であって、判定ロジックが手書き値に依存するわけではない。
    return ok(
      plan.problems.length === 0 &&
        plan.targets.length === 2 &&
        urls.includes("https://s.maplat.jp/r/shizuoka.html") &&
        urls.includes("https://s.maplat.jp/r/README.md") &&
        shiz?.expected_sha256 === "71af21d0b6c27f394b42f16367ad1bb4a987eac60a8fb10c1f7c0d4a0e71c2e3" &&
        readme?.expected_sha256 === "76d5109faa59e88e093fa24366d64e9fdafbda402c5c1a8ffa7cd61cfc46a9dc",
      `targets=${JSON.stringify(plan.targets)} problems=${JSON.stringify(plan.problems)}`,
    );
  });
  t("pos-8: cf-cache-status=HIT は FAIL（origin まで届いていない）", async () => {
    const v = judgePositiveControl(
      [posTarget("https://s.maplat.jp/r/shizuoka.html", S("plat"))],
      [{ url: "https://s.maplat.jp/r/shizuoka.html", ...pFresh(200, S("plat"), "HIT") }],
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("HIT") && p.includes("purge")),
      `outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });
  t("pos-9: 対象 URL が非 200（404 等）なら FAIL（切替の実効を判定できない）", async () => {
    const v = judgePositiveControl(
      [posTarget("https://s.maplat.jp/r/shizuoka.html", S("plat"))],
      [{ url: "https://s.maplat.jp/r/shizuoka.html", ...pFresh(404, S("plat"), null) }],
    );
    return ok(
      v.outcome === "fail" && v.problems.some((p) => p.includes("非 200")),
      `outcome=${v.outcome} problems=${JSON.stringify(v.problems)}`,
    );
  });

  // ===== run() CLI: 終了コードの実地確認（ネットワークに出ないもののみ） =====
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
      r.code === 0 &&
        r.text.includes("mode 別前提") &&
        r.text.includes("t2-c") &&
        r.text.includes("t3-v"),
      `code=${r.code}`,
    );
  });
  t("cli-3: --verify で基準値ファイルがまだ無ければ exit 4（--capture を促す）", async () => {
    const r = await runLines([
      "--verify",
      "--out",
      path.join(SCRIPT_DIR, "absent-proxy-baseline.json"),
    ]);
    return ok(
      r.code === 4 && r.text.includes("--capture") && r.text.includes("先に"),
      `code=${r.code} text=${r.text.slice(0, 200)}`,
    );
  });
  t("cli-4: --verify に不整合なファイル（tree baseline）を渡すと exit 4", async () => {
    const r = await runLines(["--verify", "--out", TREE_BASELINE_PATH]);
    return ok(r.code === 4 && r.text.includes("schema"), `code=${r.code}`);
  });
  t("cli-5: --capture に不整合な tree baseline を渡すと exit 4", async () => {
    const r = await runLines(["--capture", "--tree-baseline", path.join(SCRIPT_DIR, "allowlist.json")]);
    return ok(r.code === 4, `code=${r.code}`);
  });
  t("cli-6: --limit は正の整数でなければ exit 4", async () => {
    const r = await runLines(["--capture", "--limit", "xyz"]);
    return ok(r.code === 4, `code=${r.code}`);
  });
  t("cli-7: 未知のフラグは exit 4", async () => {
    const r = await runLines(["--verify", "--nonsense"]);
    return ok(r.code === 4, `code=${r.code}`);
  });
  t("cli-8: --positive-control で allowlist が無ければ exit 4", async () => {
    const r = await runLines([
      "--positive-control",
      "--allowlist",
      path.join(SCRIPT_DIR, "absent-allowlist.json"),
    ]);
    return ok(r.code === 4 && r.text.includes("allowlist"), `code=${r.code} text=${r.text.slice(0, 200)}`);
  });

  return cases;
}

async function runSelfTest(print, printErr) {
  const cases = buildSelfTestCases();
  print(`===== verify-switch.mjs 自己テスト（${cases.length} ケース） =====`);
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
 */
export async function run(argv, io = {}) {
  const print = io.print ?? ((s) => console.log(s));
  const printErr = io.printErr ?? ((s) => console.error(s));
  try {
    const o = {
      mode: null,
      treeBaseline: TREE_BASELINE_PATH,
      out: PROXY_BASELINE_PATH,
      allowlistPath: ALLOWLIST_PATH,
      limit: 0,
      timeoutMs: 30_000,
      bust: true, // §4.6-P: verify は既定で cache-bust クエリを付ける
    };
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      const take = () => {
        const v = argv[++i];
        if (v === undefined) throw new UsageError(`${a} の値が無い`);
        return v;
      };
      if (a === "--capture") o.mode = "capture";
      else if (a === "--verify") o.mode = "verify";
      else if (a === "--positive-control") o.mode = "positive-control";
      else if (a === "--bust") o.bust = true;
      else if (a === "--selftest") o.mode = "selftest";
      else if (a === "-h" || a === "--help") o.mode = "help";
      else if (a === "--tree-baseline") o.treeBaseline = take();
      else if (a === "--out") o.out = take();
      else if (a === "--allowlist") o.allowlistPath = take();
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
      printErr("mode（--capture / --verify / --positive-control / --selftest）を指定すること");
      return EXIT.USAGE;
    }
    if (o.mode === "selftest") {
      return (await runSelfTest(print, printErr)) ? EXIT.PASS : 1;
    }
    if (o.mode === "capture") {
      return await runCapture(o, print, printErr);
    }
    if (o.mode === "verify") {
      return await runVerify(o, print, printErr);
    }
    if (o.mode === "positive-control") {
      return await runPositiveControl(o, print, printErr);
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
