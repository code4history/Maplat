import { default as ContextMenuBase } from './base';
import { ContextMenuItem } from '../types';
/**
 * @class Html
 */
export declare class Html {
    Base: ContextMenuBase;
    container: HTMLElement;
    /**
     * @constructor
     * @param {ContextMenuBase} base Base class.
     */
    constructor(base: ContextMenuBase);
    createMenu(): false | undefined;
    addMenuEntry(item: ContextMenuItem): void;
    generateHtmlAndPublish(parent: HTMLElement, item: ContextMenuItem | string, submenu?: boolean | undefined): HTMLElement;
    removeMenuEntry(index: string): void;
    cloneAndGetLineHeight(): number;
}
