import { Control, Rotate, Zoom as BaseZoom } from "ol/control";
import { CLASS_UNSELECTABLE, CLASS_CONTROL } from "ol/css";
import { MapEvent } from "ol";
import pointer from "./pointer_images";
import { createElement, MaplatApp } from "@maplat/core";
import * as bsn from "bootstrap.native";
import { getIcon } from "./icons";

export let control_settings: any = {};
const delegator: { [key: string]: string } = {
  compass: "compass.png",
  border: "border.png",
  attr: "attr.png",
  gps: "gps.png",
  zoom_plus: "plus.png",
  zoom_minus: "minus.png",
  help: "help.png",
  home: "home.png",
  hide_marker: "hide_marker.png",
  marker_list: "marker_list.png",
  share: "share.png",
  slider_in_help: "slider.png",
  favicon: "favicon.png"
};

function hexRgb(hex: any) {
  const ret: any = {};
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

export function setControlSettings(options: any) {
  control_settings = options;
  Object.keys(control_settings).forEach(key => {
    if (delegator[key]) {
      (pointer as any)[delegator[key]] = control_settings[key];
    }
  });
}

export class SliderNew extends Control {
  constructor(opt_options: any) {
    const options = opt_options ? opt_options : {};
    const containerElement = document.createElement("input");
    containerElement.type = "range";
    containerElement.min = "0";
    containerElement.max = "1";
    containerElement.max = "1";
    const initialValue = options.initialValue || 0;
    containerElement.value = `${1 - initialValue}`;
    containerElement.step = "0.01";
    const render = options.render ? options.render : function (mapEvent: any) { if (!mapEvent.frameState) return; };
    super({
      element: containerElement,
      render
    });
    const className =
      options.className !== undefined ? options.className : "ol-slidernew";
    this.set("slidervalue", initialValue);

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

    containerElement.addEventListener("input", _ev => {
      this.set("slidervalue", 1 - parseFloat((this.element as HTMLInputElement).value));
    });

    if (control_settings["slider_color"]) {
      const rgb = hexRgb(control_settings["slider_color"]);
      containerElement.classList.add("ol-slider-originalcolor");
      const sheets = document.styleSheets;
      const sheet = sheets[sheets.length - 1] as CSSStyleSheet;
      try {
        sheet.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${className}::-webkit-slider-thumb {
          background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.5);
        }`, sheet.cssRules.length);

        sheet.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${className}::-moz-range-thumb {
          background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.5);
        }`, sheet.cssRules.length);

        sheet.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${className}[disabled]::-webkit-slider-thumb {
          background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.2);
        }`, sheet.cssRules.length);

        sheet.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${className}[disabled]::-moz-range-thumb {
          background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.2);
        }`, sheet.cssRules.length);

        sheet.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${className}:not([disabled])::-webkit-slider-thumb:hover {
          background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.7);
        }`, sheet.cssRules.length);

        sheet.insertRule(`.maplat.with-opacity .ol-slider-originalcolor.${className}:not([disabled])::-moz-range-thumb:hover {
          background: rgba(${rgb.red},${rgb.green},${rgb.blue}, 0.7);
        }`, sheet.cssRules.length);
      } catch (e) {
        console.error(e);
      }
    }
  }

  setMap(map: any) {
    super.setMap(map);
    if (map) {
      map.render();
    }
  }

  setEnable(cond: any) {
    const elem = this.element as HTMLInputElement;
    if (cond) {
      elem.disabled = false;
    } else {
      elem.disabled = true;
    }
  }

  setValue(res: any) {
    this.set("slidervalue", res);
    (this.element as HTMLInputElement).value = (1 - res).toString();
  }
}

export class CustomControl extends Control {
  center_: any;
  zoom_: any;
  callResetNorth_: any;
  rotation_: any;
  label_: any;
  ui: any;
  moveTo_: boolean = false;

  constructor(optOptions: any) {
    const options = optOptions || {};
    const element = document.createElement("div");

    super({
      element,
      target: options.target,
      render: options.render
    });

    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.title = options.tipLabel;
    const span = document.createElement("span");
    span.innerHTML = options.character;
    button.appendChild(span);
    let timer: any;
    let touchstart: any;
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
              clearTimeout(timer);
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
            clearTimeout(timer);
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
          clearTimeout(timer);
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
  constructor(optOptions: any) {
    const options = optOptions || {};
    options.character = control_settings["home"]
      ? `<img src="${control_settings["home"]}">`
      : getIcon('house', 'far fa-lg');
    options.cls = "home";
    options.callback = function () {
      const map = this.getMap();
      if (map) {
        const source = map.getLayers().item(0).getSource();
        if (source && (source as any).goHome) {
          (source as any).goHome();
        }
      }
    };
    super(options);
    if (control_settings["home"]) {
      const button = this.element.querySelector("button");
      if (button) button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class SetGPS extends CustomControl {
  constructor(optOptions: any) {
    const options = optOptions || {};
    options.character = control_settings["gps"]
      ? `<img src="${control_settings["gps"]}">`
      : getIcon('location-crosshairs', 'far fa-lg');
    options.cls = "gps";
    options.render = function (mapEvent: any) {
      const frameState = mapEvent.frameState;
      if (!frameState) {
        return;
      }
      const self = this as any; // Cast to access ui
      const core = self.ui.core as MaplatApp;
      if (core && core.getGPSEnabled) {
        const enabled = core.getGPSEnabled();
        const isDisabled = self.element.classList.contains("disable");

        if (enabled && isDisabled) {
          self.element.classList.remove("disable");
        } else if (!enabled && !isDisabled) {
          self.element.classList.add("disable");
        }
      }
    };
    options.callback = function () {
      const self = this as any;
      const core = self.ui.core as MaplatApp;
      const currentlyEnabled = core.getGPSEnabled();
      if (core.alwaysGpsOn) {
        core.handleGPS(true);
      } else {
        core.handleGPS(!currentlyEnabled);
      }
    };

    super(options);

    this.ui = options.ui;
    this.moveTo_ = false;

    if (this.ui && this.ui.core) {
      this.ui.core.addEventListener("gps_error", (evt: any) => {
        console.log("GPS Error:", evt);
        const errorMap: any = {
          "user_gps_deny": "app.user_gps_deny",
          "gps_miss": "app.gps_miss",
          "gps_timeout": "app.gps_timeout"
        };

        this.ui.core.mapDivDocument.querySelector(".modal_title").innerText = this.ui.core.t("app.gps_error");
        this.ui.core.mapDivDocument.querySelector(".modal_gpsD_content").innerText = this.ui.core.t(errorMap[evt.detail] || "app.gps_error");
        const modalElm = this.ui.core.mapDivDocument.querySelector(".modalBase")!;
        const modal = new bsn.Modal(modalElm, { root: this.ui.core.mapDivDocument });
        this.ui.modalSetting("gpsD");
        modal.show();
      });

      this.ui.core.addEventListener("gps_result", (evt: any) => {
        console.log("GPS Result:", evt);
        if (evt.detail && evt.detail.error) {
          const errorMap: any = {
            "user_gps_deny": "app.user_gps_deny",
            "gps_miss": "app.gps_miss",
            "gps_timeout": "app.gps_timeout",
            "gps_off": "app.out_of_map"
          };


          this.ui.core.mapDivDocument.querySelector(".modal_title").innerText = this.ui.core.t("app.gps_error");
          this.ui.core.mapDivDocument.querySelector(".modal_gpsD_content").innerText = this.ui.core.t(errorMap[evt.detail.error] || "app.gps_error");
          const modalElm = this.ui.core.mapDivDocument.querySelector(".modalBase")!;
          const modal = new bsn.Modal(modalElm, { root: this.ui.core.mapDivDocument });
          this.ui.modalSetting("gpsD");
          modal.show();
        }
      });
    }

    if (control_settings["gps"]) {
      const button = this.element.querySelector("button");
      if (button) button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class CompassRotate extends Rotate {
  center_: any;
  zoom_: any;
  customLabel_: any;

  constructor(optOptions: any) {
    const options = optOptions || {};
    options.autoHide = false;
    const span = document.createElement("span");
    span.innerHTML = control_settings["compass"]
      ? `<img src="${control_settings["compass"]}">`
      : getIcon('compass', 'far fa-lg ol-compass-fa');
    options.label = span;
    options.render = function (mapEvent: any) {
      const frameState = mapEvent.frameState;
      if (!frameState) {
        return;
      }
      const self = this as any; // Cast for custom properties
      const view = self.getMap().getView();
      const rotation = frameState.viewState.rotation;
      const center = view.getCenter();
      const zoom = view.getDecimalZoom();
      if (
        rotation != self.rotation_ ||
        center[0] != self.center_[0] ||
        center[1] != self.center_[1] ||
        zoom != self.zoom_
      ) {
        if (!self.getMap().northUp) {
          const contains = self.element.classList.contains("disable");
          if (!contains && rotation === 0) {
            self.element.classList.add("disable");
          } else if (contains && rotation !== 0) {
            self.element.classList.remove("disable");
          }
        }

        const layer = self.getMap().getLayers().item(0);
        const source = layer.getSource
          ? layer.getSource()
          : layer.getLayers().item(0).getSource();
        if (!source) {
          const transform = "rotate(0rad)";
          self.customLabel_.style.msTransform = transform;
          self.customLabel_.style.webkitTransform = transform;
          self.customLabel_.style.transform = transform;
          return;
        }
        if ((source as any).viewpoint2MercsAsync) {
          (source as any).viewpoint2MercsAsync().then((mercs: any) => {
            const direction = (source as any).mercs2MercViewpoint(mercs)[2];
            const transform = `rotate(${direction}rad)`;
            self.customLabel_.style.msTransform = transform;
            self.customLabel_.style.webkitTransform = transform;
            self.customLabel_.style.transform = transform;
            if (self.getMap().northUp) {
              const contains = self.element.classList.contains("disable");
              if (!contains && Math.abs(direction) < 0.1) {
                self.element.classList.add("disable");
              } else if (contains && Math.abs(direction) >= 0.1) {
                self.element.classList.remove("disable");
              }
            }
          });
        }
      }
      self.rotation_ = rotation;
      self.center_ = center;
      self.zoom_ = zoom;
    }
    super(options);
    this.customLabel_ = span;
  }
}

export class Share extends CustomControl {
  constructor(optOptions: any) {
    const options = optOptions || {};
    options.character = control_settings["share"]
      ? `<img src="${control_settings["share"]}">`
      : getIcon('share-from-square', 'far fa-lg');
    options.cls = "ol-share";
    options.callback = function () {
      const map = this.getMap();
      if (map) map.dispatchEvent(
        new MapEvent("click_control", map, { control: "share" } as any)
      );
    };

    super(options);
    if (control_settings["share"]) {
      const button = this.element.querySelector("button");
      if (button) button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class Border extends CustomControl {
  constructor(optOptions: any) {
    const options = optOptions || {};
    options.character = control_settings["border"]
      ? `<img src="${control_settings["border"]}">`
      : getIcon('layer-group', 'far fa-lg');
    options.cls = "ol-border";
    options.callback = function () {
      const map = this.getMap();
      if (map) map.dispatchEvent(
        new MapEvent("click_control", map, { control: "border" } as any)
      );
    };

    super(options);
    if (control_settings["border"]) {
      const button = this.element.querySelector("button");
      if (button) button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class Maplat extends CustomControl {
  constructor(optOptions: any) {
    const options = optOptions || {};
    options.character = control_settings["help"]
      ? `<img src="${control_settings["help"]}">`
      : getIcon('circle-question', 'far fa-lg');
    options.cls = "ol-maplat";
    options.callback = function () {
      const map = this.getMap();
      if (map) map.dispatchEvent(
        new MapEvent("click_control", map, { control: "help" } as any)
      );
    };

    super(options);
    if (control_settings["help"]) {
      const button = this.element.querySelector("button");
      if (button) button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class Copyright extends CustomControl {
  constructor(optOptions: any) {
    const options = optOptions || {};
    options.character = control_settings["attr"]
      ? `<img src="${control_settings["attr"]}">`
      : getIcon('circle-info', 'far fa-lg');
    options.cls = "ol-copyright";
    options.callback = function () {
      const map = this.getMap();
      if (map) map.dispatchEvent(
        new MapEvent("click_control", map, { control: "copyright" } as any)
      );
    };

    super(options);
    if (control_settings["attr"]) {
      const button = this.element.querySelector("button");
      if (button) button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class HideMarker extends CustomControl {
  constructor(optOptions: any) {
    const options = optOptions || {};
    options.character = control_settings["hide_marker"]
      ? `<img src="${control_settings["hide_marker"]}">`
      : getIcon('map-pin', 'far fa-lg');
    options.cls = "ol-hide-marker";
    options.callback = function () {
      const map = this.getMap();
      if (map) map.dispatchEvent(
        new MapEvent("click_control", map, { control: "hideMarker" } as any)
      );
    };

    super(options);
    if (control_settings["hide_marker"]) {
      const button = this.element.querySelector("button");
      if (button) button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class MarkerList extends CustomControl {
  constructor(optOptions: any) {
    const options = optOptions || {};
    options.character = control_settings["marker_list"]
      ? `<img src="${control_settings["marker_list"]}">`
      : getIcon('list', 'far fa-lg');
    options.cls = "ol-marker-list";
    options.callback = function () {
      const map = this.getMap();
      if (map) map.dispatchEvent(
        new MapEvent("click_control", map, { control: "markerList" } as any)
      );
    };

    super(options);
    if (control_settings["marker_list"]) {
      const button = this.element.querySelector("button");
      if (button) button.style.backgroundColor = "rgba(0,0,0,0)";
    }
  }
}

export class Zoom extends BaseZoom {
  constructor(options: any = {}) {
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
