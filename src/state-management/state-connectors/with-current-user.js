import { connect } from "react-redux";

import { fetchCurrentUser } from "state-management/actions";
import { preserveOwnProps } from "state-management/helpers";

const withCurrentUser = (WrappedComponent) => {
  const mapStateToProps = (state) => ({
    currentUser: state.currentUser,
    hasAttemptedFetchCurrentUser: state.hasAttemptedFetchCurrentUser,
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchCurrentUser: () => dispatch(fetchCurrentUser()),
  });

  const mergeProps = preserveOwnProps;

  const ComponentWithCurrentUser = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
  )(WrappedComponent);

  return ComponentWithCurrentUser;
};

export default withCurrentUser;
