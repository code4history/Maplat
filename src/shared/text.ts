/**
 * 文字の詰めもの（設計 v2 §2.3.1・§4.5.2・D8）。
 *
 * 旧 UI の `ellips()`（`src/ui_utils.ts:45-104`）と同じ手順を、そのまま 1 本だけ置く:
 *   1. 文字を 1 つずつ `<span>` に分け、末尾に省略記号（`…`）の span を置く
 *   2. 先頭から 1 文字ずつ出していき、**行の高さが増えたら** 1 行あふれたと見なす
 *   3. 最初のあふれでは `minimize` を付けて文字を縮める（CSS 側で `.8em`。タッチは `.6em`）
 *   4. 縮めてもなおあふれて `lines` 行に達したら、そこから先を隠して省略記号だけ残す
 *
 * 旧との違いは 4 点（いずれも設計・orchestrator の決定で決めたもの）:
 *   - `innerHTML` を使わず、`textContent` と DOM の組み立てだけで作る（XSS を作らない）
 *   - `letter-spacing` は触らない（旧の実装も触っていない。D8）
 *   - 同じ要素に何度呼んでも文字が増えないよう、元の文字を覚えておく（`options.text` で上書き可）
 *   - **1 文字の見出しはそのまま出す**（旧は `…` だけになっていた。不具合として直した。N5）
 *
 * `-webkit-line-clamp` は第一手段にしない（D8）。CSS 側の予備は `styles.ts` が持ち、
 * この関数は「JS が通るときの本命」として動く。
 */

/** `ellipsize` の調整値（呼び出し側が変えられるようにオプションで受ける） */
export interface EllipsizeOptions {
  /** 何行で切るか（既定 2） */
  lines?: number;
  /** 省略記号（既定 `…`） */
  omitMark?: string;
  /** 縮めたことを示す class（既定 `minimize`） */
  minimizeClass?: string;
  /**
   * 元の文字。省略のたびに呼び直す用途で、`textContent` から元の文字を復元できないときに渡す。
   * 省略すると「この要素に最初に渡された文字」を使う（2 回目以降も同じ文字から作り直す）。
   */
  text?: string;
  /** 高さの測り方（既定 `offsetHeight`。テストで差し替えられるようにしている） */
  measure?: (element: HTMLElement) => number;
}

/** 要素ごとの「元の文字」（呼び直しで `…` が積み重ならないようにする） */
const ORIGINAL_TEXT = new WeakMap<HTMLElement, string>();

/** 元の文字の記録を捨てる（見出しの文字そのものが変わったとき） */
export function resetEllipsize(element: HTMLElement): void {
  ORIGINAL_TEXT.delete(element);
}

/**
 * 要素の文字を `lines` 行に収め、あふれた分を省略記号にする。
 * 高さを測れない環境（jsdom など）では「分けるだけで、隠さない」動きになる（旧と同じ）。
 */
export function ellipsize(
  element: HTMLElement,
  lines = 2,
  options: EllipsizeOptions = {}
): void {
  const omitMark = options.omitMark ?? "…";
  const minimizeClass = options.minimizeClass ?? "minimize";
  const measure = options.measure ?? ((el: HTMLElement) => el.offsetHeight);
  const source =
    options.text ?? ORIGINAL_TEXT.get(element) ?? element.textContent ?? "";
  ORIGINAL_TEXT.set(element, source);
  // 3. 縮めたことを示す class は毎回外してから測り直す（`refresh()` のように呼び直す呼び手が
  //    前回の縮小を引きずらないようにする。旧 `ellips` も呼び出しごとに測り直していた）
  element.classList.remove(minimizeClass);

  const chars = Array.from(source);
  // 1. 1 文字ずつ span に分ける（文字はテキストノードとして入れる）
  const fragment = document.createDocumentFragment();
  const spans: HTMLElement[] = [];
  for (const char of chars) {
    const span = document.createElement("span");
    span.textContent = char;
    fragment.appendChild(span);
    spans.push(span);
  }
  const omit = document.createElement("span");
  omit.className = "omit-mark";
  omit.textContent = omitMark;
  fragment.appendChild(omit);

  element.textContent = "";
  element.appendChild(fragment);

  if (lines <= 0 || spans.length === 0) return;
  // 1 文字の見出しはそのまま出す（orchestrator の決定。N5）。
  //   旧 `ellips` は `thisSpan.length - 1` が 1 になるため、最後の「全部隠す」のループが先頭の
  //   文字を隠し、`…` だけが残っていた（実測）。1 文字が `…` になるのは不具合なので、
  //   旧の手順をなぞらずに文字を見せ、省略記号は出さない。
  //   `spans.length === 0` は上で返しているので、ここは 1 文字のときだけ。
  if (spans.length === 1) {
    spans[0].style.display = "";
    omit.style.display = "none";
    return;
  }

  // 2. 先頭だけ出した状態の高さを基準にする
  spans[0].style.display = "";
  for (let i = 1; i < spans.length; i++) spans[i].style.display = "none";
  omit.style.display = "";
  let baseHeight = measure(element);
  let minimized = false;
  let lineCount = 0;
  let omitFrom = -1;

  for (let i = 1; i < spans.length; i++) {
    spans[i].style.display = "";
    const height = measure(element);
    if (height > baseHeight) {
      if (!minimized) {
        // 3. 最初のあふれでは、隠さずに縮める
        minimized = true;
        element.classList.add(minimizeClass);
      } else {
        baseHeight = height;
        lineCount++;
      }
    }
    if (lineCount >= lines) {
      // 4. `lines` 行に達した: 直前 2 文字までを残して、そこから先を隠す
      omitFrom = i - 2;
      break;
    }
    if (i >= spans.length - 1) {
      // 最後まで入った: 省略記号は要らない。
      // 旧 `ellips` の `i >= thisSpan.length - 2` は、`thisSpan` に省略記号の span も 1 個
      // 入っている前提の式（`thisSpan.length === spans.length + 1`）。新しい実装では
      // 省略記号を `spans` の外に置いているので、最後の実文字（`spans.length - 1`）で判定する。
      // ここを `spans.length - 2` にすると、収まるときに最後の 1 文字が `display: none` の
      // まま残る（M1）。
      omit.style.display = "none";
      return;
    }
  }

  // omitFrom が -1 のまま終わった（極端に短い文字列）なら、何も隠さない
  if (omitFrom < 0) return;
  for (let i = Math.max(0, omitFrom); i < spans.length; i++) {
    spans[i].style.display = "none";
  }
}

/**
 * 相対リンクの解決（旧 `ui_utils.ts` の `resolveRelativeLink` と同じ規則。Stage 3 のレビュー m4 で 1 か所にした）。
 * `/` を含む名前はそのまま、含まない名前は `fallbackPath` の下（`null`・空は `.`）。
 * 層 B（`<maplat-ui>`）と旧 API の互換層（`MaplatUi.resolveRelativeLink`）の両方が使う。
 */
export function resolveRelativeLink(
  file: string,
  fallbackPath: string | null
): string {
  const base = fallbackPath || ".";
  return file.match(/\//) ? file : `${base}/${file}`;
}
