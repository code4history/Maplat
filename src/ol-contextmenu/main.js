import Control from 'ol/control/Control';
import { TinyEmitter } from 'tiny-emitter';
import { addMenuEntries, getLineHeight } from './helpers/dom';
import { CSS_CLASSES, DEFAULT_ITEMS, DEFAULT_OPTIONS } from './constants';
import { EventTypes, ContextMenuEvent, CustomEventTypes, } from './types';
function assert(condition, message) {
    if (!condition)
        throw new Error(message);
}
export default class ContextMenu extends Control {
    constructor(opts = {}) {
        assert(typeof opts === 'object', '@param `opts` should be object type!');
        const container = document.createElement('div');
        super({ element: container });
        Object.defineProperty(this, "map", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "emitter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new TinyEmitter()
        });
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "coordinate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "pixel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "contextMenuEventListener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "entryCallbackEventListener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mapMoveListener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lineHeight", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "disabled", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "opened", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "items", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "menuEntries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.options = Object.assign(Object.assign({}, DEFAULT_OPTIONS), opts);
        const menu = document.createElement('ul');
        container.append(menu);
        container.style.width = `${this.options.width}px`;
        container.classList.add(CSS_CLASSES.container, CSS_CLASSES.unselectable, CSS_CLASSES.hidden);
        this.container = container;
        this.contextMenuEventListener = evt => {
            this.handleContextMenu(evt);
        };
        this.entryCallbackEventListener = evt => {
            this.handleEntryCallback(evt);
        };
        this.mapMoveListener = () => {
            this.handleMapMove();
        };
        this.disabled = false;
        this.opened = false;
        window.addEventListener('beforeunload', () => {
            this.removeListeners();
        }, { once: true });
    }
    clear() {
        for (const id of this.menuEntries.keys()) {
            this.removeMenuEntry(id);
        }
        this.container.replaceChildren();
        this.container.append(document.createElement('ul'));
    }
    enable() {
        this.disabled = false;
    }
    disable() {
        this.disabled = true;
    }
    getDefaultItems() {
        return DEFAULT_ITEMS;
    }
    countItems() {
        return this.menuEntries.size;
    }
    extend(items) {
        assert(Array.isArray(items), '@param `items` should be an Array.');
        addMenuEntries({
            items,
            emitter: this.emitter,
            menuWidth: this.options.width,
            container: this.container.firstElementChild,
        });
    }
    closeMenu() {
        this.opened = false;
        this.container.classList.add(CSS_CLASSES.hidden);
        this.dispatchEvent(CustomEventTypes.CLOSE);
    }
    isOpen() {
        return this.opened;
    }
    updatePosition(pixel) {
        assert(Array.isArray(pixel), '@param `pixel` should be an Array.');
        if (this.isOpen()) {
            this.pixel = pixel;
            this.positionContainer();
        }
    }
    pop() {
        const last = Array.from(this.menuEntries.keys()).pop();
        last && this.removeMenuEntry(last);
    }
    shift() {
        const first = Array.from(this.menuEntries.keys()).shift();
        first && this.removeMenuEntry(first);
    }
    push(item) {
        item && this.extend([item]);
    }
    setMap(map) {
        super.setMap(map);
        if (map) {
            this.map = map;
            map.getViewport().addEventListener(this.options.eventType, this.contextMenuEventListener, false);
            map.on('movestart', () => {
                this.handleMapMove();
            });
            this.emitter.on(CustomEventTypes.ADD_MENU_ENTRY, (item, element) => {
                this.handleAddMenuEntry(item, element);
            }, this);
            this.items = this.options.defaultItems
                ? this.options.items.concat(DEFAULT_ITEMS)
                : this.options.items;
            addMenuEntries({
                items: this.items,
                emitter: this.emitter,
                menuWidth: this.options.width,
                container: this.container.firstElementChild,
            });
            const entriesLength = this.getMenuEntriesLength();
            this.lineHeight =
                entriesLength > 0
                    ? this.container.offsetHeight / entriesLength
                    : getLineHeight(this.container);
        }
        else {
            this.removeListeners();
            this.clear();
        }
    }
    removeListeners() {
        this.map
            .getViewport()
            .removeEventListener(this.options.eventType, this.contextMenuEventListener, false);
        this.emitter.off(CustomEventTypes.ADD_MENU_ENTRY);
    }
    removeMenuEntry(id) {
        let element = document.getElementById(id);
        element === null || element === void 0 ? void 0 : element.remove();
        element = null;
        this.menuEntries.delete(id);
    }
    handleContextMenu(evt) {
        let _a;
        this.coordinate = this.map.getEventCoordinate(evt);
        this.pixel = this.map.getEventPixel(evt);
        this.dispatchEvent(new ContextMenuEvent({
            map: this.map,
            originalEvent: evt,
            type: CustomEventTypes.BEFOREOPEN,
        }));
        if (this.disabled)
            return;
        if (this.options.eventType === EventTypes.CONTEXTMENU) {
            evt.stopPropagation();
            evt.preventDefault();
        }
        setTimeout(() => {
            this.openMenu(evt);
        });
        (_a = evt.target) === null || _a === void 0 ? void 0 : _a.addEventListener('pointerdown', event => {
            if (this.opened) {
                event.stopPropagation();
                this.closeMenu();
            }
        }, { once: true });
    }
    openMenu(evt) {
        this.opened = true;
        this.positionContainer();
        this.container.classList.remove(CSS_CLASSES.hidden);
        this.dispatchEvent(new ContextMenuEvent({
            map: this.map,
            originalEvent: evt,
            type: CustomEventTypes.OPEN,
        }));
    }
    getMenuEntriesLength() {
        return Array.from(this.menuEntries).filter(([, v]) => v.isSeparator === false && v.isSubmenu === false && v.isInsideSubmenu === false).length;
    }
    positionContainer() {
        const mapSize = this.map.getSize() || [0, 0];
        const spaceLeft = {
            w: mapSize[0] - this.pixel[0],
            h: mapSize[1] - this.pixel[1],
        };
        const entriesLength = this.getMenuEntriesLength();
        const menuSize = {
            w: this.container.offsetWidth,
            // a cheap way to recalculate container height
            // since offsetHeight is like cached
            h: Math.round(this.lineHeight * entriesLength),
        };
        const left = spaceLeft.w >= menuSize.w ? this.pixel[0] + 5 : this.pixel[0] - menuSize.w;
        this.container.style.left = `${left}px`;
        this.container.style.top =
            spaceLeft.h >= menuSize.h
                ? `${this.pixel[1] - 10}px`
                : `${this.pixel[1] - menuSize.h}px`;
        this.container.style.right = 'auto';
        this.container.style.bottom = 'auto';
        spaceLeft.w -= menuSize.w;
        const containerSubmenuChildren = container => Array.from(container.children).filter(el => el.tagName === 'LI' && el.classList.contains(CSS_CLASSES.submenu));
        let countSubMenu = 0;
        const positionSubmenu = (container, spaceLeftWidth) => {
            countSubMenu += 1;
            const elements = containerSubmenuChildren(container);
            elements.forEach(element => {
                const lastLeft = spaceLeftWidth >= menuSize.w ? menuSize.w - 8 : (menuSize.w + 8) * -1;
                const submenu = element.querySelector(`ul.${CSS_CLASSES.container}`);
                const submenuHeight = Math.round(this.lineHeight *
                    Array.from(submenu.children).filter(el => el.tagName === 'LI').length);
                submenu.style.left = `${lastLeft}px`;
                submenu.style.right = 'auto';
                submenu.style.top =
                    spaceLeft.h >= submenuHeight + menuSize.h
                        ? '0'
                        : `-${submenu.offsetHeight - 25}px`;
                submenu.style.bottom = 'auto';
                submenu.style.zIndex = String(countSubMenu);
                if (containerSubmenuChildren(submenu).length > 0) {
                    positionSubmenu(submenu, spaceLeftWidth - menuSize.w);
                }
            });
        };
        positionSubmenu(this.container.firstElementChild, spaceLeft.w);
    }
    handleMapMove() {
        this.closeMenu();
    }
    handleEntryCallback(evt) {
        let _a;
        evt.preventDefault();
        evt.stopPropagation();
        const target = evt.currentTarget;
        const item = this.menuEntries.get(target.id);
        if (!item)
            return;
        const object = {
            data: item.data,
            coordinate: this.coordinate,
        };
        this.closeMenu();
        (_a = item.callback) === null || _a === void 0 ? void 0 : _a.call(item, object, this.map);
    }
    handleAddMenuEntry(item, element) {
        this.menuEntries.set(item.id, item);
        this.positionContainer();
        if ('callback' in item && typeof item.callback === 'function') {
            element.addEventListener('click', this.entryCallbackEventListener, false);
        }
    }
}
//# sourceMappingURL=main.js.map