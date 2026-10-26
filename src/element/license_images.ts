// ライセンスのアイコン（地図情報のライセンスの行）の URL の表。
// 旧 UI（src/pointer_images.ts）と同じく PNG を import してバンドラに URL を解かせる（配布物の置き場や
// ページの基点に依らない）。ここは画像の import と表だけを持つ（地図・層 A には触れない）。
// キーは旧 ui_utils.renderLicenseCell が作るファイル名（ライセンスの語彙を小文字にして空白を _ にしたもの）。
// @ts-expect-error - PNG imports handled by Vite
import Maplat from "../../assets/parts/Maplat.png";
// @ts-expect-error - PNG imports handled by Vite
import allright from "../../assets/parts/all_right_reserved.png";
// @ts-expect-error - PNG imports handled by Vite
import attr from "../../assets/parts/attr.png";
// @ts-expect-error - PNG imports handled by Vite
import cc0 from "../../assets/parts/cc0.png";
// @ts-expect-error - PNG imports handled by Vite
import ccbnn from "../../assets/parts/cc_by-nc-nd.png";
// @ts-expect-error - PNG imports handled by Vite
import ccbns from "../../assets/parts/cc_by-nc-sa.png";
// @ts-expect-error - PNG imports handled by Vite
import ccbnc from "../../assets/parts/cc_by-nc.png";
// @ts-expect-error - PNG imports handled by Vite
import ccbnd from "../../assets/parts/cc_by-nd.png";
// @ts-expect-error - PNG imports handled by Vite
import ccbs from "../../assets/parts/cc_by-sa.png";
// @ts-expect-error - PNG imports handled by Vite
import ccb from "../../assets/parts/cc_by.png";
// @ts-expect-error - PNG imports handled by Vite
import odbl from "../../assets/parts/odbl.png";
// @ts-expect-error - PNG imports handled by Vite
import pd from "../../assets/parts/pd.png";

/** ライセンスの語彙（小文字・空白を _ にしたファイル名）からアイコンの URL を引く表。 */
export const LICENSE_ICONS: Record<string, string> = {
  "maplat.png": Maplat,
  "all_right_reserved.png": allright,
  "attr.png": attr,
  "cc0.png": cc0,
  "cc_by-nc-nd.png": ccbnn,
  "cc_by-nc-sa.png": ccbns,
  "cc_by-nc.png": ccbnc,
  "cc_by-nd.png": ccbnd,
  "cc_by-sa.png": ccbs,
  "cc_by.png": ccb,
  "odbl.png": odbl,
  "pd.png": pd
};
