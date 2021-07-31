import ContextMenuBase from "ol-contextmenu";

export default class ContextMenu extends ContextMenuBase {
  constructor(options) {
    super(options);
    this.Internal.setItemListener = function (li, index) {
      const this_ = this;
      if (li && typeof this.items[index].callback === "function") {
        (function (callback) {
          li.addEventListener("pointerdown", evt => {
            evt.stopPropagation();
          });
          li.addEventListener(
            "click",
            evt => {
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
