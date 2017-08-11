import { combineReducers } from 'redux';
import { dragDeltaSelector } from './selectors';
import { createBlock } from '../models/Block';
import { createConnection } from '../models/Connection';

export const types = {
    KEY_ESCAPE: 'KEY_ESCAPE',
    WINDOW_BLUR: 'WINDOW_BLUR',
    WINDOW_RESIZE: 'WINDOW_RESIZE',
    WINDOW_MOUSEUP: 'WINDOW_MOUSEUP',
    SURFACE_PAN: 'SURFACE_PAN',
    SURFACE_ZOOM: 'SURFACE_ZOOM',
    BOX_SELECTION_START: 'BOX_SELECTION_START',
    BOX_SELECTION_MOVE: 'BOX_SELECTION_MOVE',
    BOX_SELECTION_END: 'BOX_SELECTION_END',
    SELECTION_ADD: 'SELECTION_ADD',
    SELECTION_REMOVE: 'SELECTION_REMOVE',
    SELECTION_SET: 'SELECTION_SET',
    DRAG_SELECTION_START: 'DRAG_SELECTION_START',
    DRAG_SELECTION_INIT: 'DRAG_SELECTION_INIT',
    DRAG_SELECTION_MOVE: 'DRAG_SELECTION_MOVE',
    DRAG_SELECTION_END: 'DRAG_SELECTION_END',
    LOAD_PLAN: 'LOAD_PLAN',
    LOAD_ICON: 'LOAD_ICON',
    DETAIL_EXPAND: 'DETAIL_EXPAND',
    DETAIL_COLLAPSE: 'DETAIL_COLLAPSE',
    SHOW_TOOLTIP: 'SHOW_TOOLTIP',
    HIDE_TOOLTIP: 'HIDE_TOOLTIP',
    BLOCK_RECIPE_CHANGE: 'BLOCK_RECIPE_CHANGE',
    BLOCK_PROTO_CHANGE: 'BLOCK_PROTO_CHANGE',
    BLOCK_QUANTITY_CHANGE: 'BLOCK_QUANTITY_CHANGE',
};

const horizPadding = 18;
const vertPadding = 38;
const minimumViewable = 200;

function restrainViewDimension(padding, windowSize, domainSize, zoom, offset) {
    return Math.min(windowSize - minimumViewable - padding, Math.max(-domainSize * zoom + minimumViewable, offset))
}

