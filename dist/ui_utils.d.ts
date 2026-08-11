import * as bsn from "bootstrap.native";
export declare function createElement(domStr: string): ChildNode[];
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
export declare function renderLicenseCell(contentEl: HTMLElement, license: string | undefined, note: string | undefined, iconUrlFor: (fileName: string) => string): void;
/**
 * m6-t3: license / dataLicense が空のとき、地図種別に応じたフォールバック値を返す。
 *
 * ベースマップ (isWmts = true): license / dataLicense ともに "All right reserved"
 * Maplat 地図 (isWmts = false):
 *   license → "All right reserved" (MapEdit.vue の既定値)
 *   dataLicense → "CC BY-SA" (MapEdit.vue の既定値。人間確認済み)
 */
export declare function resolveLicenseFallback(key: "license" | "dataLicense", val: string | undefined, isWmts: boolean): string;
