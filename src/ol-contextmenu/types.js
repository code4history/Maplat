import MapBrowserEvent from 'ol/MapBrowserEvent';
export let EventTypes;
(function (EventTypes) {
    EventTypes["CONTEXTMENU"] = "contextmenu";
    EventTypes["CLICK"] = "click";
    EventTypes["DBLCLICK"] = "dblclick";
})(EventTypes || (EventTypes = {}));
export let CustomEventTypes;
(function (CustomEventTypes) {
    CustomEventTypes["BEFOREOPEN"] = "beforeopen";
    CustomEventTypes["OPEN"] = "open";
    CustomEventTypes["CLOSE"] = "close";
    CustomEventTypes["ADD_MENU_ENTRY"] = "add-menu-entry";
})(CustomEventTypes || (CustomEventTypes = {}));
export class ContextMenuEvent extends MapBrowserEvent {
    constructor(options) {
        super(options.type, options.map, options.originalEvent);
    }
}
//# sourceMappingURL=types.js.map