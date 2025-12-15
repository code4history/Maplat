
import {
  MaplatApp as Core
} from "@maplat/core";
import "ol/ol.css";
import EventTarget from "ol/events/Target.js";
import { asArray } from 'ol/color';

import { Swiper } from "./swiper_ex";
// @ts-ignore
import { Navigation, Pagination } from "swiper";
import "swiper/swiper-bundle.css";
import page from "page";
import * as bsn from "bootstrap.native";
import "../less/ui.less";

import { uiInit } from "./ui_init";
import {
  handleMarkerAction,
  showContextMenu,
  xyToMapIDs,
  setHideMarker,
  checkOverlayID,
  handleMarkerActionById
} from "./ui_marker";
import {
  resolveRelativeLink,
  ellips
} from "./ui_utils";

Swiper.use([Navigation, Pagination]);


export class MaplatUi extends EventTarget {
  static createObject(option: any) {
    const app = new MaplatUi(option);
    return app.waitReady.then(() => app);
  }

  core?: Core;
  appOption: any;
  waitReady!: Promise<any>;
  waitReadyBridge: any;
  pathThatSet?: string;
  swipers: any = {};
  mobile_if: any;
  ui_func: any;
  datum: any;
  selected_layer: any;
  toms: any;
  cache_messages: any;
  last_toast: any;
  share_enable!: boolean;
  sliderNew: any;
  baseSwiper: any;
  overlaySwiper: any;
  sliderCommon: any;
  contextMenu: any;
  splashPromise!: Promise<any>;
  _selectCandidateSources?: any;
  appEnvelope?: boolean;
  restoring: boolean = false;
  poiSwiper: any;
  html!: string;
  enablePoiHtmlNoScroll: boolean = false;
  enableShare: boolean = false;
  enableHideMarker: boolean = false;
  enableBorder: boolean = false;
  enableMarkerList: boolean = false;
  disableNoimage: boolean = false;
  alwaysGpsOn: boolean = false;
  isTouch: boolean = false;
  html_id_seed: string;
  lastClickPixel: any;
  lastClickCoordinate: any;

  constructor(appOption: any) {
    super();
    const ui = this;
    this.html_id_seed = `${Math.floor(Math.random() * 9000) + 1000}`;
    this.appOption = appOption;

    if (appOption.stateUrl) {
      page((ctx: any, _next: any) => {
        let pathes = ctx.canonicalPath.split("#!");
        let path = pathes.length > 1 ? pathes[1] : pathes[0];
        console.log(`[Debug] Page callback.Canonical: ${ctx.canonicalPath}, Path: ${path} `);

        pathes = path.split("?");
        path = pathes[0];
        if (path === ui.pathThatSet) {
          delete ui.pathThatSet;
          return;
        }
        const restore: any = {
          transparency: 0,
          position: {
            rotation: 0
          }
        };
        // Parse "s:map/x:100/..."
        path.split("/").forEach((state: any) => {
          if (!state) return;
          const line = state.split(":");
          console.log(`[Debug] Parsing state: ${state} `, line);
          switch (line[0]) {
            case "s":
              restore.mapID = line[1];
              break;
            case "b":
              restore.backgroundID = line[1];
              break;
            case "t":
              restore.transparency = parseFloat(line[1]);
              break;
            case "r":
              restore.position.rotation = parseFloat(line[1]);
              break;
            case "z":
              restore.position.zoom = parseFloat(line[1]);
              break;
            case "x":
            case "y":
              restore.position[line[0]] = parseFloat(line[1]);
              break;
            case "sb":
              restore.showBorder = !!parseInt(line[1]);
              break;
            case "hm":
              restore.hideMarker = !!parseInt(line[1]);
              break;
            case "hl":
              restore.hideLayer = line[1];
              break;
            case "om":
              restore.openedMarker = line[1];
              break;
            case "c":
              if (ui.core) {
                const modalElm =
                  ui.core!.mapDivDocument!.querySelector(".modalBase")!;
                const modal = new bsn.Modal(modalElm, {
                  root: ui.core!.mapDivDocument!
                });
                modal.hide();
              }
              break;
          }
        });
        if (!ui.core) {
          if (restore.mapID) {
            console.log(`[Debug] Init with restore: `, JSON.parse(JSON.stringify(restore)));
            appOption.restore = restore;
            ui.restoring = true;
          }
          const preRot = restore.position ? restore.position.rotation : 'undefined';
          console.log(`[Debug] Before initializer: rotation = ${preRot} `);

          ui.initializer(appOption).then(() => {
            ui.core!.waitReady.then(() => {
              // Fix: Manually apply rotation as Core 0.11.1 preserves it but fails to apply it view-side
              // if (restore.position && restore.position.rotation !== undefined) {
              //   console.log(`[Debug] Manually applying rotation: ${ restore.position.rotation } `);
              //   ui.core!.mapObject.getView().setRotation(restore.position.rotation);
              // }
              // Fix: Verify transparency state before updating URL
              if (ui.sliderNew) {
                // Ensure map transparency matches restore if slider is ready
                const currentTrans = ui.sliderNew.get("slidervalue") * 100;
                console.log(`[Debug] Slider transparency: ${currentTrans} `);
              } else {
                console.log(`[Debug] Slider not ready yet`);
              }

              ui.restoring = false;
              console.log(`[Debug] Calling updateUrl from Init`);
              ui.updateUrl();
            });
          });
        } else if (restore.mapID) {
          console.log(`[Debug] ChangeMap with restore: `, JSON.parse(JSON.stringify(restore)));
          ui.restoring = true;

          ui.core!.waitReady.then(() => {
            const ret = ui.core!.changeMap(restore.mapID, restore);
            Promise.resolve(ret).then(() => {
              // Fix: Manually apply rotation after changeMap
              // if (restore.position && restore.position.rotation !== undefined) {
              //   console.log(`[Debug] Manually applying rotation after changeMap: ${ restore.position.rotation } `);
              //   ui.core!.mapObject.getView().setRotation(restore.position.rotation);
              // }

              // Update transparency slider if needed
              if (ui.sliderNew) {
                const t = restore.transparency || 0;
                const val = t / 100;
                ui.sliderNew.set("slidervalue", val);
                if (ui.sliderNew.element) {
                  ui.sliderNew.element.value = (1 - val).toString();
                }
              }

              ui.restoring = false;
              console.log(`[Debug] Calling updateUrl from ChangeMap`);
              ui.updateUrl();
            });
          });
        }
      });
      page({
        hashbang: true
      });
      page();
      ui.waitReady = new Promise((resolve, _reject) => {
        ui.waitReadyBridge = resolve;
      });
    } else {
      ui.waitReady = ui.initializer(appOption);
    }
  }

