import _ from "lodash";

export const randomID = () =>
  _.times(2, () => Math.random().toString(36).substring(2, 10)).join("");
