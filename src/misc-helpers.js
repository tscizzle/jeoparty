import Cookies from "js-cookie";
import _ from "lodash";

export const isDev = () => process.env.NODE_ENV === "development";

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

export const mapItemsToIdx = (items) => {
  const itemIdxs = _.reduce(
    items,
    (resSoFar, item, idx) => ({ ...resSoFar, [item]: idx }),
    {}
  );
  return itemIdxs;
};

export const getRoundOrder = () => ["single", "double", "final"];

export const getCategoryOrder = ({ categories }) => {
  const roundOrder = getRoundOrder();
  // Object with rounds as keys mapped to their index in the round order.
  // e.g. { single: 0, ... }
  const roundOrderIdxs = mapItemsToIdx(roundOrder);

  // Order the categories by round first, then within that, order by column order.
  const roundOrderer = (category) => roundOrderIdxs[category.round_type];
  const colOrderOrderer = "col_order_index";
  const orderers = [roundOrderer, colOrderOrderer];

  const categoryOrder = _(categories)
    .values()
    .orderBy(orderers)
    .map("id")
    .value();

  return categoryOrder;
};

export const getClueOrder = ({ categories, clues }) => {
  const categoryOrder = getCategoryOrder({ categories });
  // Object with category id's as keys mapped to their index in the category order.
  // e.g. { 12: 0, 5: 1, ... }
  const categoryOrderIdxs = mapItemsToIdx(categoryOrder);

  // Order the clues by category first, then within that, order by money.
  const categoryOrderer = (clue) => categoryOrderIdxs[clue.category_id];
  const moneyOrderer = "money";
  const orderers = [categoryOrderer, moneyOrderer];

  const clueOrder = _(clues).values().orderBy(orderers).map("id").value();

  return clueOrder;
};
