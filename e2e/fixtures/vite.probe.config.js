// M1-T4 AC5b: ブラウザ検証用プローブを**完全にバンドル**するための専用設定。
//
// なぜ事前バンドルするか（実装レビュー Major-1）:
//   dev サーバ経由だと、dompurify の依存最適化とページ読み込みが競合し
//   504 (Outdated Optimize Dep) でモジュールが評価されないことがある。
//   warm cache では偶然通るため「動いた」と誤認しやすい。
//   bare specifier を残さない IIFE を作れば、ブラウザ側の解決が一切不要になり
//   dev サーバの状態に依存しなくなる。
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-probe"),
    emptyOutDir: true,
    lib: {
      entry: path.resolve(import.meta.dirname, "sanitize-probe.ts"),
      name: "__t4probe",
      formats: ["iife"],
      fileName: () => "sanitize-probe.js"
    },
    // 何も external にしない（dompurify も含めて全部入れる）
    rollupOptions: { external: [] }
  }
});
