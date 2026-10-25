// 旧 `ui.contextMenu`（ol-contextmenu 4.1.0 の fork）の限定 facade。
//
// 旧 UI は OL の Control として文書にメニューを 1 つ持ち、`extend`/`clear`/`on("open")` で
// 操作していた。層 B の `<maplat-ui>` は Shadow DOM の中に**汎用のメニューを 1 つ**持つ
// （`part="poi-menu"`。重なった POI の選択も旧 API の `showContextMenu` も同じ部品）。
// 互換層はその部品へ委譲し、OpenLayers の Control 層は import しない（`spec/legacy-deps.spec.ts`）。
//
// 旧の `text` は HTML として差し込まれていた（`contextmenu/html.ts:94`）。層 B の
// メニューは `sanitizeHtml` を通してから入れる（サニタイズはあちら側の責務）。

import type { MaplatMenuItem, MaplatUiElement } from "../element";
import type { ContextMenuItem } from "./legacy_types";

export interface LegacyContextMenu {
  /** 旧 `contextMenu.container`（層 B のメニューの要素。旧の class 名は無い） */
  readonly container: HTMLElement | null;
  /** 旧 `contextMenu.Internal`（旧 UI の `showContextMenu` が使っていた口） */
  readonly Internal: {
    openMenu: (pixel?: number[], coordinate?: number[]) => void;
    closeMenu: () => void;
    readonly opened: boolean;
  };
  extend: (items: unknown[]) => void;
  clear: () => void;
  push: (item: ContextMenuItem | string) => void;
  pop: () => void;
  shift: () => void;
  countItems: () => number;
  isOpen: () => boolean;
  close: () => void;
  updatePosition: (pixel: number[]) => void;
  on: (type: string, handler: (event: unknown) => void) => void;
  un: (type: string, handler: (event: unknown) => void) => void;
  off: (type: string, handler: (event: unknown) => void) => void;
}

/** 互換層だけが使う口（facade の外から `menuclose` を購読するため）。 */
export interface LegacyContextMenuBinding {
  attach: (el: MaplatUiElement) => void;
  detach: () => void;
}

export type LegacyContextMenuFacade = LegacyContextMenu &
  LegacyContextMenuBinding;

export function createLegacyContextMenu(
  host: () => MaplatUiElement | null
): LegacyContextMenuFacade {
  const items: ContextMenuItem[] = [];
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  let lastEvent: { pixel?: number[]; coordinate?: number[] } = {};
  let open = false;
  let attached: MaplatUiElement | null = null;

  const current = (): MaplatUiElement | null => host();

  const emit = (type: string, detail?: unknown) => {
    if (type === "open") open = true;
    if (type === "close") open = false;
    for (const handler of [...(listeners.get(type) ?? [])]) {
      handler({ type, ...(detail as object) });
    }
  };

  /** 旧の 1 項目を層 B のメニューの項目にする（`text` は HTML として渡す＝層 B がサニタイズする）。 */
  const toMenuItem = (item: ContextMenuItem | string): MaplatMenuItem => {
    if (typeof item === "string") return { text: item };
    return {
      icon: typeof item.icon === "string" ? item.icon : undefined,
      text: typeof item.text === "string" ? item.text : "",
      // 旧 contextmenu の text は HTML（「層 B でサニタイズする」なので、ここでは HTML のまま渡す）
      html: true,
      callback: () => {
        const el = current();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const core = el?.app ? (el.app as any).app : undefined;
        const obj = {
          coordinate: lastEvent.coordinate ?? null,
          data: item.data ?? null
        };
        if (typeof item.callback === "function")
          item.callback(
            obj as { coordinate: number[]; data: unknown },
            core?.mapObject
          );
      }
    };
  };

  /** 層 B のメニューに出せる項目（区切り線は層 B の形に無いので読み飛ばす）。 */
  const visibleItems = (): MaplatMenuItem[] =>
    items
      .filter(item => typeof item === "string" || item.separator !== true)
      .map(toMenuItem);

  const openMenu = (pixel?: number[], coordinate?: number[]) => {
    const el = current();
    if (!el) return;
    lastEvent = {
      pixel: Array.isArray(pixel) ? pixel : lastEvent.pixel,
      coordinate: Array.isArray(coordinate) ? coordinate : lastEvent.coordinate
    };
    const at = Array.isArray(lastEvent.pixel)
      ? { x: lastEvent.pixel[0], y: lastEvent.pixel[1] }
      : undefined;
    el.showMenu({
      items: visibleItems(),
      at,
      label: el.t("menu.poi_candidates")
    });
  };

  const close = () => {
    const el = current();
    el?.closeMenu();
    if (open) emit("close");
  };

  const facade: LegacyContextMenuFacade = {
    get container() {
      const el = current();
      return el?.shadowRoot
        ? el.shadowRoot.querySelector<HTMLElement>(".poi-menu")
        : null;
    },
    Internal: {
      openMenu,
      closeMenu: close,
      get opened() {
        return open;
      }
    },
    extend: list => {
      if (!Array.isArray(list)) return;
      for (const item of list) items.push(item as ContextMenuItem);
    },
    clear: () => {
      items.length = 0;
    },
    push: item => {
      items.push(item as ContextMenuItem);
    },
    pop: () => {
      items.pop();
    },
    shift: () => {
      items.shift();
    },
    countItems: () => items.length,
    isOpen: () => open,
    close,
    updatePosition: pixel => {
      if (!open) return;
      openMenu(pixel, lastEvent.coordinate);
    },
    on: (type, handler) => {
      const set = listeners.get(type) ?? new Set();
      set.add(handler);
      listeners.set(type, set);
    },
    un: (type, handler) => {
      listeners.get(type)?.delete(handler);
    },
    off: (type, handler) => {
      listeners.get(type)?.delete(handler);
    },
    attach: el => {
      facade.detach();
      attached = el;
      el.addEventListener("menuopen", onMenuOpen);
      el.addEventListener("menuclose", onMenuClose);
    },
    detach: () => {
      if (!attached) return;
      attached.removeEventListener("menuopen", onMenuOpen);
      attached.removeEventListener("menuclose", onMenuClose);
      attached = null;
      open = false;
    }
  };

  // 層 B 側が開いたとき（POI の重なりの選択）も旧の "open"/"close" を配る
  function onMenuOpen() {
    emit("open", lastEvent);
  }
  function onMenuClose() {
    if (open) emit("close");
  }

  return facade;
}
