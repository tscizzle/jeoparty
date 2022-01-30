import Cookies from "js-cookie";
import _ from "lodash";

export const randomID = () => {
  /* Randomly generate a random string of letters and numbers.
  
  :return string: E.g. "pz729h8rik6v581k".
  */
  return _.times(2, () => Math.random().toString(36).substring(2, 10)).join("");
};

export const setBrowserIdCookie = () => {
  /* Generate and set the browser cookie value that identifies this instance of the
    J Party browser client (but only if one does not exist yet).

  :return string: The cookie value unique to this user's browser. It will be an output
    of our `randomID` helper. E.g. "pz729h8rik6v581k".
  */
  const browserIdCookieKey = "jPartyBrowserId";

  let browserIdCookie = Cookies.get(browserIdCookieKey);

  if (!browserIdCookie) {
    browserIdCookie = randomID();
    Cookies.set(browserIdCookieKey, browserIdCookie);
  }
};

export const getClueOrder = ({ categories, clues }) => {
  // TODO: sort all the clues based on round, then category, then money
  return [];
};

export const isDev = () => process.env.NODE_ENV === "development";