export const actions = {
    keyEscape: () => ({
        type: types.KEY_ESCAPE,
    }),

    windowBlur: () => ({
        type: types.WINDOW_BLUR,
    }),

    windowMouseUp: () => ({
        type: types.WINDOW_MOUSEUP,
    }),

    resizeWindow: (windowWidth, windowHeight) => ({
        type: types.WINDOW_RESIZE,
        payload: {
            windowWidth,
            windowHeight,
        },
    }),

    panSurface: (dx, dy) => (dispatch, getState) => {
        const {
            windowWidth, windowHeight,
            domainWidth, domainHeight,
            offsetX, offsetY, zoom,
        } = getState().surface;

        const payload = {
            offsetX: restrainViewDimension(horizPadding, windowWidth, domainWidth, zoom, offsetX + dx),
            offsetY: restrainViewDimension(vertPadding, windowHeight, domainHeight, zoom, offsetY + dy),
        };

        if (offsetX !== payload.offsetX || offsetY !== payload.offsetY) {
            dispatch({
                type: types.SURFACE_PAN,
                payload,
            });
        }
    },

    zoomSurface: (delta, x = null, y = null) => (dispatch, getState) => {
        const { zoom: prevZoom } = getState().surface;
        const zoom = Math.max(0.25, Math.min(1, prevZoom * Math.pow(2, delta / 300)));

        if (prevZoom !== zoom) {
            dispatch({
                type: types.SURFACE_ZOOM,
                payload: {
                    zoom,
                    x,
                    y,
                },
            });
        }
    },

    boxSelectionStart: (x, y, isAdd = false) => ({
        type: types.BOX_SELECTION_START,
        payload: {
            x,
            y,
            isAdd,
        },
    }),

    boxSelectionMove: (x, y) => ({
        type: types.BOX_SELECTION_MOVE,
        payload: {
            x,
            y,
        },
    }),

    boxSelectionEnd: () => ({
        type: types.BOX_SELECTION_END,
    }),

    selectionAll: () => (dispatch, getState) => {
        const { blockIds, connectionIds } = getState();
        dispatch({
            type: types.SELECTION_SET,
            payload: {
                ids: blockIds.concat(connectionIds),
            },
        });
    },

    selectionAdd: (id) => ({
        type: types.SELECTION_ADD,
        payload: {
            id,
        },
    }),

    selectionRemove: (id) => ({
        type: types.SELECTION_REMOVE,
        payload: {
            id,
        },
    }),

    selectionSet: (ids) => ({
        type: types.SELECTION_SET,
        payload: {
            ids,
        },
    }),

    dragSelectionStart: () => ({
        type: types.DRAG_SELECTION_START,
    }),

    dragSelectionInit: (x, y) => (dispatch, getState) => {
        if (!getState().surface.isDragging) {
            return;
        }

        dispatch({
            type: types.DRAG_SELECTION_INIT,
            payload: {
                x,
                y,
            },
        });
    },

    dragSelectionMove: (x, y) => ({
        type: types.DRAG_SELECTION_MOVE,
        payload: {
            x,
            y,
        },
    }),

    dragSelectionEnd: () => (dispatch, getState) => {
        const state = getState();
        const dragDelta = dragDeltaSelector(state);

        dispatch({
            type: types.DRAG_SELECTION_END,
            payload: {
                ids: Object.keys(state.surface.selectedById),
                deltaX: dragDelta && dragDelta.x,
                deltaY: dragDelta && dragDelta.y,
            },
        });
    },

    loadPlan: (plan) => ({
        type: types.LOAD_PLAN,
        payload: {
            plan,
        },
    }),

    loadIcon: (type, name) => (dispatch, getState) => {
        if (!getState().icons[`${type}.${name}`]) {
            dispatch({
                type: types.LOAD_ICON,
                payload: {
                    type,
                    name,
                },
            });
        }
    },

    detailExpand: (id) => ({
        type: types.DETAIL_EXPAND,
        payload: {
            id,
        },
    }),

    detailCollapse: (id) => (dispatch, getState) => {
        if (getState().detailExpanded === id) {
            dispatch({
                type: types.DETAIL_COLLAPSE,
                payload: {
                    id,
                },
            });
        }
    },

    showTooltip: (sourceId, contentType, meta) => ({
        type: types.SHOW_TOOLTIP,
        payload: {
            sourceId,
            contentType,
            meta,
        },
    }),

    hideTooltip: (sourceId) => (dispatch, getState) => {
        const tooltip = getState().tooltip;
        if (tooltip && tooltip.sourceId === sourceId) {
            dispatch({
                type: types.HIDE_TOOLTIP,
                payload: {
                    sourceId,
                },
            });
        }
    },

    changeBlockRecipe: (blockId, type, name) => ({
        type: types.BLOCK_RECIPE_CHANGE,
        payload: {
            blockId,
            type,
            name,
        },
    }),

    changeBlockProto: (blockId, name) => ({
        type: types.BLOCK_PROTO_CHANGE,
        payload: {
            blockId,
            name,
        },
    }),
};

