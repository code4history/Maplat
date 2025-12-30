import * as bsn from "bootstrap.native";
export declare function prepareModal(modalElm: Element | HTMLElement, options?: any): bsn.Modal;
export declare function resolveRelativeLink(file: string, fallbackPath: string | null): string;
export declare function ellips(mapDivDocument: HTMLElement): void;
export declare function isMaplatSource(source: unknown): source is {
    setGPSMarkerAsync: () => unknown;
    constructor: {
        isBasemap_?: boolean;
    };
};
export declare function isBasemap(source: unknown): boolean;
export declare function encBytes(bytes: number): string;
