#!/usr/bin/env node
// m1-t4 AC12a: CI 専用 @maplat/core override の鮮度検査
//
// なぜ必要か（設計書 §3.6）:
//   Maplat は @maplat/core の新 API（sanitizeHtml / buildSlideAttrs）に依存するが、
//   CI は単独 clone のため npm 公開版 0.13.2 を引き、公開版に該当 export は存在しない。
//   publish を待たずに CI を green にするため、CI 専用 YAML で特定コミットへ解決している。
//
// なぜローカル HEAD と比べないか:
//   monorepo の submodule origin は .gitmodules の相対参照によりローカルパスを指す。
//   ローカル HEAD との比較では**未 push のコミットや別 remote の SHA でも通ってしまう**。
//   CI が実際に取得するのは GitHub 上の tarball であり、検査もそこを見なければ意味がない。
//
// なぜ install の前に走らせるか:
//   install が通ってしまってからでは、古い（あるいは未 push の）コミットに対する green を
//   後追いでしか検出できない。
//   **この制約により、依存パッケージを一切 import できない。** Node 標準モジュールのみで書く。
//   YAML も対象行が固定書式のため正規表現で読む（YAML パーサを引かない）。
//
// m9 で override・本スクリプト・ci.yml のステップ・playwright-ci.config.ts の testIgnore を
// 同一変更でまとめて撤去すること（設計書 §3.6.4）。

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CI_YAML = path.join(ROOT, "ci", "pnpm-workspace.ci.yaml");
const PKG_JSON = path.join(ROOT, "package.json");

const REPO_URL = "https://github.com/code4history/MaplatCore.git";
const TASK_REF = "refs/heads/codex/m1-t4-viewer-html-sanitization";
const EXPECTED_SPEC = "^0.13.2";
const LS_REMOTE_TIMEOUT_MS = 30_000;

const failures = [];
const fail = (id, msg) => failures.push(`[${id}] ${msg}`);

