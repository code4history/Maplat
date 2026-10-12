import { MaplatApp } from '@maplat/core';
import { MaplatAppOption } from './types';
/**
 * pwaWorker の解決。null は「登録しない」。
 * マイルストーン設計 nov26-m5 §4.1 の表と 1 対 1（false・null を既定の代入より先に判定する）。
 * パッケージの入口（src/index.ts）からは re-export しない（単体テストのための export）。
 */
export declare function resolvePwaWorker(value: unknown): string | null;
export declare function initPwa(core: MaplatApp, appOption: MaplatAppOption): void;
