/**
 * Overwrites obj1's values with obj2's and adds
 * obj2's if non existent in obj1
 * @returns obj3 a new object based on obj1 and obj2
 */

export function mergeOptions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj1: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj2: Record<string, any>
) {
  const obj3: Record<string, unknown> = {};
  for (const attr1 in obj1) obj3[attr1] = obj1[attr1];
  for (const attr2 in obj2) obj3[attr2] = obj2[attr2];
  return obj3;
}

export function assert(
  condition: boolean,
  message: string = "Assertion failed"
) {
  if (!condition) {
    if (typeof Error !== "undefined") throw new Error(message);
    throw message; // Fallback
  }
}

/**
 * Does str contain test?
 * @param {String} str_test
 * @param {String} str
 * @returns Boolean
 */
export function contains(str_test: string, str: string) {
  return !!~str.indexOf(str_test);
}

export function getUniqueId(prefix: string = "id_") {
  return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
}

export function assertEqual(a: unknown, b: unknown, message: string) {
  if (a !== b) {
    throw new Error(`${message} mismatch: ${a} != ${b}`);
  }
}

export function now() {
  // Polyfill for window.performance.now()
  // @license http://opensource.org/licenses/MIT
  // copyright Paul Irish 2015
  // https://gist.github.com/paulirish/5438650
  if ("performance" in window === false) {
    interface Performance {
      now?: () => number;
    }
    (window as unknown as { performance: Performance }).performance = {};
  }

  Date.now =
    Date.now ||
    function () {
      // thanks IE8
      return new Date().getTime();
    };

  if ("now" in window.performance === false) {
    let nowOffset = Date.now();

    if (performance.timing && performance.timing.navigationStart) {
      nowOffset = performance.timing.navigationStart;
    }

    interface PerformanceWithNow extends Performance {
      now: () => number;
    }
    (window.performance as PerformanceWithNow).now = () =>
      Date.now() - nowOffset;
  }

  return window.performance.now();
}

export function randomId(prefix: string) {
  const id = now().toString(36);
  return prefix ? prefix + id : id;
}

export function isNumeric(str: string | number) {
  return /^\d+$/.test(String(str));
}

export function isEmpty(str: string | undefined | null) {
  return !str || 0 === str.length;
}

export function emptyArray(array: unknown[]) {
  while (array.length) array.pop();
}

export function anyMatchInArray(source: unknown[], target: unknown[]) {
  return source.some((each: unknown) => target.indexOf(each) >= 0);
}

export function everyMatchInArray(arr1: unknown[], arr2: unknown[]) {
  return arr2.every((each: unknown) => arr1.indexOf(each) >= 0);
}

export function anyItemHasValue(
  obj: Record<string, unknown>,
  has: boolean = false
) {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (!isEmpty(typeof value === "string" ? value : null)) has = true;
  }
  return has;
}
