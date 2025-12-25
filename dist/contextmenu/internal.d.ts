import { Map, MapEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
/**
 * @class Internal
 */
export declare class Internal {
    Base: any;
    map: Map | undefined;
    viewport: HTMLElement | undefined;
    coordinateClicked: Coordinate | undefined;
    pixelClicked: Pixel | undefined;
    lineHeight: number;
    items: Record<string, import('../types').ContextMenuInternalItem>;
    opened: boolean;
    submenu: {
        left: string;
        top: string;
        lastLeft: string;
        lastTop: string;
    };
    eventHandler: (evt: Event) => void;
    eventMapMoveHandler: (evt: MapEvent) => void;
    /**
     * @constructor
     * @param {Function} base Base class.
     */
    constructor(base: any);
    init(map: import('ol').Map): void;
    getItemsLength(): number;
    getPixelClicked(): Pixel | undefined;
    getCoordinateClicked(): Coordinate | undefined;
    positionContainer(pixel: import('ol/pixel').Pixel): void;
    openMenu(pixel: import('ol/pixel').Pixel, coordinate: import('ol/coordinate').Coordinate): void;
    closeMenu(): void;
    setListeners(): void;
    removeListeners(): void;
    handleEvent(evt: Event): void;
    handleMapMoveEvent(_evt: import('ol').MapEvent): void;
    setItemListener(li: HTMLElement, index: string): void;
}
