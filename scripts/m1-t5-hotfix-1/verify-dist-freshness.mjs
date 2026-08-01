#!/usr/bin/env node
// m1-t5-hotfix-1 L1: dist/src 鮮度検査（git 系譜・ビルド不要）
//
// なぜ必要か（設計書 §2.2 / §5 D2）:
//   このリポジトリは dist/ を git 追跡し、package.json の files/main が dist/ を指す。
//   つまり **npm publish される実体そのものが dist** である。
//   にもかかわらず「src を直したが dist を再ビルドしていない」ことを検出する仕組みが
//   一切なかった。実際 m1-t5 が ui_marker.ts の脆弱な iframe 経路を廃止した後も
//   dist は m1-t4 時点のままで、廃止したはずの経路が配布物に残り続けた。
//
// 何を見るか:
//   「src/ を最後に触ったコミット」が「dist/ を最後に触ったコミット」の
//   祖先または同一であること。src の方が新しければ dist は再ビルドされていない。
//
// なぜビルドを走らせないか:
//   ビルド不要にすることで、CI の早い段階でも pre-commit でも安価に回せる。
//   「dist を手で編集した」「異なる依存解決でビルドした」は本検査では捕まらない。
//   それは L2（verify-dist-reproducible.mjs）の担当であり、2層で塞ぐ設計である。
//
// なぜ dirty な作業ツリーを fail にするか:
//   本検査が答えるのは「**コミット済みの** dist が **コミット済みの** src に追随しているか」
//   である。src/ や dist/ に未コミット変更・未追跡ファイルがあると、
//   git 履歴と実ファイルが乖離し、検査結果はどちらの向きにも意味を失う。
//   「判定できなかった」を pass として報告すると素通しの穴になるため fail とする。
//   未追跡ファイルを見るのは、内容ハッシュ付き chunk の改名時に
//   **新 chunk の git add 漏れ**が起きうるからでもある（設計書 AC6）。

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const failures = [];
const fail = (id, msg) => failures.push(`[${id}] ${msg}`);

const git = (...args) =>
  execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

// --- 検査1: src/ と dist/ の作業ツリーが clean であること ---
try {
  // porcelain の各行は先頭2桁が status コードであり、先頭の空白にも意味がある。
  // 行頭を trim すると " D"（未ステージ削除）が "D" に見えて誤読されるため trimEnd に留める。
  const dirty = git("status", "--porcelain", "--", "src", "dist").trimEnd();
  if (dirty) {
    const lines = dirty.split("\n");
    fail(
      "L1-1",
      `src/ または dist/ に未コミットの変更・未追跡ファイルがある（${lines.length} 件）。` +
        `本検査はコミット済みの状態を対象とするため判定できない。` +
        `再ビルド結果であればコミットしてから再実行すること:\n` +
        lines.map((l) => `      ${l}`).join("\n")
    );
  }
} catch (e) {
  fail("L1-1", `git status に失敗した: ${e.message?.split("\n")[0] ?? e}`);
}

// --- 検査2: dist が src 以降であること（本検査の核心）---
const lastCommit = (id, rel) => {
  let out;
  try {
    out = git("log", "-1", "--format=%H%x09%aI%x09%s", "--", rel).trim();
  } catch (e) {
    fail(id, `${rel}/ の最終更新コミットを取得できない: ${e.message?.split("\n")[0] ?? e}`);
    return null;
  }
  if (!out) {
    // 履歴が無いのは「まだ一度もコミットされていない」であり、
    // 鮮度を判定できない状態である。skip せず fail とする。
    fail(id, `${rel}/ を変更したコミットが履歴に無い。鮮度を判定できない`);
    return null;
  }
  const [sha, date, subject] = out.split("\t");
  return { sha, date, subject };
};

const srcC = lastCommit("L1-2", "src");
const distC = lastCommit("L1-2", "dist");

if (srcC && distC) {
  let isAncestor;
  try {
    git("merge-base", "--is-ancestor", srcC.sha, distC.sha);
    isAncestor = true;
  } catch (e) {
    // exit code 1 = 祖先でない。それ以外（128 等）は検査不能であり区別する
    if (e.status === 1) {
      isAncestor = false;
    } else {
      fail("L1-2", `git merge-base に失敗した: ${e.message?.split("\n")[0] ?? e}`);
      isAncestor = null;
    }
  }
  if (isAncestor === false) {
    fail(
      "L1-2",
      `dist/ が src/ より古い（stale）。\n` +
        `      src/  最終更新: ${srcC.sha.slice(0, 8)} ${srcC.date} ${srcC.subject}\n` +
        `      dist/ 最終更新: ${distC.sha.slice(0, 8)} ${distC.date} ${distC.subject}\n` +
        `      src の変更が配布物に反映されていない。'pnpm build' を実行し dist/ をコミットすること`
    );
  }
}

// --- 検査3: 本欠陥の具体マーカー（m1-t4 / m1-t5 の是正が dist に到達していること）---
//
// 検査2 は系譜だけを見るため、「dist を再ビルドしないまま dist 配下の別ファイルを
// 触った」ような操作では通ってしまう。実際に配布される umd に、m1 の viewer 側
// セキュリティ是正が入っていることを内容で直接 assert する。
// 文字列は t4/t5 の diff から取った具体マーカーであり、退行すれば必ず落ちる。
{
  const UMD = path.join(ROOT, "dist", "maplat_ui.umd.js");
  if (!existsSync(UMD)) {
    fail("L1-3", "dist/maplat_ui.umd.js が無い");
  } else {
    const umd = readFileSync(UMD, "utf8");
    const count = (needle) => umd.split(needle).length - 1;

    // m1-t5: iframe + srcdoc 経路（heightGetter）を Shadow DOM へ置換して廃止した
    const heightGetter = count("heightGetter");
    if (heightGetter !== 0) {
      fail(
        "L1-3",
        `dist/maplat_ui.umd.js に 'heightGetter' が ${heightGetter} 件ある。` +
          `m1-t5 が廃止した iframe/srcdoc 経路（POI html を無サニタイズで流し込む）が配布物に残っている`
      );
    }
    // m1-t4/t5: サニタイズ経路が入っていること
    for (const needle of ["sanitizeHtml", "DOMPurify"]) {
      if (count(needle) === 0) {
        fail(
          "L1-3",
          `dist/maplat_ui.umd.js に '${needle}' が無い。` +
            `m1-t4/t5 の HTML サニタイズ経路が配布物に到達していない`
        );
      }
    }
  }
}

if (failures.length) {
  console.error(`✗ m1-t5-hotfix-1 L1 dist 鮮度検査 FAILED（${failures.length} 件）`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `✓ m1-t5-hotfix-1 L1 dist 鮮度検査 PASSED` +
    `（dist ${distC.sha.slice(0, 8)} は src ${srcC.sha.slice(0, 8)} 以降・サニタイズ経路が配布物に到達）`
);
