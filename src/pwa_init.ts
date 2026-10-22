// PWA 初期化（oct26-m3-t1・Maplat #260）。
// ui_init.ts の initDom から抽出した。経緯:
//   - 従来は initDom 内のインラインブロックで、同期 try/catch が
//     Weiwudi.registerSW(...) を囲むだけで、返る Promise の拒否を捕捉できず
//     uncaught (in promise) になっていた（Maplat #260）
//   - 抽出と .catch 追加の設計は docs/superpowers/specs/2026-09-10-oct26-m3-t1-design.md
// nov26-m5-t3（MaplatEditor#106 の viewer 側・M5-SEC-I-1）:
//   - pwaWorker: false / null で Service Worker を登録しない（resolvePwaWorker）
//   - <link> を HTML 文字列ではなく DOM の組み立てで作る（appendLink）
//   - 設計は NayutaProducts docs/superpowers/specs/2026-10-11-nov26-m5-t3-task-design.md
import Weiwudi from "@c4h/weiwudi";
import absoluteUrl from "./absolute_url";
import type { MaplatApp } from "@maplat/core";
import type { MaplatAppOption } from "./types";

const DEFAULT_WORKER = "./service-worker.js";

/**
 * pwaWorker の解決。null は「登録しない」。
 * マイルストーン設計 nov26-m5 §4.1 の表と 1 対 1（false・null を既定の代入より先に判定する）。
 * パッケージの入口（src/index.ts）からは re-export しない（単体テストのための export）。
 */
export function resolvePwaWorker(value: unknown): string | null {
  if (value === false || value === null) return null; // 登録しない
  if (typeof value === "string" && value !== "") return value; // その URL
  return DEFAULT_WORKER; // undefined・""・true・その他 → 既定
}

export function initPwa(core: MaplatApp, appOption: MaplatAppOption) {
  let pwaManifest = appOption.pwaManifest;
  let pwaScope = appOption.pwaScope;

  // 従来どおり、pwaManifest が無ければ pwaWorker に関係なく何もしない
  if (!pwaManifest) return;
  if (pwaManifest === true) {
    pwaManifest = `./pwa/${core.appid}_manifest.json`;
  }
  if (!pwaScope) {
    pwaScope = "./";
  }
  const pwaWorker = resolvePwaWorker(appOption.pwaWorker);

  const head = document.querySelector("head");
  if (head && !head.querySelector('link[rel="manifest"]')) {
    appendLink(head, { rel: "manifest", href: String(pwaManifest) });
  }
  // Maplat #260: Weiwudi.registerSW は Promise<ServiceWorkerRegistration> を
  // 返す（@c4h/weiwudi の型定義 weiwudi.d.ts:30）。同期 try/catch では返った
  // Promise の拒否を捕捉できないため .catch で受け、manifest fetch 失敗と同じ
  // 観測先（console.error）へ出す。登録失敗はアプリを壊さない扱いは維持する
  // （fire-and-forget のまま後続処理をブロックしない）。
  // nov26-m5-t3: pwaWorker が false / null なら登録しない（登録済みの SW は解除しない）。
  if (pwaWorker !== null) {
    Weiwudi.registerSW(pwaWorker, { scope: pwaScope }).catch(err => {
      console.error("Failed to register service worker:", err);
    });
  }

  if (head && !head.querySelector('link[rel="apple-touch-icon"]')) {
    fetch(pwaManifest)
      .then(response => response.json())
      .then(value => {
        if (value.icons) {
          value.icons.forEach((icon: { src: string; sizes: string }) => {
            appendLink(head, {
              rel: "apple-touch-icon",
              sizes: String(icon.sizes),
              href: absoluteUrl(pwaManifest as string, icon.src)
            });
          });
        }
      })
      .catch(err => {
        console.error("Failed to fetch PWA manifest:", err);
      });
  }
}

/**
 * M5-SEC-I-1: <link> を HTML 文字列ではなく DOM で組む。
 * 値は属性の値として入り、要素として解釈されない（是正前は pwaManifest や manifest の
 * icons[].src・sizes を補間した HTML 文字列から要素を作っており、切り離された <img> などが
 * 実ブラウザで読み込み・onerror を起こしうる）。
 */
function appendLink(
  head: HTMLHeadElement,
  attrs: Record<string, string>
): void {
  const link = document.createElement("link");
  for (const [name, value] of Object.entries(attrs)) {
    link.setAttribute(name, value);
  }
  head.appendChild(link);
}
