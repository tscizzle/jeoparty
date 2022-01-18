import _ from "lodash";

/* Fetching */

export const NICE_SERVER_URL = window.location.origin;

const niceFetch = (...args) => {
  args[0] = NICE_SERVER_URL + args[0];
  args[1] = { credentials: "include", ...args[1] };
  return fetch(...args);
};

const niceFetchJSON = (...args) => {
  return niceFetch(...args).then((res) => res.json());
};

const niceGET = (path) => {
  return niceFetchJSON(path);
};

const getJSONHeaders = () => {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
};

// eslint-disable-next-line
const nicePOST = (path, body) => {
  return niceFetchJSON(path, {
    method: "POST",
    headers: getJSONHeaders(),
    body: JSON.stringify(body),
  });
};

/* Transforming */

// eslint-disable-next-line
const dateify = ({ obj, dateFieldPaths }) => {
  const newObj = _.cloneDeep(obj);
  _.each(dateFieldPaths, (path) => {
    const hasField = _.has(obj, path);
    if (hasField) {
      const stringVal = _.get(obj, path);
      const dateVal = new Date(stringVal);
      _.set(newObj, path, dateVal);
    }
  });
  return newObj;
};

/* API Calls */

const getCurrentPlayer = () => {
  return niceGET(`/get-current-player`);
};

const getCurrentRoom = () => {
  return niceGET(`/get-current-room`);
};

const createRoom = () => {
  return niceGET("/create-room");
};

const api = {
  getCurrentPlayer,
  getCurrentRoom,
  createRoom,
};

export default api;
