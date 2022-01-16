import PropTypes from "prop-types";

export const playerShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  room_id: PropTypes.number,
  name: PropTypes.string,
});
