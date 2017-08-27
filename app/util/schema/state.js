export function createState({
    parent = null,
    key = null,
    path = null,
} = {}) {
    return {
        parent,
        key,
        path: path ? path.slice() : [],
    };
}

export function createChildState(state, parent, key) {
    state = createState(state);
    state.parent = parent;
    state.key = key;
    state.path.push(key);
    return state;
}
