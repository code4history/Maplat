import ContextMenuBase, { createContainer } from "./base";
import { ContextMenuItem } from "../types";
import { CSS_VARS, DEFAULT_ITEMS } from "./constants";
import { createFragment, find } from "./helpers/dom";
import { contains, getUniqueId } from "./helpers/mix";

/**
 * @class Html
 */
export class Html {
  Base: ContextMenuBase;
  container: HTMLElement;

  /**
   * @constructor
   * @param {ContextMenuBase} base Base class.
   */
  constructor(base: ContextMenuBase) {
    this.Base = base;
    this.container = this.Base.container;
    return this;
  }

  createMenu() {
    let items: ContextMenuItem[] = [];

    if ("items" in this.Base.options) {
      items =
        (this.Base.options.defaultItems
          ? (this.Base.options.items || []).concat(DEFAULT_ITEMS)
          : this.Base.options.items) || [];
    } else if (this.Base.options.defaultItems) {
      items = DEFAULT_ITEMS;
    }
    // no item
    if (items.length === 0) return false;
    // create entries
    items.forEach(this.addMenuEntry, this);
  }

  addMenuEntry(item: ContextMenuItem) {
    if (item.items && Array.isArray(item.items)) {
      // submenu - only a second level
      item.classname = item.classname || "";
      if (!contains(CSS_VARS.submenu, item.classname)) {
        item.classname = item.classname.length
          ? ` ${CSS_VARS.submenu}`
          : CSS_VARS.submenu;
      }

      const li = this.generateHtmlAndPublish(this.container, item);
      const sub = createContainer(false, this.Base.options.width || 150);
      sub.style.left =
        this.Base.Internal.submenu.lastLeft || this.Base.Internal.submenu.left;
      li.appendChild(sub);

      item.items!.forEach((each: ContextMenuItem) => {
        this.generateHtmlAndPublish(sub, each, true);
      });
    } else {
      this.generateHtmlAndPublish(this.container, item);
    }
  }

  generateHtmlAndPublish(
    parent: HTMLElement,
    item: ContextMenuItem | string,
    submenu: boolean | undefined = undefined
  ) {
    const index = getUniqueId();
    let html,
      frag: DocumentFragment,
      element: HTMLElement,
      separator = false;

    // separator
    if (typeof item === "string" && item.trim() === "-") {
      html = `<li id="${index}" class="${CSS_VARS.separator}"><hr></li>`;
      frag = createFragment(html);
      // http://stackoverflow.com/a/13347298/4640499
      // http://stackoverflow.com/a/13347298/4640499
      element = [].slice.call(frag.childNodes, 0)[0] as HTMLElement;
      if (parent.firstChild) {
        parent.firstChild.appendChild(frag);
      } else {
        parent.appendChild(frag);
      }
      // to exclude from lineHeight calculation
      separator = true;
    } else {
      const cItem = item as ContextMenuItem;
      cItem.classname = cItem.classname || "";
      html = `<span>${cItem.text}</span>`;
      frag = createFragment(html);
      element = document.createElement("li");

      if (cItem.icon) {
        if (cItem.classname === "") {
          cItem.classname = CSS_VARS.icon;
        } else if (!cItem.classname.includes(CSS_VARS.icon)) {
          cItem.classname += ` ${CSS_VARS.icon}`;
        }
        element.setAttribute("style", `background-image:url(${cItem.icon})`);
      }

      element.id = index;
      element.className = cItem.classname;
      element.appendChild(frag);
      if (parent.firstChild) {
        (parent.firstChild as HTMLElement).appendChild(element);
      } else {
        parent.appendChild(element); // Fallback if no firstChild
      }
    }

    const cItem = item as ContextMenuItem;
    this.Base.Internal.items[index] = {
      id: index,
      submenu: submenu ? 1 : 0,
      separator,
      callback: cItem.callback,
      data: cItem.data || null
    };
    this.Base.Internal.setItemListener(element, index);
    return element;
  }

  removeMenuEntry(index: string) {
    const element = find(
      `#${index}`,
      this.container.firstChild as HTMLElement,
      false
    ) as HTMLElement;
    if (element && this.container.firstChild) {
      this.container.firstChild.removeChild(element);
    }
    delete this.Base.Internal.items[index];
  }

  cloneAndGetLineHeight() {
    // for some reason I have to calculate with 2 items
    const cloned = this.container.cloneNode() as HTMLElement;
    const frag = createFragment("<span>Foo</span>");
    const frag2 = createFragment("<span>Foo</span>");
    const element = document.createElement("li");
    const element2 = document.createElement("li");

    element.appendChild(frag);
    element2.appendChild(frag2);
    cloned.appendChild(element);
    cloned.appendChild(element2);

    if (this.container.parentNode) {
      this.container.parentNode.appendChild(cloned);
      const height = cloned.offsetHeight / 2;
      this.container.parentNode.removeChild(cloned);
      return height;
    }
    return 0;
  }
}
