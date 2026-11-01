import { MaplatApp } from '@maplat/core';
import { MaplatUiElement } from '../element';
/**
 * 旧 `ui.xyToMapIDs(xy, threshold)`。`xy` は今の地図の sys 座標。地図の準備前・層 A に変換の口が無いときは空の配列。
 */
export declare function xyToMapIDs(core: MaplatApp | undefined, host: MaplatUiElement | undefined, xy: number[], threshold?: number): Promise<string[]>;
