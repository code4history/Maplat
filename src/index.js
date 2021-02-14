import { absoluteUrl } from "./absolute_url";
import { Swiper } from "./swiper_ex";
import EventTarget from "ol/events/Target";
import page from "../legacy/page";
import bsn from "../legacy/bootstrap-native";
import { MaplatApp as Core, createElement } from "@maplat/core";
import ContextMenu from "ol-contextmenu";
import iziToast from "../legacy/iziToast";
import QRCode from "../legacy/qrcode";
import { point, polygon } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import sprintf from "../legacy/sprintf";
import { META_KEYS } from "@maplat/core/lib/source/mixin";
import {
  Copyright,
  CompassRotate,
  SetGPS,
  GoHome,
  Maplat,
  Border,
  HideMarker,
  SliderCommon,
  Share,
  Zoom,
  setControlSettings
} from "./maplat_control";
import { asArray } from "ol/color";
import { HistMap } from "@maplat/core/lib/source/histmap";
import { TmsMap } from "@maplat/core/lib/source/tmsmap";
import { NowMap } from "@maplat/core/lib/source/nowmap";
import Weiwudi from "weiwudi";
import { normalizeArg } from "./function";
import pointer from "./pointer_images";

// Maplat UI Class
export class MaplatUi extends EventTarget {
  constructor(appOption) {
    super();
    appOption = normalizeArg(appOption);
    if (appOption.control) {
      setControlSettings(appOption.control);
    }

    const ui = this;
    ui.html_id_seed = `${Math.floor(Math.random() * 9000) + 1000}`;

    if (appOption.stateUrl) {
      page((ctx, _next) => {
        let pathes = ctx.canonicalPath.split("#!");
        let path = pathes.length > 1 ? pathes[1] : pathes[0];
        pathes = path.split("?");
        path = pathes[0];
        if (path === ui.pathThatSet) {
          delete ui.pathThatSet;
          return;
        }
        const restore = {
          transparency: 0,
          position: {
            rotation: 0
          }
        };
        path.split("/").map(state => {
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
            case "c":
              if (ui.core) {
                const modalElm = ui.core.mapDivDocument.querySelector(
                  ".modalBase"
                );
                const modal = new bsn.Modal(modalElm, {
                  root: ui.core.mapDivDocument
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
            ui.core.changeMap(restore.mapID, restore);
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
      ui.initializer(appOption);
    }
  }

  async initializer(appOption) {
    const ui = this;
    appOption.translateUI = true;
    ui.core = new Core(appOption);
    if (appOption.icon) {
      pointer["defaultpin.png"] = appOption.icon;
    }

    if (appOption.restore) {
      ui.setShowBorder(appOption.restore.showBorder || false);
      if (appOption.restore.hideMarker) {
        ui.core.mapDivDocument.classList.add("hide-marker");
      }
    } else if (appOption.restoreSession) {
      const lastEpoch = parseInt(localStorage.getItem("epoch") || 0); // eslint-disable-line no-undef
      const currentTime = Math.floor(new Date().getTime() / 1000);
      if (lastEpoch && currentTime - lastEpoch < 3600) {
        ui.setShowBorder(!!parseInt(localStorage.getItem("showBorder") || "0")); // eslint-disable-line no-undef
      }
      if (ui.core.initialRestore.hideMarker) {
        ui.core.mapDivDocument.classList.add("hide-marker");
      }
    } else {
      ui.setShowBorder(false);
    }

    const enableSplash = !ui.core.initialRestore.mapID;
    const restoreTransparency = ui.core.initialRestore.transparency;
    const enableOutOfMap = !appOption.presentation_mode;

    if (appOption.enableShare) {
      ui.core.mapDivDocument.classList.add("enable_share");
      ui.enableShare = true;
    }
    if (appOption.enableHideMarker) {
      ui.core.mapDivDocument.classList.add("enable_hide_marker");
      ui.enableHideMarker = true;
    }
    if (appOption.enableBorder) {
      ui.core.mapDivDocument.classList.add("enable_border");
      ui.enableBorder = true;
    }
    if (appOption.disableNoimage) {
      ui.disableNoimage = true;
    }
    if (appOption.stateUrl) {
      ui.core.mapDivDocument.classList.add("state_url");
    }
    if (ui.core.enableCache) {
      ui.core.mapDivDocument.classList.add("enable_cache");
    }
    if ("ontouchstart" in window) {
      // eslint-disable-line no-undef
      ui.core.mapDivDocument.classList.add("ol-touch");
    }
    if (appOption.mobileIF) {
      appOption.debug = true;
    }

    let pwaManifest = appOption.pwaManifest;
    let pwaWorker = appOption.pwaWorker;
    let pwaScope = appOption.pwaScope;

    // Add UI HTML Element
    let newElems = createElement(`<d c="ol-control map-title"><s></s></d> 
<d c="swiper-container ol-control base-swiper prevent-default-ui">
  <d c="swiper-wrapper"></d> 
  <d c="swiper-button-next base-next swiper-button-white"></d>
  <d c="swiper-button-prev base-prev swiper-button-white"></d>
</d> 
<d c="swiper-container ol-control overlay-swiper prevent-default-ui">
  <d c="swiper-wrapper"></d> 
  <d c="swiper-button-next overlay-next swiper-button-white"></d>
  <d c="swiper-button-prev overlay-prev swiper-button-white"></d>
</d> `);
    for (let i = newElems.length - 1; i >= 0; i--) {
      ui.core.mapDivDocument.insertBefore(
        newElems[i],
        ui.core.mapDivDocument.firstChild
      );
    }
    const prevDefs = ui.core.mapDivDocument.querySelectorAll(
      ".prevent-default-ui"
    );
    for (let i = 0; i < prevDefs.length; i++) {
      const target = prevDefs[i];
      target.addEventListener("touchstart", evt => {
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
          <s c="modal_hide_marker_title" din="html.hide_marker_title"></s>

        </h4>
      </d> 
      <d c="modal-body">

        <d c="modal_help_content">
          <d c="help_content">
            <s dinh="html.help_using_maplat"></s>
            <p c="col-xs-12 help_img"><img src="${
              pointer["fullscreen.png"]
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
              <li dinh="html.help_etc_slider" c="recipient"></li>
            </ul>
            <p><a href="https://github.com/code4nara/Maplat/wiki" target="_blank">Maplat</a>
              © 2015- Kohei Otsuka, Code for History</p>
          </d> 
        </d> 

        <d c="modal_poi_content">
          <d c="poi_web embed-responsive embed-responsive-60vh">
            <iframe c="poi_iframe iframe_poi" frameborder="0" src=""></iframe>
          </d> 
          <d c="poi_data hide">
            <d c="col-xs-12 swiper-container poi_img_swiper">
              <d c="swiper-wrapper"></d>
              <d c="swiper-button-next poi-img-next"></d>
              <d c="swiper-button-prev poi-img-prev"></d>
            </d>
            <p c="recipient poi_address"></p>
            <p c="recipient poi_desc"></p>
          </d> 
        </d> 

        <d c="modal_share_content">
          <h4 din="html.share_app_title"></h4>
          <d id="___maplat_app_toast_${ui.html_id_seed}"></d> 
          <d c="recipient row">
            <d c="form-group col-xs-4 text-center"><button title="Copy to clipboard" c="share btn btn-light" data="cp_app"><i c="fa fa-clipboard"></i>&nbsp;<small din="html.share_copy"></small></button></d> 
            <d c="form-group col-xs-4 text-center"><button title="Twitter" c="share btn btn-light" data="tw_app"><i c="fa fa-twitter"></i>&nbsp;<small>Twitter</small></button></d> 
            <d c="form-group col-xs-4 text-center"><button title="Facebook" c="share btn btn-light" data="fb_app"><i c="fa fa-facebook"></i>&nbsp;<small>Facebook</small></button></d> 
          </d> 
          <d c="qr_app center-block" style="width:128px;"></d> 
          <d c="modal_share_state">
            <h4 din="html.share_state_title"></h4>
            <d id="___maplat_view_toast_${ui.html_id_seed}"></d> 
            <d c="recipient row">
              <d c="form-group col-xs-4 text-center"><button title="Copy to clipboard" c="share btn btn-light" data="cp_view"><i c="fa fa-clipboard"></i>&nbsp;<small din="html.share_copy"></small></button></d> 
              <d c="form-group col-xs-4 text-center"><button title="Twitter" c="share btn btn-light" data="tw_view"><i c="fa fa-twitter"></i>&nbsp;<small>Twitter</small></button></d> 
              <d c="form-group col-xs-4 text-center"><button title="Facebook" c="share btn btn-light" data="fb_view"><i c="fa fa-facebook"></i>&nbsp;<small>Facebook</small></button></d> 
            </d> 
            <d c="qr_view center-block" style="width:128px;"></d> 
          </d> 
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
          <d c="recipients" c="modal_cache_content"><dl c="dl-horizontal">
            <dt din="html.cache_handle"></dt>
            <dd><s c="cache_size"></s>
              <a c="cache_delete btn btn-default pull-right" href="#" din="html.cache_delete"></a></dd>
          </dl></d> 

        </d> 

        <d c="modal_load_content">
          <p c="recipient"><img src="${
            pointer["loading.png"]
          }"><s din="html.app_loading_body"></s></p>
          <d c="splash_div hide row"><p c="col-xs-12 poi_img"><img c="splash_img" src=""></p></d> 
          <p><img src="" height="0px" width="0px"></p>
        </d> 

        <d c="modal_hide_marker_content">
          <ul c="list-group"></ul>
        </d> 

        <p c="modal_gpsD_content" c="recipient"></p>
        <p c="modal_gpsW_content" c="recipient"></p>

      </d> 
    </d> 
  </d> 
</d> `);
    for (let i = newElems.length - 1; i >= 0; i--) {
      ui.core.mapDivDocument.insertBefore(
        newElems[i],
        ui.core.mapDivDocument.firstChild
      );
    }

    const shareBtns = ui.core.mapDivDocument.querySelectorAll(".btn.share");
    for (let i = 0; i < shareBtns.length; i++) {
      const shareBtn = shareBtns[i];
      shareBtn.addEventListener("click", evt => {
        let btn = evt.target;
        if (!btn.classList.contains("share")) btn = btn.parentElement;
        const cmd = btn.getAttribute("data");
        const cmds = cmd.split("_");
        let base = evt.target.baseURI;
        if (!base) base = window.location.href;
        const div1 = base.split("#!");
        const path = div1.length > 1 ? div1[1].split("?")[0] : "";
        const div2 = div1[0].split("?");
        let uri = div2[0];
        const query =
          div2.length > 1
            ? div2[1]
                .split("&")
                .filter(qs => qs !== "pwa")
                .join("&")
            : "";

        if (query) uri = `${uri}?${query}`;
        if (cmds[1] === "view") {
          if (path) uri = `${uri}#!${path}`;
        }
        if (cmds[0] === "cp") {
          const copyFrom = document.createElement("textarea"); // eslint-disable-line no-undef
          copyFrom.textContent = uri;

          const bodyElm = document.querySelector("body"); // eslint-disable-line no-undef
          bodyElm.appendChild(copyFrom);

          if (/iP(hone|[oa]d)/.test(navigator.userAgent)) {
            // eslint-disable-line no-undef
            const range = document.createRange(); // eslint-disable-line no-undef
            range.selectNode(copyFrom);
            window.getSelection().addRange(range); // eslint-disable-line no-undef
          } else {
            copyFrom.select();
          }

          document.execCommand("copy"); // eslint-disable-line no-undef
          bodyElm.removeChild(copyFrom);
          const toastParent = `#___maplat_${cmds[1]}_toast_${ui.html_id_seed}`;
          iziToast.show({
            message: ui.core.t("app.copy_toast", { ns: "translation" }),
            close: false,
            pauseOnHover: false,
            timeout: 1000,
            progressBar: false,
            target: toastParent
          });
        } else if (cmds[0] === "tw") {
          const twuri = `https://twitter.com/share?url=${encodeURIComponent(
            uri
          )}&hashtags=Maplat`;
          window.open(
            twuri,
            "_blank",
            "width=650,height=450,menubar=no,toolbar=no,scrollbars=yes"
          ); // eslint-disable-line no-undef
        } else if (cmds[0] === "fb") {
          // https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2Fplugins%2Fshare-button%2F&display=popup&ref=plugin&src=like&kid_directed_site=0&app_id=113869198637480
          const fburi = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            uri
          )}&display=popup&ref=plugin&src=like&kid_directed_site=0`;
          window.open(
            fburi,
            "_blank",
            "width=650,height=450,menubar=no,toolbar=no,scrollbars=yes"
          ); // eslint-disable-line no-undef
        }
      });
    }

    // PWA対応: 非同期処理
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
      if (!head.querySelector('link[rel="manifest"]')) {
        head.appendChild(
          createElement(`<link rel="manifest" href="${pwaManifest}">`)[0]
        );
      }
      // service workerが有効なら、service-worker.js を登録します
      try {
        Weiwudi.registerSW(pwaWorker, { scope: pwaScope });
      } catch (e) {} // eslint-disable-line no-empty

      if (!head.querySelector('link[rel="apple-touch-icon"]')) {
        const xhr = new XMLHttpRequest(); // eslint-disable-line no-undef
        xhr.open("GET", pwaManifest, true);
        xhr.responseType = "json";

        xhr.onload = function (_e) {
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

    ui.core.addEventListener("uiPrepare", _evt => {
      const imageExtractor = function (text) {
        const regexp = /\$\{([a-zA-Z0-9_\.\/\-]+)\}/g; // eslint-disable-line no-useless-escape
        let ret = text;
        let match;
        while ((match = regexp.exec(text)) != null) {
          ret = ret.replace(match[0], pointer[match[1]]);
        }
        return ret;
      };
      let i18nTargets = ui.core.mapDivDocument.querySelectorAll("[data-i18n]");
      for (let i = 0; i < i18nTargets.length; i++) {
        const target = i18nTargets[i];
        const key = target.getAttribute("data-i18n");
        target.innerText = imageExtractor(ui.core.t(key));
      }
      i18nTargets = ui.core.mapDivDocument.querySelectorAll("[data-i18n-html]");
      for (let i = 0; i < i18nTargets.length; i++) {
        const target = i18nTargets[i];
        const key = target.getAttribute("data-i18n-html");
        target.innerHTML = imageExtractor(ui.core.t(key));
      }

      const options = {
        reverse: true,
        tipLabel: ui.core.t("control.trans", { ns: "translation" })
      };
      if (restoreTransparency) {
        options.initialValue = restoreTransparency / 100;
      }
      ui.sliderCommon = new SliderCommon(options);
      ui.core.appData.controls = [
        new Copyright({
          tipLabel: ui.core.t("control.info", { ns: "translation" })
        }),
        new CompassRotate({
          tipLabel: ui.core.t("control.compass", { ns: "translation" })
        }),
        new Zoom({
          tipLabel: ui.core.t("control.zoom", { ns: "translation" })
        }),
        new SetGPS({
          tipLabel: ui.core.t("control.gps", { ns: "translation" })
        }),
        new GoHome({
          tipLabel: ui.core.t("control.home", { ns: "translation" })
        }),
        ui.sliderCommon,
        new Maplat({
          tipLabel: ui.core.t("control.help", { ns: "translation" })
        })
      ];
      if (ui.enableShare) {
        ui.core.appData.controls.push(
          new Share({
            tipLabel: ui.core.t("control.share", { ns: "translation" })
          })
        );
      }
      if (ui.enableBorder) {
        ui.core.appData.controls.push(
          new Border({
            tipLabel: ui.core.t("control.border", { ns: "translation" })
          })
        );
      }
      if (ui.enableHideMarker) {
        ui.core.appData.controls.push(
          new HideMarker({
            tipLabel: ui.core.t("control.hide_marker", { ns: "translation" })
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
      ui.core.appData.controls.push(ui.contextMenu);
      ui.contextMenu.Internal.setItemListener = function (li, index) {
        const this_ = this;
        if (li && typeof this.items[index].callback === "function") {
          (function (callback) {
            li.addEventListener("pointerdown", evt => {
              evt.stopPropagation();
            });
            li.addEventListener(
              "click",
              evt => {
                evt.preventDefault();
                const obj = {
                  coordinate: this_.getCoordinateClicked(),
                  data: this_.items[index].data || null
                };
                if (!callback(obj, this_.map)) this_.closeMenu();
              },
              false
            );
          })(this.items[index].callback);
        }
      };

      if (ui.core.mapObject) {
        ui.core.appData.controls.map(control => {
          ui.core.mapObject.addControl(control);
        });
      }

      ui.sliderCommon.on("propertychange", evt => {
        if (evt.key === "slidervalue") {
          ui.core.setTransparency(ui.sliderCommon.get(evt.key) * 100);
        }
      });

      if (enableSplash) {
        // Check Splash data
        let splash = false;
        if (ui.core.appData.splash) splash = true;

        const modalElm = ui.core.mapDivDocument.querySelector(".modalBase");
        const modal = new bsn.Modal(modalElm, { root: ui.core.mapDivDocument });
        ui.core.mapDivDocument.querySelector(
          ".modal_load_title"
        ).innerText = ui.core.translate(ui.core.appData.appName);
        if (splash) {
          ui.core.mapDivDocument
            .querySelector(".splash_img")
            .setAttribute("src", `img/${ui.core.appData.splash}`);
          ui.core.mapDivDocument
            .querySelector(".splash_div")
            .classList.remove("hide");
        }
        ui.modalSetting("load");
        modal.show();

        const fadeTime = splash ? 1000 : 200;
        ui.splashPromise = new Promise(resolve => {
          setTimeout(() => {
            // eslint-disable-line no-undef
            resolve();
          }, fadeTime);
        });
      }

      document.querySelector("title").innerHTML = ui.core.translate(
        ui.core.appName
      ); // eslint-disable-line no-undef
    });

    ui.core.addEventListener("sourceLoaded", evt => {
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
      let cIndex = 0;
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (source.envelope) {
          source.envelopeColor = colors[cIndex];
          cIndex = cIndex + 1;
          if (cIndex === colors.length) cIndex = 0;

          const xys = source.envelope.geometry.coordinates[0];
          source.envelopeAreaIndex =
            0.5 *
            Math.abs(
              [0, 1, 2, 3].reduce((prev, curr, i) => {
                const xy1 = xys[i];
                const xy2 = xys[i + 1];
                return prev + (xy1[0] - xy2[0]) * (xy1[1] + xy2[1]);
              }, 0)
            );
        }
      }

      if (ui.splashPromise) {
        ui.splashPromise.then(() => {
          const modalElm = ui.core.mapDivDocument.querySelector(".modalBase");
          const modal = new bsn.Modal(modalElm, {
            root: ui.core.mapDivDocument
          });
          ui.modalSetting("load");
          modal.hide();
        });
      }

      const baseSources = [];
      const overlaySources = [];
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (source instanceof NowMap && !(source instanceof TmsMap)) {
          baseSources.push(source);
        } else {
          overlaySources.push(source);
        }
      }

      const baseSwiper = (ui.baseSwiper = new Swiper(".base-swiper", {
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
        loop: baseSources.length >= 2,
        navigation: {
          nextEl: ".base-next",
          prevEl: ".base-prev"
        }
      }));
      baseSwiper.on("click", e => {
        e.preventDefault();
        if (!baseSwiper.clickedSlide) return;
        const slide = baseSwiper.clickedSlide;
        ui.core.changeMap(slide.getAttribute("data"));
        delete ui._selectCandidateSources;
        baseSwiper.setSlideIndexAsSelected(
          slide.getAttribute("data-swiper-slide-index")
        );
      });
      if (baseSources.length < 2) {
        ui.core.mapDivDocument
          .querySelector(".base-swiper")
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
      overlaySwiper.on("click", e => {
        e.preventDefault();
        if (!overlaySwiper.clickedSlide) return;
        const slide = overlaySwiper.clickedSlide;
        ui.core.changeMap(slide.getAttribute("data"));
        delete ui._selectCandidateSources;
        overlaySwiper.setSlideIndexAsSelected(
          slide.getAttribute("data-swiper-slide-index")
        );
      });
      if (overlaySources.length < 2) {
        ui.core.mapDivDocument
          .querySelector(".overlay-swiper")
          .classList.add("single-map");
      }

      for (let i = 0; i < baseSources.length; i++) {
        const source = baseSources[i];
        baseSwiper.appendSlide(
          `<div class="swiper-slide" data="${source.mapID}">` +
            `<img crossorigin="anonymous" src="${
              source.thumbnail
            }"><div> ${ui.core.translate(source.label)}</div> </div> `
        );
      }
      for (let i = 0; i < overlaySources.length; i++) {
        const source = overlaySources[i];
        const colorCss = source.envelope ? ` ${source.envelopeColor}` : "";
        overlaySwiper.appendSlide(
          `<div class="swiper-slide${colorCss}" data="${source.mapID}">` +
            `<img crossorigin="anonymous" src="${
              source.thumbnail
            }"><div> ${ui.core.translate(source.label)}</div> </div> `
        );
      }

      baseSwiper.on;
      overlaySwiper.on;
      baseSwiper.slideToLoop(0);
      overlaySwiper.slideToLoop(0);
      ui.ellips();
    });

    ui.core.addEventListener("mapChanged", evt => {
      const map = evt.detail;

      ui.baseSwiper.setSlideMapID(map.mapID);
      ui.overlaySwiper.setSlideMapID(map.mapID);

      const title = map.officialTitle || map.title || map.label;
      ui.core.mapDivDocument.querySelector(
        ".map-title span"
      ).innerText = ui.core.translate(title);

      if (ui.checkOverlayID(map.mapID)) {
        ui.sliderCommon.setEnable(true);
      } else {
        ui.sliderCommon.setEnable(false);
      }
      const transparency = ui.sliderCommon.get("slidervalue") * 100;
      ui.core.mapObject.setTransparency(transparency);

      ui.updateEnvelope();
    });

    ui.core.addEventListener("poi_number", evt => {
      const number = evt.detail;
      if (number) {
        ui.core.mapDivDocument.classList.remove("no_poi");
      } else {
        ui.core.mapDivDocument.classList.add("no_poi");
      }
    });

    ui.core.addEventListener("outOfMap", _evt => {
      if (enableOutOfMap) {
        ui.core.mapDivDocument.querySelector(
          ".modal_title"
        ).innerText = ui.core.t("app.out_of_map");
        ui.core.mapDivDocument.querySelector(
          ".modal_gpsD_content"
        ).innerText = ui.core.t("app.out_of_map_area");
        const modalElm = ui.core.mapDivDocument.querySelector(".modalBase");
        const modal = new bsn.Modal(modalElm, { root: ui.core.mapDivDocument });
        ui.modalSetting("gpsD");
        modal.show();
      }
    });

    ui.core.mapDivDocument.addEventListener("mouseout", _evt => {
      if (ui._selectCandidateSources) {
        Object.keys(ui._selectCandidateSources).forEach(key =>
          ui.core.mapObject.removeEnvelope(ui._selectCandidateSources[key])
        );
        delete ui._selectCandidateSources;
      }
    });

    ui.core.addEventListener("pointerMoveOnMapXy", evt => {
      if (!ui.core.stateBuffer.showBorder) {
        if (ui._selectCandidateSources) {
          Object.keys(ui._selectCandidateSources).forEach(key =>
            ui.core.mapObject.removeEnvelope(ui._selectCandidateSources[key])
          );
          delete ui._selectCandidateSources;
        }
        return;
      }

      ui.xyToMapIDs(evt.detail, mapIDs => {
        ui.showFillEnvelope(mapIDs);
      });
    });

    ui.core.addEventListener("clickMapXy", evt => {
      if (!ui.core.stateBuffer.showBorder) {
        return;
      }

      ui.xyToMapIDs(evt.detail, mapIDs => {
        if (mapIDs.length > 0) {
          const mapIDs_ = mapIDs.map(id => id);
          let currentID;
          showContextMenu(
            mapIDs.map(mapID => {
              const source = ui.core.cacheHash[mapID];
              const hexColor = source.envelopeColor;
              let iconSVG = `<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
x="0px" y="0px" width="10px" height="10px" viewBox="0 0 10 10"
enable-background="new 0 0 10 10" xml:space="preserve">
<polygon x="0" y="0" points="2,2 2,8 8,8 8,2
2,2" stroke="${hexColor}" fill="${hexColor}" stroke-width="2" style="fill-opacity: .25;"></polygon></svg>`;
              iconSVG = `data:image/svg+xml,${encodeURIComponent(iconSVG)}`;
              return {
                icon: iconSVG,
                text: ui.core.translate(ui.core.getMapMeta(mapID).title),
                callback: () => {
                  const lis = [
                    ...ui.core.mapDivDocument.querySelectorAll(
                      ".ol-ctx-menu-container ul li"
                    )
                  ];
                  lis.forEach(li => li.classList.remove("selected"));
                  if (currentID && currentID === mapID) {
                    delete ui._selectCandidateSources;
                    ui.core.changeMap(mapID);
                  } else {
                    currentID = mapID;
                    ui.showFillEnvelope([mapID]);
                    ui.overlaySwiper.slideToMapID(mapID);
                    const index = mapIDs_.indexOf(mapID);
                    if (index > -1) {
                      const li = lis[index];
                      li.classList.add("selected");
                    }
                    return true;
                  }
                },
                mouseOnTask(_evt) {
                  currentID = mapID;
                  ui.showFillEnvelope([mapID]);
                  ui.overlaySwiper.slideToMapID(mapID);
                },
                mouseOutTask(_evt) {
                  currentID = undefined;
                  ui.showFillEnvelope([]);
                }
              };
            })
          );
          ui.showFillEnvelope(mapIDs);
        }
      });
    });

    function showContextMenu(menues) {
      ui.contextMenu.clear();
      const mouseOnTasks = [];
      menues.forEach(menu => {
        ui.contextMenu.push(menu);
        if (menu.mouseOnTask)
          mouseOnTasks.push([menu.mouseOnTask, menu.mouseOutTask]);
      });

      const coordinate = ui.core.lastClickEvent.coordinate;
      const pixel = ui.core.lastClickEvent.pixel;

      if (ui.contextMenu.disabled) return;

      const openHandler = () => {
        ui.contextMenu.removeEventListener("open", openHandler);
        if (mouseOnTasks.length > 0) {
          const lis = [
            ...ui.core.mapDivDocument.querySelectorAll(
              ".ol-ctx-menu-container ul li"
            )
          ];
          const events = lis.map((li, i) => {
            const tasks = mouseOnTasks[i];
            li.addEventListener("mouseover", tasks[0]);
            li.addEventListener("mouseout", tasks[1]);
            return [li, tasks[0], tasks[1]];
          });
          const closeHandler = () => {
            ui.contextMenu.removeEventListener("close", closeHandler);
            events.forEach(event => {
              event[0].removeEventListener("mouseover", event[1]);
              event[0].removeEventListener("mouseout", event[2]);
            });
          };
          ui.contextMenu.on("close", closeHandler);
        }
      };
      ui.contextMenu.on("open", openHandler);
      ui.contextMenu.Internal.openMenu(pixel, coordinate);

      //one-time fire
      ui.core.mapObject.getViewport().addEventListener(
        "pointerdown",
        {
          handleEvent(e) {
            if (ui.contextMenu.Internal.opened) {
              ui.contextMenu.Internal.closeMenu();
              e.stopPropagation();
              ui.core.mapObject
                .getViewport()
                .removeEventListener(e.type, this, false);
            }
          }
        },
        false
      );
    }

    ui.core.addEventListener("clickMarkers", evt => {
      const data = evt.detail;
      if (data.length === 1) {
        ui.handleMarkerAction(data[0]);
      } else {
        showContextMenu(
          data.map(datum => ({
            icon: datum.icon || pointer["defaultpin.png"],
            text: ui.core.translate(datum.name),
            callback() {
              ui.handleMarkerAction(datum);
            }
          }))
        );
      }
    });

    if (appOption.stateUrl) {
      ui.core.addEventListener("updateState", evt => {
        const value = evt.detail;
        if (!value.position || !value.mapID) return;
        let link = `s:${value.mapID}`;
        if (value.backgroundID) link = `${link}/b:${value.backgroundID}`;
        if (value.transparency) link = `${link}/t:${value.transparency}`;
        link = `${link}/x:${value.position.x}/y:${value.position.y}`;
        link = `${link}/z:${value.position.zoom}`;
        if (value.position.rotation)
          link = `${link}/r:${value.position.rotation}`;
        if (value.showBorder) link = `${link}/sb:${value.showBorder}`;
        if (value.hideMarker) link = `${link}/hm:${value.hideMarker}`;
        if (value.hideLayer) link = `${link}/hl:${value.hideLayer}`;

        ui.pathThatSet = link;
        page(link);
      });
    }

    ui.waitReady = ui.core.waitReady.then(() => {
      const fakeGps = appOption.fake ? ui.core.appData.fake_gps : false;
      const fakeCenter = appOption.fake ? ui.core.appData.fake_center : false;
      const fakeRadius = appOption.fake ? ui.core.appData.fake_radius : false;

      let shown = false;
      let gpsWaitPromise = null;
      function showGPSresult(result) {
        if (result && result.error) {
          ui.core.currentPosition = null;
          if (result.error === "gps_out" && shown) {
            shown = false;
            const modalElm = ui.core.mapDivDocument.querySelector(".modalBase");
            const modal = new bsn.Modal(modalElm, {
              root: ui.core.mapDivDocument
            });
            ui.core.mapDivDocument.querySelector(
              ".modal_title"
            ).innerText = ui.core.t("app.out_of_map");
            ui.core.mapDivDocument.querySelector(
              ".modal_gpsD_content"
            ).innerText = ui.core.t("app.out_of_map_desc");
            ui.modalSetting("gpsD");
            modal.show();
          }
        } else {
          ui.core.currentPosition = result;
        }
        if (shown) {
          shown = false;
          const modalElm = ui.core.mapDivDocument.querySelector(".modalBase");
          const modal = new bsn.Modal(modalElm, {
            root: ui.core.mapDivDocument
          });
          modal.hide();
        }
      }
      ui.core.mapObject.on("gps_request", () => {
        gpsWaitPromise = "gps_request";
        const promises = [
          new Promise(resolve => {
            if (gpsWaitPromise !== "gps_request") {
              resolve(gpsWaitPromise);
            } else gpsWaitPromise = resolve;
          })
        ];
        shown = true;
        const modalElm = ui.core.mapDivDocument.querySelector(".modalBase");
        const modal = new bsn.Modal(modalElm, { root: ui.core.mapDivDocument });
        ui.modalSetting("gpsW");
        modal.show();
        // 200m秒以上最低待たないと、Modalがうまく動かない場合がある
        promises.push(
          new Promise(resolve => {
            setTimeout(resolve, 200); // eslint-disable-line no-undef
          })
        );
        Promise.all(promises).then(results => {
          showGPSresult(results[0]);
        });
      });
      ui.core.mapObject.on("gps_result", evt => {
        if (gpsWaitPromise === "gps_request") {
          gpsWaitPromise = evt.frameState;
        } else if (gpsWaitPromise) {
          gpsWaitPromise(evt.frameState);
          gpsWaitPromise = null;
        } else if (!shown) {
          showGPSresult(evt.frameState);
        }
      });

      let qr_app;
      let qr_view;
      ui.core.mapObject.on("click_control", async evt => {
        const control = evt.frameState.control;
        const modalElm = ui.core.mapDivDocument.querySelector(".modalBase");
        const modal = new bsn.Modal(modalElm, { root: ui.core.mapDivDocument });
        if (control === "copyright") {
          const from = ui.core.getMapMeta();

          if (
            !META_KEYS.reduce((prev, curr) => {
              if (curr === "title") return prev;
              return from[curr] || prev;
            }, false)
          )
            return;

          ui.core.mapDivDocument.querySelector(
            ".modal_title"
          ).innerText = ui.core.translate(from.officialTitle || from.title);
          META_KEYS.map(key => {
            if (key === "title" || key === "officialTitle") return;
            if (!from[key] || from[key] === "") {
              ui.core.mapDivDocument
                .querySelector(`.${key}_div`)
                .classList.add("hide");
            } else {
              ui.core.mapDivDocument
                .querySelector(`.${key}_div`)
                .classList.remove("hide");
              ui.core.mapDivDocument.querySelector(`.${key}_dd`).innerHTML =
                key === "license" || key === "dataLicense"
                  ? `<img src="${
                      pointer[
                        `${from[key].toLowerCase().replace(/ /g, "_")}.png`
                      ]
                    }">`
                  : ui.core.translate(from[key]);
            }
          });

          const putTileCacheSize = function (size) {
            let unit = "Bytes";
            if (size > 1024) {
              size = Math.round((size * 10) / 1024) / 10;
              unit = "KBytes";
            }
            if (size > 1024) {
              size = Math.round((size * 10) / 1024) / 10;
              unit = "MBytes";
            }
            if (size > 1024) {
              size = Math.round((size * 10) / 1024) / 10;
              unit = "GBytes";
            }
            ui.core.mapDivDocument.querySelector(
              ".cache_size"
            ).innerHTML = `${size} ${unit}`;
          };

          ui.modalSetting("map");
          const deleteButton = document.querySelector(".cache_delete"); // eslint-disable-line no-undef
          const deleteFunc = async function (evt) {
            evt.preventDefault();
            const from = ui.core.getMapMeta();
            await ui.core.clearMapTileCacheAsync(from.mapID);
            putTileCacheSize(
              await ui.core.getMapTileCacheSizeAsync(from.mapID)
            );
          };
          const hideFunc = function (_event) {
            deleteButton.removeEventListener("click", deleteFunc, false);
            modalElm.removeEventListener("hide.bs.modal", hideFunc, false);
          };
          modalElm.addEventListener("hide.bs.modal", hideFunc, false);

          putTileCacheSize(await ui.core.getMapTileCacheSizeAsync(from.mapID));

          modal.show();
          setTimeout(() => {
            // eslint-disable-line no-undef
            deleteButton.addEventListener("click", deleteFunc, false);
          }, 100);
        } else if (control === "help") {
          ui.modalSetting("help");
          modal.show();
        } else if (control === "share") {
          ui.modalSetting("share");

          const base = location.href; // eslint-disable-line no-undef
          const div1 = base.split("#!");
          const path = div1.length > 1 ? div1[1].split("?")[0] : "";
          const div2 = div1[0].split("?");
          let uri = div2[0];
          const query =
            div2.length > 1
              ? div2[1]
                  .split("&")
                  .filter(qs => qs !== "pwa")
                  .join("&")
              : "";

          if (query) uri = `${uri}?${query}`;
          let view = uri;
          if (path) view = `${view}#!${path}`;
          if (!qr_app) {
            qr_app = new QRCode(
              ui.core.mapDivDocument.querySelector(".qr_app"),
              {
                text: uri,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
              }
            );
          } else {
            qr_app.makeCode(uri);
          }
          if (!qr_view) {
            qr_view = new QRCode(
              ui.core.mapDivDocument.querySelector(".qr_view"),
              {
                text: view,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
              }
            );
          } else {
            qr_view.makeCode(view);
          }

          modal.show();
        } else if (control === "border") {
          const flag = !ui.core.stateBuffer.showBorder;
          ui.setShowBorder(flag);
        } else if (control === "hideMarker") {
          const flag = !ui.core.stateBuffer.hideMarker;
          ui.setHideMarker(flag);
        } else if (control === "hideLayer") {
          ui.modalSetting("hide_marker");
          const layers = ui.core.listPoiLayers(false, true);
          const elem = ui.core.mapDivDocument.querySelector("ul.list-group");
          const modalElm = ui.core.mapDivDocument.querySelector(".modalBase");
          elem.innerHTML = "";
          layers.map((layer, index) => {
            const icon = layer.icon || pointer["defaultpin.png"];
            const title = ui.core.translate(layer.name);
            const check = !layer.hide;
            const id = layer.namespaceID;
            const newElems = createElement(`<li c="list-group-item">
  <d c="row">
    <d c="col-sm-1"><img c="markerlist" src="${icon}"></d> 
    <d c="col-sm-9">${title}</d> 
    <d c="col-sm-2">
      <input type="checkbox" c="markerlist" data="${id}" id="___maplat_marker_${index}_${
              ui.html_id_seed
            }"${check ? " checked" : ""}/>
      <label c="check" for="___maplat_marker_${index}_${
              ui.html_id_seed
            }"><d> </d> </label>
    </d> 
  </d> 
</li>`);
            for (let i = 0; i < newElems.length; i++) {
              elem.appendChild(newElems[i]);
            }
            const checkbox = ui.core.mapDivDocument.querySelector(
              `#___maplat_marker_${index}_${ui.html_id_seed}`
            );
            const checkFunc = function (event) {
              const id = event.target.getAttribute("data");
              const checked = event.target.checked;
              if (checked) ui.core.showPoiLayer(id);
              else ui.core.hidePoiLayer(id);
            };
            const hideFunc = function (_event) {
              modalElm.removeEventListener("hide.bs.modal", hideFunc, false);
              checkbox.removeEventListener("change", checkFunc, false);
            };
            modalElm.addEventListener("hide.bs.modal", hideFunc, false);
            checkbox.addEventListener("change", checkFunc, false);
          });
          modal.show();
        }
      });
      if (fakeGps) {
        const newElem = createElement(
          sprintf(
            ui.core.t("app.fake_explanation"),
            ui.core.translate(fakeCenter),
            fakeRadius
          )
        )[0];
        const elem = ui.core.mapDivDocument.querySelector(
          ".modal_gpsW_content"
        );
        elem.appendChild(newElem);
      } else {
        const newElem = createElement(ui.core.t("app.acquiring_gps_desc"))[0];
        const elem = ui.core.mapDivDocument.querySelector(
          ".modal_gpsW_content"
        );
        elem.appendChild(newElem);
      }
      if (ui.waitReadyBridge) {
        ui.waitReadyBridge();
        delete ui.waitReadyBridge;
      }
    });
  }

  // Modal記述の動作を調整する関数
  modalSetting(target) {
    const modalElm = this.core.mapDivDocument.querySelector(".modalBase");
    ["poi", "map", "load", "gpsW", "gpsD", "help", "share", "hide_marker"].map(
      target_ => {
        const className = `modal_${target_}`;
        if (target === target_) {
          modalElm.classList.add(className);
        } else {
          modalElm.classList.remove(className);
        }
      }
    );
  }

  handleMarkerAction(data) {
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
        window.open(href, "_blank"); // eslint-disable-line no-undef
      } else {
        window.location.href = href; // eslint-disable-line no-undef
      }
      return;
    }

    this.core.mapDivDocument.querySelector(
      ".modal_title"
    ).innerText = this.core.translate(data.name);
    const modalElm = this.core.mapDivDocument.querySelector(".modalBase");
    if (data.url || data.html) {
      this.core.mapDivDocument
        .querySelector(".poi_web")
        .classList.remove("hide");
      this.core.mapDivDocument.querySelector(".poi_data").classList.add("hide");
      const iframe = this.core.mapDivDocument.querySelector(".poi_iframe");
      if (data.html) {
        iframe.addEventListener("load", function loadEvent(event) {
          event.currentTarget.removeEventListener(event.type, loadEvent);
          const cssLink = createElement(
            '<style type="text/css">html, body { height: 100vh; }\n img { width: 100vw; }</style>'
          );
          console.log(cssLink); // eslint-disable-line no-undef
          iframe.contentDocument.head.appendChild(cssLink[0]);
        });
        iframe.removeAttribute("src");
        iframe.setAttribute("srcdoc", this.core.translate(data.html));
      } else {
        iframe.removeAttribute("srcdoc");
        iframe.setAttribute("src", this.core.translate(data.url));
      }
    } else {
      this.core.mapDivDocument
        .querySelector(".poi_data")
        .classList.remove("hide");
      this.core.mapDivDocument.querySelector(".poi_web").classList.add("hide");

      const slides = [];
      if (data.image && data.image !== "") {
        const images = Array.isArray(data.image) ? data.image : [data.image];
        images.forEach(image => {
          if (typeof image === "string") {
            image = { src: image };
          }
          const tmpImg = this.resolveRelativeLink(image.src, "img");
          let slide = `<a target="_blank" href="${tmpImg}"><img src="${tmpImg}"></a>`;
          if (image.desc) slide = `${slide}<div>${image.desc}</div>`;
          slides.push(`<div class="swiper-slide">${slide}</div>`);
        });
      } else if (!this.disableNoimage) {
        slides.push(
          `<div class="swiper-slide"><img src="${pointer["no_image.png"]}"></div>`
        );
      }

      const imgShowFunc = _event => {
        modalElm.removeEventListener("shown.bs.modal", imgShowFunc, false);
        const swiperDiv = this.core.mapDivDocument.querySelector(
          ".swiper-container.poi_img_swiper"
        );
        if (slides.length === 0) {
          swiperDiv.classList.add("hide");
        } else {
          swiperDiv.classList.remove("hide");
          if (!this.poiSwiper) {
            this.poiSwiper = new Swiper(".swiper-container.poi_img_swiper", {
              lazy: true,
              pagination: {
                el: ".swiper-pagination",
                clickable: true
              },
              navigation: {
                nextEl: ".poi-img-next",
                prevEl: ".poi-img-prev"
              }
            });
          }
          slides.forEach(slide => this.poiSwiper.appendSlide(slide));
        }
      };
      modalElm.addEventListener("shown.bs.modal", imgShowFunc, false);

      this.core.mapDivDocument.querySelector(
        ".poi_address"
      ).innerText = this.core.translate(data.address);
      this.core.mapDivDocument.querySelector(
        ".poi_desc"
      ).innerHTML = this.core.translate(data.desc).replace(/\n/g, "<br>");
    }
    const modal = new bsn.Modal(modalElm, { root: this.core.mapDivDocument });
    this.core.selectMarker(data.namespaceID);
    const hideFunc = _event => {
      modalElm.removeEventListener("hide.bs.modal", hideFunc, false);
      this.core.unselectMarker();
    };
    const hiddenFunc = _event => {
      modalElm.removeEventListener("hidden.bs.modal", hiddenFunc, false);
      if (this.poiSwiper) {
        this.poiSwiper.removeAllSlides();
        this.poiSwiper = undefined;
      }
    };
    modalElm.addEventListener("hide.bs.modal", hideFunc, false);
    modalElm.addEventListener("hidden.bs.modal", hiddenFunc, false);
    this.modalSetting("poi");
    modal.show();
  }

