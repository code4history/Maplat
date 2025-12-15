/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String|Array<String>} classname Class or array of classes.
 * For example: 'class1 class2' or ['class1', 'class2']
 * @param {Number|undefined} timeout Timeout to remove a class.
 */
export declare function addClass(element: any, classname: any, timeout: any): void;
/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String|Array<String>} classname Class or array of classes.
 * For example: 'class1 class2' or ['class1', 'class2']
 * @param {Number|undefined} timeout Timeout to add a class.
 */
export declare function removeClass(element: any, classname: any, timeout: any): void;
/**
 * @param {Element} element DOM node.
 * @param {String} classname Classname.
 * @return {Boolean}
 */
export declare function hasClass(element: any, c: any): any;
/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String} classname Classe.
 */
export declare function toggleClass(element: any, classname: any): void;
/**
 * Abstraction to querySelectorAll for increased
 * performance and greater usability
 * @param {String} selector
 * @param {Element} context (optional)
 * @param {Boolean} find_all (optional)
 * @return (find_all) {Element} : {Array}
 */
export declare function find(selector: any, context: any | undefined, find_all: any): any;
export declare function $(id: any): HTMLElement | null;
export declare function isElement(obj: any): boolean;
export declare function offset(element: any): {
    left: number;
    top: number;
    width: any;
    height: any;
};
export declare function getViewportSize(): {
    w: number;
    h: number;
};
export declare function getAllChildren(node: any, tag: any): never[];
export declare function removeAllChildren(node: any): void;
export declare function removeAll(collection: any): void;
export declare function getChildren(node: any, tag: any): never[];
export declare function createFragment(html: any, _row?: any): DocumentFragment;
export declare function template(html: any, _row: any): any;
export declare function htmlEscape(str: any): string;
export declare function createElement(node: any, html: any): any;
