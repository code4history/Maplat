import ContextMenuBase from "./contextmenu/base";
import { ContextMenuOptions } from "./types";

export default class ContextMenu extends ContextMenuBase {
  constructor(options: ContextMenuOptions = {}) {
    super(options);
    const internal = this.Internal;

    internal.setItemListener = (li: HTMLElement, index: string) => {
      const this_ = internal;
      if (
        li &&
        internal.items[index] &&
        typeof internal.items[index].callback === "function"
      ) {
        (function (callback) {
          li.addEventListener("pointerdown", (evt: Event) => {
            evt.stopPropagation();
          });
          li.addEventListener(
            "click",
            (evt: Event) => {
              evt.preventDefault();
              const obj = {
                coordinate: this_.getCoordinateClicked() || [],
                data: this_.items[index].data || null
              };
              if (callback) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result: any = callback(obj, this_.map);
                if (!result) this_.closeMenu();
              }
            },
            false
          );
        })(internal.items[index].callback);
      }
    };
  }
}
