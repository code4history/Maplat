import { Control, Rotate, Zoom as BaseZoom } from 'ol/control';
import { MaplatUi } from './index';
import { ControlOptions } from './types';
export declare let control_settings: Record<string, string>;
export declare function setControlSettings(options: Record<string, string>): void;
export declare class SliderNew extends Control {
    constructor(opt_options: ControlOptions);
    setMap(map: import('ol').Map): void;
    setEnable(cond: boolean): void;
    setValue(res: number): void;
}
export declare class CustomControl extends Control {
    center_: import('ol/coordinate').Coordinate | undefined;
    zoom_: number | undefined;
    callResetNorth_: unknown;
    lastRotation_: number;
    label_: HTMLElement;
    ui: MaplatUi;
    moveTo_: boolean;
    constructor(optOptions: ControlOptions);
}
export declare class GoHome extends CustomControl {
    constructor(optOptions: ControlOptions);
}
export declare class SetGPS extends CustomControl {
    constructor(optOptions: ControlOptions);
}
export declare class CompassRotate extends Rotate {
    center_?: import('ol/coordinate').Coordinate;
    zoom_?: number;
    customLabel_: HTMLElement;
    lastRotation_: number;
    constructor(optOptions: ControlOptions);
}
export declare class Share extends CustomControl {
    constructor(optOptions: ControlOptions);
}
export declare class Border extends CustomControl {
    constructor(optOptions: ControlOptions);
}
export declare class Maplat extends CustomControl {
    constructor(optOptions: ControlOptions);
}
export declare class Copyright extends CustomControl {
    constructor(optOptions: ControlOptions);
}
export declare class HideMarker extends CustomControl {
    constructor(optOptions: ControlOptions);
}
export declare class MarkerList extends CustomControl {
    constructor(optOptions: ControlOptions);
}
export declare class Zoom extends BaseZoom {
    constructor(options?: ControlOptions);
}
