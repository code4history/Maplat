
import {
    MaplatApp as Core,
    createElement
} from "@maplat/core";
import * as bsn from "bootstrap.native";
import pointer from "./pointer_images";
import { Swiper } from "./swiper_ex";
import { Navigation, Pagination } from "swiper";
import "swiper/swiper-bundle.css";
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
import ContextMenu from './contextmenu';
import Weiwudi from 'weiwudi';
import absoluteUrl from "./absolute_url";
import * as QRCode from "qrcode";
import { ellips, isBasemap } from "./ui_utils";
// @ts-ignore
import { handleMarkerAction, showContextMenu, poiWebControl } from "./ui_marker";

Swiper.use([Navigation, Pagination]);

export const META_KEYS = [
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

export async function uiInit(ui: any, appOption: any) {
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
          <d c="poi_web_div"></d>
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
            if (isBasemap(source)) {
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
            threshold: 2,
            preventClicks: true,
            preventClicksPropagation: true,
            observer: true,
            observeParents: true,
            loop: baseSources.length >= 2,
            navigation: {
                nextEl: ".base-next",
                prevEl: ".base-prev"
            }
        }));
        baseSwiper.on("click", (_e: any) => {
            if (!baseSwiper.clickedSlide) return;
            const slide = baseSwiper.clickedSlide;
            ui.core!.changeMap(slide.getAttribute("data")!);
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
            preventClicks: true,
            preventClicksPropagation: true,
            observer: true,
            observeParents: true,
            loop: overlaySources.length >= 2,
            navigation: {
                nextEl: ".overlay-next",
                prevEl: ".overlay-prev"
            }
        }));
        overlaySwiper.on("click", (_e: any) => {
            if (!overlaySwiper.clickedSlide) return;
            const slide = overlaySwiper.clickedSlide;
            ui.core!.changeMap(slide.getAttribute("data")!);
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
            const thumbKey = source.thumbnail ? source.thumbnail.split('/').pop() : "";
            const thumbUrl = (pointer as any)[thumbKey] || source.thumbnail;
            baseSwiper.appendSlide(
                `<div class="swiper-slide" data="${source.mapID}">` +
                `<img crossorigin="anonymous" src="${thumbUrl
                }"><div> ${ui.core!.translate(source.label)}</div> </div> `
            );
        }
        for (let i = 0; i < overlaySources.length; i++) {
            const source = overlaySources[i];
            const colorCss = source.envelope ? ` ${source.envelopeColor}` : "";
            const thumbKey = source.thumbnail ? source.thumbnail.split('/').pop() : "";
            const thumbUrl = (pointer as any)[thumbKey] || source.thumbnail;
            overlaySwiper.appendSlide(
                `<div class="swiper-slide${colorCss}" data="${source.mapID}">` +
                `<img crossorigin="anonymous" src="${thumbUrl
                }"><div> ${ui.core!.translate(source.label)}</div> </div> `
            );
        }

        overlaySwiper.on("slideChange", () => {
            ui.updateEnvelope();
        });

        baseSwiper.slideToLoop(0);
        overlaySwiper.slideToLoop(0);
        ellips(ui.core!.mapDivDocument!);
    });

    ui.core!.waitReady.then(() => {
        // Capture pointerdown at viewport level to ensure we get pixel before any stopPropagation
        ui.core!.mapObject.getViewport().addEventListener("pointerdown", (evt: any) => {
            ui.lastClickPixel = ui.core!.mapObject.getEventPixel(evt);
            ui.lastClickCoordinate = ui.core!.mapObject.getCoordinateFromPixel(ui.lastClickPixel);
        }, true);
    });

    ui.core!.addEventListener("clickMarkers", (evt: any) => {
        const data = evt.detail;
        if (data.length === 1) {
            ui.handleMarkerAction(data[0]);
        } else {
            const list: any[] = [];
            data.forEach((datum: any) => {
                list.push({
                    icon: datum.icon || (pointer as any)["defaultpin.png"],
                    text: ui.core!.translate(datum.name),
                    callback: () => {
                        ui.handleMarkerAction(datum);
                    }
                });
            });
            ui.showContextMenu(list);
        }
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

                const listRoot = modalElm.querySelector(".modal_marker_list_content ul.list-group") as HTMLElement;
                listRoot.innerHTML = "";

                const layers = ui.core!.listPoiLayers(false, true);

                layers.forEach((layer: any) => {
                    // Create Layer Item
                    const layerLi = createElement(`<li class="list-group-item layer">
                        <div class="row layer_row">
                           <div class="layer_label">
                              <span class="dli-chevron"></span>
                              <img src="${layer.icon || (pointer as any)["defaultpin.png"]}" class="markerlist"> ${ui.core!.translate(layer.name)}
                           </div>
                           <div class="layer_onoff">
                              <input type="checkbox" class="markerlist" ${layer.hide ? "" : "checked"}>
                              <label class="check"><div></div></label>
                           </div>
                        </div>
                    </li>`)[0] as HTMLElement;

                    const checkbox = layerLi.querySelector("input[type=checkbox]") as HTMLInputElement;
                    const label = layerLi.querySelector("label.check") as HTMLElement;

                    label.addEventListener("click", (e) => {
                        e.stopPropagation();
                        if (!checkbox.disabled) {
                            checkbox.checked = !checkbox.checked;
                            checkbox.dispatchEvent(new Event('change'));
                        }
                    });

                    checkbox.addEventListener("click", (e) => e.stopPropagation());

                    checkbox.addEventListener("change", (e: any) => {
                        if (e.target.checked) {
                            ui.core!.showPoiLayer(layer.id);
                        } else {
                            ui.core!.hidePoiLayer(layer.id);
                        }
                    });

                    const poiListUl = createElement(`<ul class="list_poiitems_div"></ul>`)[0] as HTMLElement;

                    layerLi.querySelector(".layer_label")!.addEventListener("click", () => {
                        poiListUl.classList.toggle("open");
                    });

                    listRoot.appendChild(layerLi);
                    listRoot.appendChild(poiListUl);

                    if (layer.pois) {
                        layer.pois.forEach((poi: any) => {
                            const poiLi = createElement(`<li class="list-group-item poi">
                                <div class="row poi_row">
                                   <div class="poi_label">
                                      <span class="dli-chevron"></span>
                                      <img src="${poi.icon || layer.icon || (pointer as any)["defaultpin.png"]}" class="markerlist"> ${ui.core!.translate(poi.name)}
                                   </div>
                                </div>
                            </li>`)[0] as HTMLElement;

                            const poiContentDiv = createElement(`<div class="list_poicontent_div"></div>`)[0] as HTMLElement;

                            let poiImgHide: any;

                            poiLi.addEventListener("click", () => {
                                if (!poiContentDiv.classList.contains("open")) {
                                    poiContentDiv.classList.add("open");

                                    const funcs = poiWebControl(ui, poiContentDiv, poi);
                                    if (funcs) {
                                        const [showFunc, hideFunc] = funcs;
                                        poiImgHide = hideFunc;
                                        if (showFunc) showFunc();
                                    }

                                    ui.core!.selectMarker?.(poi.namespaceID);
                                } else {
                                    poiContentDiv.classList.remove("open");

                                    if (poiImgHide) poiImgHide();
                                    poiContentDiv.innerHTML = "";
                                    ui.core!.unselectMarker?.();
                                }
                            });

                            poiListUl.appendChild(poiLi);
                            poiListUl.appendChild(poiContentDiv);
                        });
                    }
                });
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