export function surfaceReducer(state = {
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
    windowWidth: 0,
    windowHeight: 0,
    domainWidth: 2000,
    domainHeight: 1000,
    isBoxSelecting: false,
    boxSelectionStartIsAdd: false,
    boxSelectionStartX: 0,
    boxSelectionStartY: 0,
    boxSelectionEndX: 0,
    boxSelectionEndY: 0,
    selectedById: {},
    isDragging: false,
    dragStartX: null,
    dragStartY: null,
    dragEndX: null,
    dragEndY: null,
}, action) {
    switch (action.type) {
        case types.WINDOW_BLUR:
        case types.WINDOW_MOUSEUP:
        case types.KEY_ESCAPE:
            return {
                ...state,
                isDragging: false,
                dragStartX: null,
                dragStartY: null,
                dragEndX: null,
                dragEndY: null,
                isBoxSelecting: false,
            };
        case types.WINDOW_RESIZE: {
            const { windowWidth, windowHeight } = action.payload;
            const { offsetX, offsetY, domainWidth, domainHeight, zoom } = state;
            return {
                ...state,
                windowWidth: windowWidth,
                windowHeight: windowHeight,
                offsetX: restrainViewDimension(horizPadding, windowWidth, domainWidth, zoom, offsetX),
                offsetY: restrainViewDimension(vertPadding, windowHeight, domainHeight, zoom, offsetY),
            };
        }
        case types.SURFACE_PAN:
            return {
                ...state,
                offsetX: action.payload.offsetX,
                offsetY: action.payload.offsetY,
                boxSelectionEndX: state.boxSelectionEndX + (state.offsetX - action.payload.offsetX) / state.zoom,
                boxSelectionEndY: state.boxSelectionEndY + (state.offsetY - action.payload.offsetY) / state.zoom,
            };
        case types.SURFACE_ZOOM: {
            const { x, y, zoom } = action.payload;
            const {
                offsetX, offsetY,
                windowWidth, windowHeight,
                domainWidth, domainHeight,
                zoom: prevZoom,
            } = state;

            // // TODO: Properly calculate view center point for zooming when x/y is not specified.
            // const zoomX = x == null
            //     ? 0
            //     : x;

            return {
                ...state,
                zoom: action.payload.zoom,
                offsetX: restrainViewDimension(horizPadding, windowWidth, domainWidth, zoom, offsetX - ((x ? x : windowWidth / 2) * (zoom - prevZoom))),
                offsetY: restrainViewDimension(vertPadding, windowHeight, domainHeight, zoom, offsetY - ((y ? y : windowHeight / 2) * (zoom - prevZoom))),
            };
        }
        case types.BOX_SELECTION_START:
            return {
                ...state,
                isBoxSelecting: true,
                boxSelectionStartIsAdd: action.payload.isAdd,
                boxSelectionStartX: action.payload.x,
                boxSelectionStartY: action.payload.y,
                boxSelectionEndX: action.payload.x,
                boxSelectionEndY: action.payload.y,
                selectedById: action.payload.isAdd ? state.selectedById : {},
            };
        case types.BOX_SELECTION_MOVE:
            return {
                ...state,
                boxSelectionEndX: action.payload.x,
                boxSelectionEndY: action.payload.y,
            };
        case types.BOX_SELECTION_END:
            return {
                ...state,
                isBoxSelecting: false,
            };
        case types.SELECTION_ADD:
            return {
                ...state,
                selectedById: {
                    ...state.selectedById,
                    [action.payload.id]: true,
                },
            };
        case types.SELECTION_REMOVE: {
            const ret = {
                ...state,
                selectedById: {
                    ...state.selectedById,
                },
            };
            delete ret.selectedById[action.payload.id];
            return ret;
        }
        case types.SELECTION_SET:
            return {
                ...state,
                selectedById: action.payload.ids.reduce((ret, id) => {
                    ret[id] = true;
                    return ret;
                }, {}),
            };
        case types.DRAG_SELECTION_START:
            return {
                ...state,
                isDragging: true,
            };
        case types.DRAG_SELECTION_INIT:
            return {
                ...state,
                dragStartX: action.payload.x,
                dragStartY: action.payload.y,
                dragEndX: action.payload.x,
                dragEndY: action.payload.y,
            };
        case types.DRAG_SELECTION_MOVE:
            return {
                ...state,
                dragEndX: action.payload.x,
                dragEndY: action.payload.y,
            };
        case types.DRAG_SELECTION_END:
            return {
                ...state,
                isDragging: false,
                dragStartX: null,
                dragStartY: null,
                dragEndX: null,
                dragEndY: null,
            };
        default:
            return state;
    }
}

