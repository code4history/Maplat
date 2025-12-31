/* Fork from ol-comtextmenu 4.1.0
 * https://github.com/jonataswalker/ol-contextmenu/tree/4.1.0
 * (c) Jonatas Walker
 * @license MIT
 **/

import { CSS_VARS, DEFAULT_OPTIONS, DEFAULT_ITEMS } from "./constants";
import Control from "ol/control/Control";
import { Internal } from "./internal";
import { Html } from "./html";
import { assert, mergeOptions } from "./helpers/mix";
import { ContextMenuOptions, ContextMenuItem } from "../types";
//import './sass/main.scss';

export const createContainer = (hidden: boolean, width: number) => {
  const container = document.createElement("div");
  const ul = document.createElement("ul");
  const klasses = [CSS_VARS.container, CSS_VARS.unselectable];

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  hidden && klasses.push(CSS_VARS.hidden);
  container.className = klasses.join(" ");
  container.style.width = `${parseInt(String(width), 10)}px`;
  container.appendChild(ul);
  return container;
};

/**
 * @class Base
 * @extends {ol.control.Control}
 */
export default class Base extends Control {
  options: ContextMenuOptions;
  container: HTMLElement;
  disabled: boolean;
  Internal: Internal;
  Html: Html;

  /**
   * @constructor
   * @param {object|undefined} opt_options Options.
   */
  constructor(opt_options: ContextMenuOptions = {}) {
    assert(
      typeof opt_options == "object",
      "@param `opt_options` should be object type!"
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = mergeOptions(DEFAULT_OPTIONS, opt_options) as any;
    const container = createContainer(true, options.width!);
    super({ element: container });

    this.options = options;
    this.container = container;
    this.disabled = false;
    this.Internal = new Internal(this);
    this.Html = new Html(this);
  }

  /**
   * Remove all elements from the menu.
   */
  clear() {
    for (const key of Object.keys(this.Internal.items)) {
      this.Html.removeMenuEntry(key);
    }
  }

  /**
   * Close the menu programmatically.
   */
  close() {
    this.Internal.closeMenu();
  }

  /**
   * Enable menu
   */
  enable() {
    this.disabled = false;
  }

  /**
   * Disable menu
   */
  disable() {
    this.disabled = true;
  }

  /**
   * @return {Array} Returns default items
   */
  getDefaultItems() {
    return DEFAULT_ITEMS;
  }

  /**
   * @return {Number} Returns how many items
   */
  countItems() {
    return Object.keys(this.Internal.items).length;
  }

  /**
   * Add items to the menu. This pushes each item in the provided array
   * to the end of the menu.
   * @param {Array} arr Array.
   */
  extend(arr: ContextMenuItem[]) {
    assert(Array.isArray(arr), "@param `arr` should be an Array.");
    arr.forEach(this.push, this);
  }

  isOpen() {
    return this.Internal.opened;
  }

  /**
   * Update the menu's position.
   */
  updatePosition(pixel: number[]) {
    assert(Array.isArray(pixel), "@param `pixel` should be an Array.");

    if (this.isOpen()) {
      this.Internal.positionContainer(pixel);
    }
  }

  /**
   * Remove the last item of the menu.
   */
  pop() {
    const keys = Object.keys(this.Internal.items);
    this.Html.removeMenuEntry(keys[keys.length - 1]);
  }

  /**
   * Insert the provided item at the end of the menu.
   * @param {Object|String} item Item.
   */
  push(item: ContextMenuItem | string) {
    // assert(isDefAndNotNull(item), '@param `item` must be informed.');
    this.Html.addMenuEntry(item as ContextMenuItem);
  }

  /**
   * Remove the first item of the menu.
   */
  shift() {
    this.Html.removeMenuEntry(Object.keys(this.Internal.items)[0]);
  }

  /**
   * Not supposed to be used on app.
   */

  setMap(map: import("ol").Map) {
    Control.prototype.setMap.call(this, map);

    if (map) {
      // let's start since now we have the map
      this.Internal.init(map);
    } else {
      // I'm removed from the map - remove listeners
      this.Internal.removeListeners();
    }
  }
}
