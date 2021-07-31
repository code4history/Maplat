import locales_core from "../node_modules/@maplat/core/lib/freeze_locales";
import locales_ui from "./freeze_locales";

Object.assign(locales_core, locales_ui);

import { MaplatUi } from "./index";

export { MaplatUi };
