/**
 * Overwrites obj1's values with obj2's and adds
 * obj2's if non existent in obj1
 * @returns obj3 a new object based on obj1 and obj2
 */
export declare function mergeOptions(obj1: Record<string, any>, obj2: Record<string, any>): Record<string, unknown>;
export declare function assert(condition: boolean, message?: string): void;
/**
 * Does str contain test?
 * @param {String} str_test
 * @param {String} str
 * @returns Boolean
 */
export declare function contains(str_test: string, str: string): boolean;
export declare function getUniqueId(prefix?: string): string;
export declare function assertEqual(a: unknown, b: unknown, message: string): void;
export declare function now(): number;
export declare function randomId(prefix: string): string;
export declare function isNumeric(str: string | number): boolean;
export declare function isEmpty(str: string | undefined | null): boolean;
export declare function emptyArray(array: unknown[]): void;
export declare function anyMatchInArray(source: unknown[], target: unknown[]): boolean;
export declare function everyMatchInArray(arr1: unknown[], arr2: unknown[]): boolean;
export declare function anyItemHasValue(obj: Record<string, unknown>, has?: boolean): boolean;