  async initializer(appOption: any) {
    return uiInit(this, appOption);
  }

  handleMarkerAction(data: any) {
    handleMarkerAction(this, data);
  }

  showContextMenu(list: any[]) {
    showContextMenu(this, list);
  }

  async xyToMapIDs(xy: any, threshold = 10) {
    return xyToMapIDs(this, xy, threshold);
  }

  setShowBorder(flag: any) {
    this.core!.requestUpdateState({ showBorder: flag ? 1 : 0 } as any);
    this.updateEnvelope();
    if (flag) {
      this.core!.mapDivDocument!.classList.add("show-border");
    } else {
      this.core!.mapDivDocument!.classList.remove("show-border");
    }
    if ((this.core!.restoreSession as any)) {
      this.core!.requestUpdateState({ showBorder: flag ? 1 : 0 } as any);
    }
  }

  setHideMarker(flag: any) {
    setHideMarker(this, flag);
  }

  handleMarkerActionById(markerId: string) {
    handleMarkerActionById(this, markerId);
  }

  updateUrl() {
    const ui = this;
    if (!ui.appOption.stateUrl) return;
    if (ui.restoring) return;

    const map = ui.core!.mapObject;
    if (!map) return;
    const view = map.getView();
    const center = view.getCenter();
    const zoom = view.getZoom();
    const rotation = view.getRotation();

    const currentMap = ui.core!.from ? ui.core!.from.mapID : "";
    if (!currentMap) return;

    // Background ID
    let backMap = "";
    if (ui.baseSwiper) {
      const slide = ui.baseSwiper.slides[ui.baseSwiper.activeIndex];
      if (slide) {
        backMap = slide.getAttribute("data") || "";
      }
    }

    const transparency = ui.sliderNew ? ui.sliderNew.get("slidervalue") * 100 : 0;

    // Legacy format: s:map/b:back/... (no leading slash, prepended with #!)
    let path = `s:${currentMap}`;

    if (backMap && backMap !== currentMap) {
      path += `/b:${backMap}`;
    }

    if (transparency > 0) {
      path += `/t:${transparency}`;
    }

    path += `/x:${center[0]}`;
    path += `/y:${center[1]}`;
    path += `/z:${zoom}`;

    if (rotation !== 0) {
      path += `/r:${rotation * 180 / Math.PI}`;
    }

    // Options
    if ((ui.core!.stateBuffer as any).showBorder) path += `/sb:1`;
    if ((ui.core!.mapDivDocument!.classList.contains("hide-marker"))) path += `/hm:1`;
    if (ui.enableMarkerList && (ui.core!.stateBuffer as any).markerList) path += `/om:${(ui.core!.stateBuffer as any).markerList}`;

    if (ui.pathThatSet !== path) {
      ui.pathThatSet = path;
      page(`#!${path}`);
    }
  }

