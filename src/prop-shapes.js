import PropTypes from "prop-types";

export const playerShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  client_id: PropTypes.string.isRequired,
  room_id: PropTypes.number,
  name: PropTypes.string,
});

export const roomShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  source_game_id: PropTypes.number.isRequired,
  room_code: PropTypes.string.isRequired,
});
