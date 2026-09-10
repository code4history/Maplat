// PWA 初期化（oct26-m3-t1・Maplat #260）。
// ui_init.ts の initDom から抽出した。経緯:
//   - 従来は initDom 内のインラインブロックで、同期 try/catch が
//     Weiwudi.registerSW(...) を囲むだけで、返る Promise の拒否を捕捉できず
//     uncaught (in promise) になっていた（Maplat #260）
//   - 抽出と .catch 追加の設計は docs/superpowers/specs/2026-09-10-oct26-m3-t1-design.md
import Weiwudi from "@c4h/weiwudi";
import absoluteUrl from "./absolute_url";
import { createElement } from "./ui_utils";
import type { MaplatApp } from "@maplat/core";
import type { MaplatAppOption } from "./types";

export function initPwa(core: MaplatApp, appOption: MaplatAppOption) {
  let pwaManifest = appOption.pwaManifest;
  let pwaWorker = appOption.pwaWorker;
  let pwaScope = appOption.pwaScope;

  if (pwaManifest) {
    if (pwaManifest === true) {
      pwaManifest = `./pwa/${core.appid}_manifest.json`;
    }
    if (!pwaWorker) {
      pwaWorker = "./service-worker.js";
    }
    if (!pwaScope) {
      pwaScope = "./";
    }

    const head = document.querySelector("head");
    if (head) {
      if (!head.querySelector('link[rel="manifest"]')) {
        head.appendChild(
          createElement(`<link rel="manifest" href="${pwaManifest}">`)[0]
        );
      }
    }
    // Maplat #260: Weiwudi.registerSW は Promise<ServiceWorkerRegistration> を
    // 返す（@c4h/weiwudi の型定義 weiwudi.d.ts:30）。同期 try/catch では返った
    // Promise の拒否を捕捉できないため .catch で受け、manifest fetch 失敗と同じ
    // 観測先（console.error）へ出す。登録失敗はアプリを壊さない扱いは維持する
    // （fire-and-forget のまま後続処理をブロックしない）。
    Weiwudi.registerSW(pwaWorker, { scope: pwaScope }).catch(err => {
      console.error("Failed to register service worker:", err);
    });

    if (head && !head.querySelector('link[rel="apple-touch-icon"]')) {
      fetch(pwaManifest)
        .then(response => response.json())
        .then(value => {
          if (value.icons) {
            value.icons.forEach((icon: { src: string; sizes: string }) => {
              const src = absoluteUrl(pwaManifest as string, icon.src);
              const sizes = icon.sizes;
              const tag = `<link rel="apple-touch-icon" sizes="${sizes}" href="${src}">`;
              head.appendChild(createElement(tag)[0]);
            });
          }
        })
        .catch(err => {
          console.error("Failed to fetch PWA manifest:", err);
        });
    }
  }
}
