let m = new WeakMap<any, any>();
export function addTouchFriendlyContextMenu(element: Element, callback: (e: Event) => void) {
    let cb = (e) => {
        let t = setTimeout(() => {
            callback(e);
        }, 500);
        window.addEventListener('touchend', () => {
            clearTimeout(t);
        });
    };
    element.addEventListener('touchstart', cb);
    element.addEventListener('contextmenu', callback);
    m.set(callback, cb);
}
export function removeTouchFriendlyContextMenu(element: Element, callback: (e: Event) => void) {
    let cb = m.get(callback);
    m.delete(callback);
    element.removeEventListener('touchstart', cb);
    element.removeEventListener('contextmenu', cb);
}