// 旧 API の `ui.xyToMapIDs(xy, threshold)` の互換（互換のために作り直した）。
//
// 旧 `ui_marker.ts` の `xyToMapIDs` は、今の地図の sys 座標の点に重なる（範囲を持つ）地図を、範囲の狭い順に返していた。
// 重なりの判定は層 B の `<maplat-ui>` の `mapsAt(経緯度, threshold)`（画面の面積の threshold 倍以上の地図・
// 今の地図は外す。旧と同じ既定 10）が持つので、互換層は**点を経緯度に直して渡すだけ**にする
// （多角形の判定を二重に持たない）。
//   sys 座標 →（層 A の `from.sysCoord2MercAsync`。`Promise<[x, y]>`）→ merc →（`shared/geo.ts`）→ 経緯度
// 面積の比は旧は merc、`mapsAt` は経緯度で取る。狭い範囲では比はほぼ同じ（しきい値の判定にだけ使う）。
// `areaIndex`（旧の公開メソッド）は純関数として `src/shared/geo.ts` に置いた。

import type { MaplatApp } from "@maplat/core";
import type { MaplatUiElement } from "../element";
import { mercToLngLat } from "../shared/geo";

type FromLike = {
  sysCoord2MercAsync?: (xy: number[]) => Promise<number[]> | number[];
};

/**
 * 旧 `ui.xyToMapIDs(xy, threshold)`。`xy` は今の地図の sys 座標。地図の準備前・層 A に変換の口が無いときは空の配列。
 */
export async function xyToMapIDs(
  core: MaplatApp | undefined,
  host: MaplatUiElement | undefined,
  xy: number[],
  threshold = 10
): Promise<string[]> {
  if (!core || !host || !Array.isArray(xy) || xy.length < 2) return [];
  const from = core.from as FromLike | undefined;
  if (!from || typeof from.sysCoord2MercAsync !== "function") return [];
  const merc = await from.sysCoord2MercAsync(xy);
  if (!Array.isArray(merc) || !merc.every(v => Number.isFinite(Number(v))))
    return [];
  return host.mapsAt(mercToLngLat(merc.map(Number)), threshold);
}
