export function createKeyMemoizedSelector(createSelector) {
    let prevKeySelectors = {};
    return (keys, ...args) => {
        const keySelectors = {};
        const ret = {};
        for (let i = 0, l = keys.length; i < l; i++) {
            const key = keys[i];
            const keySelector = keySelectors[key] = prevKeySelectors[key] || createSelector(key);
            ret[key] = keySelector.apply(null, args);
        }

        prevKeySelectors = keySelectors;
        return ret;
    };
}

export function defaultEqualityCheck(a, b) {
    return a === b;
}

export function memoize(func, {
    equalityCheck = defaultEqualityCheck,
    skipHead = 0,
    skipTail = 0,
} = {}) {
    let lastArgs = null;
    let lastResult = null;

    return function() {
        if (!areArgumentsShallowlyEqual(equalityCheck, skipHead, skipTail, lastArgs, arguments)) {
            lastResult = func.apply(null, arguments);
        }

        lastArgs = arguments;
        return lastResult;
    };
}

export function arrayValuesEqualityCheck(a, b) {
    if (!a || !b) {
        return false;
    }

    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0, l = a.length; i < l; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

function areArgumentsShallowlyEqual(equalityCheck, skipHead, skipTail, prev, next) {
    if (prev === null || next === null || prev.length !== next.length) {
        return false;
    }

    const length = prev.length - skipTail;
    for (let i = 0 + skipHead; i < length; i++) {
        if (!equalityCheck(prev[i], next[i])) {
            return false;
        }
    }

    return true;
}
