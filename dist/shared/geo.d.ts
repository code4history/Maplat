import { LngLat } from '@maplat/core/common';
/**
 * 旧 `MaplatUi.areaIndex`（旧 `src/index.ts`）。閉じた 4 角形（5 点。最後は最初と同じ）の面積。
 * 単位は点の座標の単位のまま（旧 API は merc を渡していた）。旧の式をそのまま写す。
 */
export declare function areaIndex(xys: number[][]): number;
/** 多角形（経緯度の点の並び）の面積。球面補正はしない（狭い範囲の重なりの比較にだけ使う）。 */
export declare function polygonArea(points: readonly LngLat[]): number;
/** 点が多角形の中にあるか（ray casting。境界は内側に寄せる）。 */
export declare function pointInPolygon(point: LngLat, polygon: readonly LngLat[]): boolean;
/** Web メルカトル（EPSG:3857 の m）を経緯度（度）へ。`ol/proj` を使わずに同じ式で直す。 */
export declare function mercToLngLat(merc: readonly number[]): LngLat;
