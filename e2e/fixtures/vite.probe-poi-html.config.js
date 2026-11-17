// POI html の隔離のブラウザ検証用プローブを完全にバンドルする専用設定（サニタイズの E2E と同方式）。
//
// 出力先はサニタイズの E2E と同じ dist-probe/ にする。別ディレクトリだと
// dev サーバが配信せず index.html にフォールバックした（実測）。既に配信実績の
// あるパスへ相乗りするのが確実である。emptyOutDir は false（サニタイズの E2E のプローブを消さない）。
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
