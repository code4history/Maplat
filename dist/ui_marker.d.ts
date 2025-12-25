import { MaplatUi } from './index';
import { MarkerData } from './types';
export declare function poiWebControl(ui: MaplatUi, div: HTMLElement, data: MarkerData): (((_event?: Event) => void) | undefined)[] | undefined;
export declare function handleMarkerAction(ui: MaplatUi, data: MarkerData): void;
export declare function showContextMenu(ui: MaplatUi, list: MarkerData[]): void;
export declare function xyToMapIDs(ui: MaplatUi, xy: any, threshold?: number): Promise<any>;
export declare function setHideMarker(ui: MaplatUi, flag: boolean): void;
export declare function checkOverlayID(ui: MaplatUi, mapID: string): boolean;
export declare function handleMarkerActionById(_ui: MaplatUi, markerId: string): void;
