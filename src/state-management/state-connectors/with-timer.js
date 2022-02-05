import { connect } from "react-redux";

import { updateTimer } from "state-management/actions";
import { preserveOwnProps } from "state-management/helpers";

const withTimer = (WrappedComponent) => {
  const mapStateToProps = (state) => ({
    timerStartTime: state.timerStartTime,
    timerCurrentTime: state.timerCurrentTime,
    timerTotalTime: state.timerTotalTime,
  });

  const mapDispatchToProps = (dispatch) => ({
    updateTimer: ({ startTime, currentTime, totalTime }) => dispatch(updateTimer({ startTime, currentTime, totalTime })),
  });

  const mergeProps = preserveOwnProps;

  const ComponentWithTimer = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
  )(WrappedComponent);

  return ComponentWithTimer;
};

export default withTimer;
