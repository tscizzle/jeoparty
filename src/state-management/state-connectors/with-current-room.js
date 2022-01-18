import { connect } from "react-redux";

import { fetchCurrentRoom } from "state-management/actions";
import { preserveOwnProps } from "state-management/helpers";

const withCurrentRoom = (WrappedComponent) => {
  const mapStateToProps = (state) => ({
    currentRoom: state.currentRoom,
    hasAttemptedFetchCurrentRoom: state.hasAttemptedFetchCurrentRoom,
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchCurrentRoom: () => dispatch(fetchCurrentRoom()),
  });

  const mergeProps = preserveOwnProps;

  const ComponentWithCurrentRoom = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
  )(WrappedComponent);

  return ComponentWithCurrentRoom;
};

export default withCurrentRoom;
