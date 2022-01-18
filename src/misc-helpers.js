import Cookies from "js-cookie";
import _ from "lodash";

export const randomID = () => {
  /* Randomly generate a random string of letters and numbers.
  
  :return string: E.g. "pz729h8rik6v581k".
  */
  return _.times(2, () => Math.random().toString(36).substring(2, 10)).join("");
};

export const setClientIdCookie = () => {
  /* Generate and set the browser cookie value that identifies this instance of the
    jeoparty browser client (but only if one does not exist yet).

  :return string: The cookie value unique to this user's browser. It will be an output
    of our `randomID` helper. E.g. "pz729h8rik6v581k".
  */
  const clientIdCookieKey = "jeopartyClientId";

  let clientIdCookie = Cookies.get(clientIdCookieKey);

  if (!clientIdCookie) {
    clientIdCookie = randomID();
    Cookies.set(clientIdCookieKey, clientIdCookie);
  }
};