  updateEnvelope() {
    const ui = this;
    if (!ui.core!.mapObject) return;

    ui.core!.mapObject.resetEnvelope();
    if (ui._selectCandidateSources) {
      Object.keys(ui._selectCandidateSources).forEach(key => {
        if ((ui.core!.mapObject as any).removeEnvelope) {
          console.log(`[Debug] Removing envelope for ${key}`);
          (ui.core!.mapObject as any).removeEnvelope(ui._selectCandidateSources![key]);
        }
      });
    }
    ui._selectCandidateSources = {};

    if ((ui.core!.stateBuffer as any).showBorder) {
      if (!ui.core!.from) return;

      let activeOverlayId: string | null = null;
      if (ui.overlaySwiper) {
        const slide = ui.overlaySwiper.slides[ui.overlaySwiper.activeIndex];
        if (slide) activeOverlayId = slide.getAttribute("data");
      }



      Object.keys(ui.core!.cacheHash!)
        .filter((key: any) => ui.core!.cacheHash[key].envelope)
        .map((key: any) => {
          const source = ui.core!.cacheHash[key];
          const isActive = key === activeOverlayId;
          const xyPromises =
            key === ui.core!.from!.mapID && typeof source.xy2SysCoord === 'function'
              ? [
                [0, 0],
                [source.width, 0],
                [source.width, source.height],
                [0, source.height],
                [0, 0]
              ].map(xy => Promise.resolve(source.xy2SysCoord(xy)))
              : source.envelope.geometry.coordinates[0].map((coord: any) =>
                ui.core!.from!.merc2SysCoordAsync(coord)
              );

          Promise.all(xyPromises).then(xys => {
            const options: any = {
              color: source.envelopeColor,
              width: 2,
              lineDash: [6, 6]
            };
            ui.core!.mapObject.setEnvelope(xys, options);
            if (isActive && (ui.core!.mapObject as any).setFillEnvelope) {
              console.log(`[Debug] Setting fill envelope for ${key}`);
              const color = asArray(source.envelopeColor || '#000000');
              color[3] = 0.4;
              const fillHandle = (ui.core!.mapObject as any).setFillEnvelope(xys, null, { color });
              ui._selectCandidateSources![key] = fillHandle;
            }
          });
        });
    }
  }

  resolveRelativeLink(file: any, fallbackPath: any) {
    return resolveRelativeLink(file, fallbackPath);
  }

  checkOverlayID(mapID: any) {
    return checkOverlayID(this, mapID);
  }

  areaIndex(xys: any) {
    return (
      0.5 *
      Math.abs(
        [0, 1, 2, 3].reduce((prev: any, _curr: any, i: any) => {
          const xy1 = xys[i];
          const xy2 = xys[i + 1];
          return prev + (xy1[0] - xy2[0]) * (xy1[1] + xy2[1]);
        }, 0)
      )
    );
  }

  getShareUrl(type: string) {
    if (type === "view") {
      return window.location.href;
    }
    // app
    return window.location.href.split("?")[0].split("#")[0];
  }

  showToast(message: string, target?: HTMLElement) {
    let toast = document.querySelector(".custom-toast") as HTMLElement;
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "custom-toast";
      document.body.appendChild(toast);
    }
    (toast as HTMLElement).innerText = message;

    if (target) {
      const parent = target.closest(".recipient");
      const rect = (parent || target).getBoundingClientRect();
      toast.style.position = "fixed";
      toast.style.left = (rect.left + rect.width / 2) + "px";
      toast.style.top = (rect.top + rect.height / 2) + "px";
      toast.style.transform = "translate(-50%, -50%)";
      toast.style.bottom = "auto";
      toast.style.margin = "0";
    } else {
      toast.style.position = "fixed";
      toast.style.left = "50%";
      toast.style.bottom = "30px";
      toast.style.top = "auto";
      toast.style.transform = "";
      toast.style.marginLeft = "-125px";
    }

    toast.classList.add("show");

    setTimeout(() => {
      toast!.classList.remove("show");
    }, 1500);
  }


  modalSetting(type: string) {
    const modalElm = this.core!.mapDivDocument!.querySelector(".modalBase")!;
    modalElm.classList.remove("modal_load", "modal_poi", "modal_share", "modal_help", "modal_gpsW", "modal_gpsD", "modal_map", "modal_marker_list");
    modalElm.classList.add(`modal_${type}`);
  }

  ellips() {
    ellips(this.core!.mapDivDocument!);
  }

  remove() {
    this.core!.remove();
    delete this.core;
  }
}
