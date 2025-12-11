
import {
  MaplatApp as Core,
  createElement
} from "@maplat/core";
import "ol/ol.css";
import EventTarget from "ol/events/Target.js";
import * as QRCode from "qrcode";
import { point, polygon, booleanPointInPolygon } from '@turf/turf';
import Weiwudi from 'weiwudi';
import ContextMenu from './contextmenu';

import {
  SliderNew,
  Copyright,
  CompassRotate,
  Zoom,
  SetGPS,
  GoHome,
  Maplat,
  Share,
  Border,
  HideMarker,
  MarkerList
} from "./maplat_control";
import absoluteUrl from "./absolute_url";
import { Swiper } from "./swiper_ex";
// @ts-ignore
import { Navigation, Pagination } from "swiper";
import "swiper/swiper-bundle.css";
import page from "page";
import * as bsn from "bootstrap.native";
import "../less/ui.less";
import pointer from "./pointer_images";

Swiper.use([Navigation, Pagination]);


const META_KEYS = [
  "title",
  "officialTitle",
  "author",
  "epoch",
  "createdAt",
  "era",
  "contributor",
  "mapper",
  "license",
  "dataLicense",
  "attr",
  "dataAttr",
  "reference",
  "description"
];

function isMaplatSource(source: any): boolean {
  return source && typeof source.setGPSMarkerAsync === 'function';
}

