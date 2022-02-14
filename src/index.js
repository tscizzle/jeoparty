import React from "react";
import { render } from "react-dom";

import store from "state-management/create-store";

import Main from "components/Main/Main";

import "index.scss";

// Mount our React app on the DOM.

render(<Main store={store} />, document.getElementById("root"));
