import { TinyEmitter } from 'tiny-emitter';
import { type Item } from '../types';
export declare function createFragment(html: string): DocumentFragment;
export declare function getLineHeight(container: HTMLDivElement): number;
export declare function addMenuEntry({ parentNode, item, isSubmenu, isInsideSubmenu, emitter, }: {
    parentNode: HTMLUListElement;
    item: Item;
    isSubmenu: boolean;
    isInsideSubmenu?: boolean;
    emitter: TinyEmitter;
}): HTMLLIElement;
export declare function addMenuEntries({ container, items, menuWidth, isInsideSubmenu, emitter, }: {
    container: HTMLUListElement;
    items: Item[];
    menuWidth: number;
    isInsideSubmenu?: boolean;
    emitter: TinyEmitter;
}): void;
