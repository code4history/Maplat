import { assets } from "@maplat/core";
// @ts-expect-error - PNG imports handled by Vite
import Maplat from "../assets/parts/Maplat.png";
// @ts-expect-error - PNG imports handled by Vite
import allright from "../assets/parts/all_right_reserved.png";
// @ts-expect-error - PNG imports handled by Vite
import attr from "../assets/parts/attr.png";
// @ts-expect-error - PNG imports handled by Vite
import basemap from "../assets/parts/basemap.png";
// @ts-expect-error - PNG imports handled by Vite
import border from "../assets/parts/border.png";
// @ts-expect-error - PNG imports handled by Vite
import cc0 from "../assets/parts/cc0.png";
// @ts-expect-error - PNG imports handled by Vite
import ccbnn from "../assets/parts/cc_by-nc-nd.png";
// @ts-expect-error - PNG imports handled by Vite
import ccbns from "../assets/parts/cc_by-nc-sa.png";
// @ts-expect-error - PNG imports handled by Vite
import ccbnc from "../assets/parts/cc_by-nc.png";
// @ts-expect-error - PNG imports handled by Vite
import ccbnd from "../assets/parts/cc_by-nd.png";
// @ts-expect-error - PNG imports handled by Vite
import ccbs from "../assets/parts/cc_by-sa.png";
// @ts-expect-error - PNG imports handled by Vite
import ccb from "../assets/parts/cc_by.png";
// @ts-expect-error - PNG imports handled by Vite
import compass from "../assets/parts/compass.png";
// @ts-expect-error - PNG imports handled by Vite
import favicon from "../assets/parts/favicon.png";
// @ts-expect-error - PNG imports handled by Vite
import fullscreen from "../assets/parts/fullscreen.png";
// @ts-expect-error - PNG imports handled by Vite
import gps from "../assets/parts/gps.png";
// @ts-expect-error - PNG imports handled by Vite
import help from "../assets/parts/help.png";
// @ts-expect-error - PNG imports handled by Vite
import hide from "../assets/parts/hide_marker.png";
// @ts-expect-error - PNG imports handled by Vite
import list from "../assets/parts/marker_list.png";
// @ts-expect-error - PNG imports handled by Vite
import home from "../assets/parts/home.png";
// @ts-expect-error - PNG imports handled by Vite
import loading from "../assets/parts/loading.png";
// @ts-expect-error - PNG imports handled by Vite
import loading_i from "../assets/parts/loading_image.png";
// @ts-expect-error - PNG imports handled by Vite
import minus from "../assets/parts/minus.png";
// @ts-expect-error - PNG imports handled by Vite
import noimg from "../assets/parts/no_image.png";
// @ts-expect-error - PNG imports handled by Vite
import overlay from "../assets/parts/overlay.png";
// @ts-expect-error - PNG imports handled by Vite
import pd from "../assets/parts/pd.png";
// @ts-expect-error - PNG imports handled by Vite
import plus from "../assets/parts/plus.png";
// @ts-expect-error - PNG imports handled by Vite
import share from "../assets/parts/share.png";
// @ts-expect-error - PNG imports handled by Vite
import slider from "../assets/parts/slider.png";

const pointer: Record<string, string> = {
  "Maplat.png": Maplat,
  "all_right_reserved.png": allright,
  "attr.png": attr,
  "basemap.png": basemap,
  "bluedot.png": assets.bluedot,
  "bluedot_transparent.png": assets.bluedot_transparent,
  "bluedot_small.png": assets.bluedot_small,
  "border.png": border,
  "cc0.png": cc0,
  "cc_by-nc-nd.png": ccbnn,
  "cc_by-nc-sa.png": ccbns,
  "cc_by-nc.png": ccbnc,
  "cc_by-nd.png": ccbnd,
  "cc_by-sa.png": ccbs,
  "cc_by.png": ccb,
  "compass.png": compass,
  "defaultpin.png": assets.defaultpin,
  "defaultpin_selected.png": assets.defaultpin_selected,
  "favicon.png": favicon,
  "fullscreen.png": fullscreen,
  "gps.png": gps,
  "gsi.jpg": assets.gsi,
  "gsi_ortho.jpg": assets.gsi_ortho,
  "help.png": help,
  "hide_marker.png": hide,
  "marker_list.png": list,
  "home.png": home,
  "loading.png": loading,
  "loading_image.png": loading_i,
  "minus.png": minus,
  "no_image.png": noimg,
  "osm.jpg": assets.osm,
  "overlay.png": overlay,
  "pd.png": pd,
  "plus.png": plus,
  "redcircle.png": assets.redcircle,
  "share.png": share,
  "slider.png": slider
};
export default pointer;
