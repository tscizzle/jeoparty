import moment from "moment-timezone";
import _ from "lodash";

/* Fetching */

export const NICE_SERVER_URL = window.location.origin;

const niceFetch = (...args) => {
  args[0] = new URL(NICE_SERVER_URL + args[0]);
  args[1] = { credentials: "include", ...args[1] };
  return fetch(...args);
};

const niceFetchJSON = (...args) => {
  return niceFetch(...args).then((res) => res.json());
};

const niceGET = (query) => {
  return niceFetchJSON(query);
};

const getJSONHeaders = () => {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
};

const nicePOST = (query, body) => {
  return niceFetchJSON(query, {
    method: "POST",
    headers: getJSONHeaders(),
    body: JSON.stringify(body),
  });
};

/* Transforming */

const dateify = ({ obj, dateFieldPaths }) => {
  const newObj = _.cloneDeep(obj);
  _.each(dateFieldPaths, (path) => {
    const hasField = _.has(obj, path);
    if (hasField) {
      const stringVal = _.get(obj, path);
      if (stringVal) {
        const dateVal = moment.tz(stringVal, "UTC").toDate();
        _.set(newObj, path, dateVal);
      }
    }
  });
  return newObj;
};

/* API Calls */

const getCurrentUser = () => {
  return niceGET("/get-current-user");
};

const getCurrentRoom = () => {
  return niceGET("/get-current-room").then((resp) => {
    const processedResp = dateify({
      obj: resp,
      dateFieldPaths: [
        "room.timer_started_at",
        "room.timer_will_end_at",
        "room.players_updated_at",
        "room.submissions_updated_at",
      ],
    });
    return processedResp;
  });
};

const getPlayers = () => {
  return niceGET(`/get-players`);
};

const createRoom = () => {
  return nicePOST("/create-room");
};

const joinRoom = ({ roomCode, nameToRegister, canvasImageBlob }) => {
  return nicePOST("/join-room", {
    roomCode,
    nameToRegister,
    canvasImageBlob,
  });
};

const leaveRoom = () => {
  return nicePOST("/leave-room");
};

const startGame = () => {
  return nicePOST(`/start-game`);
};

const getSubmissions = () => {
  return niceGET(`/get-submissions`);
};

const submitResponse = ({ clueId, submissionText, isFakeGuess }) => {
  return nicePOST("/submit-response", {
    clueId,
    submissionText,
    isFakeGuess,
  });
};

const gradeResponse = ({ clueId, gradedAs }) => {
  return nicePOST("/grade-response", {
    clueId,
    gradedAs,
  });
};

const getJGameData = () => {
  return niceGET(`/get-j-game-data`).then((resp) => {
    const processedResp = dateify({
      obj: resp,
      dateFieldPaths: ["sourceGame.taped_date"],
    });
    return processedResp;
  });
};

const api = {
  getCurrentUser,
  getCurrentRoom,
  getPlayers,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  getSubmissions,
  submitResponse,
  gradeResponse,
  getJGameData,
};

export default api;
