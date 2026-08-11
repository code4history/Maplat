#!/usr/bin/env node
// m1-t5-hotfix-1 L2: dist 再ビルド一致検査（厳密・ビルド実行を伴う）
//
// なぜ L1 だけでは足りないか（設計書 §5 D2）:
//   L1（verify-dist-freshness.mjs）は git 系譜だけを見るため、
//   「dist を手で編集した」「別の依存解決でビルドした dist をコミットした」は
//   通ってしまう。dist は npm publish される実体そのものであり、
//   src から再現できない内容が配布物に入ることは許容できない。
//   L2 は実際に pnpm build を走らせ、コミット済み dist とバイト一致するかを見る。
//
// 何と比べるか:
//   作業ツリーの直前の中身ではなく **HEAD にコミットされた内容** と比べる。
//   検査したいのは「配布される（＝コミット済みの）dist が src から再現できるか」だからである。
//
// なぜ clean な状態を要求するか:
//   本検査はビルドで dist/ を上書きする。未コミットの変更があれば失われる。
//   また「dist に未コミット変更がある」こと自体、コミット済み配布物と実体の乖離であり、
//   検査以前の異常である。skip せず fail として報告する。
//
// 正規化について:
//   scripts/build-sw.js:9-26 は new Date() から "YYYY-MM-DD-HH-MM" 形式の SW_VERSION を
//   生成し service-worker.js へ **1箇所** 埋め込む。分をまたぐとここだけ差が出る。
//   したがって service-worker.js の SW_VERSION 1箇所のみを正規化して比較する。
//   **それ以外は一切正規化しない。** 正規化を広げると検査は空洞化する。
//   1箇所という前提が崩れた（0箇所 / 2箇所以上）場合も fail とする。前提が崩れたまま
//   置換すると、意味のある差分まで消してしまうためである。
//
// 検査対象パス（pnpm build が実際に書くファイルを実測して決めた・2026-08-01）:
//   - dist/                    … vite.config.js:73 outDir = 'dist'（BUILD_MODE=package）
//   - public/service-worker.js … scripts/build-sw.js:36-44 が dist/service-worker.js を
//                                 非 watch 分岐で copyFileSync する（build ログの
//                                 "Copied service-worker.js to public/" で確認）
//   dist-demo/ は BUILD_MODE=package では生成されず .gitignore 済みのため対象外。
//
// 実行後の作業ツリーについて:
//   本検査は自動復元しない（設計書 §5 D2）。失敗時に証跡を消さないためである。
//   SW_VERSION の分が変わっていれば成功時でも service-worker.js に差分が残る。
//   L1 は clean を要求するため、両方を回す場合は **L2 を後に置く** か、
//   L2 実行後に案内される復元コマンドを実行すること。

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// pnpm build が書く追跡パス。git status のスコープにも比較にも同じ集合を使う
const BUILD_OUTPUT_PATHS = ["dist", "public/service-worker.js"];
// 非決定的な SW_VERSION を含むため正規化対象とするファイル
const SW_FILES = new Set(["dist/service-worker.js", "public/service-worker.js"]);
// "YYYY-MM-DD-HH-MM" 形式。define 経由で文字列リテラルとして埋め込まれる
const SW_VERSION_RE = /"\d{4}-\d{2}-\d{2}-\d{2}-\d{2}"/g;
const SW_VERSION_PLACEHOLDER = '"<SW_VERSION>"';

const failures = [];
const fail = (id, msg) => failures.push(`[${id}] ${msg}`);

const git = (...args) =>
  execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"]
  });

// porcelain -z で取得する。パスに空白や非 ASCII があってもクォートされないため
const statusEntries = () => {
  const raw = git("status", "--porcelain", "-z", "--", ...BUILD_OUTPUT_PATHS);
  return raw
    .split("\0")
    .filter((s) => s.length > 0)
    .map((s) => ({ code: s.slice(0, 2), file: s.slice(3) }));
};