  showFillEnvelope(mapIDs) {
    const ui = this;
    if (mapIDs.length > 0) {
      if (!ui._selectCandidateSources) ui._selectCandidateSources = {};
      Object.keys(ui._selectCandidateSources).forEach(key => {
        const index = mapIDs.indexOf(key);
        if (index < 0) {
          ui.core.mapObject.removeEnvelope(ui._selectCandidateSources[key]);
          delete ui._selectCandidateSources[key];
        } else mapIDs.splice(index, 1);
      });

      mapIDs.forEach(mapID => {
        if (mapID !== ui.core.from.mapID) {
          const source = ui.core.cacheHash[mapID];
          const xyPromises = source.envelope.geometry.coordinates[0].map(
            coord => ui.core.from.merc2XyAsync(coord)
          );
          const hexColor = source.envelopeColor;
          let color = asArray(hexColor);
          color = color.slice();
          color[3] = 0.2;

          Promise.all(xyPromises).then(xys => {
            ui._selectCandidateSources[
              mapID
            ] = ui.core.mapObject.setFillEnvelope(xys, null, { color });
          });
        }
      });
    } else {
      if (ui._selectCandidateSources) {
        Object.keys(ui._selectCandidateSources).forEach(key =>
          ui.core.mapObject.removeEnvelope(ui._selectCandidateSources[key])
        );
        delete ui._selectCandidateSources;
      }
    }
  }

