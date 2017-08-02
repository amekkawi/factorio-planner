import { combineReducers } from 'redux';

export const types = {
    PAN_SURFACE: 'PAN_SURFACE',
    BOX_SELECTION_START: 'BOX_SELECTION_START',
    BOX_SELECTION_MOVE: 'BOX_SELECTION_MOVE',
    BOX_SELECTION_END: 'BOX_SELECTION_END',
    SELECTION_ADD: 'SELECTION_ADD',
    SELECTION_REMOVE: 'SELECTION_REMOVE',
    SELECTION_SET: 'SELECTION_SET',
    LOAD_PLAN: 'LOAD_PLAN',
    LOAD_ICON: 'LOAD_ICON',
    FOCUS: 'FOCUS',
    BLUR: 'BLUR',
    SHOW_TOOLTIP: 'SHOW_TOOLTIP',
    HIDE_TOOLTIP: 'HIDE_TOOLTIP',
};

export const actions = {
    panSurface: (dx, dy) => (dispatch, getState) => {
        const { offsetX, offsetY } = getState().surface;
        const payload = {
            offsetX: Math.min(0, Math.max(-300, offsetX + dx)),
            offsetY: Math.min(0, Math.max(-300, offsetY + dy)),
        };

        if (offsetX !== payload.offsetX || offsetY !== payload.offsetY) {
            dispatch({
                type: types.PAN_SURFACE,
                payload,
            });
        }
    },

    boxSelectionStart: (x, y) => ({
        type: types.BOX_SELECTION_START,
        payload: {
            x,
            y,
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

    focus: (id) => ({
        type: types.FOCUS,
        payload: {
            id,
        },
    }),

    blur: (id) => (dispatch, getState) => {
        if (getState().focused === id) {
            dispatch({
                type: types.BLUR,
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
};

export function surfaceReducer(state = {
    offsetX: 0,
    offsetY: 0,
}, action) {
    switch (action.type) {
        case types.PAN_SURFACE:
            return {
                ...state,
                offsetX: action.payload.offsetX,
                offsetY: action.payload.offsetY,
                boxSelectionEndX: state.boxSelectionEndX + (state.offsetX - action.payload.offsetX),
                boxSelectionEndY: state.boxSelectionEndY + (state.offsetY - action.payload.offsetY),
            };
        case types.BOX_SELECTION_START:
            return {
                ...state,
                isBoxSelecting: true,
                boxSelectionStartX: action.payload.x,
                boxSelectionStartY: action.payload.y,
                boxSelectionEndX: action.payload.x,
                boxSelectionEndY: action.payload.y,
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

export function selectionReducer(state = {
    isBoxSelecting: false,
    boxSelectionStartX: 0,
    boxSelectionStartY: 0,
    boxSelectionEndX: 0,
    boxSelectionEndY: 0,
    byId: {},
}, action) {
    switch (action.type) {
        case types.SELECTION_ADD:
            return {
                ...state,
                byId: {
                    ...state.byId,
                    [action.payload.id]: true,
                },
            };
        case types.SELECTION_REMOVE: {
            const ret = {
                ...state,
                byId: {
                    ...state.byId,
                },
            };
            delete ret.byId[action.payload.id];
            return ret;
        }
        case types.SELECTION_SET:
            return {
                ...state,
                byId: action.payload.ids.reduce((ret, id) => {
                    ret[id] = true;
                    return ret;
                }, {}),
            };
        default:
            return state;
    }
}

export function blocksReducer(state = {}, action) {
    switch (action.type) {
        case types.LOAD_PLAN:
            return action.payload.plan.blocks || {};
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
            return action.payload.plan.connections || {};
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

export function focusedReducer(state = null, action) {
    switch (action.type) {
        case types.FOCUS:
            return action.payload.id;
        case types.BLUR:
            return state === action.payload.id
                ? null
                : state;
        case types.PAN_SURFACE:
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
        case types.PAN_SURFACE:
            return null;
        default:
            return state;
    }
}

export default combineReducers({
    surface: surfaceReducer,
    selection: selectionReducer,
    icons: iconsReducer,
    tooltip: tooltipReducer,
    focused: focusedReducer,
    blockIds: blockIdsReducer,
    blocks: blocksReducer,
    connectionIds: connectionIdsReducer,
    connections: connectionsReducer,
});
