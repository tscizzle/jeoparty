import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import Loading from "components/Loading/Loading";

import "components/NiceButton/NiceButton.scss";

const NiceButton = ({
  className,
  isPrimary,
  isSecondary,
  isBig,
  isDisabled,
  isLoading,
  children,
  ...otherProps
}) => {
  const niceButtonContainerClasses = classNames("nice-button-container", {
    "big-button-container": isBig,
  });
  const niceButtonClasses = classNames("nice-button", {
    [className]: Boolean(className),
    "primary-button": isPrimary,
    "secondary-button": isSecondary,
    "big-button": isBig,
  });
  const buttonDisabled = isDisabled || isLoading;
  return (
    <div className={niceButtonContainerClasses}>
      <button
        className={niceButtonClasses}
        disabled={buttonDisabled}
        {...otherProps}
      >
        {children}
        {isLoading && (
          <div className="button-loading">
            <Loading />
          </div>
        )}
      </button>
    </div>
  );
};

NiceButton.propTypes = {
  className: PropTypes.string,
  isPrimary: PropTypes.bool,
  isSecondary: PropTypes.bool,
  isBig: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default NiceButton;

export const CircleButton = ({
  className,
  isSmall,
  color,
  children,
  ...otherProps
}) => {
  const colorClass = {
    red: "red-circle",
    blue: "blue-circle",
    green: "green-circle",
    yellow: "yellow-circle",
    orange: "orange-circle",
    dark: "dark-circle",
    gray: "",
  }[color];
  const circleButtonClasses = classNames("circle-button", {
    [className]: Boolean(className),
    [colorClass]: Boolean(colorClass),
    "small-circle-button": isSmall,
  });
  return (
    <div className={circleButtonClasses} {...otherProps}>
      {children}
    </div>
  );
};

CircleButton.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOf([
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "dark",
    "gray",
  ]),
  isSmall: PropTypes.bool,
};

export const LinkButton = ({ className, children, ...otherProps }) => {
  return (
    <div className="link-button" {...otherProps}>
      {children}
    </div>
  );
};

LinkButton.propTypes = {
  className: PropTypes.string,
};
