export const isMac = navigator.userAgent.indexOf('Mac OS X') != -1;
export const mouseMultiSelectionEventProp = isMac ? 'metaKey' : 'ctrlKey';
export const isRetina = window.devicePixelRatio > 1;

export function isMouseEventMultiSelection(evt) {
    const isMultiModifier = evt.shiftKey || evt.ctrlKey || evt[mouseMultiSelectionEventProp];
    return evt.button === 0 && isMultiModifier
        || isMouseEventContextMenu(evt) && isMultiModifier;
}

export function isMouseEventMultiSelectionRemove(evt) {
    return evt.button === 0 && evt[mouseMultiSelectionEventProp];
}

export function isMouseEventContextMenu(evt) {
    return evt.button === 2 || isMac && evt.button === 0 && evt.ctrlKey;
}

export function determineWheelDelta(delta, deltaMode) {
    return -delta * (deltaMode ? 120 : 1);
}
