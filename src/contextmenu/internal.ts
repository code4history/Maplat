import { CSS_VARS, EVENT_TYPE } from './constants';
import {
  find,
  addClass,
  removeClass,
  getViewportSize,
  offset,
} from './helpers/dom';

/**
 * @class Internal
 */
export class Internal {
  Base: any;
  map: any;
  viewport: any;
  coordinateClicked: any;
  pixelClicked: any;
  lineHeight: number;
  items: any;
  opened: boolean;
  submenu: any;
  eventHandler: any;
  eventMapMoveHandler: any;

  /**
   * @constructor
   * @param {Function} base Base class.
   */
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
      lastLeft: '', // string + px
    };
    /**
     * @type {Function}
     */
    this.eventHandler = this.handleEvent.bind(this);
    /**
     * @type {Function}
     */
    this.eventMapMoveHandler = this.handleMapMoveEvent.bind(this);
    return this;
  }

  init(map: any) {
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

  positionContainer(pixel: any) {
    const container = this.Base.container;
    const mapSize = this.map.getSize();
    // how much (width) space left over
    const space_left_h = mapSize[1] - pixel[1];
    // how much (height) space left over
    const space_left_w = mapSize[0] - pixel[0];

    const menuSize = {
      w: container.offsetWidth,
      // a cheap way to recalculate container height
      // since offsetHeight is like cached
      h: Math.round(this.lineHeight * this.getItemsLength()),
    };
    // submenus
    const subs = find(`li.${CSS_VARS.submenu}>div`, container, true);

    if (space_left_w >= menuSize.w) {
      container.style.right = 'auto';
      container.style.left = `${pixel[0] + 5}px`;
    } else {
      container.style.left = 'auto';
      container.style.right = '15px';
    }
    // set top or bottom
    if (space_left_h >= menuSize.h) {
      container.style.bottom = 'auto';
      container.style.top = `${pixel[1] - 10}px`;
    } else {
      container.style.top = 'auto';
      container.style.bottom = 0;
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
      subs.forEach((sub: any) => {
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

  openMenu(pixel: any, coordinate: any) {
    this.Base.dispatchEvent({
      type: EVENT_TYPE.OPEN,
      pixel,
      coordinate,
    });
    this.opened = true;
    this.positionContainer(pixel);
  }

  closeMenu() {
    this.opened = false;
    addClass(this.Base.container, CSS_VARS.hidden, null);
    this.Base.dispatchEvent({
      type: EVENT_TYPE.CLOSE,
    });
  }

  setListeners() {
    this.viewport.addEventListener(
      this.Base.options.eventType,
      this.eventHandler,
      false
    );

    this.map.on('movestart', this.eventMapMoveHandler);
  }

  removeListeners() {
    this.viewport.removeEventListener(
      this.Base.options.eventType,
      this.eventHandler,
      false
    );

    this.map.un('movestart', this.eventMapMoveHandler);
  }

  handleEvent(evt: any) {
    const this_ = this;

    this.coordinateClicked = this.map.getEventCoordinate(evt);
    this.pixelClicked = this.map.getEventPixel(evt);

    this.Base.dispatchEvent({
      type: EVENT_TYPE.BEFOREOPEN,
      pixel: this.pixelClicked,
      coordinate: this.coordinateClicked,
    });

    if (this.Base.disabled) return;

    if (this.Base.options.eventType === EVENT_TYPE.CONTEXTMENU) {
      // don't be intrusive with other event types
      evt.stopPropagation();
      evt.preventDefault();
    }

    this.openMenu(this.pixelClicked, this.coordinateClicked);

    //one-time fire
    evt.target.addEventListener(
      'pointerdown',
      {
        handleEvent: (e: any) => {
          if (this_.opened) {
            this_.closeMenu();
            e.stopPropagation();
            evt.target.removeEventListener(e.type, this, false);
          }
        },
      },
      false
    );
  }

  handleMapMoveEvent(_evt: any) {
    this.closeMenu();
  }

  setItemListener(li: any, index: any) {
    const this_ = this;
    if (li && typeof this.items[index].callback === 'function') {
      (function (callback) {
        li.addEventListener(
          'click',
          (evt: any) => {
            evt.preventDefault();
            const obj = {
              coordinate: this_.getCoordinateClicked(),
              data: this_.items[index].data || null,
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
