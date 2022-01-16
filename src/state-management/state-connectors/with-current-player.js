import { connect } from "react-redux";

import { fetchCurrentPlayer } from "state-management/actions";
import { preserveOwnProps } from "state-management/helpers";

const withCurrentPlayer = (WrappedComponent) => {
  const mapStateToProps = (state) => ({
    currentPlayer: state.currentPlayer,
    hasAttemptedFetchCurrentPlayer: state.hasAttemptedFetchCurrentPlayer,
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchCurrentPlayer: () => dispatch(fetchCurrentPlayer()),
  });

  const mergeProps = preserveOwnProps;

  const ComponentWithCurrentPlayer = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
  )(WrappedComponent);

  return ComponentWithCurrentPlayer;
};

export default withCurrentPlayer;
