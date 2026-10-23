import { Restore } from '@maplat/core/common';
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
/**
 * URL の hash（location.hash）から復元値を読む（旧 index.ts の page.js の処理と同じ規則）。
 * 旧と同じく transparency は 0・rotation は 0 から始める（URL に無ければ 0 で復元する）。
 * @returns "#!" で始まらない・地図（s:）が無いときは null（旧も地図が無ければ復元しない）
 */
export declare function parseStateHash(hash: string): Restore | null;
/** 状態を URL の "#!" の後ろの文字列にする（旧 updateUrl と同じ並び・同じ省略の規則）。 */
export declare function buildStatePath(v: StateUrlValues): string;
