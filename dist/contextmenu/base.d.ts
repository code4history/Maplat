import { default as Control } from 'ol/control/Control';
import { Internal } from './internal';
import { Html } from './html';
export declare const createContainer: (hidden: any, width: any) => HTMLDivElement;
/**
 * @class Base
 * @extends {ol.control.Control}
 */
export default class Base extends Control {
    options: any;
    container: HTMLElement;
    disabled: boolean;
    Internal: Internal;
    Html: Html;
    /**
     * @constructor
     * @param {object|undefined} opt_options Options.
     */
    constructor(opt_options?: any);
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
    extend(arr: any[]): void;
    isOpen(): boolean;
    /**
     * Update the menu's position.
     */
    updatePosition(pixel: any): void;
    /**
     * Remove the last item of the menu.
     */
    pop(): void;
    /**
     * Insert the provided item at the end of the menu.
     * @param {Object|String} item Item.
     */
    push(item: any): void;
    /**
     * Remove the first item of the menu.
     */
    shift(): void;
    /**
     * Not supposed to be used on app.
     */
    setMap(map: any): void;
}
