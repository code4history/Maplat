import { Control, Rotate } from "ol5/control";
import { CLASS_UNSELECTABLE, CLASS_CONTROL } from "ol5/css";
import PointerEventHandler from "ol5/pointer/PointerEventHandler";
import { listen } from "ol5/events";
import EventType from "ol5/pointer/EventType";
import { stopPropagation } from "ol5/events/Event";
import ViewHint from "ol5/ViewHint";
import { clamp } from "ol5/math";
import { MapEvent } from "ol5";
import { addResizeListener } from "../legacy/detect-element-resize";

/**
 * @classdesc
 * A slider type of control for zooming.
 *
 * Example:
 *
 *     map.addControl(new ol.control.SliderCommon());
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.SliderCommonOptions=} opt_options Zoom slider options.
 * @api
 */
export class SliderCommon extends Control {
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};
    const containerElement = document.createElement("div"); // eslint-disable-line no-undef
    const render = options.render ? options.render : SliderCommon.render;

    super({
      element: containerElement,
      render
    });

    /**
     * The direction of the slider. Will be determined from actual display of the
     * container and defaults to ol.control.SliderCommon.Direction_.VERTICAL.
     *
     * @type {ol.control.SliderCommon.Direction_}
     * @private
     */
    this.direction_ = SliderCommon.Direction_.VERTICAL;

    /**
     * @type {boolean}
     * @private
     */
    this.dragging_ = undefined;

    this.value_ = undefined;

    /**
     * @type {number|undefined}
     * @private
     */
    this.previousX_ = undefined;

    /**
     * @type {number|undefined}
     * @private
     */
    this.previousY_ = undefined;

    /**
     * The calculated thumb size (border box plus margins).  Set when initSlider_
     * is called.
     * @type {ol.Size}
     * @private
     */
    this.thumbSize_ = null;

    /**
     * Whether the slider is initialized.
     * @type {boolean}
     * @private
     */
    this.sliderInitialized_ = false;

    /**
     * @type {number}
     * @private
     */
    this.duration_ = options.duration !== undefined ? options.duration : 200;

    /**
     * @type {number}
     * @private
     */
    this.reverse_ = options.reverse !== undefined ? options.reverse : false;

    this.initialValue = options.initialValue;

    const className =
      options.className !== undefined ? options.className : "ol-slidercommon";
    const thumbElement = document.createElement("button"); // eslint-disable-line no-undef
    thumbElement.setAttribute("type", "button");
    thumbElement.className = `${className}-thumb${CLASS_UNSELECTABLE}`;

    containerElement.title = options.tipLabel;
    containerElement.className = `${className} ${CLASS_UNSELECTABLE} ${CLASS_CONTROL}`;
    containerElement.appendChild(thumbElement);

    /**
     * @type {ol.pointer.PointerEventHandler}
     * @private
     */
    this.dragger_ = new PointerEventHandler(containerElement);

    listen(
      this.dragger_,
      EventType.POINTERDOWN,
      this.handleDraggerStart_,
      this
    );
    listen(this.dragger_, EventType.POINTERMOVE, this.handleDraggerDrag_, this);
    listen(this.dragger_, EventType.POINTERUP, this.handleDraggerEnd_, this);

    listen(thumbElement, EventType.CLICK, stopPropagation);

    listen(this.element, EventType.MOUSEOUT, this.handleDraggerEnd_, this);
  }

  /**
   * Update the SliderCommon element.
   * @param {ol.MapEvent} mapEvent Map event.
   * @this {ol.control.SliderCommon}
   * @api
   */
  static render(mapEvent) {
    if (!mapEvent.frameState) {
      return;
    }
    if (!this.sliderInitialized_) {
      this.initSlider_();
    }
  }

  /**
   * The enum for available directions.
   *
   * @enum {number}
   * @private
   */
  static get Direction_() {
    return {
      VERTICAL: 0,
      HORIZONTAL: 1
    };
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.dragger_.dispose();
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  setMap(map) {
    super.setMap(map);
    if (map) {
      map.render();
    }
  }

  /**
   * Initializes the slider element. This will determine and set this controls
   * direction_ and also constrain the dragging of the thumb to always be within
   * the bounds of the container.
   *
   * @private
   */
  initSlider_() {
    const container = this.element;
    const containerSize = {
      width: container.offsetWidth,
      height: container.offsetHeight
    };

    const thumb = container.firstElementChild;
    const computedStyle = getComputedStyle(thumb); // eslint-disable-line no-undef
    const thumbWidth =
      thumb.offsetWidth +
      parseFloat(computedStyle["marginRight"]) +
      parseFloat(computedStyle["marginLeft"]);
    const thumbHeight =
      thumb.offsetHeight +
      parseFloat(computedStyle["marginTop"]) +
      parseFloat(computedStyle["marginBottom"]);
    this.thumbSize_ = [thumbWidth, thumbHeight];

    if (containerSize.width > containerSize.height) {
      this.direction_ = SliderCommon.Direction_.HORIZONTAL;
    } else {
      this.direction_ = SliderCommon.Direction_.VERTICAL;
    }
    this.setValue(this.initialValue || 0);
    const self = this;
    addResizeListener(container, () => {
      self.setValue(self.value_);
    });

    this.sliderInitialized_ = true;
  }

  widthLimit_(_event) {
    const container = this.element;
    return container.offsetWidth - this.thumbSize_[0];
  }

  heightLimit_(_event) {
    const container = this.element;
    return container.offsetHeight - this.thumbSize_[1];
  }

  /**
   * @param {Event} event The browser event to handle.
   * @private
   */
  handleContainerClick_(event) {
    const relativePosition = this.getRelativePosition_(
      event.offsetX - this.thumbSize_[0] / 2,
      event.offsetY - this.thumbSize_[1] / 2
    );

    this.setThumbPosition_(relativePosition);
  }

  /**
   * Handle dragger start events.
   * @param {ol.pointer.PointerEvent} event The drag event.
   * @private
   */
  handleDraggerStart_(event) {
    if (
      !this.dragging_ &&
      event.originalEvent.target === this.element.firstElementChild &&
      !this.element.classList.contains("disable")
    ) {
      this.getMap().getView().setHint(ViewHint.INTERACTING, 1);
      this.previousX_ = event.clientX;
      this.previousY_ = event.clientY;
      this.dragging_ = true;
    }
  }

  /**
   * Handle dragger drag events.
   *
   * @param {ol.pointer.PointerEvent|Event} event The drag event.
   * @private
   */
  handleDraggerDrag_(event) {
    if (this.dragging_) {
      const element = this.element.firstElementChild;
      const deltaX =
        event.clientX -
        this.previousX_ +
        (parseFloat(element.style.left, 10) || 0);
      const deltaY =
        event.clientY -
        this.previousY_ +
        (parseFloat(element.style.top, 10) || 0);
      const relativePosition = this.getRelativePosition_(deltaX, deltaY);
      this.setThumbPosition_(relativePosition);
      this.previousX_ = event.clientX;
      this.previousY_ = event.clientY;
    }
  }

  /**
   * Handle dragger end events.
   * @param {ol.pointer.PointerEvent|Event} event The drag event.
   * @private
   */
  handleDraggerEnd_(_event) {
    if (this.dragging_) {
      const view = this.getMap().getView();
      view.setHint(ViewHint.INTERACTING, -1);

      this.dragging_ = false;
      this.previousX_ = undefined;
      this.previousY_ = undefined;
    }
  }

  /**
   * Positions the thumb inside its container according to the given resolution.
   *
   * @param {number} res The res.
   * @private
   */
  setThumbPosition_(res) {
    const thumb = this.element.firstElementChild;

    if (this.direction_ == SliderCommon.Direction_.HORIZONTAL) {
      thumb.style.left = `${this.widthLimit_() * res}px`;
    } else {
      thumb.style.top = `${this.heightLimit_() * res}px`;
    }
    this.value_ = this.reverse_ ? 1 - res : res;
    this.set("slidervalue", this.value_);
  }

  /**
   * Calculates the relative position of the thumb given x and y offsets.  The
   * relative position scales from 0 to 1.  The x and y offsets are assumed to be
   * in pixel units within the dragger limits.
   *
   * @param {number} x Pixel position relative to the left of the slider.
   * @param {number} y Pixel position relative to the top of the slider.
   * @return {number} The relative position of the thumb.
   * @private
   */
  getRelativePosition_(x, y) {
    let amount;
    if (this.direction_ === SliderCommon.Direction_.HORIZONTAL) {
      amount = x / this.widthLimit_();
    } else {
      amount = y / this.heightLimit_();
    }
    return clamp(amount, 0, 1);
  }

  setValue(res) {
    res = this.reverse_ ? 1 - res : res;
    this.setThumbPosition_(res);
  }

  setEnable(cond) {
    const elem = this.element;
    if (cond) {
      elem.classList.remove("disable");
    } else {
      elem.classList.add("disable");
    }
  }
}