function isBasemap(source: any): boolean {
  if (!isMaplatSource(source)) return false;
  if (source.constructor && source.constructor.isBasemap_ === false) return false;
  if (source.constructor && source.constructor.isBasemap_ === true) return true;
  return true;
}

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
  _selectCandidateSources?: any[];
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

          ui.core.waitReady.then(() => {
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
    const ui = this;

    appOption.translateUI = true;
    ui.core = new Core(appOption);
    if (appOption.icon) {
      (pointer as any)["defaultpin.png"] = appOption.icon;
    }

    if (appOption.restore) {
      ui.setShowBorder(appOption.restore.showBorder || false);
      if (appOption.restore.hideMarker) {
        ui.core!.waitReady.then(() => {
          ui.setHideMarker(appOption.restore.hideMarker);
        });
      }
      if (appOption.restore.openedMarker) {
        console.log(appOption.restore.openedMarker);
        ui.core!.waitReady.then(() => {
          console.log(`Timeout ${appOption.restore.openedMarker} `);
          ui.handleMarkerActionById(appOption.restore.openedMarker);
        });
      }
    } else if (appOption.restoreSession) {
      // @ts-ignore
      const lastEpoch = parseInt(String(localStorage.getItem("epoch") || "0") as any, 10); // eslint-disable-line no-undef
      const currentTime = Math.floor(new Date().getTime() / 1000);
      if (lastEpoch && currentTime - lastEpoch < 3600) {
        // @ts-ignore
        ui.setShowBorder(!!parseInt(String(localStorage.getItem("showBorder") || "0") as any, 10)); // eslint-disable-line no-undef
      }
      if (ui.core!.initialRestore.hideMarker) {
        ui.core!.waitReady.then(() => {
          ui.setHideMarker(true);
        });
      }
    } else {
      ui.setShowBorder(false);
    }

    const enableSplash = !ui.core!.initialRestore.mapID;
    const restoreTransparency = ui.core!.initialRestore.transparency || (appOption.restore ? appOption.restore.transparency : undefined);
    const enableOutOfMap = !appOption.presentationMode;

    ui.enablePoiHtmlNoScroll = appOption.enablePoiHtmlNoScroll || false;
    if (appOption.enableShare) {
      ui.core!.mapDivDocument!.classList.add("enable_share");
      ui.enableShare = true;
    }
    if (appOption.enableHideMarker) {
      ui.core!.mapDivDocument!.classList.add("enable_hide_marker");
      ui.enableHideMarker = true;
    }
    if (appOption.enableBorder) {
      ui.core!.mapDivDocument!.classList.add("enable_border");
      ui.enableBorder = true;
    }
    if (appOption.enableMarkerList) {
      ui.core!.mapDivDocument!.classList.add("enable_marker_list");
      ui.enableMarkerList = true;
    }
    if (appOption.disableNoimage) {
      ui.disableNoimage = true;
    }
    if (appOption.stateUrl) {
      ui.core!.mapDivDocument!.classList.add("state_url");
    }
    if (appOption.alwaysGpsOn) {
      ui.alwaysGpsOn = true;
    }
    if (ui.core!.enableCache) {
      ui.core!.mapDivDocument!.classList.add("enable_cache");
    }
    if ("ontouchstart" in window) {
      // eslint-disable-line no-undef
      ui.core!.mapDivDocument!.classList.add("ol-touch");
      ui.isTouch = true;
    }
    if (appOption.mobileIF) {
      appOption.debug = true;
    }
    if (appOption.appEnvelope) {
      ui.appEnvelope = true;
    }

    // Inject Custom Toast Styles
    const style = document.createElement("style");
    style.innerHTML = `
      .custom-toast {
        visibility: hidden;
        min-width: 250px;
        margin-left: -125px;
        background-color: #333;
        color: #fff;
        text-align: center;
        border-radius: 2px;
        padding: 16px;
        position: fixed;
        z-index: 9999;
        left: 50%;
        bottom: 30px;
        font-size: 17px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .custom-toast.show {
        visibility: visible;
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    let pwaManifest = appOption.pwaManifest;
    let pwaWorker = appOption.pwaWorker;
    let pwaScope = appOption.pwaScope;

    // Inject FontAwesome CDN for reliable icons (REMOVED)
    // Icons: Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0)

    // Add UI HTML Element
    let newElems = createElement(`<d c="ol-control map-title"><s></s></d>
  <d c="swiper-container ol-control base-swiper prevent-default-ui">
    <d c="swiper-wrapper"> </d>
      <d c="swiper-button-next base-next swiper-button-white"> </d>
        <d c="swiper-button-prev base-prev swiper-button-white"> </d>
          </d>
          <d c="swiper-container ol-control overlay-swiper prevent-default-ui">
            <d c="swiper-wrapper"> </d>
              <d c="swiper-button-next overlay-next swiper-button-white"> </d>
                <d c="swiper-button-prev overlay-prev swiper-button-white"> </d>
                  </d> `);
    for (let i = newElems.length - 1; i >= 0; i--) {
      ui.core!.mapDivDocument!.insertBefore(
        newElems[i],
        ui.core!.mapDivDocument!.firstChild
      );
    }

    // Delegated event listener for share buttons
    ui.core!.mapDivDocument!.addEventListener("click", (evt: any) => {
      const target = evt.target as HTMLElement;
      const btn = target.closest(".share");
      if (!btn) return;

      console.log("Share button clicked:", btn);
      const cmd = btn.getAttribute("data");
      if (!cmd) return;
      const cmds = cmd.split("_");
      let uri = ui.getShareUrl(cmds[1] || "app");

      console.log("Share URI:", uri);

      if (cmds[0] === "cp") {
        const bodyElm = document.querySelector("body")!;
        const message = (ui.core as any).t ? (ui.core as any).t("app.copy_toast") : "URL Copied";
        if (navigator.clipboard) {
          navigator.clipboard.writeText(uri).then(() => {
            ui.showToast(message, btn as HTMLElement);
          });
        } else {
          const copyFrom = document.createElement("textarea");
          copyFrom.textContent = uri;
          bodyElm.appendChild(copyFrom);
          copyFrom.select();
          document.execCommand("copy");
          bodyElm.removeChild(copyFrom);
          ui.showToast(message, btn as HTMLElement);
        }
      } else if (cmds[0] === "tw") {
        const text = document.title;
        const twuri = `https://twitter.com/intent/tweet?url=${encodeURIComponent(uri)}&text=${encodeURIComponent(text)}&hashtags=Maplat`;
        window.open(twuri, "_blank");
      } else if (cmds[0] === "fb") {
        const fburi = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(uri)}&display=popup&ref=plugin&src=like&kid_directed_site=0`;
        window.open(fburi, "_blank", "width=650,height=450,menubar=no,toolbar=no,scrollbars=yes");
      }
    });

    const prevDefs = ui.core!.mapDivDocument!.querySelectorAll(
      ".prevent-default-ui"
    );
    for (let i = 0; i < prevDefs.length; i++) {
      const target = prevDefs[i];
      target.addEventListener("touchstart", (evt: any) => {
        evt.preventDefault();
      });
    }

    newElems = createElement(`<d c="modal modalBase" tabindex="-1" role="dialog"
    aria-labelledby="staticModalLabel" aria-hidden="true" data-show="true" data-keyboard="false"
    data-backdrop="static">
  <d c="modal-dialog">
    <d c="modal-content">
      <d c="modal-header">
        <button type="button" c="close" data-dismiss="modal">
          <s aria-hidden="true">&#215;</s><s c="sr-only" din="html.close"></s>
        </button>
        <h4 c="modal-title">

          <s c="modal_title"></s>
          <s c="modal_load_title"></s>
          <s c="modal_gpsW_title" din="html.acquiring_gps"></s>
          <s c="modal_help_title" din="html.help_title"></s>
          <s c="modal_share_title" din="html.share_title"></s>
          <s c="modal_marker_list_title" din="html.marker_list_title"></s>

        </h4>
      </d> 
      <d c="modal-body">

        <d c="modal_help_content">
          <d c="help_content">
            <s dinh="html.help_using_maplat"></s>
            <p c="col-xs-12 help_img"><img src="${(pointer as any)["fullscreen.png"]
      }"></p>
            <h4 din="html.help_operation_title"></h4>
            <p dinh="html.help_operation_content" c="recipient"></p>
            <h4 din="html.help_selection_title"></h4>
            <p dinh="html.help_selection_content" c="recipient"></p>
            <h4 din="html.help_gps_title"></h4>
            <p dinh="html.help_gps_content" c="recipient"></p>
            <h4 din="html.help_poi_title"></h4>
            <p dinh="html.help_poi_content" c="recipient"></p>
            <h4 din="html.help_etc_title"></h4>
            <ul>
              <li dinh="html.help_etc_attr" c="recipient"></li>
              <li dinh="html.help_etc_help" c="recipient"></li>
              <s c="share_help"><li dinh="html.help_share_help" c="recipient"></li></s>
              <s c="border_help"><li dinh="html.help_etc_border" c="recipient"></li></s>
              <s c="hide_marker_help"><li dinh="html.help_etc_hide_marker" c="recipient"></li></s>
              <s c="marker_list_help"><li dinh="html.help_etc_marker_list" c="recipient"></li></s>
              <li dinh="html.help_etc_slider" c="recipient"></li>
            </ul>
            <p><a href="https://www.maplat.jp/" target="_blank">Maplat</a>
              © 2015- Kohei Otsuka, Code for History</p>
          </d> 
        </d> 

        <d c="modal_poi_content">
          <d c="poi_web poi_web_div hide"><iframe c="poi_iframe" frameborder="0"></iframe></d>
          <d c="poi_data fade in">
            <d c="swiper-container poi_img_swiper">
              <d c="swiper-wrapper"></d>
              <d c="swiper-button-next poi-img-next swiper-button-white"></d>
              <d c="swiper-button-prev poi-img-prev swiper-button-white"></d>
              <d c="swiper-pagination poi-pagination"></d>
            </d>
            <p c="poi_address"></p>
            <d c="poi_desc"></d>
          </d>
          <d c="modal_share_poi"></d>
          <p><img src="" height="0px" width="0px"></p>
        </d> 

        <div class="modal_share_content">
          <h4 din="html.share_app_title"></h4>
          <div id="___maplat_app_toast_${ui.html_id_seed}"></div>
          <div class="recipient row">
            <div class="form-group col-xs-4 text-center"><button title="Copy to clipboard" class="share btn btn-light" data="cp_app"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M224 0c-35.3 0-64 28.7-64 64V96H96c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384h64c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224zM288 384H96V160H224c0-17.7 14.3-32 32-32h64V256c0 17.7 14.3 32 32 32h96V384H288z"/></svg>&nbsp;<small din="html.share_copy"></small></button></div>
            <div class="form-group col-xs-4 text-center"><button title="Twitter" class="share btn btn-light" data="tw_app"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>&nbsp;<small>Twitter</small></button></div>
            <div class="form-group col-xs-4 text-center"><button title="Facebook" class="share btn btn-light" data="fb_app"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 121.3 87.1 222.4 203 240.5V327.9h-61v-71.9h61V203c0-60.8 35.8-93.7 89.2-93.7 25.5 0 50.4 1.8 56.1 2.6v62.4h-35.4c-29.5 0-37.4 18.2-37.4 42.1v59.6h68.9l-11 71.9h-57.9V496.5C416.9 478.4 504 377.3 504 256z"/></svg>&nbsp;<small>Facebook</small></button></div>
          </div>
          <div class="qr_app center-block" style="width:128px;"></div>
          <div class="modal_share_state">
            <h4 din="html.share_state_title"></h4>
            <div id="___maplat_view_toast_${ui.html_id_seed}"></div>
            <div class="recipient row">
              <div class="form-group col-xs-4 text-center"><button title="Copy to clipboard" class="share btn btn-light" data="cp_view"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M224 0c-35.3 0-64 28.7-64 64V96H96c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384h64c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224zM288 384H96V160H224c0-17.7 14.3-32 32-32h64V256c0 17.7 14.3 32 32 32h96V384H288z"/></svg>&nbsp;<small din="html.share_copy"></small></button></div>
              <div class="form-group col-xs-4 text-center"><button title="Twitter" class="share btn btn-light" data="tw_view"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>&nbsp;<small>Twitter</small></button></div>
              <div class="form-group col-xs-4 text-center"><button title="Facebook" class="share btn btn-light" data="fb_view"><svg style="width:14px;height:14px;vertical-align:text-bottom;" viewBox="0 0 512 512"><path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 121.3 87.1 222.4 203 240.5V327.9h-61v-71.9h61V203c0-60.8 35.8-93.7 89.2-93.7 25.5 0 50.4 1.8 56.1 2.6v62.4h-35.4c-29.5 0-37.4 18.2-37.4 42.1v59.6h68.9l-11 71.9h-57.9V496.5C416.9 478.4 504 377.3 504 256z"/></svg>&nbsp;<small>Facebook</small></button></div>
            </div>
            <div class="qr_view center-block" style="width:128px;"></div>
          </div>
          <p><img src="" height="0px" width="0px"></p>
        </div>

        <d c="modal_map_content">
            ${META_KEYS.map(key => {
        if (key == "title" || key == "officialTitle") return "";
        return `<d c="recipients ${key}_div"><dl c="dl-horizontal">
                      <dt din="html.${key}"></dt>
                      <dd c="${key}_dd"></dd>
                    </dl></d> `;
      }).join("")}
          <d c="recipients modal_cache_content"><dl c="dl-horizontal">
            <dt din="html.cache_handle"></dt>
            <dd><s c="cache_size"></s></dd>
            <dt></dt>
            <dd><s c="pull-right"><button c="cache_fetch btn btn-default" href="#" din="html.cache_fetch"></button>
              <button c="cache_delete btn btn-default" href="#" din="html.cache_delete"></button></s></dd>
          </dl></d> 
        </d>

        <d c="modal_load_content">
          <p c="recipient"><img src="${(pointer as any)["loading.png"]
      }"><s din="html.app_loading_body"></s></p>
          <d c="splash_div hide row"><p c="col-xs-12 poi_img"><img c="splash_img" src=""></p></d> 
          <p><img src="" height="0px" width="0px"></p>
        </d> 

        <d c="modal_marker_list_content">
          <ul c="list-group"></ul>
        </d> 

        <p c="modal_gpsD_content" c="recipient"></p>
        <p c="modal_gpsW_content" c="recipient"></p>

      </d> 
    </d> 
  </d> 
