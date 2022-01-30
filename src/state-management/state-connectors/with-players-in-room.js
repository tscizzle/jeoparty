import { connect } from "react-redux";

import { fetchPlayersInRoom } from "state-management/actions";
import { preserveOwnProps } from "state-management/helpers";

const withPlayersInRoom = (WrappedComponent) => {
  const mapStateToProps = (state) => ({
    playersInRoom: state.playersInRoom,
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchPlayersInRoom: ({ roomId }) =>
      dispatch(fetchPlayersInRoom({ roomId })),
  });

  const mergeProps = preserveOwnProps;

  const ComponentWithPlayersInRoom = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
  )(WrappedComponent);

  return ComponentWithPlayersInRoom;
};

export default withPlayersInRoom;
