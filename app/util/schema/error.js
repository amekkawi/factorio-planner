export function createError(message, state) {
    return new Error(state && state.path && state.path.length ? `[${state.path.join('.')}] ${message}` : message);
}