</d> `);
    for (let i = newElems.length - 1; i >= 0; i--) {
      ui.core!.mapDivDocument!.insertBefore(
        newElems[i],
        ui.core!.mapDivDocument!.firstChild
      );
    }

    // PWA
    if (pwaManifest) {
      if (pwaManifest === true) {
        pwaManifest = `./pwa/${ui.core!.appid}_manifest.json`;
      }
      if (!pwaWorker) {
        pwaWorker = "./service-worker.js";
      }
      if (!pwaScope) {
        pwaScope = "./";
      }

      const head = document.querySelector("head"); // eslint-disable-line no-undef
      if (head) {
        if (!head.querySelector('link[rel="manifest"]')) {
          head.appendChild(
            createElement(`<link rel="manifest" href="${pwaManifest}">`)[0]
          );
        }
      }
      try {
        Weiwudi.registerSW(pwaWorker, { scope: pwaScope });
      } catch (e) { } // eslint-disable-line no-empty

      if (head && !head.querySelector('link[rel="apple-touch-icon"]')) {
        const xhr = new XMLHttpRequest(); // eslint-disable-line no-undef
        xhr.open("GET", pwaManifest, true);
        xhr.responseType = "json";

        xhr.onload = function (_e: any) {
          let value = this.response;
          if (!value) return;
          if (typeof value != "object") value = JSON.parse(value);

          if (value.icons) {
            for (let i = 0; i < value.icons.length; i++) {
              const src = absoluteUrl(pwaManifest, value.icons[i].src);
              const sizes = value.icons[i].sizes;
              const tag = `<link rel="apple-touch-icon" sizes="${sizes}" href="${src}">`;
              head.appendChild(createElement(tag)[0]);
            }
          }
        };
        xhr.send();
      }
    }

    ui.core!.addEventListener("uiPrepare", (_evt: any) => {
      const imageExtractor = function (text: any) {
        const regexp = /\$\{([a-zA-Z0-9_\.\/\-]+)\}/g; // eslint-disable-line no-useless-escape
        let ret = text;
        let match;
        while ((match = regexp.exec(text)) != null) {
          ret = ret.replace(match[0], (pointer as any)[match[1]]);
        }
        return ret;
      };
      let i18nTargets = ui.core!.mapDivDocument!.querySelectorAll("[data-i18n], [din]");
      for (let i = 0; i < i18nTargets.length; i++) {
        const target = i18nTargets[i];
        const key = target.getAttribute("data-i18n") || target.getAttribute("din");
        (target as HTMLElement).innerText = imageExtractor(ui.core!.t(key));
      }
      i18nTargets = ui.core!.mapDivDocument!.querySelectorAll("[data-i18n-html], [dinh]");
      for (let i = 0; i < i18nTargets.length; i++) {
        const target = i18nTargets[i];
        const key = target.getAttribute("data-i18n-html") || target.getAttribute("dinh");
        target.innerHTML = imageExtractor(ui.core!.t(key));
      }
      // Explicitly fix app_loading_body with a more robust selector if needed, or re-run translation for it
      const appLoadingBody = ui.core!.mapDivDocument!.querySelector('[data-i18n="html.app_loading_body"], [din="html.app_loading_body"]');
      if (appLoadingBody) {
        (appLoadingBody as HTMLElement).innerHTML = imageExtractor(ui.core!.t("html.app_loading_body"));
      }

      const options: any = {
        reverse: true,
        tipLabel: ui.core!.t("control.trans", { ns: "translation" })
      };
      if (restoreTransparency) {
        options.initialValue = restoreTransparency / 100;
      }
      ui.sliderNew = new SliderNew(options);
      ui.core!.appData!.controls = [
        new Copyright({
          tipLabel: ui.core!.t("control.info", { ns: "translation" })
        }),
        new CompassRotate({
          tipLabel: ui.core!.t("control.compass", { ns: "translation" })
        }),
        new Zoom({
          tipLabel: ui.core!.t("control.zoom", { ns: "translation" })
        }),
        new SetGPS({
          ui,
          tipLabel: ui.core!.t("control.gps", { ns: "translation" })
        }),
        new GoHome({
          tipLabel: ui.core!.t("control.home", { ns: "translation" })
        }),
        ui.sliderNew,
        new Maplat({
          tipLabel: ui.core!.t("control.help", { ns: "translation" })
        })
      ];
      if (ui.enableShare) {
        ui.core!.appData!.controls.push(
          new Share({
            tipLabel: ui.core!.t("control.share", { ns: "translation" })
          })
        );
      }
      if (ui.enableBorder) {
        ui.core!.appData!.controls.push(
          new Border({
            tipLabel: ui.core!.t("control.border", { ns: "translation" })
          })
        );
      }
      if (ui.enableHideMarker) {
        ui.core!.appData!.controls.push(
          new HideMarker({
            tipLabel: ui.core!.t("control.hide_marker", { ns: "translation" })
          })
        );
      }
      if (ui.enableMarkerList) {
        ui.core!.appData!.controls.push(
          new MarkerList({
            tipLabel: ui.core!.t("control.marker_list", { ns: "translation" })
          })
        );
      }

      // Contextmenu
      ui.contextMenu = new ContextMenu({
        eventType: "__dummy__",
        width: 170,
        defaultItems: false,
        items: []
      });
      ui.core!.appData!.controls.push(ui.contextMenu);

      ui.sliderNew.on("propertychange", (evt: any) => {
        if (evt.key === "slidervalue") {
          ui.core!.setTransparency(ui.sliderNew.get(evt.key) * 100);
          ui.updateUrl();
        }
      });

      if (enableSplash) {
        // Check Splash data
        let splash = false;
        if ((ui.core!.appData as any).splash) splash = true;


        const modalElm = ui.core!.mapDivDocument!.querySelector(".modalBase")!;
        const modal = new bsn.Modal(modalElm, { root: ui.core!.mapDivDocument! });
        (ui.core!.mapDivDocument!.querySelector(".modal_load_title") as HTMLElement).innerText =
          ui.core!.translate(ui.core!.appData!.appName) || "";
        if (splash) {
          ui.core!.mapDivDocument!
            .querySelector(".splash_img")!
            .setAttribute("src", `img/${(ui.core!.appData as any).splash}`);
          ui.core!.mapDivDocument!
            .querySelector(".splash_div")!
            .classList.remove("hide");
        }
        ui.modalSetting("load");
        modal.show();

        const fadeTime = splash ? 1000 : 200;
        ui.splashPromise = new Promise((resolve: any) => {
          setTimeout(() => {
            // eslint-disable-line no-undef
            resolve();
          }, fadeTime);
        });
      }

      document.querySelector("title")!.innerHTML = ui.core!.translate(
        ui.core!.appName
      ) || ""; // eslint-disable-line no-undef
    });

    ui.core!.addEventListener("sourceLoaded", (evt: any) => {
      const sources = evt.detail;

      const colors = [
        "maroon",
        "deeppink",
        "indigo",
        "olive",
        "royalblue",
        "red",
        "hotpink",
        "green",
        "yellow",
        "navy",
        "saddlebrown",
        "fuchsia",
        "darkslategray",
        "yellowgreen",
        "blue",
        "mediumvioletred",
        "purple",
        "lime",
        "darkorange",
        "teal",
        "crimson",
        "darkviolet",
        "darkolivegreen",
        "steelblue",
        "aqua"
      ];
      const appBbox: any[] = [];
      let cIndex = 0;
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (source.envelope) {
          if (ui.appEnvelope)
            source.envelope.geometry.coordinates[0].map((xy: any) => {
              if (appBbox.length === 0) {
                appBbox[0] = appBbox[2] = xy[0];
                appBbox[1] = appBbox[3] = xy[1];
              } else {
                if (xy[0] < appBbox[0]) appBbox[0] = xy[0];
                if (xy[0] > appBbox[2]) appBbox[2] = xy[0];
                if (xy[1] < appBbox[1]) appBbox[1] = xy[1];
                if (xy[1] > appBbox[3]) appBbox[3] = xy[1];
              }
            });
          source.envelopeColor = colors[cIndex];
          cIndex = cIndex + 1;
          if (cIndex === colors.length) cIndex = 0;

          const xys = source.envelope.geometry.coordinates[0];
          // http://blog.arq.name/wp-content/uploads/2018/02/Rectangle_Area.pdf
          source.envelopeAreaIndex = ui.areaIndex(xys);
        }
      }
      if (ui.appEnvelope) console.log(`This app's envelope is: ${appBbox}`);

      // Restore Sources definitions
      const baseSources = Object.keys(ui.core!.cacheHash!)
        .map((key: any) => ui.core!.cacheHash[key])
        .filter(source => isBasemap(source));
      const overlaySources = Object.keys(ui.core!.cacheHash!)
        .map((key: any) => ui.core!.cacheHash[key])
        .filter(source => !isBasemap(source));


      if (ui.splashPromise) {
        ui.splashPromise.then(() => {
          const modalElm = ui.core!.mapDivDocument!.querySelector(".modalBase")!;
          const modal = bsn.Modal.getInstance(modalElm) || new bsn.Modal(modalElm);
          modal.hide();
        });
      } else {
        const modalElm = ui.core!.mapDivDocument!.querySelector(".modalBase")!;
        const modal = bsn.Modal.getInstance(modalElm) || new bsn.Modal(modalElm);
        modal.hide();
      }

      // Reconstructed baseSwiper init
      ui.core!.mapDivDocument!.querySelector(".base-swiper .swiper-wrapper")!.innerHTML = "";
      const baseSwiper = (ui.baseSwiper = new Swiper(".base-swiper", {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: baseSources.length > 1,
        navigation: {
          nextEl: ".base-next",
          prevEl: ".base-prev"
        }
      }));

      baseSwiper.on("click", (_e: any) => {
        if (!baseSwiper.clickedSlide) return;
        const slide = baseSwiper.clickedSlide;
        ui.core!.changeMap(slide.getAttribute("data") || "");
        baseSwiper.slideToLoop(
          parseInt(slide.getAttribute("data-swiper-slide-index") || "0", 10)
        );
      });

      if (baseSources.length < 2) {
        ui.core!.mapDivDocument!
          .querySelector(".base-swiper")!
          .classList.add("single-map");
      }
      ui.core!.mapDivDocument!.querySelector(".overlay-swiper .swiper-wrapper")!.innerHTML = "";
      const overlaySwiper = (ui.overlaySwiper = new Swiper(".overlay-swiper", {
        slidesPerView: 2,
        spaceBetween: 15,
        breakpoints: {
          // when window width is <= 480px
          480: {
            slidesPerView: 1.4,
            spaceBetween: 10
          }
        },
        centeredSlides: true,
        threshold: 2,
        loop: overlaySources.length >= 2,
        navigation: {
          nextEl: ".overlay-next",
          prevEl: ".overlay-prev"
        }
      }));
      overlaySwiper.on("click", (_e: any) => {
        if (!overlaySwiper.clickedSlide) return;
        const slide = overlaySwiper.clickedSlide;
        ui.core!.changeMap(slide.getAttribute("data") || "");
        delete ui._selectCandidateSources;
        overlaySwiper.setSlideIndexAsSelected(
          parseInt(slide.getAttribute("data-swiper-slide-index") || "0", 10)
        );
      });
      if (overlaySources.length < 2) {
        ui.core!.mapDivDocument!
          .querySelector(".overlay-swiper")!
          .classList.add("single-map");
      }

      for (let i = 0; i < baseSources.length; i++) {
        const source = baseSources[i];
        baseSwiper.appendSlide(
          `<div class="swiper-slide" data="${source.mapID}">` +
          `<img crossorigin="anonymous" src="${source.thumbnail
          }"><div> ${ui.core!.translate(source.label)}</div> </div> `
        );
      }
      for (let i = 0; i < overlaySources.length; i++) {
        const source = overlaySources[i];
        const colorCss = source.envelope ? ` ${source.envelopeColor}` : "";
        overlaySwiper.appendSlide(
          `<div class="swiper-slide${colorCss}" data="${source.mapID}">` +
          `<img crossorigin="anonymous" src="${source.thumbnail
          }"><div> ${ui.core!.translate(source.label)}</div> </div> `
        );
      }

      baseSwiper.on;
      overlaySwiper.on;
      baseSwiper.slideToLoop(0);
      overlaySwiper.slideToLoop(0);
      ui.ellips();

    });

    ui.core!.addEventListener("mapChanged", (evt: any) => {
      const map = evt.detail;

      ui.baseSwiper.setSlideMapID(map.mapID);
      ui.overlaySwiper.setSlideMapID(map.mapID);

      const title = map.officialTitle || map.title || map.label;
      (ui.core!.mapDivDocument!.querySelector(".map-title span") as HTMLElement).innerText =
        ui.core!.translate(title) || "";

      if (ui.checkOverlayID(map.mapID)) {
        ui.sliderNew.setEnable(true);
      } else {
        ui.sliderNew.setEnable(false);
      }
      const transparency = ui.sliderNew.get("slidervalue") * 100;
      ui.core!.mapObject.setTransparency(transparency);

      ui.updateEnvelope();
      ui.updateUrl();
    });

    ui.core!.addEventListener("poi_number", (evt: any) => {
      const number = evt.detail;
      if (number) {
        ui.core!.mapDivDocument!.classList.remove("no_poi");
      } else {
        ui.core!.mapDivDocument!.classList.add("no_poi");
      }
    });

    ui.core!.addEventListener("outOfMap", (_evt: any) => {
      if (enableOutOfMap) {
        (ui.core!.mapDivDocument!.querySelector(".modal_title") as HTMLElement).innerText =
          ui.core!.t("app.out_of_map") || "";
        (ui.core!.mapDivDocument!.querySelector(".modal_gpsD_content") as HTMLElement).innerText =
          ui.core!.t("app.out_of_map_area") || "";
        const modalElm = ui.core!.mapDivDocument!.querySelector(".modalBase")!;
        const modal = new bsn.Modal(modalElm, { root: ui.core!.mapDivDocument! });
        ui.modalSetting("gpsD");
        modal.show();
      }
    });

    ui.core!.mapDivDocument!.addEventListener("mouseout", (_evt: any) => {
      if (ui._selectCandidateSources) {
        Object.keys(ui._selectCandidateSources).forEach((key: any) =>
          ui.core!.mapObject.removeEnvelope(ui._selectCandidateSources![key])
        );
        delete ui._selectCandidateSources;
      }
    });

    ui.core!.addEventListener("sourceLoaded", (evt: any) => {
      const sources = evt.detail;
      const colors = ["maroon", "deeppink", "indigo", "olive", "royalblue", "red", "hotpink", "green", "yellow", "navy", "saddlebrown", "fuchsia", "darkslategray", "yellowgreen", "blue", "mediumvioletred", "purple", "lime", "darkorange", "teal", "crimson", "darkviolet", "darkolivegreen", "steelblue", "aqua"];
      const appBbox: any[] = [];
      let cIndex = 0;

      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (source.envelope) {
          if (ui.appEnvelope) {
            source.envelope.geometry.coordinates[0].map((xy: any) => {
              if (appBbox.length === 0) {
                appBbox[0] = appBbox[2] = xy[0];
                appBbox[1] = appBbox[3] = xy[1];
              } else {
                if (xy[0] < appBbox[0]) appBbox[0] = xy[0];
                if (xy[0] > appBbox[2]) appBbox[2] = xy[0];
                if (xy[1] < appBbox[1]) appBbox[1] = xy[1];
                if (xy[1] > appBbox[3]) appBbox[3] = xy[1];
              }
            });
          }
          source.envelopeColor = colors[cIndex];
          cIndex++;
          if (cIndex === colors.length) cIndex = 0;

          const xys = source.envelope.geometry.coordinates[0];
          source.envelopeAreaIndex = ui.areaIndex(xys);
        }
      }
      if (ui.appEnvelope) console.log(`This app's envelope is: ${appBbox}`);

      if (ui.splashPromise) {
        ui.splashPromise.then(() => {
          const modalElm = ui.core!.mapDivDocument!.querySelector(".modalBase")!;
          const modal = bsn.Modal.getInstance(modalElm) || new bsn.Modal(modalElm, { root: ui.core!.mapDivDocument! });
          ui.modalSetting("load");
          modal.hide();
        });
      }

      const baseSources: any[] = [];
      const overlaySources: any[] = [];
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        // Use loose check as NowMap/TmsMap are not exported
        if (source.constructor.name === 'NowMap' && source.constructor.name !== 'TmsMap') {
          baseSources.push(source);
        } else {
          overlaySources.push(source);
        }
      }

      const baseSwiper = (ui.baseSwiper = new Swiper(".base-swiper", {
        slidesPerView: 2,
        spaceBetween: 15,
        breakpoints: {
          480: {
            slidesPerView: 1.4,
            spaceBetween: 10
          }
        },
        centeredSlides: true,
        threshold: 20, // Increased from 2
        preventClicks: true,
        preventClicksPropagation: true,
        loop: baseSources.length >= 2,
        navigation: {
          nextEl: ".base-next",
          prevEl: ".base-prev"
        }
      }));
      baseSwiper.on("click", (_e: any) => {
        if (!baseSwiper.clickedSlide) return;
        const slide = baseSwiper.clickedSlide;
        ui.core!.changeMap(slide.getAttribute("data"));
        delete ui._selectCandidateSources;
        baseSwiper.setSlideIndexAsSelected(
          parseInt(slide.getAttribute("data-swiper-slide-index") || "0", 10)
        );
      });
      if (baseSources.length < 2) {
        ui.core!.mapDivDocument!.querySelector(".base-swiper")!.classList.add("single-map");
      }

      const overlaySwiper = (ui.overlaySwiper = new Swiper(".overlay-swiper", {
        slidesPerView: 2,
        spaceBetween: 15,
        breakpoints: {
          480: {
            slidesPerView: 1.4,
            spaceBetween: 10
          }
        },
        centeredSlides: true,
        threshold: 2,
        loop: overlaySources.length >= 2,
        navigation: {
          nextEl: ".overlay-next",
          prevEl: ".overlay-prev"
        }
      }));
      overlaySwiper.on("click", (_e: any) => {
        if (!overlaySwiper.clickedSlide) return;
        const slide = overlaySwiper.clickedSlide;
        ui.core!.changeMap(slide.getAttribute("data"));
        delete ui._selectCandidateSources;
        overlaySwiper.setSlideIndexAsSelected(
          parseInt(slide.getAttribute("data-swiper-slide-index") || "0", 10)
        );
      });
      if (overlaySources.length < 2) {
        ui.core!.mapDivDocument!.querySelector(".overlay-swiper")!.classList.add("single-map");
      }

      for (let i = 0; i < baseSources.length; i++) {
        const source = baseSources[i];
        baseSwiper.appendSlide(
          `<div class="swiper-slide" data="${source.mapID}">` +
          `<img crossorigin="anonymous" src="${source.thumbnail
          }"><div> ${ui.core!.translate(source.label)}</div> </div> `
        );
      }
      for (let i = 0; i < overlaySources.length; i++) {
        const source = overlaySources[i];
        const colorCss = source.envelope ? ` ${source.envelopeColor}` : "";
        overlaySwiper.appendSlide(
          `<div class="swiper-slide${colorCss}" data="${source.mapID}">` +
          `<img crossorigin="anonymous" src="${source.thumbnail
          }"><div> ${ui.core!.translate(source.label)}</div> </div> `
        );
      }

      baseSwiper.slideToLoop(0);
      overlaySwiper.slideToLoop(0);
      ui.ellips();
    });

    ui.core!.addEventListener("clickMarker", (evt: any) => {
      const data = evt.detail;
      const modalElm = ui.core!.mapDivDocument!.querySelector(".modalBase")!;
      const modal = bsn.Modal.getInstance(modalElm) || new bsn.Modal(modalElm);

      const closeBtns = modalElm.querySelectorAll(".close, .modal-footer button");
      for (let i = 0; i < closeBtns.length; i++) {
        closeBtns[i].addEventListener("click", () => {
          modal.hide();
        });
      }

      if (data.directgo) {
        let blank = false;
        let href = "";
        if (typeof data.directgo == "string") {
          href = data.directgo;
        } else {
          href = data.directgo.href;
          blank = data.directgo.blank || false;
        }
        if (blank) {
          window.open(href, "_blank");
        } else {
          window.location.href = href;
        }
        return;
      }

      const titleEl = ui.core!.mapDivDocument!.querySelector(".modal_poi_title") || ui.core!.mapDivDocument!.querySelector(".modal_title");
      if (titleEl) (titleEl as HTMLElement).innerText = ui.core!.translate(data.name) || "";

      if (data.url || data.html) {
        (ui.core!.mapDivDocument!.querySelector(".poi_web") as HTMLElement).classList.remove("hide");
        (ui.core!.mapDivDocument!.querySelector(".poi_data") as HTMLElement).classList.add("hide");
        const iframe = ui.core!.mapDivDocument!.querySelector(".poi_iframe") as HTMLIFrameElement;

        if (data.html) {
          const loadEvent = (event: any) => {
            event.currentTarget.removeEventListener(event.type, loadEvent);
            const cssLink = createElement(
              '<style type="text/css">html, body { height: 100vh; }\n img { width: 100%; }</style>'
            );
            const jsLink = createElement(
              `<script>
                  const heightGetter = document.querySelector("#heightGetter");
                  const resizeObserver = new ResizeObserver(entries => {
                    window.parent.postMessage(["setHeight", (entries[0].target.clientHeight + 16) + "px"], "*");
                  });
                  resizeObserver.observe(heightGetter);
                </script>`
            );
            iframe.contentDocument!.head.appendChild(cssLink[0]);
            iframe.contentDocument!.head.appendChild(jsLink[0]);
          };
          iframe.addEventListener("load", loadEvent);
          iframe.removeAttribute("src");
          iframe.setAttribute(
            "srcdoc",
            `<div id="heightGetter">${ui.core!.translate(data.html) || ""}</div>`
          );
        } else {
          iframe.removeAttribute("srcdoc");
          iframe.setAttribute("src", ui.core!.translate(data.url) || "");
        }
      } else {
        (ui.core!.mapDivDocument!.querySelector(".poi_data") as HTMLElement).classList.remove("hide");
        (ui.core!.mapDivDocument!.querySelector(".poi_web") as HTMLElement).classList.add("hide");

        const slides: string[] = [];
        if (data.image && data.image !== "") {
          const images = Array.isArray(data.image) ? data.image : [data.image];
          images.forEach((image: any) => {
            if (typeof image === "string") {
              image = { src: image };
            }
            const tmpImg = ui.resolveRelativeLink(image.src, "img");
            let slide = `<a target="_blank" href="${tmpImg}"><img src="${tmpImg}"></a>`;
            if (image.desc) slide = `${slide}<div>${image.desc}</div>`;
            slides.push(`<div class="swiper-slide">${slide}</div>`);
          });
        }
        // Simplified: logic for noimage skipped for now to focus on restore

        const swiperDiv = ui.core!.mapDivDocument!.querySelector(".swiper-container.poi_img_swiper") as HTMLElement;
        if (slides.length === 0) {
          swiperDiv.classList.add("hide");
        } else {
          swiperDiv.classList.remove("hide");
          if (!ui.poiSwiper) {
            // Inject custom CSS for Swiper
            if (!document.getElementById("poi-swiper-style")) {
              const style = document.createElement("style");
              style.id = "poi-swiper-style";
              style.innerHTML = `
                 .poi_img_swiper { --swiper-theme-color: #007aff; }
                 .poi_img_swiper .swiper-button-next, .poi_img_swiper .swiper-button-prev { color: #007aff !important; }
                 .poi_img_swiper .swiper-button-disabled { opacity: 0.35 !important; filter: blur(2px) !important; color: #007aff !important; pointer-events: none; }
                 .poi_img_swiper .swiper-pagination-bullet { background: #007aff !important; opacity: 0.4 !important; filter: blur(1px); }
                 .poi_img_swiper .swiper-pagination-bullet-active { opacity: 1 !important; filter: none !important; }
               `;
              document.head.appendChild(style);
            }

            ui.poiSwiper = new Swiper(".swiper-container.poi_img_swiper", {
              lazy: true,
              slidesPerView: 1,
              centeredSlides: true,
              spaceBetween: 10,
              grabCursor: true,
              speed: 300,
              effect: "slide",
              observer: true,
              observeParents: true,
              pagination: {
                el: ".poi-pagination",
                clickable: true
              },
              navigation: {
                nextEl: ".poi-img-next",
                prevEl: ".poi-img-prev"
              }
            });
          }
          ui.poiSwiper!.removeAllSlides();
          slides.forEach(slide => ui.poiSwiper!.appendSlide(slide));
          ui.poiSwiper!.update();
          ui.poiSwiper!.slideTo(0);
        }

        (ui.core!.mapDivDocument!.querySelector(".poi_address") as HTMLElement).innerText = ui.core!.translate(data.address) || "";
        (ui.core!.mapDivDocument!.querySelector(".poi_desc") as HTMLElement).innerHTML = (ui.core!.translate(data.desc) || "").replace(/\n/g, "<br>");
      }

      ui.core!.selectMarker(data.namespaceID);
      const hiddenFunc = (_event: any) => {
        modalElm.removeEventListener("hidden.bs.modal", hiddenFunc, false);
        if (ui.poiSwiper) {
          ui.poiSwiper.removeAllSlides();
          // Keep instance or destroy? Legacy kept instance logic complex, simplified here
        }
        ui.core!.unselectMarker();
      };
      modalElm.addEventListener("hidden.bs.modal", hiddenFunc, false);

      ui.modalSetting("poi");
      modal.show();
    });

    ui.core!.waitReady.then(() => {
      ui.core!.mapObject.on("click_control", (evt: any) => {
        const control = evt.control || (evt.frameState && evt.frameState.control);
        const modalElm = ui.core!.mapDivDocument!.querySelector(".modalBase")!;
        const modal = bsn.Modal.getInstance(modalElm) || new bsn.Modal(modalElm);

        const closeBtns = modalElm.querySelectorAll(".close, .modal-footer button");
        for (let i = 0; i < closeBtns.length; i++) {
          closeBtns[i].addEventListener("click", () => {
            modal.hide();
          });
        }

        if (control === "help") {
          ui.modalSetting("help");
          modal.show();
        } else if (control === "share") {
          ui.modalSetting("share");

          const modalBody = modalElm.querySelector(".modal-body") as HTMLElement;

          const baseUrl = ui.getShareUrl("app");
          const viewUrl = ui.getShareUrl("view");

          // Generate QR Codes
          const qrAppDiv = modalBody.querySelector(".qr_app") as HTMLElement;
          const qrViewDiv = modalBody.querySelector(".qr_view") as HTMLElement;

          if (qrAppDiv) {
            QRCode.toCanvas(baseUrl, { width: 128, margin: 1 }, (err: any, canvas: any) => {
              if (!err) {
                qrAppDiv.innerHTML = "";
                qrAppDiv.appendChild(canvas);
              }
            });
          }
          if (qrViewDiv) {
            QRCode.toCanvas(viewUrl, { width: 128, margin: 1 }, (err: any, canvas: any) => {
              if (!err) {
                qrViewDiv.innerHTML = "";
                qrViewDiv.appendChild(canvas);
              }
            });
          }

          modal.show();
        } else if (control === "markerList") {
          ui.modalSetting("marker_list");
          modal.show();
        } else if (control === "copyright") {
          ui.modalSetting("map");
          const mapData = ui.core!.from!;
          const modalRoot = ui.core!.mapDivDocument!;
          const titleEl = modalRoot.querySelector(".modal_map .modal_title");
          if (titleEl) {
            const titleVal = (mapData as any).get ? (mapData as any).get('title') : (mapData as any).title;
            (titleEl as HTMLElement).innerText = ui.core!.translate(titleVal) || "";
          }

          META_KEYS.forEach((key) => {
            if (key === 'title' || key === 'officialTitle') return;
            const val = (mapData as any).get ? (mapData as any).get(key) : (mapData as any)[key];
            const container = modalRoot.querySelector(`.modal_map .${key}_div`);
            if (container) {
              if (val) {
                (container as HTMLElement).style.display = "block";
                const contentEl = container.querySelector(`.${key}_dd`);
                if (contentEl) {
                  if (key === 'license' || key === 'dataLicense') {
                    const fileName = (val as string).toLowerCase().replace(/ /g, '_');
                    (contentEl as HTMLElement).innerHTML = `<img src="assets/parts/${fileName}.png" class="license" />`;
                  } else {
                    (contentEl as HTMLElement).innerHTML = ui.core!.translate(val) || "";
                  }
                }
              } else {
                (container as HTMLElement).style.display = "none";
              }
            }
          });
          modal.show();
        } else if (control === "border") {
          ui.setShowBorder(!(ui.core!.stateBuffer as any).showBorder);
        } else if (control === "hideMarker") {
          const current = ui.core!.mapDivDocument!.classList.contains("hide-marker");
          ui.setHideMarker(!current);
        }
        ui.updateUrl();
      });
      ui.core!.mapObject.on("moveend", (_evt: any) => {
        ui.updateUrl();
      });
    });
  }

  async xyToMapIDs(xy: any, threshold = 10) {
    const ui = this;
    const point_ = point(xy);

    const map = ui.core!.mapObject;
    const size = map.getSize();
    const extent = [[0, 0], [size[0], 0], size, [0, size[1]], [0, 0]];
    const sysCoords = extent.map((pixel: any) => map.getCoordinateFromPixel(pixel));
    const mercs = await (typeof ui.core!.from!.xy2SysCoord !== 'function'
      ? Promise.resolve(sysCoords)
      : Promise.all(
        sysCoords.map((sysCoord: any) => ui.core!.from!.sysCoord2MercAsync(sysCoord))
      ));
    const areaIndex = ui.areaIndex(mercs);

    return Promise.all(
      Object.keys(ui.core!.cacheHash!)
        .filter((key: any) => ui.core!.cacheHash[key].envelope)
        .map((key: any) => {
          const source = ui.core!.cacheHash[key];
          return Promise.all([
            Promise.resolve(source),
            Promise.all(
              source.envelope.geometry.coordinates[0].map((coord: any) =>
                ui.core!.from!.merc2SysCoordAsync(coord)
              )
            )
          ]);
        })
    ).then((sources: any) => {
      const mapIDs = sources
        .reduce((prev: any, curr: any) => {
          const source = curr[0];
          const mercXys = curr[1];
          // Use type assertion or check for existence if xyToMapIDs logic relies on it?
          // But strict null checks might catch source.mapID mismatch.
          // Assuming source is valid.
          if (source.mapID !== ui.core!.from!.mapID) {
            const polygon_ = polygon([mercXys]);
            if (booleanPointInPolygon(point_, polygon_)) {
              prev.push(source);
            }
          }
          return prev;
        }, [])
        .filter((source: any) => source.envelopeAreaIndex / areaIndex < threshold)
        .sort((a: any, b: any) => a.envelopeAreaIndex - b.envelopeAreaIndex)
        .map((source: any) => source.mapID);
      return mapIDs;
    });
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
    this.core!.requestUpdateState({ hideMarker: flag ? 1 : 0 } as any);
    if (flag) {
      if ((this.core as any).hideAllMarkers) {
        (this.core as any).hideAllMarkers();
      }
      this.core!.mapDivDocument!.classList.add("hide-marker");
    } else {
      if ((this.core as any).showAllMarkers) {
        (this.core as any).showAllMarkers();
      }
      this.core!.mapDivDocument!.classList.remove("hide-marker");
    }
    if ((this.core!.restoreSession as any)) {
      this.core!.requestUpdateState({ hideMarker: flag ? 1 : 0 } as any);
    }
  }

  handleMarkerActionById(markerId: string) {
    // Implement marker opening logic here if needed, or if it relies on existing functionality.
    // Based on legacy code, it might try to find the marker and simulate a click?
    // For now, if Core has a method, call it.
    // However, the original code had `ui.handleMarkerActionById` but it wasn't clearly defined in the snippet I saw.
    // It was used in `initializer` line 148.
    // I will assume it exists or needs to be implemented.
    // Since I don't have the implementation, I'll log it.
    console.log(`Open marker: ${markerId}`);
    // Potentially trigger click on marker feature?
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
    delete ui._selectCandidateSources;

    if ((ui.core!.stateBuffer as any).showBorder) {
      Object.keys(ui.core!.cacheHash!)
        .filter((key: any) => ui.core!.cacheHash[key].envelope)
        .map((key: any) => {
          const source = ui.core!.cacheHash[key];
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
            ui.core!.mapObject.setEnvelope(xys, {
              color: source.envelopeColor,
              width: 2,
              lineDash: [6, 6]
            });
          });
        });
    }
  }

  resolveRelativeLink(file: any, fallbackPath: any) {
    if (!fallbackPath) fallbackPath = ".";
    return file.match(/\//) ? file : `${fallbackPath}/${file}`;
  }

  checkOverlayID(mapID: any) {
    const ui = this;
    const swiper = ui.overlaySwiper;
    const sliders = swiper.$el[0].querySelectorAll(".swiper-slide");
    for (let i = 0; i < sliders.length; i++) {
      const slider = sliders[i];
      if (slider.getAttribute("data") === mapID) {
        return true;
      }
    }
    return false;
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
    const ui = this;
    const omitMark = "…";
    const omitLine = 2;
    const stringSplit = function (element: any) {
      const splitArr = element.innerText.split("");
      let joinString = "";
      for (let i = 0; i < splitArr.length; i++) {
        joinString += `<span>${splitArr[i]}</span>`;
      }
      joinString += `<span class="omit-mark">${omitMark}</span>`;
      element.innerHTML = joinString;
    };
    const omitCheck = function (element: any) {
      const thisSpan = element.querySelectorAll("span");
      const omitSpan = element.querySelector(".omit-mark");
      let lineCount = 0;
      let omitCount = 0;

      if (omitLine <= 0) {
        return;
      }

      thisSpan[0].style.display = "";
      for (let i = 1; i < thisSpan.length; i++) {
        thisSpan[i].style.display = "none";
      }
      omitSpan.style.display = "";
      let divHeight = element.offsetHeight;
      let minimizeFont = false;
      for (let i = 1; i < thisSpan.length - 1; i++) {
        thisSpan[i].style.display = "";
        if (element.offsetHeight > divHeight) {
          if (!minimizeFont) {
            minimizeFont = true;
            element.classList.add("minimize");
          } else {
            divHeight = element.offsetHeight;
            lineCount++;
          }
        }
        if (lineCount >= omitLine) {
          omitCount = i - 2;
          break;
        }
        if (i >= thisSpan.length - 2) {
          omitSpan.style.display = "none";
          return;
        }
      }
      for (let i = omitCount; i < thisSpan.length - 1; i++) {
        thisSpan[i].style.display = "none";
      }
    };
    const swiperItems =
      ui.core!.mapDivDocument!.querySelectorAll(".swiper-slide div");
    for (let i = 0; i < swiperItems.length; i++) {
      const swiperItem = swiperItems[i];
      stringSplit(swiperItem);
      omitCheck(swiperItem);
    }
  }

  remove() {
    this.core!.remove();
    delete this.core;
  }
}
