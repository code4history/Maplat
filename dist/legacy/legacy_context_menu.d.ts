import { MaplatUiElement } from '../element';
import { ContextMenuItem } from './legacy_types';
export interface LegacyContextMenu {
    /** 旧 `contextMenu.container`（層 B のメニューの要素。旧の class 名は無い） */
    readonly container: HTMLElement | null;
    /** 旧 `contextMenu.Internal`（旧 UI の `showContextMenu` が使っていた口） */
    readonly Internal: {
        openMenu: (pixel?: number[], coordinate?: number[]) => void;
        closeMenu: () => void;
        readonly opened: boolean;
    };
    extend: (items: unknown[]) => void;
    clear: () => void;
    push: (item: ContextMenuItem | string) => void;
    pop: () => void;
    shift: () => void;
    countItems: () => number;
    isOpen: () => boolean;
    close: () => void;
    updatePosition: (pixel: number[]) => void;
    on: (type: string, handler: (event: unknown) => void) => void;
    un: (type: string, handler: (event: unknown) => void) => void;
    off: (type: string, handler: (event: unknown) => void) => void;
}
/** 互換層だけが使う口（facade の外から `menuclose` を購読するため）。 */
export interface LegacyContextMenuBinding {
    attach: (el: MaplatUiElement) => void;
    detach: () => void;
}
export type LegacyContextMenuFacade = LegacyContextMenu & LegacyContextMenuBinding;
export declare function createLegacyContextMenu(host: () => MaplatUiElement | null): LegacyContextMenuFacade;
