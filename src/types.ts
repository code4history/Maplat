// Type definitions for Maplat UI

import { Swiper as SwiperClass } from "swiper";
import type { Control } from "ol/control";

export interface MaplatAppOption {
  appid?: string;
  fake?: boolean;
  pwaManifest?: boolean | string;
  pwaWorker?: string;
  pwaScope?: string;
  overlay?: boolean;
  enableHideMarker?: boolean;
  enableMarkerList?: boolean;
  enableBorder?: boolean;
  enableCache?: boolean;
  stateUrl?: boolean;
  enableShare?: boolean;
  enablePoiHtmlNoScroll?: boolean;
  disableNoimage?: boolean;
  alwaysGpsOn?: boolean;
  mobileIF?: boolean;
  debug?: boolean;
  appEnvelope?: boolean;
  mapboxToken?: string;
  googleApiKey?: string;
  lang?: string;
  restore?: RestoreState;
  restoreSession?: boolean;
  presentationMode?: boolean;
  northTop?: boolean;
  mapboxgl?: unknown;
  maplibregl?: unknown;
  markerList?: boolean;
  icon?: string;
  translateUI?: boolean;
}

export interface RestoreState {
  mapID?: string;
  backgroundID?: string;
  transparency?: number;
  position?: {
    rotation?: number;
    zoom?: number;
    x?: number;
    y?: number;
  };
  showBorder?: boolean;
  hideMarker?: boolean;
  hideLayer?: string;
  openedMarker?: string;
}

export interface MapSource {
  mapID: string;
  title?: string;
  officialTitle?: string;
  label?: string;
  width?: number;
  height?: number;
  envelope?: {
    geometry: {
      coordinates: number[][][];
    };
  };
  envelopeColor?: string;
  envelopeAreaIndex?: number;
  xy2SysCoord?: (xy: number[]) => Promise<number[]> | number[];
  thumbnail?: string;
}

export type MediaObject = {
  src: string;
  thumbnail?: string;
  type?: string;
  caption?: string;
  desc?: string; // backward compatibility for caption
  // Viewer specific attributes
  "fit-to-container"?: boolean;
  "debug-mode"?: boolean;
  "camera-position"?: string;
  "camera-target"?: string;
  "show-texture"?: boolean;
  [key: string]: unknown;
};

export type MediaSetting = string | MediaObject;

export interface MarkerData {
  markerId: string;
  lnglat?: number[];
  title?: string;
  icon?: string;
  description?: string;
  images?: string[];
  image?: MediaSetting | MediaSetting[];
  media?: MediaSetting | MediaSetting[];
  address?: string;
  desc?: string;
  url?: string;
  html?: string;
  directgo?: string | { href: string; blank?: boolean };
  namespaceID?: string;
  name?: string;
}

export interface ClickMarkersEvent {
  pixel: number[];
  coord: number[];
  list: MarkerData[];
}

export interface ContextMenuInterface {
  clear: () => void;
  extend: (items: unknown[]) => void;
  on: (event: string, handler: (e: unknown) => void) => void;
  un: (event: string, handler: (e: unknown) => void) => void;
  Internal?: {
    openMenu: (pixel: number[], coord: number[]) => void;
    closeMenu: () => void;
    opened: boolean;
  };
}

export interface ClickMarkersEvent {
  pixel: number[];
  coord: number[];
  list: MarkerData[];
}

export type EventCallback = (event: unknown) => void;
export type SwiperInstance = SwiperClass;
export type SliderControl = Control & {
  get(prop: string): number;
  set(prop: string, value: number): void;
  element?: HTMLElement; // Changed from HTMLInputElement to HTMLElement to match common control pattern or just optional
  setEnable(flag: boolean): void;
};

export interface RGB {
  red: number;
  green: number;
  blue: number;
}

import type { MaplatUi } from "./index";

export interface ControlOptions {
  target?: HTMLElement | string;
  render?: (event: import("ol").MapEvent) => void;
  className?: string;
  tipLabel?: string;
  initialValue?: number;
  character?: string;
  callback?: (this: Control) => void;
  long_callback?: (this: Control) => void;
  cls?: string;
  ui?: MaplatUi;
  zoomInLabel?: string | HTMLElement;
  zoomOutLabel?: string | HTMLElement;
  autoHide?: boolean;
  label?: string | HTMLElement;
  reverse?: boolean;
}

export interface ContextMenuItem {
  text?: string;
  classname?: string;
  icon?: string;
  callback?: (
    obj: { coordinate: number[]; data: unknown },
    map: unknown
  ) => void;
  data?: unknown;
  items?: ContextMenuItem[];
  separator?: boolean;
}

export interface ContextMenuOptions {
  width?: number;
  defaultItems?: boolean;
  items?: ContextMenuItem[];
  eventType?: string;
}

export interface ContextMenuInternalItem {
  id: string;
  submenu: number;
  separator: boolean;
  callback?: (
    obj: { coordinate: number[]; data: unknown },
    map: unknown
  ) => void;
  data?: unknown;
}

export interface ContextMenuEvent {
  type: string;
  pixel?: number[];
  coordinate?: number[];
}