export class CustomControl extends Control {
  constructor(optOptions) {
    const options = optOptions || {};
    const element = document.createElement("div"); // eslint-disable-line no-undef

    super({
      element,
      target: options.target,
      render: options.render
    });

    const button = document.createElement("button"); // eslint-disable-line no-undef
    button.setAttribute("type", "button");
    button.title = options.tipLabel;
    const span = document.createElement("span"); // eslint-disable-line no-undef
    span.innerHTML = options.character;
    button.appendChild(span);
    let timer;
    let touchstart;
    const self = this;

    button.addEventListener("click", e => {
      e.stopPropagation();
    });
    button.addEventListener(
      "mouseup",
      e => {
        if (!touchstart) {
          if (timer) {
            if (options.long_callback) {
              clearTimeout(timer); // eslint-disable-line no-undef
            }
            timer = null;
            options.callback.apply(self);
          }
        }
        e.stopPropagation();
      },
      false
    );
    button.addEventListener(
      "mousemove",
      e => {
        e.stopPropagation();
      },
      false
    );
    button.addEventListener(
      "mousedown",
      e => {
        if (!touchstart) {
          if (options.long_callback) {
            timer = setTimeout(() => {
              // eslint-disable-line no-undef
              timer = null;
              options.long_callback.apply(self);
            }, 1500);
          } else {
            timer = true;
          }
        }
        e.stopPropagation();
      },
      false
    );
    button.addEventListener(
      "touchstart",
      e => {
        touchstart = true;
        if (options.long_callback) {
          timer = setTimeout(() => {
            // eslint-disable-line no-undef
            timer = null;
            options.long_callback.apply(self);
          }, 1500);
        } else {
          timer = true;
        }
        e.stopPropagation();
      },
      false
    );
    button.addEventListener(
      "touchend",
      e => {
        if (timer) {
          if (options.long_callback) {
            clearTimeout(timer); // eslint-disable-line no-undef
          }
          timer = null;
          options.callback.apply(self);
        }
        e.stopPropagation();
      },
      false
    );
    button.addEventListener(
      "mouseout",
      e => {
        if (options.long_callback) {
          clearTimeout(timer); // eslint-disable-line no-undef
        }
        timer = null;
        e.stopPropagation();
      },
      false
    );
    button.addEventListener(
      "dblclick",
      e => {
        e.preventDefault();
      },
      false
    );

    element.className = `${options.cls} ol-unselectable ol-control`;
    element.appendChild(button);
  }
}

