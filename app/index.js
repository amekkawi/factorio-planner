import { AppContainer } from 'react-hot-loader';
import React from 'react';
import ReactDOM from 'react-dom';
import { configureStore } from './state/store';
import rootReducer, { actions as reducerActions } from './state/reducers';
import Root from './Root';
import throttle from 'lodash.throttle';

const rootEl = document.getElementById('root');

const render = (Component, store, cb) => {
    ReactDOM.render(
        <AppContainer>
            <Component store={store}/>
        </AppContainer>,
        rootEl,
        cb
    );
};

const store = configureStore(rootReducer);

// Catch window blur to cancel in-progress actions (e.g. dragging).
window.addEventListener('blur', () => {
    store.dispatch(reducerActions.windowBlur());
});

// Catch window mouse up to cancel in-progress actions (e.g. dragging) that may not properly catch
window.addEventListener('mouseup', () => {
    store.dispatch(reducerActions.windowMouseUp());
});

window.addEventListener('focus', checkDefaultFocus);
document.addEventListener('focusout', () => {
    setTimeout(checkDefaultFocus, 1);
});
function checkDefaultFocus() {
    if (document.activeElement === document.body) {
        const el = document.getElementById('DefaultFocus');
        if (el) {
            el.focus();
        }
    }
}

// Monitor window viewport size.
dispatchWindowSize();
window.addEventListener('resize', throttle(dispatchWindowSize, 100));
function dispatchWindowSize() {
    store.dispatch(
        reducerActions.resizeWindow(
            window.innerWidth,
            window.innerHeight
        ),
    );
}

// TODO: Remove test data
store.dispatch(
    reducerActions.loadPlan(
        require('./testdata').default
    )
);

render(Root, store, () => {
    // Focus the surface on load.
    checkDefaultFocus();
});

if (module.hot) {
    module.hot.accept('./Root', () => {
        const Root = require('./Root').default;
        render(Root, store);
    });

    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./state/reducers', () => {
        const nextRootReducer = require('./state/reducers').default;
        store.replaceReducer(nextRootReducer);
    });
}
