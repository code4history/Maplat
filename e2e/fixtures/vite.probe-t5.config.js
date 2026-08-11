// M1-T5: ブラウザ検証用プローブを完全にバンドルする専用設定（m1-t4 と同方式）。
//
// 出力先は m1-t4 と同じ dist-probe/ にする。別ディレクトリ（dist-probe-t5）だと
// dev サーバが配信せず index.html にフォールバックした（実測）。既に配信実績の
// あるパスへ相乗りするのが確実である。emptyOutDir は false（t4 の成果物を消さない）。
//
// publicDir: false — 既定だと public/ 一式が出力先へ複製され、無関係な巨大成果物が増える。
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  publicDir: false,
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-probe"),
    emptyOutDir: false,
    lib: {
      entry: path.resolve(import.meta.dirname, "poi-html-probe.ts"),
      name: "__t5probe",
      formats: ["iife"],
      fileName: () => "poi-html-probe.js"
    },
    rollupOptions: {
      external: [],
      output: { assetFileNames: "poi-html-probe.css" }
    }
  }
});