const die = () => {
  console.error(`✗ m1-t5-hotfix-1 L2 dist 再ビルド一致検査 FAILED（${failures.length} 件）`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
};

// --- 検査1: 実行前提（clean であること）---
let before;
try {
  before = statusEntries();
} catch (e) {
  fail("L2-1", `git status に失敗した: ${e.message?.split("\n")[0] ?? e}`);
  die();
}
if (before.length) {
  fail(
    "L2-1",
    `検査対象パスに未コミットの変更・未追跡ファイルがある（${before.length} 件）。` +
      `本検査はビルドで上書きするため clean な状態でのみ実行できる。` +
      `また未コミット変更の存在自体が、コミット済み配布物と実体の乖離である:\n` +
      before.map((e) => `      ${e.code} ${e.file}`).join("\n")
  );
  die();
}

// --- 検査2: 再ビルドを実行する ---
console.log("→ pnpm build を実行して dist を再生成します（数十秒かかります）");
try {
  execFileSync("pnpm", ["run", "build"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "inherit", "inherit"]
  });
} catch (e) {
  fail("L2-2", `pnpm build が失敗した: ${e.message?.split("\n")[0] ?? e}`);
  die();
}

// --- 検査3: 再ビルド結果がコミット済み dist と一致すること ---
let after;
try {
  after = statusEntries();
} catch (e) {
  fail("L2-3", `再ビルド後の git status に失敗した: ${e.message?.split("\n")[0] ?? e}`);
  die();
}

// SW_VERSION 1箇所のみを固定文字列へ置換する。1箇所でなければ前提が崩れているので null を返す
const normalizeSw = (text) => {
  const hits = text.match(SW_VERSION_RE);
  if (!hits || hits.length !== 1) return { ok: false, count: hits ? hits.length : 0 };
  return { ok: true, text: text.replace(SW_VERSION_RE, SW_VERSION_PLACEHOLDER) };
};

const tolerated = [];
for (const entry of after) {
  const { code, file } = entry;

  if (!SW_FILES.has(file) || code !== " M") {
    // SW_VERSION 以外の差分・追加・削除はすべて再現性の破れである
    const kind =
      code.includes("?") ? "未追跡（コミット漏れ、または依存差でファイル名が変わった）"
        : code.includes("D") ? "削除（コミット済み dist に不要ファイルが残っている）"
        : "内容差";
    fail(
      "L2-3",
      `${file} が再ビルド結果と一致しない — ${kind}（status "${code}"）。` +
        `コミット済み dist が src から再現できない`
    );
    continue;
  }

  // service-worker.js は SW_VERSION の1箇所だけ正規化して比べる
  const full = path.join(ROOT, file);
  if (!existsSync(full)) {
    fail("L2-3", `${file} が再ビルド後に存在しない`);
    continue;
  }
  let headText;
  try {
    headText = git("show", `HEAD:${file}`);
  } catch (e) {
    fail("L2-3", `${file} の HEAD 版を取得できない: ${e.message?.split("\n")[0] ?? e}`);
    continue;
  }
  const built = normalizeSw(readFileSync(full, "utf8"));
  const head = normalizeSw(headText);
  if (!built.ok || !head.ok) {
    fail(
      "L2-3",
      `${file} の SW_VERSION 相当パターンがちょうど1箇所でない` +
        `（再ビルド後 ${built.count ?? 1} 箇所 / HEAD ${head.count ?? 1} 箇所）。` +
        `正規化の前提（build-sw.js が1箇所だけ埋め込む）が崩れている。` +
        `前提が崩れたまま置換すると意味のある差分まで消えるため fail とする`
    );
    continue;
  }
  if (built.text !== head.text) {
    fail(
      "L2-3",
      `${file} が SW_VERSION を正規化してもなお HEAD と一致しない。` +
        `service-worker のソースまたは依存が変わっているのに dist をコミットしていない`
    );
    continue;
  }
  tolerated.push(file);
}

if (failures.length) {
  console.error("");
  die();
}

console.log(
  `✓ m1-t5-hotfix-1 L2 dist 再ビルド一致検査 PASSED` +
    `（コミット済み dist は pnpm build から再現できる` +
    `${tolerated.length ? `／SW_VERSION のみ差分: ${tolerated.join(", ")}` : ""}）`
);
if (tolerated.length) {
  console.log(
    `  作業ツリーには SW_VERSION の差分が残っています。復元するには:\n` +
      `    git checkout -- ${tolerated.join(" ")}`
  );
}
