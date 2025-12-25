import { CSS_VARS, EVENT_TYPE } from "./constants";
import {
  find,
  addClass,
  removeClass,
  getViewportSize,
  offset
} from "./helpers/dom";
import { Map, MapEvent } from "ol";
import { Coordinate } from "ol/coordinate";
import { Pixel } from "ol/pixel";

/**
 * @class Internal
 */
export class Internal {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Base: any;
  map: Map | undefined;
  viewport: HTMLElement | undefined;
  coordinateClicked: Coordinate | undefined;
  pixelClicked: Pixel | undefined;
  lineHeight: number;
  items: Record<string, import("../types").ContextMenuInternalItem>;
  opened: boolean;
  submenu: { left: string; top: string; lastLeft: string; lastTop: string };
  eventHandler: (evt: Event) => void;
  eventMapMoveHandler: (evt: MapEvent) => void;

  /**
   * @constructor
   * @param {Function} base Base class.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(base: any) {
    /**
     * @type {ol.control.Control}
     */
    this.Base = base;
    /**
     * @type {ol.Map}
     */
    this.map = undefined;
    /**
     * @type {Element}
     */
    this.viewport = undefined;
    /**
     * @type {ol.Coordinate}
     */
    this.coordinateClicked = undefined;
    /**
     * @type {ol.Pixel}
     */
    this.pixelClicked = undefined;
    /**
     * @type {Number}
     */
    this.lineHeight = 0;
    /**
     * @type {Object}
     */
    this.items = {};
    /**
     * @type {Boolean}
     */
    this.opened = false;
    /**
     * @type {Object}
     */
    this.submenu = {
      left: `${base.options.width - 15}px`,
      lastLeft: "", // string + px
      top: "0px",
      lastTop: ""
    };
    /**
     * @type {Function}
     */
    this.eventHandler = this.handleEvent.bind(this) as unknown as (
      evt: Event
    ) => void;
    /**
     * @type {Function}
     */
    this.eventMapMoveHandler = this.handleMapMoveEvent.bind(this);

    return this;
  }

  init(map: import("ol").Map) {
    this.map = map;
    this.viewport = map.getViewport();
    this.setListeners();
    this.Base.Html.createMenu();

    this.lineHeight =
      this.getItemsLength() > 0
        ? this.Base.container.offsetHeight / this.getItemsLength()
        : this.Base.Html.cloneAndGetLineHeight();
  }

  getItemsLength() {
    let count = 0;
    Object.keys(this.items).forEach(k => {
      if (this.items[k].submenu || this.items[k].separator) return;
      count++;
    });
    return count;
  }

  getPixelClicked() {
    return this.pixelClicked;
  }

  getCoordinateClicked() {
    return this.coordinateClicked;
  }

  positionContainer(pixel: import("ol/pixel").Pixel) {
    const container = this.Base.container as HTMLElement;
    const mapSize = this.map!.getSize();
    if (!mapSize) return;
    // how much (width) space left over
    const space_left_h = mapSize[1] - pixel[1];
    // how much (height) space left over
    const space_left_w = mapSize[0] - pixel[0];

    const menuSize = {
      w: container.offsetWidth,
      // a cheap way to recalculate container height
      // since offsetHeight is like cached
      h: Math.round(this.lineHeight * this.getItemsLength())
    };
    // submenus
    const subs = find(
      `li.${CSS_VARS.submenu}>div`,
      container,
      true
    ) as HTMLElement[];

    if (space_left_w >= menuSize.w) {
      container.style.right = "auto";
      container.style.left = `${pixel[0] + 5}px`;
    } else {
      container.style.left = "auto";
      container.style.right = "15px";
    }
    // set top or bottom
    if (space_left_h >= menuSize.h) {
      container.style.bottom = "auto";
      container.style.top = `${pixel[1] - 10}px`;
    } else {
      container.style.top = "auto";
      container.style.bottom = "0px";
    }

    removeClass(container, CSS_VARS.hidden, null);

    if (subs.length) {
      if (space_left_w < menuSize.w * 2) {
        // no space (at right) for submenu
        // position them at left
        this.submenu.lastLeft = `-${menuSize.w}px`;
      } else {
        this.submenu.lastLeft = this.submenu.left;
      }
      subs.forEach((sub: HTMLElement) => {
        // is there enough space for submenu height?
        const viewport = getViewportSize();
        const sub_offset = offset(sub);
        const sub_height = sub_offset.height;
        let sub_top = space_left_h - sub_height;

        if (sub_top < 0) {
          sub_top = sub_height - (viewport.h - sub_offset.top);
          sub.style.top = `-${sub_top}px`;
        }
        sub.style.left = this.submenu.lastLeft;
      });
    }
  }

  openMenu(
    pixel: import("ol/pixel").Pixel,
    coordinate: import("ol/coordinate").Coordinate
  ) {
    this.Base.dispatchEvent({
      type: EVENT_TYPE.OPEN,
      pixel,
      coordinate
    });
    this.opened = true;
    this.positionContainer(pixel);
  }

  closeMenu() {
    this.opened = false;
    addClass(this.Base.container, CSS_VARS.hidden, null);
    this.Base.dispatchEvent({
      type: EVENT_TYPE.CLOSE
    });
  }

  setListeners() {
    this.viewport!.addEventListener(
      this.Base.options.eventType,
      this.eventHandler,
      false
    );

    if (this.map) this.map.on("movestart", this.eventMapMoveHandler);
  }

  removeListeners() {
    this.viewport!.removeEventListener(
      this.Base.options.eventType,
      this.eventHandler,

      false
    );

    if (this.map) this.map.un("movestart", this.eventMapMoveHandler);
  }

  handleEvent(evt: Event) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const this_ = this;
    if (!this.map) return;

    this.coordinateClicked = this.map.getEventCoordinate(evt as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    this.pixelClicked = this.map.getEventPixel(evt as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    this.Base.dispatchEvent({
      type: EVENT_TYPE.BEFOREOPEN,
      pixel: this.pixelClicked,
      coordinate: this.coordinateClicked
    });

    if (this.Base.disabled) return;

    if (this.Base.options.eventType === EVENT_TYPE.CONTEXTMENU) {
      // don't be intrusive with other event types
      evt.stopPropagation();
      evt.preventDefault();
    }

    this.openMenu(this.pixelClicked, this.coordinateClicked);

    //one-time fire
    if (evt.target)
      evt.target.addEventListener(
        "pointerdown",
        {
          handleEvent: (e: Event) => {
            if (this_.opened) {
              this_.closeMenu();
              e.stopPropagation();
              if (evt.target)
                evt.target.removeEventListener(e.type, this, false);
            }
          }
        },
        false
      );
  }

  handleMapMoveEvent(_evt: import("ol").MapEvent) {
    this.closeMenu();
  }

  setItemListener(li: HTMLElement, index: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const this_ = this;
    if (li && typeof this.items[index].callback === "function") {
      (function (callback) {
        li.addEventListener(
          "click",
          (evt: Event) => {
            evt.preventDefault();
            const obj = {
              coordinate: this_.getCoordinateClicked()!,
              data: this_.items[index].data || null
            };
            this_.closeMenu();
            callback(obj, this_.map);
          },
          false
        );
      })(this.items[index].callback);
    }
  }
}
