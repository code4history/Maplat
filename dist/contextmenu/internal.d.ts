/**
 * @class Internal
 */
export declare class Internal {
    Base: any;
    map: any;
    viewport: any;
    coordinateClicked: any;
    pixelClicked: any;
    lineHeight: number;
    items: any;
    opened: boolean;
    submenu: any;
    eventHandler: any;
    eventMapMoveHandler: any;
    /**
     * @constructor
     * @param {Function} base Base class.
     */
    constructor(base: any);
    init(map: any): void;
    getItemsLength(): number;
    getPixelClicked(): any;
    getCoordinateClicked(): any;
    positionContainer(pixel: any): void;
    openMenu(pixel: any, coordinate: any): void;
    closeMenu(): void;
    setListeners(): void;
    removeListeners(): void;
    handleEvent(evt: any): void;
    handleMapMoveEvent(_evt: any): void;
    setItemListener(li: any, index: any): void;
}
