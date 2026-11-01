// <maplat-ui> の状態 URL（state-url）。旧 UI（src/index.ts の page.js の hashbang の処理と updateUrl）と
// 同じ書式で、URL の "#!" の後ろに地図の状態を書く・読む。
//
//   #!s:<地図>/b:<背景地図>/t:<透過度>/x:<x>/y:<y>/z:<zoom>/r:<回転（度）>/sb:1/hm:1/hl:<隠した層>/om:<開いた POI>
//
// 値の意味は層 A の Restore（@maplat/core/common）と同じ（x・y・zoom・rotation は viewpoint の値）。
// sb（枠線）・om（開いた POI）は層 B の拡張キー（showBorder・openedMarker）。
// 旧 UI の URL をそのまま読め、ここで書いた URL を旧 UI も読める（旧の読み手が知らない区切りは使わない）。
//
// import は @maplat/core/common の型だけ（<maplat-ui> の依存の規則。spec/element-deps.spec.ts）。
import type { Restore } from "@maplat/core/common";

/** URL に書く状態（層 A の state・viewpoint と、層 B の拡張キー）。 */
export interface StateUrlValues {
  mapID: string;
  backgroundID?: string;
  transparency?: number;
  x?: number;
  y?: number;
  zoom?: number;
  rotation?: number;
  showBorder?: boolean;
  hideMarker?: boolean;
  hideLayer?: string;
  openedMarker?: string;
}

/** 区切りの 1 つを読む（旧は page.js が URL の % を解いてから渡していた）。 */
function decodePart(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function num(text: string): number | undefined {
  const n = parseFloat(text);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * URL の hash（location.hash）から復元値を読む（旧 index.ts の page.js の処理と同じ規則）。
 * 旧と同じく transparency は 0・rotation は 0 から始める（URL に無ければ 0 で復元する）。
 * @returns "#!" で始まらない・地図（s:）が無いときは null（旧も地図が無ければ復元しない）
 */
export function parseStateHash(hash: string): Restore | null {
  if (typeof hash !== "string" || !hash.startsWith("#!")) return null;
  const path = hash.slice(2).split("?")[0];
  const position: NonNullable<Restore["position"]> = { rotation: 0 };
  const restore: Restore = { transparency: 0, position };
  for (const raw of path.split("/")) {
    if (!raw) continue;
    const sep = raw.indexOf(":");
    if (sep < 0) continue;
    const key = raw.slice(0, sep);
    const value = decodePart(raw.slice(sep + 1));
    switch (key) {
      case "s":
        if (value) restore.mapID = value;
        break;
      case "b":
        if (value) restore.backgroundID = value;
        break;
      case "t": {
        const n = num(value);
        if (n !== undefined) restore.transparency = n;
        break;
      }
      case "r": {
        const n = num(value);
        if (n !== undefined) position.rotation = n;
        break;
      }
      case "z": {
        const n = num(value);
        if (n !== undefined) position.zoom = n;
        break;
      }
      case "x": {
        const n = num(value);
        if (n !== undefined) position.x = n;
        break;
      }
      case "y": {
        const n = num(value);
        if (n !== undefined) position.y = n;
        break;
      }
      case "sb":
        restore.showBorder = !!parseInt(value, 10);
        break;
      case "hm":
        restore.hideMarker = parseInt(value, 10) ? 1 : 0;
        break;
      case "hl":
        if (value) restore.hideLayer = value;
        break;
      case "om":
        if (value) restore.openedMarker = value;
        break;
      // 旧の c（モーダルを閉じる）・mobile_if（効いていない）は読まない
      default:
        break;
    }
  }
  return restore.mapID ? restore : null;
}

/** 状態を URL の "#!" の後ろの文字列にする（旧 updateUrl と同じ並び・同じ省略の規則）。 */
export function buildStatePath(v: StateUrlValues): string {
  let path = `s:${v.mapID}`;
  if (v.backgroundID && v.backgroundID !== v.mapID)
    path += `/b:${v.backgroundID}`;
  if (typeof v.transparency === "number" && v.transparency > 0)
    path += `/t:${v.transparency}`;
  if (typeof v.x === "number" && typeof v.y === "number") {
    path += `/x:${v.x}`;
    path += `/y:${v.y}`;
  }
  if (typeof v.zoom === "number") path += `/z:${v.zoom}`;
  if (typeof v.rotation === "number" && v.rotation !== 0)
    path += `/r:${v.rotation}`;
  if (v.showBorder) path += `/sb:1`;
  if (v.hideMarker) path += `/hm:1`;
  if (v.hideLayer) path += `/hl:${v.hideLayer}`;
  if (v.openedMarker) path += `/om:${v.openedMarker}`;
  return path;
}
