import pointer_core from '../node_modules/@maplat/core/src/pointer_images';
import pointer_ui from './pointer_images';
import freeze from "./freeze_images";
import locales_core from '../node_modules/@maplat/core/src/freeze_locales';
import locales_ui from './freeze_locales';

Object.assign(pointer_core, freeze);
Object.assign(pointer_ui, freeze);
Object.assign(locales_core, locales_ui);

import { MaplatUi } from "./index";

export {MaplatUi};