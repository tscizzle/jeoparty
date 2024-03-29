import api from "api";

/* Action Types */

export const FETCH_CURRENT_USER_SUCCESS = "FETCH_CURRENT_USER_SUCCESS";
export const FETCH_CURRENT_USER_FAILURE = "FETCH_CURRENT_USER_FAILURE";

export const FETCH_CURRENT_ROOM_SUCCESS = "FETCH_CURRENT_ROOM_SUCCESS";
export const FETCH_CURRENT_ROOM_FAILURE = "FETCH_CURRENT_ROOM_FAILURE";

export const FETCH_PLAYERS_SUCCESS = "FETCH_PLAYERS_SUCCESS";
export const FETCH_PLAYERS_FAILURE = "FETCH_PLAYERS_FAILURE";

export const FETCH_SUBMISSIONS_SUCCESS = "FETCH_SUBMISSIONS_SUCCESS";
export const FETCH_SUBMISSIONS_FAILURE = "FETCH_SUBMISSIONS_FAILURE";

export const FETCH_J_GAME_DATA_SUCCESS = "FETCH_J_GAME_DATA_SUCCESS";
export const FETCH_J_GAME_DATA_FAILURE = "FETCH_J_GAME_DATA_FAILURE";

/* Action Creators */

const fetchCurrentUserSuccess = ({ user }) => ({
  type: FETCH_CURRENT_USER_SUCCESS,
  user,
});

const fetchCurrentUserFailure = () => ({
  type: FETCH_CURRENT_USER_FAILURE,
});

export const fetchCurrentUser = () => {
  return (dispatch) => {
    api
      .getCurrentUser()
      .then(({ user }) => {
        if (user) {
          dispatch(fetchCurrentUserSuccess({ user }));
        } else {
          dispatch(fetchCurrentUserFailure());
        }
      })
      .catch(() => {
        dispatch(fetchCurrentUserFailure());
      });
  };
};

export const fetchCurrentRoomSuccess = ({ room }) => ({
  type: FETCH_CURRENT_ROOM_SUCCESS,
  room,
});

const fetchCurrentRoomFailure = () => ({
  type: FETCH_CURRENT_ROOM_FAILURE,
});

export const fetchCurrentRoom = () => {
  return (dispatch) => {
    api
      .getCurrentRoom()
      .then(({ room }) => {
        if (room) {
          dispatch(fetchCurrentRoomSuccess({ room }));
        } else {
          dispatch(fetchCurrentRoomFailure());
        }
      })
      .catch(() => {
        dispatch(fetchCurrentRoomFailure());
      });
  };
};

const fetchPlayersSuccess = ({ players }) => ({
  type: FETCH_PLAYERS_SUCCESS,
  players,
});

export const fetchPlayers = () => {
  return (dispatch) => {
    api.getPlayers().then(({ players }) => {
      if (players) {
        dispatch(fetchPlayersSuccess({ players }));
      }
    });
  };
};

const fetchSubmissionsSuccess = ({ submissions }) => ({
  type: FETCH_SUBMISSIONS_SUCCESS,
  submissions,
});

export const fetchSubmissions = () => {
  return (dispatch) => {
    api.getSubmissions().then(({ submissions }) => {
      if (submissions) {
        dispatch(fetchSubmissionsSuccess({ submissions }));
      }
    });
  };
};

const fetchJGameDataSuccess = ({ sourceGame, categories, clues }) => ({
  type: FETCH_J_GAME_DATA_SUCCESS,
  sourceGame,
  categories,
  clues,
});

const fetchJGameDataFailure = () => ({
  type: FETCH_J_GAME_DATA_FAILURE,
});

export const fetchJGameData = () => {
  return (dispatch) => {
    api
      .getJGameData()
      .then(({ sourceGame, categories, clues }) => {
        if (sourceGame) {
          dispatch(fetchJGameDataSuccess({ sourceGame, categories, clues }));
        } else {
          dispatch(fetchJGameDataFailure());
        }
      })
      .catch(() => {
        dispatch(fetchJGameDataFailure());
      });
  };
};
