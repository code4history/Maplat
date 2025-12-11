/**
 * Overwrites obj1's values with obj2's and adds
 * obj2's if non existent in obj1
 * @returns obj3 a new object based on obj1 and obj2
 */
export function mergeOptions(obj1: any, obj2: any) {
  const obj3: any = {};
  for (const attr1 in obj1) obj3[attr1] = obj1[attr1];
  for (const attr2 in obj2) obj3[attr2] = obj2[attr2];
  return obj3;
}

export function assert(condition: any, message: any = 'Assertion failed') {
  if (!condition) {
    if (typeof Error !== 'undefined') throw new Error(message);
    throw message; // Fallback
  }
}

/**
 * Does str contain test?
 * @param {String} str_test
 * @param {String} str
 * @returns Boolean
 */
export function contains(str_test: any, str: any) {
  return !!~str.indexOf(str_test);
}

export function getUniqueId(prefix: any = 'id_') {
  return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
}

export function isDefAndNotNull(val: any) {
  // Note that undefined == null.
  return val != null; // eslint-disable-line no-eq-null
}

export function assertEqual(a: any, b: any, message: any) {
  if (a !== b) {
    throw new Error(`${message} mismatch: ${a} != ${b}`);
  }
}

export function now() {
  // Polyfill for window.performance.now()
  // @license http://opensource.org/licenses/MIT
  // copyright Paul Irish 2015
  // https://gist.github.com/paulirish/5438650
  if ('performance' in window === false) {
    (window as any).performance = {};
  }

  Date.now =
    Date.now ||
    function () {
      // thanks IE8
      return new Date().getTime();
    };

  if ('now' in window.performance === false) {
    let nowOffset = Date.now();

    if (performance.timing && performance.timing.navigationStart) {
      nowOffset = performance.timing.navigationStart;
    }

    (window.performance as any).now = () => Date.now() - nowOffset;
  }

  return window.performance.now();
}

export function randomId(prefix: any) {
  const id = now().toString(36);
  return prefix ? prefix + id : id;
}

export function isNumeric(str: any) {
  return /^\d+$/.test(str);
}

export function isEmpty(str: any) {
  return !str || 0 === str.length;
}

export function emptyArray(array: any) {
  while (array.length) array.pop();
}

export function anyMatchInArray(source: any, target: any) {
  return source.some((each: any) => target.indexOf(each) >= 0);
}

export function everyMatchInArray(arr1: any, arr2: any) {
  return arr2.every((each: any) => arr1.indexOf(each) >= 0);
}

export function anyItemHasValue(obj: any, has: any = false) {
  const keys = Object.keys(obj);
  keys.forEach(key => {
    if (!isEmpty(obj[key])) has = true;
  });
  return has;
}
