import React from "react";
import { render } from "react-dom";
import { createStore, applyMiddleware, compose } from "redux";
import reduxThunk from "redux-thunk";
import reduxMulti from "redux-multi";

import mainReducer from "state-management/reducers";

import Main from "components/Main/Main";

import "index.scss";

// Redux

const middlewareEnhancer = applyMiddleware(reduxThunk, reduxMulti);
const enhancer = compose(middlewareEnhancer);

const store = createStore(mainReducer, enhancer);

// Mount our React app on the DOM.

render(<Main store={store} />, document.getElementById("root"));
