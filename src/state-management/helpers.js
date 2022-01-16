/*
redux defaults to stateProps and dispatchProps overriding ownProps, but having
ownProps override the others allows us to specify certain props even when we
"connect" the component to supply it the rest of the props, using a state-connecting HOC
*/
export const preserveOwnProps = (stateProps, dispatchProps, ownProps) => ({
  ...stateProps,
  ...dispatchProps,
  ...ownProps,
});
