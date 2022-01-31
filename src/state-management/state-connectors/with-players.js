import { connect } from "react-redux";

import { fetchPlayers } from "state-management/actions";
import { preserveOwnProps } from "state-management/helpers";

const withPlayers = (WrappedComponent) => {
  const mapStateToProps = (state) => ({
    players: state.players,
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchPlayers: ({ roomId }) => dispatch(fetchPlayers({ roomId })),
  });

  const mergeProps = preserveOwnProps;

  const ComponentwithPlayers = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
  )(WrappedComponent);

  return ComponentwithPlayers;
};

export default withPlayers;
