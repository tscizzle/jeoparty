import {
  FETCH_CURRENT_PLAYER_SUCCESS,
  FETCH_CURRENT_PLAYER_FAILURE,
  FETCH_CURRENT_ROOM_SUCCESS,
  FETCH_CURRENT_ROOM_FAILURE,
} from "state-management/actions";

const getInitialState = () => ({
  currentPlayer: null,
  hasAttemptedFetchCurrentPlayer: false,
  currentRoom: null,
  hasAttemptedFetchCurrentRoom: false,
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
    case FETCH_CURRENT_PLAYER_SUCCESS:
      newState = {
        ...state,
        currentPlayer: action.player,
        hasAttemptedFetchCurrentPlayer: true,
      };
      break;
    case FETCH_CURRENT_PLAYER_FAILURE:
      newState = {
        ...state,
        currentPlayer: null,
        hasAttemptedFetchCurrentPlayer: true,
      };
      break;
    case FETCH_CURRENT_ROOM_SUCCESS:
      newState = {
        ...state,
        currentRoom: action.room,
        hasAttemptedFetchCurrentRoom: true,
      };
      break;
    case FETCH_CURRENT_ROOM_FAILURE:
      newState = {
        ...state,
        currentRoom: null,
        hasAttemptedFetchCurrentRoom: true,
      };
      break;
    default:
      break;
  }

  if (verbose) {
    console.log("State AFTER:", newState);
  }

  return newState;
};

export default mainReducer;
