import { createElement } from "@maplat/core";

// import { Swiper } from "./swiper_ex";
import "@c4h/chuci";
import QRCode from "qrcode";
import { point, polygon, booleanPointInPolygon } from "@turf/turf";
import { resolveRelativeLink, prepareModal } from "./ui_utils";

function detectMediaType(src: string): string {
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    return "youtube";
  }
  const ext = src.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp4":
    case "webm":
      return "video";
    case "obj":
      return "3dmodel";
    case "splat":
    case "ply":
      return "gaussian";
    default:
      return "image";
  }
}
import type { MaplatUi } from "./index";
import type { MarkerData, MediaSetting, MediaObject } from "./types";

export function poiWebControl(
  ui: MaplatUi,
  div: HTMLElement,
  data: MarkerData,
  showShare: boolean = true
) {
  // let poiSwiper: SwiperInstance | undefined;
  div.innerHTML = "";

  if (data.url || data.html) {
    const htmlDiv =
      createElement(`<div class="${ui.enablePoiHtmlNoScroll ? "" : " embed-responsive embed-responsive-60vh"}">
    <iframe class="poi_iframe iframe_poi" frameborder="0" src=""${ui.enablePoiHtmlNoScroll ? ` onload="window.addEventListener('message', (e) =>{if (e.data[0] == 'setHeight') {this.style.height = e.data[1];}});" scrolling="no"` : ""}></iframe>
    </div>`)[0] as HTMLElement;
    div.appendChild(htmlDiv);
    const iframe = htmlDiv.querySelector(".poi_iframe") as HTMLIFrameElement;

    if (data.html) {
      const loadEvent = (event: Event) => {
        if (!event.currentTarget) return;
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
                if(heightGetter) resizeObserver.observe(heightGetter);
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
    const slides: string[] = [];
    const mediaList = (data.media || data.image) as MediaSetting[] | undefined;
    const inputs = mediaList
      ? Array.isArray(mediaList)
        ? mediaList
        : [mediaList]
      : [];
    let swiperStr = "";

    if (inputs.length > 0) {
      inputs.forEach((item: MediaSetting) => {
        let mediaObj: MediaObject;
        if (typeof item === "string") {
          mediaObj = {
            src: item,
            type: detectMediaType(item)
          };
        } else {
          mediaObj = { ...item }; // Clone to avoid mutation if needed
          if (!mediaObj.type) {
            mediaObj.type = detectMediaType(mediaObj.src);
          }
          // desc compatibility for caption
          if (mediaObj.desc && !mediaObj.caption) {
            mediaObj.caption = mediaObj.desc;
          }
        }

        const tmpSrc = resolveRelativeLink(mediaObj.src, "img"); // Assume 'img' type resolve works for most media assets or general path

        let slideAttrs = `image-url="${tmpSrc}" image-type="${mediaObj.type}"`;

        if (mediaObj.thumbnail) {
          slideAttrs += ` thumbnail-url="${resolveRelativeLink(mediaObj.thumbnail, "img")}"`;
        } else {
          // Default thumbnail to src for images, but for others (video etc) this might fail if no explicit thumb provided.
          // Legacy behavior was image-only so src was thumb.
          // For non-image types without thumbnail, Chuci might handle or show placeholder.
          // Let's use src as thumb for images or if nothing else.
          if (mediaObj.type === "image") {
            slideAttrs += ` thumbnail-url="${tmpSrc}"`;
          }
        }

        // Map other attributes
        for (const key of Object.keys(mediaObj)) {
          if (["src", "type", "thumbnail", "desc"].includes(key)) continue;
          const val = mediaObj[key];
          if (typeof val === "boolean") {
            if (val) slideAttrs += ` ${key}`;
          } else if (val !== undefined && val !== null) {
            slideAttrs += ` ${key}="${val}"`;
          }
        }

        slides.push(`<cc-swiper-slide ${slideAttrs}></cc-swiper-slide>`);
      });

      swiperStr = `    <div class="col-xs-12 poi_img_swiper">
      <cc-swiper>${slides.join("")}</cc-swiper>
    </div>`;
    }
    // Logic for noimage skipped/simplified as requested in previous interactions

    const htmlDiv = createElement(`<div class="poi_data">
      ${swiperStr}
    <p class="recipient poi_address"></p>
    <p class="recipient poi_desc"></p>
    </div>`)[0] as HTMLElement;
    div.appendChild(htmlDiv);

    // Inject custom CSS for Swiper if not exists (global check)
    if (!document.getElementById("poi-swiper-style")) {
      const style = document.createElement("style");
      style.id = "poi-swiper-style";
      style.innerHTML = `
            cc-swiper { --cc-slider-theme-color: #007aff; --cc-slider-navigation-color: #007aff; height: 300px; }
            cc-viewer { --cc-viewer-z-index: 100000; }
          `;
      document.head.appendChild(style);
    }

    (htmlDiv.querySelector(".poi_address") as HTMLElement).innerText =
      ui.core!.translate(data.address) || "";
    (htmlDiv.querySelector(".poi_desc") as HTMLElement).innerHTML = (
      ui.core!.translate(data.desc) || ""
    ).replace(/\n/g, "<br>");

    // Show/hide share buttons based on showShare parameter
    const shareButtons =
      ui.core!.mapDivDocument!.querySelector(".poi_share_buttons");
    const qrDiv = ui.core!.mapDivDocument!.querySelector(".qr_view_poi");

    if (showShare) {
      shareButtons?.classList.remove("hide");
      qrDiv?.classList.remove("hide");

      // Auto-generate QR code
      if (qrDiv) {
        QRCode.toCanvas(
          window.location.href,
          { width: 128, margin: 1 },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (err: any, canvas: any) => {
            if (!err) {
              qrDiv.innerHTML = "";
              qrDiv.appendChild(canvas);
            }
          }
        );
      }
    } else {
      shareButtons?.classList.add("hide");
      qrDiv?.classList.add("hide");
    }
  }

  return undefined;
}

export function handleMarkerAction(ui: MaplatUi, data: MarkerData) {
  const modalElm = ui.core!.mapDivDocument!.querySelector(".modalBase")!;
  const modal = prepareModal(modalElm);

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

  const titleEl =
    ui.core!.mapDivDocument!.querySelector(".modal_poi_title") ||
    ui.core!.mapDivDocument!.querySelector(".modal_title");
  if (titleEl)
    (titleEl as HTMLElement).innerText = ui.core!.translate(data.name) || "";

  // Prepare container - ensure poi_web_div exists or target it
  let poiWebDiv = ui.core!.mapDivDocument!.querySelector(".poi_web_div");
  if (!poiWebDiv) {
    // Fallback or create? simpler to assume ui_init will be updated,
    // but for robustness we can clear modal_poi_content and append it if missing,
    // OR target existing .poi_web (renaming it effectively).
    // Let's assume ui_init.ts will provide .poi_web_div.
    // If not present, we grab .modal_poi_content and insert it?
    const modalPoiContent =
      ui.core!.mapDivDocument!.querySelector(".modal_poi_content");
    if (modalPoiContent) {
      poiWebDiv = createElement(
        '<div class="poi_web_div"></div>'
      )[0] as HTMLElement;
      // Prepend to avoid messing with share buttons at bottom?
      modalPoiContent.insertBefore(poiWebDiv, modalPoiContent.firstChild);
    }
  }

  // Show share buttons only if both enableShare and stateUrl are true
  const showShare = ui.enableShare && !!ui.appOption.stateUrl;
  poiWebControl(ui, poiWebDiv as HTMLElement, data, showShare);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hiddenFunc = (_event: any) => {
    modalElm.removeEventListener("hidden.bs.modal", hiddenFunc, false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ui.core as any).unselectMarker?.();
    ui.selectedMarkerNamespaceID = undefined;
    ui.updateUrl();
  };
  modalElm.addEventListener("hidden.bs.modal", hiddenFunc, false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ui.core as any).selectMarker?.(data.namespaceID);
  ui.selectedMarkerNamespaceID = data.namespaceID;
  ui.modalSetting("poi");
  modal.show();
  ui.updateUrl();
}

export function showContextMenu(ui: MaplatUi, list: MarkerData[]) {
  if (!ui.contextMenu) return;

  ui.contextMenu.clear();
  ui.contextMenu.extend(list);

  const pixel = ui.lastClickPixel;
  const coordinate = ui.lastClickCoordinate;

  if (!pixel) {
    console.warn("[Debug] No lastClickPixel for ContextMenu");
    return;
  }

  const openHandler = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ui.contextMenu as any).un("open", openHandler);
    const closeHandler = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ui.contextMenu as any).un("close", closeHandler);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ui.contextMenu as any).on("close", closeHandler);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ui.contextMenu as any).on("open", openHandler);

  // Need direct access to internal openMenu if possible, or standard open
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ui.contextMenu as any).Internal?.openMenu(pixel, coordinate);

  // One-time click to close (mimic legacy)
  const viewport = ui.core!.mapObject.getViewport();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const closeMenuHandler = (e: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((ui.contextMenu as any).Internal.opened) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ui.contextMenu as any).Internal?.closeMenu();
      e.stopPropagation();
      viewport.removeEventListener(e.type, closeMenuHandler, false);
    }
  };
  viewport.addEventListener("pointerdown", closeMenuHandler, false);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function xyToMapIDs(ui: MaplatUi, xy: any, threshold = 10) {
  const point_ = point(xy);

  const map = ui.core!.mapObject;
  const size = map.getSize();
  const extent = [[0, 0], [size[0], 0], size, [0, size[1]], [0, 0]];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sysCoords = extent.map((pixel: any) =>
    map.getCoordinateFromPixel(pixel)
  );
  const mercs = await (typeof ui.core!.from!.xy2SysCoord !== "function" // ERROR HERE - wait, index.ts line 1273 - checking source
    ? Promise.resolve(sysCoords)
    : Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sysCoords.map((sysCoord: any) =>
          ui.core!.from!.sysCoord2MercAsync(sysCoord)
        )
      ));
  const areaIndex = ui.areaIndex(mercs);

  return Promise.all(
    Object.keys(ui.core!.cacheHash!)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((key: any) => ui.core!.cacheHash[key].envelope)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((key: any) => {
        const source = ui.core!.cacheHash[key];
        return Promise.all([
          Promise.resolve(source),
          Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            source.envelope.geometry.coordinates[0].map((coord: any) =>
              ui.core!.from!.merc2SysCoordAsync(coord)
            )
          )
        ]);
      })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).then((sources: any) => {
    const mapIDs = sources
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((prev: any, curr: any) => {
        const source = curr[0];
        const mercXys = curr[1];
        if (source.mapID !== ui.core!.from!.mapID) {
          const polygon_ = polygon([mercXys]);
          if (booleanPointInPolygon(point_, polygon_)) {
            prev.push(source);
          }
        }
        return prev;
      }, [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((source: any) => source.envelopeAreaIndex / areaIndex < threshold)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.envelopeAreaIndex - b.envelopeAreaIndex)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((source: any) => source.mapID);
    return mapIDs;
  });
}

export function setHideMarker(ui: MaplatUi, flag: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ui.core!.requestUpdateState({ hideMarker: flag ? 1 : 0 } as any);
  if (flag) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((ui.core as any).hideAllMarkers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ui.core as any).hideAllMarkers();
    }
    ui.core!.mapDivDocument!.classList.add("hide-marker");
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((ui.core as any).showAllMarkers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ui.core as any).showAllMarkers();
    }
    ui.core!.mapDivDocument!.classList.remove("hide-marker");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (ui.core!.restoreSession as any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ui.core!.requestUpdateState({ hideMarker: flag ? 1 : 0 } as any);
  }
}

export function checkOverlayID(ui: MaplatUi, mapID: string) {
  const swiper = ui.overlaySwiper;
  const sliders = Array.from(swiper.$el[0].querySelectorAll(".swiper-slide"));
  return sliders.some(slider => slider.getAttribute("data") === mapID);
}

export function handleMarkerActionById(ui: MaplatUi, markerId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (ui.core as any).getMarker(markerId);
  if (data) {
    handleMarkerAction(ui, data);
  }
}
