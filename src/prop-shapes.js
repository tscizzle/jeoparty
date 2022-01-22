import PropTypes from "prop-types";

export const userShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  browser_id: PropTypes.string.isRequired,
  room_id: PropTypes.number,
  is_host: PropTypes.oneOf([0, 1]),
  name: PropTypes.string,
});

export const roomShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  source_game_id: PropTypes.number.isRequired,
  room_code: PropTypes.string.isRequired,
});

export const sourceGameShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  jarchive_id: PropTypes.string.isRequired,
});

export const roundShape = PropTypes.oneOf(["single", "double", "final"]);

export const categoryShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  source_game_id: PropTypes.number.isRequired,
  col_order_index: PropTypes.number,
  text: PropTypes.string.isRequired,
  round_type: roundShape.isRequired,
});

export const clueShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  category_id: PropTypes.number.isRequired,
  source_game_id: PropTypes.number.isRequired,
  clue: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
  money: PropTypes.number,
});

export const jGameDataShape = PropTypes.shape({
  sourceGame: sourceGameShape,
  categories: PropTypes.objectOf(categoryShape),
  clues: PropTypes.objectOf(clueShape),
});
