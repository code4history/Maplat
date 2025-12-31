import { MaplatApp as Core } from "@maplat/core";
import "ol/ol.css";
import EventTarget from "ol/events/Target.js";
import { asArray } from "ol/color";

import { Swiper } from "./swiper_ex";
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
import type { SliderNew } from "./maplat_control";
import type ContextMenu from "./contextmenu";

import type { Pixel } from "ol/pixel";
import type { Coordinate } from "ol/coordinate";
import { resolveRelativeLink, ellips } from "./ui_utils";
import type { MaplatAppOption, RestoreState, SwiperInstance } from "./types";

Swiper.use([Navigation, Pagination]);

export class MaplatUi extends EventTarget {
  static createObject(option: MaplatAppOption) {
    const app = new MaplatUi(option);
    return app.waitReady.then(() => app);
  }

  core?: Core;
  appOption: MaplatAppOption;
  waitReady!: Promise<void>;
  waitReadyBridge: unknown;
  pathThatSet?: string;
  swipers: Record<string, SwiperInstance> = {};
  mobile_if: boolean = false;
  ui_func: string = "default";
  datum: string = "default";
  selected_layer: string = "default";
  toms: number = 0;
  cache_messages: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last_toast: any;
  share_enable!: boolean;
  sliderNew!: SliderNew;
  baseSwiper!: SwiperInstance;
  overlaySwiper!: SwiperInstance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sliderCommon: any;
  contextMenu!: ContextMenu;
  splashPromise!: Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _selectCandidateSources?: Record<string, any>;
  appEnvelope?: boolean;
  restoring: boolean = false;
  poiSwiper: SwiperInstance | undefined;
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
  lastClickPixel: Pixel | undefined;
  lastClickCoordinate: Coordinate | undefined;
  lastGPSError: string | undefined;
  selectedMarkerNamespaceID: string | undefined;

