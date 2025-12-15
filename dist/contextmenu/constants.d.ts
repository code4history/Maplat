export declare const CSS_VARS: {
    namespace: string;
    container: string;
    separator: string;
    submenu: string;
    hidden: string;
    icon: string;
    zoomIn: string;
    zoomOut: string;
    unselectable: string;
};
export declare const EVENT_TYPE: {
    /**
     * Triggered before context menu is open.
     */
    BEFOREOPEN: string;
    /**
     * Triggered when context menu is open.
     */
    OPEN: string;
    /**
     * Triggered when context menu is closed.
     */
    CLOSE: string;
    /**
     * Internal. Triggered when a menu entry is added.
     */
    ADD_MENU_ENTRY: string;
    /**
     * Internal.
     */
    CONTEXTMENU: string;
    /**
     * Internal.
     */
    HOVER: string;
};
export declare const DEFAULT_OPTIONS: {
    width: number;
    scrollAt: number;
    eventType: string;
    defaultItems: boolean;
};
export declare const DEFAULT_ITEMS: {
    text: string;
    classname: string;
    callback: (obj: any, map: any) => void;
}[];
