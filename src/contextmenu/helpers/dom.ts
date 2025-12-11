import { isNumeric } from './mix';

/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String|Array<String>} classname Class or array of classes.
 * For example: 'class1 class2' or ['class1', 'class2']
 * @param {Number|undefined} timeout Timeout to remove a class.
 */
export function addClass(element: any, classname: any, timeout: any) {
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
export function removeClass(element: any, classname: any, timeout: any) {
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
export function hasClass(element: any, c: any) {
  // use native if available
  return element.classList
    ? element.classList.contains(c)
    : classRegex(c).test(element.className);
}

/**
 * @param {Element|Array<Element>} element DOM node or array of nodes.
 * @param {String} classname Classe.
 */
export function toggleClass(element: any, classname: any) {
  if (Array.isArray(element)) {
    element.forEach(each => toggleClass(each, classname));
    return;
  }

  // use native if available
  if (element.classList) {
    element.classList.toggle(classname);
  } else {
    hasClass(element, classname)
      ? _removeClass(element, classname, null)
      : _addClass(element, classname, null);
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
export function find(selector: any, context: any = window.document, find_all: any) {
  const simpleRe = /^(#?[\w-]+|\.[\w-.]+)$/,
    periodRe = /\./g,
    slice = Array.prototype.slice;
  let matches = [];

  // Redirect call to the more performant function
  // if it's a simple selector and return an array
  // for easier usage
  if (simpleRe.test(selector)) {
    switch (selector[0]) {
      case '#':
        matches = [$(selector.substr(1))];
        break;
      case '.':
        matches = slice.call(
          context.getElementsByClassName(
            selector.substr(1).replace(periodRe, ' ')
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

export function $(id: any) {
  id = id[0] === '#' ? id.substr(1, id.length) : id;
  return document.getElementById(id);
}

export function isElement(obj: any) {
  // DOM, Level2
  if ('HTMLElement' in window) {
    return !!obj && obj instanceof HTMLElement;
  }
  // Older browsers
  return (
    !!obj && typeof obj === 'object' && obj.nodeType === 1 && !!obj.nodeName
  );
}

export function offset(element: any) {
  const rect = element.getBoundingClientRect();
  const docEl = document.documentElement;
  return {
    left: rect.left + window.pageXOffset - docEl.clientLeft,
    top: rect.top + window.pageYOffset - docEl.clientTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

export function getViewportSize() {
  return {
    w: window.innerWidth || document.documentElement.clientWidth,
    h: window.innerHeight || document.documentElement.clientHeight,
  };
}

export function getAllChildren(node: any, tag: any) {
  return [].slice.call(node.getElementsByTagName(tag));
}

export function removeAllChildren(node: any) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function removeAll(collection: any) {
  let node;
  while ((node = collection[0])) node.parentNode.removeChild(node);
}

export function getChildren(node: any, tag: any) {
  return [].filter.call(node.childNodes, (el: any) =>
    tag
      ? el.nodeType === 1 && el.tagName.toLowerCase() === tag
      : el.nodeType === 1
  );
}

export function createFragment(html: any, _row?: any) {
  const frag = document.createDocumentFragment(),
    temp = document.createElement('div');
  temp.innerHTML = html;
  while (temp.firstChild) {
    frag.appendChild(temp.firstChild);
  }
  return frag;
}

export function template(html: any, _row: any) {
  return html.replace(/\{ *([\w_-]+) *\}/g, (_htm: any, key: any) => {
    const value = _row[key] === undefined ? '' : _row[key];
    return htmlEscape(value);
  });
}

export function htmlEscape(str: any) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function createElement(node: any, html: any) {
  let elem;
  if (Array.isArray(node)) {
    elem = document.createElement(node[0]);

    if (node[1].id) elem.id = node[1].id;
    if (node[1].classname) elem.className = node[1].classname;

    if (node[1].attr) {
      const attr = node[1].attr;
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

function classRegex(classname: any) {
  return new RegExp(`(^|\\s+) ${classname} (\\s+|$)`);
}

function _addClass(el: any, klass: any, timeout: any) {
  // use native if available
  if (el.classList) {
    el.classList.add(klass);
  } else {
    el.className = (`${el.className} ${klass}`).trim();
  }

  if (timeout && isNumeric(timeout)) {
    window.setTimeout(() => _removeClass(el, klass, null), timeout);
  }
}

function _removeClass(el: any, klass: any, timeout: any) {
  if (el.classList) {
    el.classList.remove(klass);
  } else {
    el.className = el.className.replace(classRegex(klass), ' ').trim();
  }
  if (timeout && isNumeric(timeout)) {
    window.setTimeout(() => _addClass(el, klass, null), timeout);
  }
}
