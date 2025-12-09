import {
  MaplatApp as Core,
  createElement
} from "@maplat/core";
import "ol/ol.css";



import EventTarget from "ol/events/Target.js";
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
import { Navigation, Pagination } from "swiper";
import "swiper/swiper-bundle.css";
import "izitoast/dist/css/iziToast.css";
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
  contextMenu: any;
  splashPromise!: Promise<any>;
  _selectCandidateSources?: any[];
  html!: string;
  enablePoiHtmlNoScroll: boolean = false;
  enableShare: boolean = false;
  enableHideMarker: boolean = false;
  enableBorder: boolean = false;
  enableMarkerList: boolean = false;
  disableNoimage: boolean = false;
  alwaysGpsOn: boolean = false;
  isTouch: boolean = false;
  appEnvelope: boolean = false;
  overlaySwiper: any;

  constructor(appOption: any) {
    super();
    const ui = this;
    this.appOption = appOption;

    if (appOption.stateUrl) {
      page((ctx: any, _next: any) => {
        let pathes = ctx.canonicalPath.split("#!");
        let path = pathes.length > 1 ? pathes[1] : pathes[0];
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
        path.split("/").map((state: any) => {
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
          }
        });
        if (!ui.core) {
          if (restore.mapID) {
            appOption.restore = restore;
          }
          ui.initializer(appOption);
        } else if (restore.mapID) {
          ui.core.waitReady.then(() => {
            ui.core!.changeMap(restore.mapID, restore);
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
        ui.core!.mapDivDocument!.classList.add("hide-marker");
      }
      if (appOption.restore.openedMarker) {
        console.log(appOption.restore.openedMarker);
        ui.core.waitReady.then(() => {
          console.log(`Timeout ${appOption.restore.openedMarker}`);
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
      if (ui.core.initialRestore.hideMarker) {
        ui.core!.mapDivDocument!.classList.add("hide-marker");
      }
    } else {
      ui.setShowBorder(false);
    }

    const enableSplash = !ui.core.initialRestore.mapID;
    const restoreTransparency = ui.core.initialRestore.transparency;
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
    if (ui.core.enableCache) {
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

    let pwaManifest = appOption.pwaManifest;
    let pwaWorker = appOption.pwaWorker;
    let pwaScope = appOption.pwaScope;

    // Add UI HTML Element
    let newElems = createElement(`<d c="ol-control map-title"><s></s></d> 
-<d c="swiper-container ol-control base-swiper prevent-default-ui">
-  <d c="swiper-wrapper"></d> 
-  <d c="swiper-button-next base-next swiper-button-white"></d>
-  <d c="swiper-button-prev base-prev swiper-button-white"></d>
-</d> 
-<d c="swiper-container ol-control overlay-swiper prevent-default-ui">
-  <d c="swiper-wrapper"></d> 
-  <d c="swiper-button-next overlay-next swiper-button-white"></d>
-  <d c="swiper-button-prev overlay-prev swiper-button-white"></d>
-</d> `);
    for (let i = newElems.length - 1; i >= 0; i--) {
      ui.core!.mapDivDocument!.insertBefore(
        newElems[i],
        ui.core!.mapDivDocument!.firstChild
      );
    }
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
          <d c="poi_web_div"></d> 
          <d c="modal_share_poi"></d> 
          <p><img src="" height="0px" width="0px"></p>
        </d> 

        <d c="modal_share_content">
          <d c="modal_share_app"></d>
          <d c="modal_share_pos"></d> 
          <p><img src="" height="0px" width="0px"></p>
        </d> 

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
        pwaManifest = `./pwa/${ui.core.appid}_manifest.json`;
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
          ui.modalSetting("load");
        });
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
        threshold: 2,
        loop: baseSources.length >= 2,
        navigation: {
          nextEl: ".base-next",
          prevEl: ".base-prev"
        }
      }));
      baseSwiper.on("click", (_e: any) => {
        if (!baseSwiper.clickedSlide) return;
        const slide = baseSwiper.clickedSlide;
        ui.core!.changeMap(slide.getAttribute("data") || "");
        delete ui._selectCandidateSources;
        baseSwiper.setSlideIndexAsSelected(
          parseInt(slide.getAttribute("data-swiper-slide-index") || "0", 10)
        );
      });
      if (baseSources.length < 2) {
        ui.core!.mapDivDocument!
          .querySelector(".base-swiper")!
          .classList.add("single-map");
      }
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

      const titleEl = ui.core!.mapDivDocument!.querySelector(".modal_poi_title") || ui.core!.mapDivDocument!.querySelector(".modal_title");
      if (titleEl) (titleEl as HTMLElement).innerText = data.name;

      (ui.core!.mapDivDocument!.querySelector(".modal_poi_content .poi_web_div") as HTMLElement).innerHTML =
        data.desc;

      const img = ui.core!.mapDivDocument!.querySelector(".modal_poi_content img") as HTMLImageElement;
      if (data.image) {
        img.src = data.image;
        img.style.display = "block";
      } else {
        img.style.display = "none";
      }
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
          modal.show();
        } else if (control === "markerList") {
          ui.modalSetting("marker_list");
          modal.show();
        } else if (control === "copyright") {
          ui.modalSetting("map");
          modal.show();
        } else if (control === "border") {
          ui.setShowBorder(!(ui.core!.stateBuffer as any).showBorder);
        } else if (control === "hideMarker") {
          const current = ui.core!.mapDivDocument!.classList.contains("hide-marker");
          ui.setHideMarker(!current);
        }
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
    if (flag) {
      this.core!.hideAllMarkers();
      this.core!.mapDivDocument!.classList.add("hide-marker");
    } else {
      this.core!.showAllMarkers();
      this.core!.mapDivDocument!.classList.remove("hide-marker");
    }
  }

  updateEnvelope() {
    const ui = this;
    if (!ui.core!.mapObject) return;

    ui.core!.mapObject.resetEnvelope();
    delete ui._selectCandidateSources;

    if ((ui.core!.stateBuffer as any).showBorder) {
      Object.keys(ui.core!.cacheHash)
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
