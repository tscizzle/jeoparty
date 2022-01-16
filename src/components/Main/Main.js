import React from "react";
import { Provider } from "react-redux";

import App from "components/App/App";

const Main = ({ store }) => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

export default Main;
