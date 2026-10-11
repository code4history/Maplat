// <maplat-ui> の共有（旧 src/index.ts の getShareUrl・src/ui_init.ts の共有ボタンの処理・QR の表示）。
//
// QR は既存の依存の qrcode（旧 UI も使う）で作る。最初に QR を出すときに 1 回だけ動的 import する
// （要素の読み込みでは読まない。spec/element-deps.spec.ts が静的な import の無いことを確かめる）。
// 旧は qrcode の toCanvas で 128 px の canvas に描いていた。ここでは qrcode の create（符号化だけ）の結果を
// 同じ大きさ（128 px・余白 1 マス・誤り訂正 M＝toCanvas の既定）の SVG にする（DOM の API だけで組み、
// 文字列の HTML を使わない。jsdom でも描ける）。

/** 共有する URL の種類（仕様 §4.4 getShareUrl）。app はアプリそのもの、view は今の表示（状態 URL 込み）。 */
export type ShareUrlType = "app" | "view";

/** 旧 getShareUrl と同じ: view は今の URL（state-url なら "#!…" を含む）、それ以外は ? と # を落とした URL。 */
export function shareUrlOf(type: string, href: string): string {
  if (type === "view") return href;
  return href.split("?")[0].split("#")[0];
}

/** 旧と同じ SNS の共有先（Twitter の intent・Facebook の sharer）。 */
export function twitterShareUrl(uri: string, text: string): string {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(uri)}&text=${encodeURIComponent(text)}&hashtags=Maplat`;
}
export function facebookShareUrl(uri: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(uri)}&display=popup&ref=plugin&src=like&kid_directed_site=0`;
}

/** qrcode の create の戻り値のうち使う部分。 */
interface QrModules {
  size: number;
  get(row: number, col: number): boolean | number;
}
interface QrLibrary {
  create(
    text: string,
    options?: { errorCorrectionLevel?: string }
  ): {
    modules: QrModules;
  };
}

let qrLoading: Promise<QrLibrary | null> | null = null;

/** qrcode を読む（CommonJS なので default に入っていることがある）。読めなければ次の機会に読み直す。 */
function loadQr(): Promise<QrLibrary | null> {
  if (!qrLoading) {
    qrLoading = import("qrcode")
      .then((mod: unknown) => {
        const m = mod as Partial<QrLibrary> & { default?: Partial<QrLibrary> };
        const lib = typeof m.create === "function" ? m : m.default;
        if (!lib || typeof lib.create !== "function")
          throw new Error("qrcode has no create()");
        return lib as QrLibrary;
      })
      .catch((err: unknown) => {
        qrLoading = null;
        console.warn("<maplat-ui>: failed to load qrcode (QR code)", err);
        return null;
      });
  }
  return qrLoading;
}

const SVG_NS = "http://www.w3.org/2000/svg";
/** 旧 toCanvas の { width: 128, margin: 1 } と同じ。 */
const QR_WIDTH = 128;
const QR_MARGIN = 1;

/** QR の SVG を組む（暗いマスを 1 本の path にまとめる）。 */
function buildQrSvg(
  modules: QrModules,
  text: string,
  label: string
): SVGSVGElement {
  const n = modules.size + QR_MARGIN * 2;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("viewBox", `0 0 ${n} ${n}`);
  svg.setAttribute("width", `${QR_WIDTH}`);
  svg.setAttribute("height", `${QR_WIDTH}`);
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label);
  svg.setAttribute("data-url", text);
  svg.setAttribute("part", "qr-code");
  const bg = document.createElementNS(SVG_NS, "rect");
  bg.setAttribute("width", `${n}`);
  bg.setAttribute("height", `${n}`);
  bg.setAttribute("fill", "#ffffff");
  svg.appendChild(bg);
  let d = "";
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col))
        d += `M${col + QR_MARGIN} ${row + QR_MARGIN}h1v1h-1z`;
    }
  }
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "#000000");
  svg.appendChild(path);
  return svg;
}

// 入れ物ごとの最後の依頼（読み込み待ちの間に別の URL で描き直されたら、古い方を描かない）
const pending = new WeakMap<Element, string>();

/**
 * container の中身を text の QR に替える。
 * @returns 描いたら true（qrcode が読めない・符号化できない・より新しい依頼に替わったら false）
 */
export async function renderQr(
  container: HTMLElement,
  text: string,
  label: string
): Promise<boolean> {
  pending.set(container, text);
  const lib = await loadQr();
  if (pending.get(container) !== text) return false;
  if (!lib) return false;
  let modules: QrModules;
  try {
    modules = lib.create(text, { errorCorrectionLevel: "M" }).modules;
  } catch (err) {
    console.warn("<maplat-ui>: failed to make a QR code", err);
    return false;
  }
  container.replaceChildren(buildQrSvg(modules, text, label));
  return true;
}
