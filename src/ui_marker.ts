import { createElement } from "@maplat/core";
import * as bsn from "bootstrap.native";
import { Swiper } from "./swiper_ex";
import { point, polygon, booleanPointInPolygon } from "@turf/turf";
import { resolveRelativeLink } from "./ui_utils";
import type { MaplatUi } from "./index";
import type { MarkerData, SwiperInstance } from "./types";

export function poiWebControl(
  ui: MaplatUi,
  div: HTMLElement,
  data: MarkerData
) {
  let imgShowFunc: ((_event?: Event) => void) | undefined;
  let imgHideFunc: (() => void) | undefined;
  let poiSwiper: SwiperInstance | undefined;
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
    const htmlDiv = createElement(`<div class="poi_data">
    <div class="col-xs-12 swiper-container poi_img_swiper">
      <div class="swiper-wrapper"></div>
      <div class="swiper-pagination poi-pagination"></div>
      <div class="swiper-button-next poi-img-next"></div>
      <div class="swiper-button-prev poi-img-prev"></div>
    </div>
    <p class="recipient poi_address"></p>
    <p class="recipient poi_desc"></p>
    </div>`)[0] as HTMLElement;
    div.appendChild(htmlDiv);

    const slides: string[] = [];
    if (data.image && data.image !== "") {
      const images = Array.isArray(data.image) ? data.image : [data.image];
      images.forEach((image: string | { src: string; desc?: string }) => {
        if (typeof image === "string") {
          image = { src: image };
        }
        const tmpImg = resolveRelativeLink(image.src, "img");
        let slide = `<a target="_blank" href="${tmpImg}"><img src="${tmpImg}"></a>`;
        if (image.desc) slide = `${slide}<div>${image.desc}</div>`;
        slides.push(`<div class="swiper-slide">${slide}</div>`);
      });
    }
    // Logic for noimage skipped/simplified as requested in previous interactions

    imgShowFunc = (_event?: Event) => {
      const swiperDiv = htmlDiv.querySelector(
        ".swiper-container.poi_img_swiper"
      ) as HTMLElement;
      if (slides.length === 0) {
        swiperDiv.classList.add("hide");
      } else {
        swiperDiv.classList.remove("hide");

        // Ensure unique classes for multiple swipers if needed, but scoping to div helps
        // Actually legacy uses new Swiper(swiperDiv...) so element reference is fine

        // Inject custom CSS for Swiper if not exists (global check)
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

        poiSwiper = new Swiper(swiperDiv, {
          lazy: true,
          pagination: {
            el: htmlDiv.querySelector(".poi-pagination") as HTMLElement,
            clickable: true
          },
          navigation: {
            nextEl: htmlDiv.querySelector(".poi-img-next") as HTMLElement,
            prevEl: htmlDiv.querySelector(".poi-img-prev") as HTMLElement
          },
          observer: true,
          observeParents: true
        });
        slides.forEach(slide => poiSwiper!.appendSlide(slide));
      }
    };

    imgHideFunc = () => {
      if (poiSwiper) {
        poiSwiper.destroy(true, true);
        poiSwiper = undefined;
      }
    };

    (htmlDiv.querySelector(".poi_address") as HTMLElement).innerText =
      ui.core!.translate(data.address) || "";
    (htmlDiv.querySelector(".poi_desc") as HTMLElement).innerHTML = (
      ui.core!.translate(data.desc) || ""
    ).replace(/\n/g, "<br>");
  }

  return imgShowFunc ? [imgShowFunc, imgHideFunc] : undefined;
}

export function handleMarkerAction(ui: MaplatUi, data: MarkerData) {
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

  const poiImgFunc = poiWebControl(ui, poiWebDiv as HTMLElement, data);

  if (poiImgFunc) {
    const poiImgShow = poiImgFunc[0],
      poiImgHide = poiImgFunc[1];
    const poiImgShowWrap = () => {
      modalElm.removeEventListener("shown.bs.modal", poiImgShowWrap, false);
      if (poiImgShow) poiImgShow();
    };
    modalElm.addEventListener("shown.bs.modal", poiImgShowWrap, false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hiddenFunc = (_event: any) => {
      modalElm.removeEventListener("hidden.bs.modal", hiddenFunc, false);
      if (poiImgHide) poiImgHide();
      ui.core!.unselectMarker();
    };
    modalElm.addEventListener("hidden.bs.modal", hiddenFunc, false);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hiddenFunc = (_event: any) => {
      modalElm.removeEventListener("hidden.bs.modal", hiddenFunc, false);
      ui.core!.unselectMarker();
    };
    modalElm.addEventListener("hidden.bs.modal", hiddenFunc, false);
  }

  ui.core!.selectMarker(data.namespaceID);
  ui.modalSetting("poi");
  modal.show();
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
  const sliders = swiper.$el[0].querySelectorAll(".swiper-slide");
  for (let i = 0; i < sliders.length; i++) {
    const slider = sliders[i];
    if (slider.getAttribute("data") === mapID) {
      return true;
    }
  }
  return false;
}

export function handleMarkerActionById(_ui: MaplatUi, markerId: string) {
  console.log(`Open marker: ${markerId}`);
}
