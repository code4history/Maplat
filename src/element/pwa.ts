// <maplat-ui> の PWA（旧 src/pwa_init.ts の initPwa を、層 A に触れずに動く形へ移したもの）。
//
// 旧と同じことをする:
//   - 文書の <head> に <link rel="manifest"> が無ければ足す
//   - Service Worker（既定 ./service-worker.js・scope ./）を登録する。失敗は console.error へ出し、アプリは止めない
//   - <head> に apple-touch-icon が無ければ、manifest の icons から足す
// 旧との違い:
//   - 旧は Weiwudi.registerSW（@c4h/weiwudi）で登録していた。<maplat-ui> は Weiwudi を import しない
//     （依存の規則。spec/element-deps.spec.ts）ので navigator.serviceWorker.register を直接呼ぶ。
//     登録する Service Worker は旧と同じもの（MaplatUI の service-worker.js。Weiwudi のタイルキャッシュの
//     受け口を含む）なので、<maplat-app enable-cache> のタイルキャッシュとの関係は旧と同じ
//     （UI は pwa-manifest があるときだけ登録し、enable-cache だけでは登録しない。層 A も登録しない）。
//   - 同じ文書で 2 回目以降の呼び出し（<maplat-ui> が複数・繋ぎ直し）は、同じ Service Worker・scope の
//     登録を繰り返さない（二重に登録しない）。manifest の link・apple-touch-icon も二重に足さない。
//   - URL は http/https・相対 URL のときだけ使う（safeWebUrl）。
import absoluteUrl from "../absolute_url";
import { safeWebUrl } from "../poi_safe";

export interface PwaOptions {
  /** manifest の URL（true は既に既定のパスへ解決済みの値を渡す） */
  manifest: string;
  /** Service Worker の URL（既定 ./service-worker.js） */
  worker?: string;
  /** Service Worker の scope（既定 ./） */
  scope?: string;
}

const registrations = new Map<
  string,
  Promise<ServiceWorkerRegistration | undefined>
>();
const iconsAdded = new Set<string>();

function resolveKey(url: string): string {
  try {
    return new URL(url, document.baseURI).href;
  } catch {
    return url;
  }
}

/** 文書の <head> に要素を足す（属性は setAttribute で入れる。文字列の HTML を使わない）。 */
function appendLink(head: HTMLElement, attrs: Record<string, string>) {
  const link = document.createElement("link");
  for (const [k, v] of Object.entries(attrs)) link.setAttribute(k, v);
  head.appendChild(link);
}

/** Service Worker を登録する（失敗は console.error へ出して undefined に解決。旧と同じ文言）。 */
function register(
  worker: string,
  scope: string
): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) {
    console.error(
      "Failed to register service worker:",
      "Service worker is not supported"
    );
    return Promise.resolve(undefined);
  }
  return navigator.serviceWorker.register(worker, { scope }).then(
    reg => reg,
    (err: unknown) => {
      console.error("Failed to register service worker:", err);
      return undefined;
    }
  );
}

/** 単体テスト用: 文書ごとの「登録済み」の記録を消す（公開の入口からは出さない）。 */
export function resetPwaRegistryForTest(): void {
  registrations.clear();
  iconsAdded.clear();
}

/**
 * PWA を有効にする。
 * @returns Service Worker の登録（登録しなかった・失敗したら undefined に解決）。URL が不正なら undefined
 */
export function initPwa(
  options: PwaOptions
): Promise<ServiceWorkerRegistration | undefined> | undefined {
  if (typeof document === "undefined") return undefined;
  const manifest = safeWebUrl(options.manifest);
  const worker = safeWebUrl(options.worker ?? "./service-worker.js");
  const scope = safeWebUrl(options.scope ?? "./");
  if (manifest === undefined || worker === undefined || scope === undefined) {
    console.warn(
      "<maplat-ui>: PWA was not enabled because pwa-manifest / pwa-worker / pwa-scope is not an http(s) or relative URL."
    );
    return undefined;
  }

  const head = document.head;
  if (head && !head.querySelector('link[rel="manifest"]')) {
    appendLink(head, { rel: "manifest", href: manifest });
  }

  const key = `${resolveKey(worker)}|${resolveKey(scope)}`;
  let registration = registrations.get(key);
  if (!registration) {
    registration = register(worker, scope);
    registrations.set(key, registration);
  }

  const manifestKey = resolveKey(manifest);
  if (
    head &&
    !head.querySelector('link[rel="apple-touch-icon"]') &&
    !iconsAdded.has(manifestKey)
  ) {
    iconsAdded.add(manifestKey);
    fetch(manifest)
      .then(response => response.json())
      .then((value: { icons?: unknown }) => {
        if (!Array.isArray(value?.icons)) return;
        for (const icon of value.icons as Array<Record<string, unknown>>) {
          // icons の src は manifest 起点の相対パス（旧と同じく absoluteUrl で繋ぐ）。スキーム付きは http/https だけ
          if (!icon || safeWebUrl(icon.src) === undefined) continue;
          const src = safeWebUrl(absoluteUrl(manifest, icon.src as string));
          if (src === undefined) continue;
          const attrs: Record<string, string> = {
            rel: "apple-touch-icon",
            href: src
          };
          if (typeof icon.sizes === "string") attrs.sizes = icon.sizes;
          appendLink(head, attrs);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to fetch PWA manifest:", err);
      });
  }
  return registration;
}
