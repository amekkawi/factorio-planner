import { AppContainer } from 'react-hot-loader';
import React from 'react';
import ReactDOM from 'react-dom';
import { configureStore } from './state/store';
import rootReducer, { actions as reducerActions } from './state/reducers';
import Root from './Root';

const rootEl = document.getElementById('root');

const render = (Component, store) => {
    ReactDOM.render(
        <AppContainer>
            <Component store={store}/>
        </AppContainer>,
        rootEl
    );
};

const store = configureStore(rootReducer);

// TODO: Remove test data
store.dispatch(
    reducerActions.loadPlan(
        require('./testdata').default
    )
);

render(Root, store);

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
