/**
 * 面積と点の内外の小さな計算（層 B の `<maplat-ui>` と旧 API の互換層 `src/legacy/` の両方が使う。
 * 1 か所にまとめた）。DOM にも OpenLayers にも触れない純関数だけを置く。
 */
import type { LngLat } from "@maplat/core/common";

/** 地球の半径（Web メルカトル EPSG:3857 の定数。旧 Core の merc と同じ） */
const MERC_RADIUS = 6378137;

/**
 * 旧 `MaplatUi.areaIndex`（旧 `src/index.ts`）。閉じた 4 角形（5 点。最後は最初と同じ）の面積。
 * 単位は点の座標の単位のまま（旧 API は merc を渡していた）。旧の式をそのまま写す。
 */
export function areaIndex(xys: number[][]): number {
  return (
    0.5 *
    Math.abs(
      [0, 1, 2, 3].reduce((prev, _curr, i) => {
        const xy1 = xys[i];
        const xy2 = xys[i + 1];
        return prev + (xy1[0] - xy2[0]) * (xy1[1] + xy2[1]);
      }, 0)
    )
  );
}

/** 多角形（経緯度の点の並び）の面積。球面補正はしない（狭い範囲の重なりの比較にだけ使う）。 */
export function polygonArea(points: readonly LngLat[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.longitude * b.latitude - b.longitude * a.latitude;
  }
  return Math.abs(sum) / 2;
}

/** 点が多角形の中にあるか（ray casting。境界は内側に寄せる）。 */
export function pointInPolygon(
  point: LngLat,
  polygon: readonly LngLat[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses =
      a.latitude > point.latitude !== b.latitude > point.latitude &&
      point.longitude <
        ((b.longitude - a.longitude) * (point.latitude - a.latitude)) /
          (b.latitude - a.latitude) +
          a.longitude;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Web メルカトル（EPSG:3857 の m）を経緯度（度）へ。`ol/proj` を使わずに同じ式で直す。 */
export function mercToLngLat(merc: readonly number[]): LngLat {
  const [x, y] = merc;
  return {
    longitude: ((x / MERC_RADIUS) * 180) / Math.PI,
    latitude:
      ((2 * Math.atan(Math.exp(y / MERC_RADIUS)) - Math.PI / 2) * 180) / Math.PI
  };
}
