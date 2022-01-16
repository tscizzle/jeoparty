import api from "api";

/* Action Types */

export const FETCH_CURRENT_PLAYER_SUCCESS = "FETCH_CURRENT_PLAYER_SUCCESS";
export const FETCH_CURRENT_PLAYER_FAILURE = "FETCH_CURRENT_PLAYER_FAILURE";

/* Action Creators */

export const fetchCurrentPlayerSuccess = ({ player }) => ({
  type: FETCH_CURRENT_PLAYER_SUCCESS,
  player,
});

export const fetchCurrentPlayerFailure = () => ({
  type: FETCH_CURRENT_PLAYER_FAILURE,
});

export const fetchCurrentPlayer = () => {
  return (dispatch) => {
    api
      .getCurrentPlayer()
      .then(({ player }) => {
        if (player) {
          dispatch(fetchCurrentPlayerSuccess({ player }));
        } else {
          dispatch(fetchCurrentPlayerFailure());
        }
      })
      .catch(() => {
        dispatch(fetchCurrentPlayerFailure());
      });
  };
};
