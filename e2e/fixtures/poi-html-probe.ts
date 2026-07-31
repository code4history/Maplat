// M1-T5 AC5 / AC6 / AC10: ブラウザ検証用プローブ。製品には含めない。
//
// m1-t4 と同じく**事前バンドル**して読む。dev サーバの依存最適化と競合すると
// 504 (Outdated Optimize Dep) で不安定になるため（m1-t4 の finding5）。
//
// 実コードの poiWebControl をそのまま呼ぶ。テスト内でロジックを再現してはならない。
import { poiWebControl } from "../../src/ui_marker";
// 実際の CSS を読む（.poi_html_host--scroll の overflow-y を computed style で検査するため。
// テスト側に CSS を写すと正本が2箇所になる）
import "../../src/styles/ui.scss";

import type { MaplatUi } from "../../src/index";
import type { MarkerData } from "../../src/types";

const ui = (noScroll: boolean) =>
  ({
    enablePoiHtmlNoScroll: noScroll,
    translate: (x: unknown) => x as string
  }) as unknown as MaplatUi;

function mount(): HTMLElement {
  const div = document.createElement("div");
  // 高さ検査のため実レイアウトへ載せる（display:none だと clientHeight が 0 になる）
  div.style.width = "600px";
  document.body.appendChild(div);
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
