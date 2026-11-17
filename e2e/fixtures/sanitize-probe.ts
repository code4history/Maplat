// ブラウザ側サニタイズ検証用のプローブ（テスト専用エントリ）。
//
// なぜ専用エントリが要るか:
//   当初は page.addScriptTag で /@fs のソースを動的 import していたが、
//   その import が dompurify を**初めて** Vite の依存最適化へ導入するため、
//   ページの実行コンテキストが破棄・再読込され、代入前に waitForFunction が
//   timeout していた（warm cache では偶然通っていた）。
//   通常のページ読み込み経路で import すれば、Vite は最適化を済ませてから
//   ページを確定させるため、この競合が起きない。
import { sanitizeHtml, escapeAttr, toPlainText, buildSlideAttrs } from "@maplat/core";

declare global {
  interface Window {
    __sanitizeProbe?: {
      sanitizeHtml: typeof sanitizeHtml;
      escapeAttr: typeof escapeAttr;
      toPlainText: typeof toPlainText;
      buildSlideAttrs: typeof buildSlideAttrs;
    };
  }
}

window.__sanitizeProbe = { sanitizeHtml, escapeAttr, toPlainText, buildSlideAttrs };
export {};
