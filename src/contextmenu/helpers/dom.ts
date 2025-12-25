import { isNumeric } from "./mix";

/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String|Array<String>} classname Class or array of classes.
 * For example: 'class1 class2' or ['class1', 'class2']
 * @param {Number|undefined} timeout Timeout to remove a class.
 */
export function addClass(
  element: HTMLElement | HTMLElement[],
  classname: string | string[],
  timeout: number | null = null
) {
  if (Array.isArray(element)) {
    element.forEach(each => addClass(each, classname, null));
    return;
  }

  const array = Array.isArray(classname) ? classname : classname.split(/\s+/);
  let i = array.length;

  while (i--) {
    if (!hasClass(element, array[i])) {
      _addClass(element, array[i], timeout);
    }
  }
}

/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String|Array<String>} classname Class or array of classes.
 * For example: 'class1 class2' or ['class1', 'class2']
 * @param {Number|undefined} timeout Timeout to add a class.
 */
export function removeClass(
  element: HTMLElement | HTMLElement[],
  classname: string | string[],
  timeout: number | null = null
) {
  if (Array.isArray(element)) {
    element.forEach(each => removeClass(each, classname, timeout));
    return;
  }

  const array = Array.isArray(classname) ? classname : classname.split(/\s+/);
  let i = array.length;

  while (i--) {
    if (hasClass(element, array[i])) {
      _removeClass(element, array[i], timeout);
    }
  }
}

/**
 * @param {Element} element DOM node.
 * @param {String} classname Classname.
 * @return {Boolean}
 */
export function hasClass(element: HTMLElement, c: string) {
  // use native if available
  return element.classList
    ? element.classList.contains(c)
    : classRegex(c).test(element.className);
}

/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String} classname Classe.
 */
export function toggleClass(
  element: HTMLElement | HTMLElement[],
  classname: string
) {
  if (Array.isArray(element)) {
    element.forEach(each => toggleClass(each, classname));
    return;
  }

  // use native if available
  if (element.classList) {
    element.classList.toggle(classname);
  } else if (hasClass(element, classname)) {
    _removeClass(element, classname, null);
  } else {
    _addClass(element, classname, null);
  }
}

/**
 * Abstraction to querySelectorAll for increased
 * performance and greater usability
 * @param {String} selector
 * @param {Element} context (optional)
 * @param {Boolean} find_all (optional)
 * @return (find_all) {Element} : {Array}
 */
export function find(
  selector: string,
  context: Element | Document = window.document,
  find_all: boolean = false
): HTMLElement | HTMLElement[] | undefined {
  const simpleRe = /^(#?[\w-]+|\.[\w-.]+)$/,
    periodRe = /\./g,
    slice = Array.prototype.slice;
  let matches: HTMLElement[] = [];

  // Redirect call to the more performant function
  // if it's a simple selector and return an array
  // for easier usage
  if (simpleRe.test(selector)) {
    switch (selector[0]) {
      case "#": {
        const el = $(selector.substr(1));
        matches = el ? [el] : [];
        break;
      }
      case ".":
        matches = slice.call(
          context.getElementsByClassName(
            selector.substr(1).replace(periodRe, " ")
          )
        );
        break;
      default:
        matches = slice.call(context.getElementsByTagName(selector));
    }
  } else {
    // If not a simple selector, query the DOM as usual
    // and return an array for easier usage
    matches = slice.call(context.querySelectorAll(selector));
  }

  return find_all ? matches : matches[0];
}

export function $(id: string) {
  id = id[0] === "#" ? id.substr(1, id.length) : id;
  return document.getElementById(id);
}

export function isElement(obj: unknown) {
  // DOM, Level2
  if ("HTMLElement" in window) {
    return !!obj && obj instanceof HTMLElement;
  }
  // Older browsers
  return (
    !!obj &&
    typeof obj === "object" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj as any).nodeType === 1 &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(obj as any).nodeName
  );
}

export function offset(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const docEl = document.documentElement;
  return {
    left: rect.left + window.pageXOffset - docEl.clientLeft,
    top: rect.top + window.pageYOffset - docEl.clientTop,
    width: element.offsetWidth,
    height: element.offsetHeight
  };
}

export function getViewportSize() {
  return {
    w: window.innerWidth || document.documentElement.clientWidth,
    h: window.innerHeight || document.documentElement.clientHeight
  };
}

export function getAllChildren(node: Element, tag: string) {
  return [].slice.call(node.getElementsByTagName(tag));
}

export function removeAllChildren(node: Node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function removeAll(collection: HTMLElement[]) {
  let node;

  while ((node = collection[0])) node.parentNode!.removeChild(node);
}

export function getChildren(node: Node, tag: string | null) {
  return [].filter.call(node.childNodes, (el: Node) =>
    tag
      ? el.nodeType === 1 && (el as Element).tagName.toLowerCase() === tag
      : el.nodeType === 1
  );
}

export function createFragment(html: string) {
  const frag = document.createDocumentFragment(),
    temp = document.createElement("div");
  temp.innerHTML = html;
  while (temp.firstChild) {
    frag.appendChild(temp.firstChild);
  }
  return frag;
}

export function template(html: string, _row: Record<string, string>) {
  return html.replace(/\{ *([\w_-]+) *\}/g, (_htm: string, key: string) => {
    const value = _row[key] === undefined ? "" : _row[key];
    return htmlEscape(value);
  });
}

export function htmlEscape(str: string | number) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function createElement(
  node:
    | string
    | [
        string,
        {
          id?: string;
          classname?: string;
          attr?:
            | { name: string; value: string }
            | { name: string; value: string }[];
        }
      ],
  html: string
) {
  let elem: HTMLElement;
  if (Array.isArray(node)) {
    elem = document.createElement(node[0]);
    const attrs = node[1];

    if (attrs.id) elem.id = attrs.id;
    if (attrs.classname) elem.className = attrs.classname;

    if (attrs.attr) {
      const attr = attrs.attr;
      if (Array.isArray(attr)) {
        let i = -1;
        while (++i < attr.length) {
          elem.setAttribute(attr[i].name, attr[i].value);
        }
      } else {
        elem.setAttribute(attr.name, attr.value);
      }
    }
  } else {
    elem = document.createElement(node);
  }
  elem.innerHTML = html;
  const frag = document.createDocumentFragment();

  while (elem.childNodes[0]) frag.appendChild(elem.childNodes[0]);
  elem.appendChild(frag);
  return elem;
}

function classRegex(classname: string) {
  return new RegExp(`(^|\\s+) ${classname} (\\s+|$)`);
}

function _addClass(el: HTMLElement, klass: string, timeout: number | null) {
  // use native if available
  if (el.classList) {
    el.classList.add(klass);
  } else {
    el.className = `${el.className} ${klass}`.trim();
  }

  if (timeout && isNumeric(timeout)) {
    window.setTimeout(() => _removeClass(el, klass, null), timeout);
  }
}

function _removeClass(el: HTMLElement, klass: string, timeout: number | null) {
  if (el.classList) {
    el.classList.remove(klass);
  } else {
    el.className = el.className.replace(classRegex(klass), " ").trim();
  }
  if (timeout && isNumeric(timeout)) {
    window.setTimeout(() => _addClass(el, klass, null), timeout);
  }
}
