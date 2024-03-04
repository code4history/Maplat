import { CSS_CLASSES } from '../constants';
import { CustomEventTypes } from '../types';
export function createFragment(html) {
    const fragment = document.createDocumentFragment();
    const div = document.createElement('div');
    div.innerHTML = html;
    while (div.firstChild) {
        fragment.append(div.firstChild);
    }
    return fragment;
}
export function getLineHeight(container) {
    let _a, _b;
    const cloned = document.importNode(container);
    const width = container.offsetWidth;
    cloned.style.cssText = `position: fixed; top: 0; left: 0; overflow: auto; visibility: hidden; pointer-events: none; height: unset; max-height: unset; width: ${width}px`;
    const frag = createFragment('<span>Foo</span>');
    const frag2 = createFragment('<span>Foo</span>');
    const element = document.createElement('li');
    const element2 = document.createElement('li');
    element.append(frag);
    element2.append(frag2);
    cloned.append(element);
    cloned.append(element2);
    (_a = container.parentNode) === null || _a === void 0 ? void 0 : _a.append(cloned);
    const height = cloned.offsetHeight / 2;
    (_b = container.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(cloned);
    return height;
}
export function addMenuEntry({ parentNode, item, isSubmenu = false, isInsideSubmenu = false, emitter, }) {
    const id = `_${Math.random().toString(36).slice(2, 11)}`;
    if (typeof item !== 'string' && 'text' in item) {
        const html = `<span>${item.text}</span>`;
        const frag = createFragment(html);
        const element = document.createElement('li');
        item.classname = item.classname || '';
        if (item.icon) {
            if (item.classname === '') {
                item.classname = CSS_CLASSES.icon;
            }
            else if (item.classname.includes(CSS_CLASSES.icon) === false) {
                item.classname += ` ${CSS_CLASSES.icon}`;
            }
            element.setAttribute('style', `background-image:url(${item.icon})`);
        }
        element.id = id;
        element.className = item.classname;
        element.append(frag);
        parentNode.append(element);
        const entry = {
            id,
            isSubmenu,
            isInsideSubmenu,
            isSeparator: false,
            callback: 'callback' in item ? item.callback : null,
            data: 'data' in item ? item.data : null,
        };
        emitter.emit(CustomEventTypes.ADD_MENU_ENTRY, entry, element);
        return element;
    }
    const html = `<li id="${id}" class="${CSS_CLASSES.separator}"><hr></li>`;
    const frag = createFragment(html);
    parentNode.append(frag);
    const element = parentNode.lastChild;
    const entry = {
        id,
        isSubmenu: false,
        isInsideSubmenu: false,
        isSeparator: true,
        callback: null,
        data: null,
    };
    emitter.emit(CustomEventTypes.ADD_MENU_ENTRY, entry, element);
    return element;
}
export function addMenuEntries({ container, items, menuWidth, isInsideSubmenu, emitter, }) {
    items.forEach(item => {
        if (typeof item !== 'string' && 'items' in item && Array.isArray(item.items)) {
            const li = addMenuEntry({ parentNode: container, item, isSubmenu: true, emitter });
            li.classList.add(CSS_CLASSES.submenu);
            const ul = document.createElement('ul');
            ul.classList.add(CSS_CLASSES.container);
            ul.style.width = `${menuWidth}px`;
            li.append(ul);
            addMenuEntries({
                emitter,
                menuWidth,
                container: ul,
                items: item.items,
                isInsideSubmenu: true,
            });
        }
        else {
            addMenuEntry({
                parentNode: container,
                item,
                isSubmenu: false,
                isInsideSubmenu,
                emitter,
            });
        }
    });
}
//# sourceMappingURL=dom.js.map