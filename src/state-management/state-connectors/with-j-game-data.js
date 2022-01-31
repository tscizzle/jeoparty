import { connect } from "react-redux";

import { fetchJGameData } from "state-management/actions";
import { preserveOwnProps } from "state-management/helpers";

const withJGameData = (WrappedComponent) => {
  const mapStateToProps = (state) => ({
    jGameData: state.jGameData,
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchJGameData: () => dispatch(fetchJGameData()),
  });

  const mergeProps = preserveOwnProps;

  const ComponentWithJGameData = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
  )(WrappedComponent);

  return ComponentWithJGameData;
};

export default withJGameData;
