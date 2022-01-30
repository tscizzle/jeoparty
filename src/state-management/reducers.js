import {
  FETCH_CURRENT_USER_SUCCESS,
  FETCH_CURRENT_USER_FAILURE,
  FETCH_CURRENT_ROOM_SUCCESS,
  FETCH_CURRENT_ROOM_FAILURE,
  FETCH_PLAYERS_IN_ROOM_SUCCESS,
  FETCH_J_GAME_DATA_SUCCESS,
  FETCH_J_GAME_DATA_FAILURE,
} from "state-management/actions";

const getInitialState = () => ({
  currentUser: null,
  hasAttemptedFetchCurrentUser: false,
  currentRoom: null,
  hasAttemptedFetchCurrentRoom: false,
  playersInRoom: null,
  jGameData: null,
});

const mainReducer = (state = getInitialState(), action) => {
  const verbose = false;
  // const verbose = true;
  if (verbose) {
    console.log(`=== Action: ${action.type} ===`);
    console.log("Action:", action);
    console.log("State BEFORE:", state);
  }

  let newState = state;

  switch (action.type) {
    case FETCH_CURRENT_USER_SUCCESS: {
      newState = {
        ...state,
        currentUser: action.user,
        hasAttemptedFetchCurrentUser: true,
      };
      break;
    }

    case FETCH_CURRENT_USER_FAILURE: {
      newState = {
        ...state,
        currentUser: null,
        hasAttemptedFetchCurrentUser: true,
      };
      break;
    }

    case FETCH_CURRENT_ROOM_SUCCESS: {
      newState = {
        ...state,
        currentRoom: action.room,
        hasAttemptedFetchCurrentRoom: true,
      };
      break;
    }

    case FETCH_CURRENT_ROOM_FAILURE: {
      newState = {
        ...state,
        currentRoom: null,
        hasAttemptedFetchCurrentRoom: true,
      };
      break;
    }

    case FETCH_PLAYERS_IN_ROOM_SUCCESS: {
      newState = {
        ...state,
        playersInRoom: action.players,
      };
      break;
    }

    case FETCH_J_GAME_DATA_SUCCESS: {
      newState = {
        ...state,
        jGameData: {
          sourceGame: action.sourceGame,
          categories: action.categories,
          clues: action.clues,
        },
      };
      break;
    }

    case FETCH_J_GAME_DATA_FAILURE: {
      newState = {
        ...state,
        currentRoom: null,
        hasAttemptedFetchCurrentRoom: true,
      };
      break;
    }

    default: {
      break;
    }
  }

  if (verbose) {
    console.log("State AFTER:", newState);
  }

  return newState;
};

export default mainReducer;
