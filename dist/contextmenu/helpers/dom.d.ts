/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String|Array<String>} classname Class or array of classes.
 * For example: 'class1 class2' or ['class1', 'class2']
 * @param {Number|undefined} timeout Timeout to remove a class.
 */
export declare function addClass(element: HTMLElement | HTMLElement[], classname: string | string[], timeout?: number | null): void;
/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String|Array<String>} classname Class or array of classes.
 * For example: 'class1 class2' or ['class1', 'class2']
 * @param {Number|undefined} timeout Timeout to add a class.
 */
export declare function removeClass(element: HTMLElement | HTMLElement[], classname: string | string[], timeout?: number | null): void;
/**
 * @param {Element} element DOM node.
 * @param {String} classname Classname.
 * @return {Boolean}
 */
export declare function hasClass(element: HTMLElement, c: string): boolean;
/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String} classname Classe.
 */
export declare function toggleClass(element: HTMLElement | HTMLElement[], classname: string): void;
/**
 * Abstraction to querySelectorAll for increased
 * performance and greater usability
 * @param {String} selector
 * @param {Element} context (optional)
 * @param {Boolean} find_all (optional)
 * @return (find_all) {Element} : {Array}
 */
export declare function find(selector: string, context?: Element | Document, find_all?: boolean): HTMLElement | HTMLElement[] | undefined;
export declare function $(id: string): HTMLElement | null;
export declare function isElement(obj: unknown): boolean;
export declare function offset(element: HTMLElement): {
    left: number;
    top: number;
    width: number;
    height: number;
};
export declare function getViewportSize(): {
    w: number;
    h: number;
};
export declare function getAllChildren(node: Element, tag: string): never[];
export declare function removeAllChildren(node: Node): void;
export declare function removeAll(collection: HTMLElement[]): void;
export declare function getChildren(node: Node, tag: string | null): never[];
export declare function createFragment(html: string): DocumentFragment;
export declare function template(html: string, _row: Record<string, string>): string;
export declare function htmlEscape(str: string | number): string;
export declare function createElement(node: string | [
    string,
    {
        id?: string;
        classname?: string;
        attr?: {
            name: string;
            value: string;
        } | {
            name: string;
            value: string;
        }[];
    }
], html: string): HTMLElement;
