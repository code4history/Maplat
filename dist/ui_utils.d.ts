export declare function resolveRelativeLink(file: string, fallbackPath: string | null): string;
export declare function ellips(mapDivDocument: HTMLElement): void;
export declare function isMaplatSource(source: unknown): source is {
    setGPSMarkerAsync: () => unknown;
    constructor: {
        isBasemap_?: boolean;
    };
};
export declare function isBasemap(source: unknown): boolean;
