import PropTypes from "prop-types";

export const userShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  browser_id: PropTypes.string.isRequired,
  room_id: PropTypes.number,
  is_host: PropTypes.bool,
  name: PropTypes.string,
  image_blob: PropTypes.string,
});

export const roomShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  source_game_id: PropTypes.number.isRequired,
  room_code: PropTypes.string.isRequired,
  has_game_been_started: PropTypes.bool.isRequired,
  current_clue_id: PropTypes.number,
  current_clue_stage: PropTypes.oneOf([
    "preparing",
    "answering",
    "grading",
    "finished",
  ]),
  timer_started_at: PropTypes.instanceOf(Date),
  timer_seconds_elapsed: PropTypes.number,
  timer_will_end_at: PropTypes.instanceOf(Date),
  players_updated_at: PropTypes.instanceOf(Date).isRequired,
  submissions_updated_at: PropTypes.instanceOf(Date).isRequired,
});

export const submissionShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  user_id: PropTypes.number.isRequired,
  clue_id: PropTypes.number.isRequired,
  room_id: PropTypes.number.isRequired,
  text: PropTypes.string,
  graded_as: PropTypes.oneOf(["correct", "incorrect", "blank"]),
  is_fake_guess: PropTypes.bool.isRequired,
});

export const sourceGameShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  taped_date: PropTypes.instanceOf(Date).isRequired,
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
  clue: PropTypes.string,
  answer: PropTypes.string,
  money: PropTypes.number,
  is_daily_double: PropTypes.bool.isRequired,
});

export const jGameDataShape = PropTypes.shape({
  sourceGame: sourceGameShape.isRequired,
  categories: PropTypes.objectOf(categoryShape).isRequired,
  clues: PropTypes.objectOf(clueShape).isRequired,
  clueOrderIdxs: PropTypes.objectOf(PropTypes.number).isRequired,
});