// --- 検査1: override の記法と SHA の取り出し ---
let sha = null;
let ciOverrideValue = null; // 検査4 で lock の specifier と完全一致を見るために保持する
if (!existsSync(CI_YAML)) {
  fail("AC12a-1", `${path.relative(ROOT, CI_YAML)} が無い`);
} else {
  const yaml = readFileSync(CI_YAML, "utf8");
  // 固定書式:   "@maplat/core": "github:code4history/MaplatCore#<sha>"
  const m = /^\s*["']?@maplat\/core["']?\s*:\s*["']([^"']+)["']/m.exec(yaml);
  if (!m) {
    fail("AC12a-1", "ci/pnpm-workspace.ci.yaml の overrides に @maplat/core の指定が無い");
  } else {
    const value = m[1].trim();
    const g = /^github:code4history\/MaplatCore#([0-9a-f]+)$/.exec(value);
    if (!g) {
      fail(
        "AC12a-1",
        `override の記法が想定と違う: ${value}（期待: github:code4history/MaplatCore#<40桁hex>）`
      );
    } else if (g[1].length !== 40) {
      fail("AC12a-1", `SHA が 40 桁 hex でない: ${g[1]}（${g[1].length} 桁）`);
    } else {
      sha = g[1];
      ciOverrideValue = value;
    }
  }
}

// --- 検査2: GitHub 上の task branch と SHA を照合する（本 AC の核心）---
if (sha) {
  let remoteSha = null;
  try {
    const out = execFileSync("git", ["ls-remote", REPO_URL, TASK_REF], {
      encoding: "utf8",
      timeout: LS_REMOTE_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const line = out.split("\n").find((l) => l.trim());
    // ref 不存在なら出力が空になる。「取得できたが空」も fail であり skip しない
    if (!line) {
      fail("AC12a-2", `GitHub に ${TASK_REF} が存在しない（未 push の疑い）`);
    } else {
      remoteSha = line.split(/\s+/)[0];
    }
  } catch (e) {
    // ネットワーク不通・タイムアウト・認証失敗などはすべて fail とする。
    // 「取得できなかったので skip」にすると stale green を素通しするため。
    fail("AC12a-2", `git ls-remote に失敗した: ${e.message?.split("\n")[0] ?? e}`);
  }

  if (remoteSha && remoteSha !== sha) {
    fail(
      "AC12a-2",
      `override の SHA ${sha} が GitHub の ${TASK_REF} の先端 ${remoteSha} と不一致。` +
        `MaplatCore に commit を積んだ場合は override の更新と lock 再生成が必要`
    );
  }
}

// --- 検査3: 公開 semver 契約が保たれていること ---
if (!existsSync(PKG_JSON)) {
  fail("AC12a-3", "package.json が無い");
} else {
  const pkg = JSON.parse(readFileSync(PKG_JSON, "utf8"));
  const spec = pkg.dependencies?.["@maplat/core"];
  if (spec !== EXPECTED_SPEC) {
    fail(
      "AC12a-3",
      `package.json の @maplat/core が ${JSON.stringify(spec)}。` +
        `${EXPECTED_SPEC} のままでなければならない（override は CI 限定であり、公開 semver 契約は変えない）`
    );
  }
}

// --- 検査4: GitHub ref が CI 専用 YAML 以外に無いこと ---
//
// 注意: CI は "Apply CI-only pnpm config" で ci/pnpm-workspace.ci.yaml を
// pnpm-workspace.yaml へコピーしてから本検査を走らせる。したがって CI 実行時の
// pnpm-workspace.yaml は**その展開結果そのもの**であり、github ref を含んでいて正しい。
// 内容が ci/pnpm-workspace.ci.yaml と同一なら展開結果とみなして許可し、
// 異なる内容なら「CI 専用 YAML 以外の場所に github ref がある」として fail する。
{
  const NEEDLE = "github:code4history/";
  const ciText = existsSync(CI_YAML) ? readFileSync(CI_YAML, "utf8") : null;
  const targets = ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml"];
  for (const rel of targets) {
    const full = path.join(ROOT, rel);
    if (!existsSync(full)) continue;
    const text = readFileSync(full, "utf8");
    if (rel === "pnpm-workspace.yaml" && ciText !== null && text === ciText) continue;
    if (rel === "pnpm-lock.yaml") {
      // lock の overrides 節と packages 節の resolution 欄は、override の結果として
      // 当然 github ref を含む。検査対象は **importers 節の specifier 欄**だけである。
      //
      // 旧実装は「packages: より前の領域に needle があり、かつ正規の @maplat/core 行が
      // 存在すれば pass」という粗い判定だった。packages: より前には overrides 節と
      // importers 節の両方があるため、正規の override が1つあるだけで**別 importer に
      // 何を混ぜても pass**してしまった（実装レビューで指摘・M9 で再現）。
      //
      // ここでは importers 節だけを切り出し、github ref を持つ specifier を全件列挙して、
      // 「@maplat/core かつ CI YAML の override と完全一致」の1件だけを許可する。
      const start = text.indexOf("\nimporters:");
      if (start === -1) continue; // importers 節が無い lock（想定外）は他の検査に委ねる
      const after = text.slice(start + 1);
      const endRel = after.indexOf("\npackages:");
      const importers = endRel === -1 ? after : after.slice(0, endRel);

      // "  '<name>':" の直後に続く "specifier: <value>" を対応付けて全件拾う
      const found = [];
      let currentPkg = null;
      for (const line of importers.split("\n")) {
        const pkg = /^\s+["']?(@?[^"'\s:]+)["']?:\s*$/.exec(line);
        if (pkg) { currentPkg = pkg[1]; continue; }
        const spec = /^\s+specifier:\s*(.+?)\s*$/.exec(line);
        if (spec && spec[1].includes(NEEDLE)) found.push({ pkg: currentPkg, spec: spec[1] });
      }

      const expected = ciOverrideValue; // ci/pnpm-workspace.ci.yaml の @maplat/core の値
      const allowed = found.filter((f) => f.pkg === "@maplat/core" && f.spec === expected);
      const rest = found.filter((f) => !(f.pkg === "@maplat/core" && f.spec === expected));

      for (const f of rest) {
        fail(
          "AC12a-4",
          `${rel} の importers に想定外の github ref がある: ${f.pkg} → ${f.spec}` +
            `（許可されるのは @maplat/core が CI YAML の override と完全一致する1件のみ）`
        );
      }
      // 件数は「ちょうど1件」でなければならない。
      // 0件は、lock が git ref を指さなくなった状態（specifier を npm 版へ戻した・
      // エントリごと消えた等）であり、CI は npm 公開版 0.13.2 を引いて新 API を得られない。
      // 「多すぎる」だけを見て「無い」を見逃すと、override が効いていない lock を素通しする。
      if (allowed.length !== 1) {
        fail(
          "AC12a-4",
          allowed.length === 0
            ? `${rel} の importers に @maplat/core の github ref（CI YAML の override と完全一致）が無い。` +
              `lock が git ref を指していないため、CI は npm 公開版を引いて新 API を得られない。` +
              `override 追加後に lock を再生成したか確認すること`
            : `${rel} の importers に @maplat/core の github ref が ${allowed.length} 件ある（ちょうど1件のみ許可）`
        );
      }
      continue;
    }
    if (text.includes(NEEDLE)) {
      fail("AC12a-4", `${rel} に ${NEEDLE} がある。GitHub ref は ci/pnpm-workspace.ci.yaml 限定である`);
    }
  }
}

if (failures.length) {
  console.error(`✗ m1-t4 AC12a 検証 FAILED（${failures.length} 件）`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`✓ m1-t4 AC12a 検証 PASSED（override ${sha?.slice(0, 8)} は GitHub の task branch と一致・公開 semver 契約は維持）`);
