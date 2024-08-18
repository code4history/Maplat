import { Control, Rotate, Zoom as BaseZoom } from "ol/control";
import { CLASS_UNSELECTABLE, CLASS_CONTROL } from "ol/css";
import { MapEvent } from "ol";
import pointer from "./pointer_images";
import { createElement } from "@maplat/core";
import bsn from "../legacy/bootstrap-native";

let control_settings = {};
const delegator = {
  compass: "compass.png",
  border: "border.png",
  attr: "attr.png",
  gps: "gps.png",
  zoom_plus: "plus.png",
  zoom_minus: "minus.png",
  help: "help.png",
  home: "home.png",
  hide_marker: "hide_marker.png",
  share: "share.png",
  slider_in_help: "slider.png",
  favicon: "favicon.png"
};

function hexRgb(hex) {
  const ret = {};
  if (hex.match(/^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i)) {
    ret.red = parseInt(RegExp.$1, 16);
    ret.green = parseInt(RegExp.$2, 16);
    ret.blue = parseInt(RegExp.$3, 16);
  } else if (hex.match(/^#?([0-9A-F])([0-9A-F])([0-9A-F])$/i)) {
    ret.red = parseInt(`${RegExp.$1}${RegExp.$1}`, 16);
    ret.green = parseInt(`${RegExp.$2}${RegExp.$2}`, 16);
    ret.blue = parseInt(`${RegExp.$3}${RegExp.$3}`, 16);
  }
  return ret;
}

export function setControlSettings(options) {
  control_settings = options;
  Object.keys(control_settings).forEach(key => {
    if (delegator[key]) {
      pointer[delegator[key]] = control_settings[key];
    }
  });
}

/**
 * @classdesc
 * A slider type of control for zooming.
 *
 * Example:
 *
 *     map.addControl(new ol.control.SliderNew());
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.SliderNewOptions=} opt_options Zoom slider options.
 * @api
 */
export class SliderNew extends Control {
  constructor(opt_options) { 
    const options = opt_options ? opt_options : {};
    const containerElement = document.createElement("input"); // eslint-disable-line no-undef
    containerElement.type = "range";
    containerElement.min = 0;
    containerElement.max = 1;
    containerElement.value = 1;
    containerElement.step = 0.01;
    const render = options.render ? options.render : SliderNew.render;
    super({
      element: containerElement,
      render
    });
    const className =
      options.className !== undefined ? options.className : "ol-slidernew";
    this.set("slidervalue", 0);

    containerElement.title = options.tipLabel;
    containerElement.className = `${className} ${CLASS_UNSELECTABLE} ${CLASS_CONTROL}`;
    containerElement.addEventListener("click", ev => {
      ev.stopPropagation();
    });
    containerElement.addEventListener("pointerdown", ev => {
      ev.stopPropagation();
    });
    containerElement.addEventListener("pointerup", ev => {
      ev.stopPropagation();
    });

    // eslint-disable-next-line no-unused-vars
    containerElement.addEventListener("input", ev => { 
      this.set("slidervalue", 1 - this.element.value);
    });

    if (control_settings["slider_color"]) {
      const rgb = hexRgb(control_settings["slider_color"]);
      containerElement.addClass("ol-slider-originalcolor");
      const sheets = document.styleSheets
      const sheet = sheets[sheets.length - 1];
      sheet.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${className}::-webkit-slider-thumb {
        background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.5);
      }

      .maplat.with-opacity .ol-slider-originalcolor.${className}::-moz-range-thumb {
        background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.5);
      }
        
      .maplat.with-opacity .ol-slider-originalcolor.${className}[disabled]::-webkit-slider-thumb {
        background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.2);
      }

      .maplat.with-opacity .ol-slider-originalcolor.${className}[disabled]::-moz-range-thumb {
        background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.2);
      }
         
      .maplat.with-opacity .ol-slider-originalcolor.${className}:not([disabled])::-webkit-slider-thumb:hover {
        background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.7);
      }

      .maplat.with-opacity .ol-slider-originalcolor.${className}:not([disabled])::-moz-range-thumb:hover {
        background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.7);
      }`, sheet.cssRules.length);
    }
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
   * Update the SliderCommon element.
   * @param {ol.MapEvent} mapEvent Map event.
   * @this {ol.control.SliderCommon}
   * @api
   */
  static render(mapEvent) {
    if (!mapEvent.frameState) {
      return;
    }
  }

  setEnable(cond) {
    const elem = this.element;
    if (cond) {
      elem.disabled = false;
    } else {
      elem.disabled = true;
    }
  }

  setValue(res) {
    this.set("slidervalue", res);
    this.element.value = 1 - res;
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
    options.character = control_settings["home"]
      ? `<img src="${control_settings["home"]}">`
      : '<i class="far fa-house fa-lg"></i>';
    options.cls = "home";
    options.callback = function () {
      const source = this.getMap().getLayers().item(0).getSource();
      source.goHome();
    };
    super(options);
    if (control_settings["home"]) {
      const button = this.element.querySelector("button");
      button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class SetGPS extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = control_settings["gps"]
      ? `<img src="${control_settings["gps"]}">`
      : '<i class="far fa-location-crosshairs fa-lg"></i>';
    options.cls = "gps";
    options.render = function (mapEvent) {
      const frameState = mapEvent.frameState;
      if (!frameState) {
        return;
      }
    };
    options.callback = function () {
      const ui = this.ui;
      const map = ui.core.mapObject;
      const overlayLayer = map.getLayer("overlay").getLayers().item(0);
      const firstLayer = map.getLayers().item(0);
      const source = (overlayLayer ? overlayLayer.getSource() : firstLayer.getSource());
      const geolocation = ui.geolocation;

      if (!geolocation.getTracking()) {
        geolocation.setTracking(true);
        geolocation.once("change", () => {
          const lnglat = geolocation.getPosition();
          const acc = geolocation.getAccuracy();
          if (!lnglat || !acc) return;
          source.setGPSMarker({ lnglat, acc }).then((insideCheck) => {
            if (!insideCheck) {
              source.setGPSMarker();
            }
          });
        });
      } else {
        const lnglat = geolocation.getPosition();
        const acc = geolocation.getAccuracy();
        if (!lnglat || !acc) return;
        source.setGPSMarkerAsync({ lnglat, acc }).then((insideCheck) => {
          if (!insideCheck) {
            source.setGPSMarker();
          }
        });
      }
    };

    super(options);
    
    this.ui = options.ui;
    this.moveTo_ = false;
    this.ui.waitReady.then(() => {
      const ui = this.ui;
      const geolocation = ui.geolocation;
      
      geolocation.on("change", () => {
        const map = ui.core.mapObject;
        const overlayLayer = map.getLayer("overlay").getLayers().item(0);
        const firstLayer = map.getLayers().item(0);
        const source = (overlayLayer ? overlayLayer.getSource() : firstLayer.getSource());
        const lnglat = geolocation.getPosition();
        const acc = geolocation.getAccuracy();
        if (!lnglat || !acc) return;
        source.setGPSMarkerAsync({ lnglat, acc }, !this.moveTo_).then((insideCheck) => {
          this.moveTo_ = false;
          if (!insideCheck) {
            source.setGPSMarker();
          }
        });
      });
      geolocation.on("error", (evt) => {
        const code = evt.code;
        if (code === 3) return;
        geolocation.setTracking(false);
        ui.core.mapDivDocument.querySelector(".modal_title").innerText = ui.core.t("app.gps_error");
        ui.core.mapDivDocument.querySelector(".modal_gpsD_content").innerText = ui.core.t(code === 1 ? "app.user_gps_deny" :
          code === 2 ? "app.gps_miss" : "app.gps_timeout");
        const modalElm = ui.core.mapDivDocument.querySelector(".modalBase");
        const modal = new bsn.Modal(modalElm, { root: ui.core.mapDivDocument });
        ui.modalSetting("gpsD");
        modal.show();
      });
      ui.core.addEventListener("mapChanged", () => {
        if (geolocation.getTracking()) {
          const map = ui.core.mapObject;
          const overlayLayer = map.getLayer("overlay").getLayers().item(0);
          const firstLayer = map.getLayers().item(0);
          const source = (overlayLayer ? overlayLayer.getSource() : firstLayer.getSource());
          const lnglat = geolocation.getPosition();
          const acc = geolocation.getAccuracy();
          if (!lnglat || !acc) return;
          source.setGPSMarkerAsync({ lnglat, acc }, true).then((insideCheck) => {
            if (!insideCheck) {
              source.setGPSMarker();
            }
          });
        }
      });
    });

    if (options.alwaysGpsOn) {
      this.alwaysGpsOn = true;
    }

    if (control_settings["gps"]) {
      const button = this.element.querySelector("button");
      button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class CompassRotate extends Rotate {
  constructor(optOptions) {
    const options = optOptions || {};
    options.autoHide = false;
    const span = document.createElement("span"); // eslint-disable-line no-undef
    span.innerHTML = control_settings["compass"]
      ? `<img src="${control_settings["compass"]}">`
      : '<i class="far fa-compass fa-lg ol-compass-fa"></i>';
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
        if (!this.getMap().northUp) {
          const contains = this.element.classList.contains("disable");
          if (!contains && rotation === 0) {
            this.element.classList.add("disable");
          } else if (contains && rotation !== 0) {
            this.element.classList.remove("disable");
          }
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
        source.viewpoint2MercsAsync().then(mercs => {
          const direction = source.mercs2MercViewpoint(mercs)[2];
          const transform = `rotate(${direction}rad)`;
          self.label_.style.msTransform = transform;
          self.label_.style.webkitTransform = transform;
          self.label_.style.transform = transform;
          if (this.getMap().northUp) {
            const contains = self.element.classList.contains("disable");
            if (!contains && Math.abs(direction) < 0.1) {
              self.element.classList.add("disable");
            } else if (contains && Math.abs(direction) >= 0.1) {
              self.element.classList.remove("disable");
            }
          }
        });
      }
      this.rotation_ = rotation;
      this.center_ = center;
      this.zoom_ = zoom;
    };
    super(options);
    if (control_settings["compass"]) {
      const button = this.element.querySelector("button");
      button.style.backgroundColor = "rgba(0,0,0,0)";
    }
    this.center_ = [];
    this.zoom_ = undefined;
    this.callResetNorth_ = () => {
      const layer = this.getMap().getLayers().item(0);
      const source = layer.getSource
        ? layer.getSource()
        : layer.getLayers().item(0).getSource();
      source.resetCirculation();
    };
  }
}

export class Share extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = control_settings["share"]
      ? `<img src="${control_settings["share"]}">`
      : '<i class="far fa-share-from-square fa-lg"></i>';
    options.cls = "ol-share";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "share" })
      );
    };

    super(options);
    if (control_settings["share"]) {
      const button = this.element.querySelector("button");
      button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class Border extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = control_settings["border"]
      ? `<img src="${control_settings["border"]}">`
      : '<i class="far fa-layer-group fa-lg"></i>';
    options.cls = "ol-border";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "border" })
      );
    };

    super(options);
    if (control_settings["border"]) {
      const button = this.element.querySelector("button");
      button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class Maplat extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = control_settings["help"]
      ? `<img src="${control_settings["help"]}">`
      : '<i class="far fa-circle-question fa-lg"></i>';
    options.cls = "ol-maplat";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "help" })
      );
    };

    super(options);
    if (control_settings["help"]) {
      const button = this.element.querySelector("button");
      button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class Copyright extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = control_settings["attr"]
      ? `<img src="${control_settings["attr"]}">`
      : '<i class="far fa-circle-info fa-lg"></i>';
    options.cls = "ol-copyright";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "copyright" })
      );
    };

    super(options);
    if (control_settings["attr"]) {
      const button = this.element.querySelector("button");
      button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class HideMarker extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = control_settings["hide_marker"]
      ? `<img src="${control_settings["hide_marker"]}">`
      : '<i class="far fa-map-pin fa-lg"></i>';
    options.cls = "ol-hide-marker";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "hideMarker" })
      );
    };

    super(options);
    if (control_settings["hide_marker"]) {
      const button = this.element.querySelector("button");
      button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class MarkerList extends CustomControl {
  constructor(optOptions) {
    const options = optOptions || {};
    options.character = control_settings["marker_list"]
      ? `<img src="${control_settings["marker_list"]}">`
      : '<i class="far fa-list fa-lg"></i>';
    options.cls = "ol-marker-list";
    options.callback = function () {
      const map = this.getMap();
      map.dispatchEvent(
        new MapEvent("click_control", map, { control: "hideLayer" })
      );
    };

    super(options);
    if (control_settings["marker_list"]) {
      const button = this.element.querySelector("button");
      button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class Zoom extends BaseZoom {
  constructor(options = {}) {
    if (control_settings["zoom_plus"]) {
      options.zoomInLabel = createElement(
        `<img src="${control_settings["zoom_plus"]}">`
      )[0];
    }
    if (control_settings["zoom_minus"]) {
      options.zoomOutLabel = createElement(
        `<img src="${control_settings["zoom_minus"]}">`
      )[0];
    }

    super(options);
    if (control_settings["compass"]) {
      const buttons = this.element.querySelectorAll("button");
      buttons.forEach(button => {
        button.style.backgroundColor = "rgba(0,0,0,0)";
      });
    }
  }
}
