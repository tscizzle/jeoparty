import React from "react";
import classNames from "classnames";

import "components/Loading/Loading.scss";

const Loading = ({ className }) => {
  const loadingClassNames = classNames("spinner", {
    [className]: className,
  });
  return (
    <span className={loadingClassNames}>
      <span className="double-bounce1" />
      <span className="double-bounce2" />
    </span>
  );
};

export default Loading;

export const FullPageLoading = () => (
  <div className="full-page-loading-container">
    <Loading />
  </div>
);
