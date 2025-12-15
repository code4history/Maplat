/**
 * Overwrites obj1's values with obj2's and adds
 * obj2's if non existent in obj1
 * @returns obj3 a new object based on obj1 and obj2
 */
export declare function mergeOptions(obj1: any, obj2: any): any;
export declare function assert(condition: any, message?: any): void;
/**
 * Does str contain test?
 * @param {String} str_test
 * @param {String} str
 * @returns Boolean
 */
export declare function contains(str_test: any, str: any): boolean;
export declare function getUniqueId(prefix?: any): string;
export declare function isDefAndNotNull(val: any): boolean;
export declare function assertEqual(a: any, b: any, message: any): void;
export declare function now(): number;
export declare function randomId(prefix: any): string;
export declare function isNumeric(str: any): boolean;
export declare function isEmpty(str: any): boolean;
export declare function emptyArray(array: any): void;
export declare function anyMatchInArray(source: any, target: any): any;
export declare function everyMatchInArray(arr1: any, arr2: any): any;
export declare function anyItemHasValue(obj: any, has?: any): any;
