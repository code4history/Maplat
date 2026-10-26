import { MaplatUiElement } from '../element';
export interface LegacySlider {
    /** 旧 `control.element`（層 B の中の input。無ければ null） */
    readonly element: HTMLInputElement | null;
    /** 旧 `control.get("slidervalue")`（0..1。0 が不透明） */
    get: (key: string) => number | undefined;
    /** 旧 `control.set("slidervalue", 0..1)`（`transparency` 属性を書く） */
    set: (key: string, value: number) => void;
    /** 旧 `setValue`（0..1） */
    setValue: (value: number) => void;
    /** 旧 `setEnable`（地図の準備前は無効） */
    setEnable: (flag: boolean) => void;
    on: (type: "propertychange", handler: (event: unknown) => void) => void;
    off: (type: "propertychange", handler: (event: unknown) => void) => void;
    un: (type: "propertychange", handler: (event: unknown) => void) => void;
}
/** 互換層だけが使う口（ホストができた・外れたときに見張りを付け外しする）。 */
export interface LegacySliderBinding {
    attach: () => void;
    detach: () => void;
}
export type LegacySliderFacade = LegacySlider & LegacySliderBinding;
export declare function createLegacySlider(host: () => MaplatUiElement | null): LegacySliderFacade;