  async xyToMapIDs(xy, callback) {
    const ui = this;
    const point_ = point(xy);
    Promise.all(
      Object.keys(ui.core.cacheHash)
        .filter(key => ui.core.cacheHash[key].envelope)
        .map(key => {
          const source = ui.core.cacheHash[key];
          return Promise.all([
            Promise.resolve(source),
            Promise.all(
              source.envelope.geometry.coordinates[0].map(coord =>
                ui.core.from.merc2XyAsync(coord)
              )
            )
          ]);
        })
    ).then(sources => {
      const mapIDs = sources.reduce((prev, curr) => {
        const source = curr[0];
        const mercXys = curr[1];
        if (source.mapID !== ui.core.from.mapID) {
          const polygon_ = polygon([mercXys]);
          if (booleanPointInPolygon(point_, polygon_)) {
            prev.push(source.mapID);
          }
        }
        return prev;
      }, []);
      callback(mapIDs);
    });
  }

  setShowBorder(flag) {
    this.core.requestUpdateState({ showBorder: flag ? 1 : 0 });
    this.updateEnvelope();
    if (flag) {
      this.core.mapDivDocument.classList.add("show-border");
    } else {
      this.core.mapDivDocument.classList.remove("show-border");
    }
    if (this.core.restoreSession) {
      const currentTime = Math.floor(new Date().getTime() / 1000);
      localStorage.setItem("epoch", currentTime); // eslint-disable-line no-undef
      localStorage.setItem("showBorder", flag ? 1 : 0); // eslint-disable-line no-undef
    }
  }

