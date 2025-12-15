import { Control, Rotate, Zoom as BaseZoom } from 'ol/control';
export declare let control_settings: any;
export declare function setControlSettings(options: any): void;
export declare class SliderNew extends Control {
    constructor(opt_options: any);
    setMap(map: any): void;
    setEnable(cond: any): void;
    setValue(res: any): void;
}
export declare class CustomControl extends Control {
    center_: any;
    zoom_: any;
    callResetNorth_: any;
    rotation_: any;
    label_: any;
    ui: any;
    moveTo_: boolean;
    constructor(optOptions: any);
}
export declare class GoHome extends CustomControl {
    constructor(optOptions: any);
}
export declare class SetGPS extends CustomControl {
    constructor(optOptions: any);
}
export declare class CompassRotate extends Rotate {
    center_: any;
    zoom_: any;
    customLabel_: any;
    constructor(optOptions: any);
}
export declare class Share extends CustomControl {
    constructor(optOptions: any);
}
export declare class Border extends CustomControl {
    constructor(optOptions: any);
}
export declare class Maplat extends CustomControl {
    constructor(optOptions: any);
}
export declare class Copyright extends CustomControl {
    constructor(optOptions: any);
}
export declare class HideMarker extends CustomControl {
    constructor(optOptions: any);
}
export declare class MarkerList extends CustomControl {
    constructor(optOptions: any);
}
export declare class Zoom extends BaseZoom {
    constructor(options?: any);
}
