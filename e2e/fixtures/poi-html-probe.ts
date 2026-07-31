// M1-T5 AC5 / AC6 / AC10: ブラウザ検証用プローブ。製品には含めない。
//
// m1-t4 と同じく**事前バンドル**して読む。dev サーバの依存最適化と競合すると
// 504 (Outdated Optimize Dep) で不安定になるため（m1-t4 の finding5）。
//
// 実コードの poiWebControl をそのまま呼ぶ。テスト内でロジックを再現してはならない。
import { poiWebControl } from "../../src/ui_marker";
// 実際の CSS を読む（.poi_html_host--scroll の overflow-y を computed style で検査するため。
// テスト側に CSS を写すと正本が2箇所になる）
//
// ?inline で**文字列として**取り込み、自前で <style> へ入れる。
// 別アセットとして出して <link> で読むと、Vite dev サーバが .css を JS モジュールとして
// 返す（Content-Type: text/javascript）ため、ブラウザの MIME チェックで適用されない（実測）。
import css from "../../src/styles/ui.scss?inline";

import type { MaplatUi } from "../../src/index";
import type { MarkerData } from "../../src/types";

const ui = (noScroll: boolean) =>
  ({
    enablePoiHtmlNoScroll: noScroll,
    translate: (x: unknown) => x as string
  }) as unknown as MaplatUi;

const styleEl = document.createElement("style");
styleEl.textContent = css;
document.head.appendChild(styleEl);

// ui.scss のルールは `.maplat` 配下へスコープされている（実測:
// `.maplat .poi_html_host--scroll{height:60vh;overflow-y:auto}`）。
// body 直下へ置くと CSS が当たらず、computed style の検査が無意味になるため
// 製品と同じ祖先の下にマウントする。
const root = document.createElement("div");
root.className = "maplat";
document.body.appendChild(root);

function mount(): HTMLElement {
  const div = document.createElement("div");
  // 高さ検査のため実レイアウトへ載せる（display:none だと clientHeight が 0 になる）
  div.style.width = "600px";
  root.appendChild(div);
  return div;
}

(window as unknown as Record<string, unknown>).__t5 = {
  renderHtml(html: string, noScroll = true) {
    const div = mount();
    poiWebControl(ui(noScroll), div, { html } as unknown as MarkerData, false);
    return div.querySelector(".poi_html_host") as HTMLElement;
  },
  renderUrl(url: string, noScroll = true) {
    const div = mount();
    poiWebControl(ui(noScroll), div, { url } as unknown as MarkerData, false);
    return div;
  },
  renderBoth(html: string, url: string, noScroll = true) {
    const div = mount();
    poiWebControl(
      ui(noScroll),
      div,
      { html, url } as unknown as MarkerData,
      false
    );
    return div;
  },
  marker: "untouched"
};
