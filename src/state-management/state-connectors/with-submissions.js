import { connect } from "react-redux";

import { fetchSubmissions } from "state-management/actions";
import { preserveOwnProps } from "state-management/helpers";

const withSubmissions = (WrappedComponent) => {
  const mapStateToProps = (state) => ({
    submissions: state.submissions,
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchSubmissions: ({ roomId }) => dispatch(fetchSubmissions({ roomId })),
  });

  const mergeProps = preserveOwnProps;

  const ComponentwithSubmissions = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
  )(WrappedComponent);

  return ComponentwithSubmissions;
};

export default withSubmissions;
