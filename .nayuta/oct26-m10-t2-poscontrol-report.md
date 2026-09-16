# oct26-m10-t2 陽性対照（positive control）実装報告

委任識別語: **OCT26-M10T2-POSCTRL-HIBARI**

判定: 完了

## 1. 変更したファイルの行数と shasum -a 256

- `scripts/oct26-m10/verify-switch.mjs`
  - 行数: 875 → **1310**（+435 行）
  - `shasum -a 256` = `ea1547e09ccca5ec5276037dec40727858eb148ee901fda79bba3148d61cff81`
- 変更はこの 1 ファイルのみ。`ghpages-tree-baseline.json`・`allowlist.json`・
  `verify-ghpages-identity.mjs` は触れていない。

## 2. --selftest の全出力（36 ケース。追加分 pos-1〜pos-9 / cli-8）

```
===== verify-switch.mjs 自己テスト（36 ケース） =====
  OK   enum-1: {name}.html → https://s.maplat.jp/r/{name}/ の URL 形式（入れ子も機械変換）
  OK   enum-2: HTML の列挙が設計期待（52）に満たない場合は分母不足として検出される
  OK   enum-3: 実 baseline（52 HTML）からは問題無く 54 対象が列挙される
  OK   bust-1: cache-bust クエリ ?_=<ISO8601> が付く（既存 URL 部は保存される）
  OK   cap-1: 全 200 は PASS・200 の件数を数える
  OK   cap-2: 200 と 403/404 の混在は PASS（非 200 は「応答しない集合」として記録される）
  OK   cap-3: 応答 200 が 0 件は FAIL（分母が空・基準値を書かない）
  OK   cap-4: 【核心】1 件でも例外（タイムアウト等）があれば FAIL(2) でなく環境エラー(3)
  OK   cap-5: 対象列挙が 0 件は FAIL
  OK   ver-1: 基準値 200 → 200・sha256 一致は PASS
  OK   ver-2: 基準値 200 が非 200 になれば FAIL
  OK   ver-3: sha256 不一致は FAIL
  OK   ver-4: cf-cache-status=HIT は FAIL（origin まで届いていない＝検査になっていない）
  OK   ver-9: 【Minor-1 是正】cf-cache-status が小文字 "hit" でも FAIL と検出される
  OK   ver-10: 【Minor-1 是正】cf-cache-status が混在 "Hit" でも FAIL と検出される（前後の空白も許容）
  OK   ver-5: 基準値 非 200 は現状維持（404 のままでも・200 になっても FAIL にしない）
  OK   ver-6: 【核心】fetch が throw した URL が 1 件でもあれば FAIL(2) でなく環境エラー(3)
  OK   ver-7: 基準値で 200 の URL が 0 件なら FAIL（分母が空）
  OK   ver-8: 基準値に有って今回の結果に無い URL は FAIL（列挙漏れ）
  OK   pos-1: PlatSeries 側の値が返れば PASS
  OK   pos-2: Maplat 側（旧）の値が返れば FAIL（切替が効いていないことを検出する）
  OK   pos-3: どちらとも違う値（想定外の改変）が返れば FAIL
  OK   pos-4: 取得例外は環境エラー（exit 3）で条件偽（exit 2）と区別される
  OK   pos-5: 期待値が allowlist から読めない・PENDING なら FAIL
  OK   pos-6: 対象（expected_changes）が 0 件なら FAIL（分母が空を合格にしない）
  OK   pos-7: 実 allowlist から 2 対象（shizuoka.html・README.md）が PlatSeries 期待値で導出される
  OK   pos-8: cf-cache-status=HIT は FAIL（origin まで届いていない）
  OK   pos-9: 対象 URL が非 200（404 等）なら FAIL（切替の実効を判定できない）
  OK   cli-1: mode 無し（素の起動）は exit 4（使い方を表示。green にしない）
  OK   cli-2: --help は exit 0 で mode 別前提を表示する
  OK   cli-3: --verify で基準値ファイルがまだ無ければ exit 4（--capture を促す）
  OK   cli-4: --verify に不整合なファイル（tree baseline）を渡すと exit 4
  OK   cli-5: --capture に不整合な tree baseline を渡すと exit 4
  OK   cli-6: --limit は正の整数でなければ exit 4
  OK   cli-7: 未知のフラグは exit 4
  OK   cli-8: --positive-control で allowlist が無ければ exit 4
===== 結果: 36/36 =====
```
終了コード: **exit 0**（26 → 36。追加 10 ケース。既存 26 ケースは変更なく全緑）

## 3. --verify の終了コードと末尾 5 行（本番・切替済みに対して前景実行）

終了コード: **exit 0**

```
陽性対照（--verify に必ず内包。--positive-control と同一の検査）: allowlist の expected_changes を PlatSeries 側期待値と照合
  [1/2] https://s.maplat.jp/r/shizuoka.html: 200 sha256=71af21d0b6c2… cf=DYNAMIC（一致）
  [2/2] https://s.maplat.jp/r/README.md: 200 sha256=76d5109faa59… cf=DYNAMIC（一致）
  → 陽性対照 green: 2 件が PlatSeries 側の期待値と一致（切替が効いている）
  → 総合判定: P 層 green（疎通も切替の実効も確認済み）。
```
（proxy 同一性は基準値 200 の 39 件すべて 200 かつ sha256 一致。非 200 基準 15 件は現状維持。
  基準値は t1 worktree の `captures/proxy-baseline-pre.json`〔切替前採取・2026-09-16〕を `--out` で読み、
  今回は読み取りのみで書き込みを行っていない）

## 4. --help の陽性対照に関する部分

