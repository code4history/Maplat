import { default as Control } from 'ol/control/Control';
import { Internal } from './internal';
import { Html } from './html';
import { ContextMenuOptions, ContextMenuItem } from '../types';
export declare const createContainer: (hidden: boolean, width: number) => HTMLDivElement;
/**
 * @class Base
 * @extends {ol.control.Control}
 */
export default class Base extends Control {
    options: ContextMenuOptions;
    container: HTMLElement;
    disabled: boolean;
    Internal: Internal;
    Html: Html;
    /**
     * @constructor
     * @param {object|undefined} opt_options Options.
     */
    constructor(opt_options?: ContextMenuOptions);
    /**
     * Remove all elements from the menu.
     */
    clear(): void;
    /**
     * Close the menu programmatically.
     */
    close(): void;
    /**
     * Enable menu
     */
    enable(): void;
    /**
     * Disable menu
     */
    disable(): void;
    /**
     * @return {Array} Returns default items
     */
    getDefaultItems(): {
        text: string;
        classname: string;
        callback: (obj: any, map: any) => void;
    }[];
    /**
     * @return {Number} Returns how many items
     */
    countItems(): number;
    /**
     * Add items to the menu. This pushes each item in the provided array
     * to the end of the menu.
     * @param {Array} arr Array.
     */
    extend(arr: ContextMenuItem[]): void;
    isOpen(): boolean;
    /**
     * Update the menu's position.
     */
    updatePosition(pixel: number[]): void;
    /**
     * Remove the last item of the menu.
     */
    pop(): void;
    /**
     * Insert the provided item at the end of the menu.
     * @param {Object|String} item Item.
     */
    push(item: ContextMenuItem | string): void;
    /**
     * Remove the first item of the menu.
     */
    shift(): void;
    /**
     * Not supposed to be used on app.
     */
    setMap(map: import('ol').Map): void;
}
