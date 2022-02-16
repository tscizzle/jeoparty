import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import { randomID } from "misc-helpers";

import "components/NiceInput/NiceInput.scss";

class NiceInput extends Component {
  static propTypes = {
    containerClassName: PropTypes.string,
    inputClassName: PropTypes.string,
    isFull: PropTypes.bool,
    isBold: PropTypes.bool,
    isTextArea: PropTypes.bool,
    focusOnMount: PropTypes.bool,
    id: PropTypes.string,
    label: PropTypes.string,
  };

  state = {
    hasFocusedOnMount: false,
  };

  refFuncThatFocusesOnMount = (input) => {
    const { hasFocusedOnMount } = this.state;
    if (!hasFocusedOnMount) {
      input && input.focus();
      this.setState({ hasFocusedOnMount: true });
    }
  };

  render() {
    const {
      containerClassName,
      inputClassName,
      isFull,
      isBold,
      isTextArea,
      focusOnMount,
      id,
      label,
      type,
      ...otherProps
    } = this.props;
    const elId = id || randomID();
    const typeArg = type ? { type } : {};
    const isCheckbox = type === "checkbox";
    const containerClasses = classNames("nice-input-container", {
      [containerClassName]: Boolean(containerClassName),
      "full-input-container": isFull,
      "checkbox-input-container": isCheckbox,
    });
    const inputClasses = classNames("nice-input", {
      [inputClassName]: Boolean(inputClassName),
      "full-input": isFull,
      "bold-input": isBold,
      "nice-textarea": isTextArea,
    });
    const inputComponentProps = {
      id: elId,
      className: inputClasses,
      ...typeArg,
      ...otherProps,
      ...(focusOnMount && { ref: this.refFuncThatFocusesOnMount }),
    };
    let inputComponent;
    if (isTextArea) {
      inputComponent = <textarea {...inputComponentProps} />;
    } else {
      inputComponent = <input {...inputComponentProps} />;
    }
    return label ? (
      <label htmlFor={elId} className={containerClasses}>
        {inputComponent} {label}
      </label>
    ) : (
      <div className={containerClasses}>{inputComponent}</div>
    );
  }
}

export default NiceInput;