  constructor(appOption: MaplatAppOption) {
    super();
    this.html_id_seed = `${Math.floor(Math.random() * 9000) + 1000}`;
    this.appOption = appOption;

    if (appOption.stateUrl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      page((ctx: any, _next: any) => {
        let pathes = ctx.canonicalPath.split("#!");
        let path = pathes.length > 1 ? pathes[1] : pathes[0];

        pathes = path.split("?");
        path = pathes[0];
        if (path === this.pathThatSet) {
          delete this.pathThatSet;
          return;
        }
        const restore: RestoreState = {
          transparency: 0,
          position: {
            rotation: 0
          }
        };
        // Parse "s:map/x:100/..."
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        path.split("/").forEach((state: any) => {
          if (!state) return;
          const line = state.split(":");
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
              restore.position!.rotation = parseFloat(line[1]);
              break;
            case "z":
              restore.position!.zoom = parseFloat(line[1]);
              break;
            case "x":
              restore.position!.x = parseFloat(line[1]);
              break;
            case "y":
              restore.position!.y = parseFloat(line[1]);
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
              if (this.core) {
                const modalElm =
                  this.core!.mapDivDocument!.querySelector(".modalBase")!;
                const modal = new bsn.Modal(modalElm, {
                  root: this.core!.mapDivDocument!
                });
                modal.hide();
              }
              break;
            case "mobile_if":
              this.mobile_if = line[1] === "true";
              break;
          }
        });
        if (!this.core) {
          if (restore.mapID) {
            appOption.restore = restore;
            this.restoring = true;
          }

          this.initializer(appOption).then(() => {
            this.core!.waitReady.then(() => {
              this.restoring = false;
              this.updateUrl();
            });
          });
        } else if (restore.mapID) {
          this.restoring = true;

          this.core!.waitReady.then(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ret = this.core!.changeMap(restore.mapID!, restore as any);
            Promise.resolve(ret).then(() => {
              // Fix: Manually apply rotation after changeMap
              // if (restore.position && restore.position.rotation !== undefined) {
              //   console.log(`[Debug] Manually applying rotation after changeMap: ${ restore.position.rotation } `);
              //   this.core!.mapObject.getView().setRotation(restore.position.rotation);
              // }

              // Update transparency slider if needed
              if (this.sliderNew) {
                const t = restore.transparency || 0;
                const val = t / 100;
                this.sliderNew.set("slidervalue", val);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((this.sliderNew as any).element) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (this.sliderNew as any).element.value = (1 - val).toString();
                }
              }

              this.restoring = false;
              console.log(`[Debug] Calling updateUrl from ChangeMap`);
              this.updateUrl();
            });
          });
        }
      });
      page({
        hashbang: true
      });
      page();
      this.waitReady = new Promise((resolve, _reject) => {
        this.waitReadyBridge = resolve;
      });
    } else {
      this.waitReady = this.initializer(appOption);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async initializer(appOption: any) {
    return uiInit(this, appOption);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleMarkerAction(data: any) {
    handleMarkerAction(this, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showContextMenu(list: any[]) {
    showContextMenu(this, list);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async xyToMapIDs(xy: any, threshold = 10) {
    return xyToMapIDs(this, xy, threshold);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setShowBorder(flag: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.core!.requestUpdateState({ showBorder: flag ? 1 : 0 } as any);
    this.updateEnvelope();
    if (flag) {
      this.core!.mapDivDocument!.classList.add("show-border");
    } else {
      this.core!.mapDivDocument!.classList.remove("show-border");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (this.core!.restoreSession as any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.core!.requestUpdateState({ showBorder: flag ? 1 : 0 } as any);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setHideMarker(flag: any) {
    setHideMarker(this, flag);
  }

  handleMarkerActionById(markerId: string) {
    handleMarkerActionById(this, markerId);
  }

  updateUrl() {
    if (!this.appOption.stateUrl) return;
    if (this.restoring) return;

    const map = this.core!.mapObject;
    if (!map) return;
    const view = map.getView();
    const center = view.getCenter();
    const zoom = view.getZoom();
    const rotation = view.getRotation();

    const currentMap = this.core!.from ? this.core!.from.mapID : "";
    if (!currentMap) return;

    // Background ID
    let backMap = "";
    if (this.baseSwiper) {
      const slide = this.baseSwiper.slides[this.baseSwiper.activeIndex];

      if (slide) {
        backMap = slide.getAttribute("data") || "";
      }
    }

    const transparency = this.sliderNew
      ? this.sliderNew.get("slidervalue") * 100
      : 0;

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
      path += `/r:${(rotation * 180) / Math.PI}`;
    }

    // Options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((this.core!.stateBuffer as any).showBorder) path += `/sb:1`;
    if (this.core!.mapDivDocument!.classList.contains("hide-marker"))
      path += `/hm:1`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (this.enableMarkerList && (this.core!.stateBuffer as any).markerList)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      path += `/om:${(this.core!.stateBuffer as any).markerList}`;

    // Add selected marker to URL
    if (this.selectedMarkerNamespaceID) {
      path += `/om:${this.selectedMarkerNamespaceID}`;
    }

    if (this.pathThatSet !== path) {
      this.pathThatSet = path;
      page(`#!${path}`);
    }
  }

  updateEnvelope() {
    if (!this.core!.mapObject) return;

    this.core!.mapObject.resetEnvelope();
    if (this._selectCandidateSources) {
      for (const key of Object.keys(this._selectCandidateSources)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((this.core!.mapObject as any).removeEnvelope) {
          console.log(`[Debug] Removing envelope for ${key}`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.core!.mapObject as any).removeEnvelope(
            this._selectCandidateSources![key]
          );
        }
      }
    }

    this._selectCandidateSources = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((this.core!.stateBuffer as any).showBorder) {
      if (!this.core!.from) return;

      let activeOverlayId: string | null = null;
      if (this.overlaySwiper) {
        const slide = this.overlaySwiper.slides[this.overlaySwiper.activeIndex];
        if (slide) activeOverlayId = slide.getAttribute("data");
      }

      Object.keys(this.core!.cacheHash!)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((key: any) => this.core!.cacheHash[key].envelope)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((key: any) => {
          const source = this.core!.cacheHash[key];
          const isActive = key === activeOverlayId;

          const xyPromises =
            key === this.core!.from!.mapID &&
            typeof source.xy2SysCoord === "function"
              ? [
                  [0, 0],
                  [source.width, 0],
                  [source.width, source.height],
                  [0, source.height],
                  [0, 0]
                ].map(xy => Promise.resolve(source.xy2SysCoord(xy)))
              : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                source.envelope.geometry.coordinates[0].map((coord: any) =>
                  this.core!.from!.merc2SysCoordAsync(coord)
                );

          Promise.all(xyPromises).then(xys => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const options: any = {
              color: source.envelopeColor,
              width: 2,
              lineDash: [6, 6]
            };
            this.core!.mapObject.setEnvelope(xys, options);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (isActive && (this.core!.mapObject as any).setFillEnvelope) {
              console.log(`[Debug] Setting fill envelope for ${key}`);

              const color = asArray(source.envelopeColor || "#000000");

              color[3] = 0.4;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const fillHandle = (this.core!.mapObject as any).setFillEnvelope(
                xys,
                null,
                { color }
              );
              this._selectCandidateSources![key] = fillHandle;
            }
          });
        });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolveRelativeLink(file: any, fallbackPath: any) {
    return resolveRelativeLink(file, fallbackPath);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkOverlayID(mapID: any) {
    return checkOverlayID(this, mapID);
  }

  areaIndex(xys: number[][]) {
    return (
      0.5 *
      Math.abs(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      toast.style.left = `${rect.left + rect.width / 2}px`;
      toast.style.top = `${rect.top + rect.height / 2}px`;
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
    modalElm.classList.remove(
      "modal_load",
      "modal_poi",
      "modal_share",
      "modal_help",
      "modal_gpsW",
      "modal_gpsD",
      "modal_map",
      "modal_marker_list"
    );
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
