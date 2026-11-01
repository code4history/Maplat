export { MaplatUiElement, MAPLAT_UI_VERSION } from './maplat-ui';
export type { CompassAction, MaplatMenuItem, MaplatMenuOptions } from './maplat-ui';
/**
 * <maplat-ui> を登録する。既に登録済みなら上書きせず、英語で警告する（1 文書に載る層 B の実装は 1 つ）。
 * @returns 登録したら true
 */
export declare function defineMaplatUi(tagName?: string): boolean;