export function blockIdsReducer(state = [], action) {
    switch (action.type) {
        case types.LOAD_PLAN:
            return Object.keys(action.payload.plan.blocks || {});
        default:
            return state;
    }
}

export function blocksReducer(state = {}, action) {
    switch (action.type) {
        case types.LOAD_PLAN:
            return Object.keys(action.payload.plan.blocks || {})
                .reduce((ret, blockId) => {
                    ret[blockId] = createBlock(blockId, action.payload.plan.blocks[blockId]);
                    return ret;
                }, {});
        case types.DRAG_SELECTION_END: {
            const keysSet = new Set(action.payload.ids);
            return Object.keys(state).reduce((ret, blockId) => {
                if (keysSet.has(blockId)) {
                    ret[blockId] = {
                        ...state[blockId],
                        x: state[blockId].x + action.payload.deltaX,
                        y: state[blockId].y + action.payload.deltaY,
                    };
                }
                else {
                    ret[blockId] = state[blockId];
                }
                return ret;
            }, {});
        }
        case types.BLOCK_RECIPE_CHANGE:
            if (!state[action.payload.blockId]) {
                return state;
            }

            return {
                ...state,
                [action.payload.blockId]: {
                    ...state[action.payload.blockId],
                    recipeType: action.payload.type,
                    recipeName: action.payload.name,
                },
            };
        case types.BLOCK_PROTO_CHANGE:
            if (!state[action.payload.blockId]) {
                return state;
            }

            return {
                ...state,
                [action.payload.blockId]: {
                    ...state[action.payload.blockId],
                    name: action.payload.name,
                },
            };
        default:
            return state;
    }
}

export function connectionIdsReducer(state = [], action) {
    switch (action.type) {
        case types.LOAD_PLAN:
            return Object.keys(action.payload.plan.connections || {});
        default:
            return state;
    }
}

export function connectionsReducer(state = {}, action) {
    switch (action.type) {
        case types.LOAD_PLAN:
            return Object.keys(action.payload.plan.connections || {})
                .reduce((ret, connectionId) => {
                    ret[connectionId] = createConnection(connectionId, action.payload.plan.connections[connectionId]);
                    return ret;
                }, {});
        default:
            return state;
    }
}

export function iconsReducer(state = {}, action) {
    switch (action.type) {
        case types.LOAD_PLAN:
            return action.payload.plan.icons || {};
        case types.LOAD_ICON: {
            const iconKey = `${action.payload.type}.${action.payload.name}`;

            if (state[iconKey]) {
                return state;
            }

            return {
                ...state,
                [iconKey]: { type: action.payload.type, name: action.payload.name },
            };
        }
        default:
            return state;
    }
}

export function detailExpandedReducer(state = null, action) {
    switch (action.type) {
        case types.DETAIL_EXPAND:
            return action.payload.id;
        case types.DETAIL_COLLAPSE:
            return state === action.payload.id
                ? null
                : state;
        case types.SURFACE_PAN:
        case types.SURFACE_ZOOM:
            return null;
        default:
            return state;
    }
}

export function tooltipReducer(state = null, action) {
    switch (action.type) {
        case types.SHOW_TOOLTIP:
            return action.payload;
        case types.HIDE_TOOLTIP:
            return state && state.sourceId === action.payload.sourceId
                ? null
                : state;
        case types.SURFACE_PAN:
        case types.SURFACE_ZOOM:
            return null;
        default:
            return state;
    }
}

export default combineReducers({
    surface: surfaceReducer,
    icons: iconsReducer,
    tooltip: tooltipReducer,
    detailExpanded: detailExpandedReducer,
    blockIds: blockIdsReducer,
    blocks: blocksReducer,
    connectionIds: connectionIdsReducer,
    connections: connectionsReducer,
});
