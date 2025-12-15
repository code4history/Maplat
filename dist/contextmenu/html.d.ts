/**
 * @class Html
 */
export declare class Html {
    Base: any;
    container: any;
    /**
     * @constructor
     * @param {Function} base Base class.
     */
    constructor(base: any);
    createMenu(): false | undefined;
    addMenuEntry(item: any): void;
    generateHtmlAndPublish(parent: any, item: any, submenu?: any): HTMLLIElement;
    removeMenuEntry(index: any): void;
    cloneAndGetLineHeight(): number;
}
