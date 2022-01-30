import moment from "moment-timezone";
import _ from "lodash";

import { isDev } from "misc-helpers";

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
      const dateVal = moment.tz(stringVal, "UTC").toDate();
      _.set(newObj, path, dateVal);
    }
  });
  return newObj;
};

/* API Calls */

const getCurrentUser = () => {
  return niceGET("/get-current-user");
};

const getCurrentRoom = () => {
  return niceGET("/get-current-room");
};

const getPlayersInRoom = ({ roomId }) => {
  return niceGET(`/get-players-in-room/${roomId}`);
};

const createRoom = () => {
  return nicePOST("/create-room");
};

const joinRoom = ({ roomCode }) => {
  return nicePOST("/join-room", {
    roomCode,
  });
};

const leaveRoom = () => {
  return nicePOST("/leave-room");
};

const startGame = ({ roomId }) => {
  return nicePOST(`/start-game/${roomId}`, {
    roomId,
  });
};

const subscribeToRoomUpdates = ({ roomId }) => {
  const baseUrl = isDev() ? "http://localhost:5000" : NICE_SERVER_URL;
  const url = new URL(`${baseUrl}/subscribe-to-room-updates/${roomId}`);
  return new EventSource(url);
};

const getJGameData = ({ sourceGameId }) => {
  return niceGET(`/get-j-game-data/${sourceGameId}`).then((resp) => {
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
  getPlayersInRoom,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  subscribeToRoomUpdates,
  getJGameData,
};

export default api;
