import ContextMenuBase from "./contextmenu/base";

export default class ContextMenu extends ContextMenuBase {
  constructor(options: any = {}) {
    super(options);
    (this.Internal as any).setItemListener = function (li: any, index: any) {
      const this_ = this;
      if (li && typeof this.items[index].callback === "function") {
        (function (callback) {
          li.addEventListener("pointerdown", (evt: any) => {
            evt.stopPropagation();
          });
          li.addEventListener(
            "click",
            (evt: any) => {
              evt.preventDefault();
              const obj = {
                coordinate: this_.getCoordinateClicked(),
                data: this_.items[index].data || null
              };
              if (!callback(obj, this_.map)) this_.closeMenu();
            },
            false
          );
        })(this.items[index].callback);
      }
    };
  }
}
