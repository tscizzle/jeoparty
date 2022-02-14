import { createStore, applyMiddleware, compose } from "redux";
import reduxThunk from "redux-thunk";
import reduxMulti from "redux-multi";

import mainReducer from "state-management/reducers";

const middlewareEnhancer = applyMiddleware(reduxThunk, reduxMulti);
const enhancer = compose(middlewareEnhancer);

const store = createStore(mainReducer, enhancer);

export default store;