```
  node scripts/oct26-m10/verify-switch.mjs --positive-control
      陽性対照（単独実行）: allowlist の expected_changes（切替で中身が変わる
      shizuoka.html・README.md）を s.maplat.jp 経由で取得し、中身が PlatSeries 側の
      期待値と一致することを確認する。--verify はこの検査を必ず内包する
  --allowlist <file>      allowlist のパス（--positive-control と --verify 内の陽性対照が
                          読み、期待値 expected_sha256 を機械採取済みの値として使う。
                          既定: scripts/oct26-m10/allowlist.json）
  ※ --verify は陽性対照（allowlist の expected_changes を PlatSeries 側期待値と照合）
    を必ず内包する。t3 gate・t3-v の --verify 再実行でもこの内包検査が効き、
    「切替の疎通」と「切替の実効」の両方が green でない限り exit 0 にならない。
  - 陽性対照: allowlist の expected_changes（shizuoka.html・README.md）を
    https://s.maplat.jp/r/<path> から cache-bust 付きで取得し、中身が PlatSeries 側の
    期待値（expected_sha256）と一致すること。--verify は常にこれを内包し、一致し
    なければ FAIL（上流がまだ Maplat のまま等を検出する）。期待値が未採取（PENDING）
  2 = 検査 FAIL（非 200・sha256 不一致・cf-cache-status=HIT・分母が空〔応答 200 が 0 件〕・
      陽性対照不一致・陽性対照の期待値が未採取（PENDING））
```
（`--help` の終了コードは exit 0）

## 5. 凍結証跡と allowlist の shasum（不変の確認）

- `ghpages-tree-baseline.json`
  - `6819d533a89510eaff34d2fc1381499e77807fb715f379abbb9150f80e6f778e`（委任基準値と一致・**不変**）
- `allowlist.json`
  - `d9199d7de61483aa8238f93cc4b14a708f90766b3630f63b30a6259e657a1616`（作業開始時と同一・**不変**）

## 6. 「Maplat 側の値が返れば FAIL」をどう実装したか（fail-closed の考え方）

**方式**: 「`s.maplat.jp` の中身 == PlatSeries 側期待値（allowlist の `expected_sha256`）」だけを
PASS 条件にした。Maplat 側の値は実行時に取得して比較対象にする方式（旧 origin 取得）は採らない。

- 陽性対照の対象は allowlist の `expected_changes`（修正 commit で中身が変わった
  `shizuoka.html`・`README.md` の 2 件）から**機械導出**し、対象 path も期待値も手書きしない
  （§4.3 手書き禁止）。期待値は機械採取済みの `expected_sha256` を読む。
- 上流がまだ Maplat のまま（切替が効いていない）なら、この 2 ファイルの配信内容は旧側の値に
  なり、PlatSeries 期待値と不一致になる → **FAIL（exit 2）**。これが「どちらの側が返るか」の判定。
- Maplat 側との不一致「だけ」を条件にしない理由: 第 3 の値（想定外の改変・破損）が素通りする
  余地を塞ぐため。`== PlatSeries 期待値` は `!= Maplat` より強い条件であり fail-closed。

コード内コメント（`planPositiveControl`）の該当箇所の引用:

>  * fail-closed の考え方（委任の「Maplat 側と比較するか期待値一致だけか」への回答）:
>  *   「s.maplat.jp の中身 == PlatSeries 側期待値（allowlist の expected_sha256）」
>  *   だけを PASS 条件にする。Maplat 側の期待値は allowlist に存在しない
>  *   （allowlist は fix 後期待値のみを機械採取する。§4.3）。実行時に旧 origin
>  *   （https://code4history.github.io/Maplat/<path>）を取得して比較対象にする方式は
>  *   採らない。理由:
>  *     (1) 旧 origin は t3（gh-pages 削除）で消える。… 切替が正しく完了したあとの
>  *         t3 以降に --verify を再実行した際、旧 origin の 404 が環境エラー（exit 3）と
>  *         なって「正しい切替が緑にならない」失敗を作る。
>  *     (2) 「== PlatSeries 期待値」は「!= Maplat 側」より強い条件である。… Maplat 側との
>  *         不一致「だけ」を条件にすると、第 3 の値が素通りする余地が残る。
>  *   ∴ 「PlatSeries 側期待値と完全一致すること」だけを PASS 条件にするのが
>  *     fail-closed として正しい…

判定（`judgePositiveControl`）の不一致メッセージ引用:

> `陽性対照不一致: ${t.url} の中身が PlatSeries 側の期待値と一致しない（期待 …・実測 …）。上流がまだ Maplat（切替が効いていない）か、内容が想定と異なる`

**実測による裏付け**（判別点が実在すること）:
- 本番（切替済み）`: /r/shizuoka.html` → `71af21d0…`・`/r/README.md` → `76d5109f…`（PlatSeries 側）
- 旧 origin `code4history.github.io/Maplat/{path}` → `shizuoka.html` `76d340a3…`・`README.md` `da1197cd…`（Maplat 側）
- 両側が実在して値が異なるため、「Maplat のままなら mismatch → FAIL」が成立する。

## 補足（git status）

```
 M scripts/oct26-m10/verify-switch.mjs
?? .nayuta/oct26-m10-t2-poscontrol-report.md
```
（verify-switch.mjs の変更と、本報告ファイルの新規作成のみ。他の意図しない変更は無い）

**補記（commit について）**: `git add` / `git commit` を attempt したが、ファイルサンドボックス
（workspace-write モード）が主リポジトリ `.git/worktrees/.../index.lock` への書き込みを拒否した
（`Operation not permitted`）。本作業の成果物は worktree 内にあり、approval は無効のため
sandbox 昇格は行わない（委任は commit を必須とせず、完了条件は全て満たしている）。
変更は未 commit のまま残置する（`git status --short` は上の 2 件のみ。HEAD は起点 `57b54255` のまま）。