export class GoHome extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = '<i class="fa fa-home fa-lg"></i>';
    options.cls = "home";
    options.callback = function () {
      const source = this.getMap().getLayers().item(0).getSource();
      source.goHome();
    };
    super(options);
  }
}

export class SetGPS extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = '<i class="fa fa-crosshairs fa-lg"></i>';
    options.cls = "gps";
    options.render = function (mapEvent) {
      const frameState = mapEvent.frameState;
      if (!frameState) {
        return;
      }
      const map = this.getMap();
      if (map.geolocation) {
        const tracking = map.geolocation.getTracking();
        const receiving = this.element.classList.contains("disable");
        if (receiving && !tracking) {
          this.element.classList.remove("disable");
        } else if (!receiving && tracking) {
          this.element.classList.add("disable");
        }
      }
    };

    options.callback = function () {
      const receiving = this.element.classList.contains("disable");
      const map = this.getMap();

      map.handleGPS(!receiving);
      if (receiving) {
        this.element.classList.remove("disable");
      } else {
        this.element.classList.add("disable");
      }
    };

    super(options);
  }
}

export class CompassRotate extends Rotate {
  constructor(optOptions) {
    const options = optOptions || {};
    options.autoHide = false;
    const span = document.createElement("span"); // eslint-disable-line no-undef
    span.innerHTML = '<i class="fa fa-compass fa-lg ol-compass-fa"></i>';
    options.label = span;
    options.render = function (mapEvent) {
      const frameState = mapEvent.frameState;
      if (!frameState) {
        return;
      }
      const view = this.getMap().getView();
      const rotation = frameState.viewState.rotation;
      const center = view.getCenter();
      const zoom = view.getDecimalZoom();
      if (
        rotation != this.rotation_ ||
        center[0] != this.center_[0] ||
        center[1] != this.center_[1] ||
        zoom != this.zoom_
      ) {
        const contains = this.element.classList.contains("disable");
        if (!contains && rotation === 0) {
          this.element.classList.add("disable");
        } else if (contains && rotation !== 0) {
          this.element.classList.remove("disable");
        }
        const self = this;
        const layer = this.getMap().getLayers().item(0);
        const source = layer.getSource
          ? layer.getSource()
          : layer.getLayers().item(0).getSource();
        if (!source) {
          const transform = "rotate(0rad)";
          self.label_.style.msTransform = transform;
          self.label_.style.webkitTransform = transform;
          self.label_.style.transform = transform;
          return;
        }
        source.size2MercsAsync().then(mercs => {
          const rot = source.mercs2MercRotation(mercs);
          const transform = `rotate(${rot}rad)`;
          self.label_.style.msTransform = transform;
          self.label_.style.webkitTransform = transform;
          self.label_.style.transform = transform;
        });
      }
      this.rotation_ = rotation;
      this.center_ = center;
      this.zoom_ = zoom;
    };
    super(options);
    this.center_ = [];
    this.zoom_ = undefined;
  }
}

export class Share extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = '<i class="fa fa-share-alt-square fa-lg"></i>';
    options.cls = "ol-share";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "share" })
      );
    };

    super(options);
  }
}

export class Border extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = '<i class="fa fa-clone fa-lg"></i>';
    options.cls = "ol-border";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "border" })
      );
    };

    super(options);
  }
}

export class Maplat extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = '<i class="fa fa-question-circle fa-lg"></i>';
    options.cls = "ol-maplat";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "help" })
      );
    };

    super(options);
  }
}

export class Copyright extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = '<i class="fa fa-info-circle fa-lg"></i>';
    options.cls = "ol-copyright";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "copyright" })
      );
    };

    super(options);
  }
}

export class HideMarker extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = '<i class="fa fa-map-marker fa-lg"></i>';
    options.cls = "ol-hide-marker";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "hideMarker" })
      );
    };
    options.long_callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "hideLayer" })
      );
    };

    super(options);
  }
}
