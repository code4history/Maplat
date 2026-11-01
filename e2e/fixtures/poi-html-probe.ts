// M1-T5 AC5 / AC6 / AC10: ブラウザ検証用プローブ。製品には含めない。
//
// m1-t4 と同じく**事前バンドル**して読む。dev サーバの依存最適化と競合すると
// 504 (Outdated Optimize Dep) で不安定になるため（m1-t4 の finding5）。
//
// 旧の実装（`src/ui_marker.ts` の `poiWebControl`）を消したので、`<maplat-ui>` が実際に使う
// 組み立て（`src/element/poi-html.ts`）をそのまま呼ぶ。テスト内でロジックを再現してはならない。
import {
  buildPoiBody,
  buildPoiHtml,
  buildPoiIframe
} from "../../src/element/poi-html";
// 実際の CSS を読む（`.poi-html.scroll` の overflow-y を computed style で検査するため。
// テスト側に CSS を写すと正本が2箇所になる）。
//
// 要素が Shadow DOM に入れているのと同じ文字列（MAPLAT_UI_CSS）を probe でも <style> へ入れる。
// 旧は `ui.scss?inline` を読んで `.maplat` の下へ置いていたが、その CSS は旧 UI のもので、
// いまの吹き出しの見た目は要素の CSS が正本。
import { MAPLAT_UI_CSS } from "../../src/element/styles";

const styleEl = document.createElement("style");
styleEl.textContent = MAPLAT_UI_CSS;
document.head.appendChild(styleEl);

function mount(): HTMLElement {
  const div = document.createElement("div");
  // 高さ検査のため実レイアウトへ載せる（display:none だと clientHeight が 0 になる）
  div.style.width = "600px";
  document.body.appendChild(div);
  return div;
}

(window as unknown as Record<string, unknown>).__t5 = {
  renderHtml(html: string, noScroll = true) {
    const host = buildPoiHtml(html, noScroll);
    mount().appendChild(host);
    return host;
  },
  renderUrl(url: string, noScroll = true) {
    const div = mount();
    const iframe = buildPoiIframe(url, noScroll);
    if (iframe) div.appendChild(iframe);
    return div;
  },
  renderBoth(html: string, url: string, noScroll = true) {
    const div = mount();
    // 分岐（html があれば url は見ない）は要素の #renderPoi と同じ buildPoiBody に任せる（ここに写さない）
    const body = buildPoiBody({ html, url }, noScroll);
    if (body.node) div.appendChild(body.node);
    return div;
  },
  marker: "untouched"
};