  setHideMarker(flag) {
    if (flag) {
      this.core.hideAllMarkers();
      this.core.mapDivDocument.classList.add("hide-marker");
    } else {
      this.core.showAllMarkers();
      this.core.mapDivDocument.classList.remove("hide-marker");
    }
  }

  updateEnvelope() {
    const ui = this;
    if (!ui.core.mapObject) return;

    ui.core.mapObject.resetEnvelope();
    delete ui._selectCandidateSources;

    if (ui.core.stateBuffer.showBorder) {
      Object.keys(ui.core.cacheHash)
        .filter(key => ui.core.cacheHash[key].envelope)
        .map(key => {
          const source = ui.core.cacheHash[key];
          const xyPromises =
            key === ui.core.from.mapID && source instanceof HistMap
              ? [
                  [0, 0],
                  [source.width, 0],
                  [source.width, source.height],
                  [0, source.height],
                  [0, 0]
                ].map(xy => Promise.resolve(source.xy2HistMapCoords(xy)))
              : source.envelope.geometry.coordinates[0].map(coord =>
                  ui.core.from.merc2XyAsync(coord)
                );

          Promise.all(xyPromises).then(xys => {
            ui.core.mapObject.setEnvelope(xys, {
              color: source.envelopeColor,
              width: 2,
              lineDash: [6, 6]
            });
          });
        });
    }
  }

  resolveRelativeLink(file, fallbackPath) {
    if (!fallbackPath) fallbackPath = ".";
    return file.match(/\//) ? file : `${fallbackPath}/${file}`;
  }

  checkOverlayID(mapID) {
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

  ellips() {
    const ui = this;
    const omitMark = "…";
    const omitLine = 2;
    const stringSplit = function (element) {
      const splitArr = element.innerText.split("");
      let joinString = "";
      for (let i = 0; i < splitArr.length; i++) {
        joinString += `<span>${splitArr[i]}</span>`;
      }
      joinString += `<span class="omit-mark">${omitMark}</span>`;
      element.innerHTML = joinString;
    };
    const omitCheck = function (element) {
      const thisSpan = element.querySelectorAll("span");
      const omitSpan = element.querySelector(".omit-mark");
      let lineCount = 0;
      let omitCount;

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
    const swiperItems = ui.core.mapDivDocument.querySelectorAll(
      ".swiper-slide div"
    );
    for (let i = 0; i < swiperItems.length; i++) {
      const swiperItem = swiperItems[i];
      stringSplit(swiperItem);
      omitCheck(swiperItem);
    }
  }

  remove() {
    this.core.remove();
    delete this.core;
  }
}
