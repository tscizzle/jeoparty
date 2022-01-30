import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment-timezone";
import _ from "lodash";

import {
  roomShape,
  roundShape,
  categoryShape,
  clueShape,
  jGameDataShape,
} from "prop-shapes";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import "components/JGameDisplay/JGameDisplay.scss";

class Clue extends Component {
  static propTypes = {
    clue: clueShape.isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { clue, currentRoom } = this.props;

    const { id: this_clue_id, clue: clueText, money } = clue;
    const { current_clue_id, current_clue_stage } = currentRoom;

    const showMoney = !this.hasBeenDone();
    const showThisClueText =
      this_clue_id === current_clue_id && current_clue_stage === "answering";

    return (
      <div className="clue">
        {showMoney && <div className="money-text">${money}</div>}
        {showThisClueText && <div className="clue-text">{clueText}</div>}
      </div>
    );
  }

  /* Helpers. */

  hasBeenDone = () => {
    const { clue, currentRoom } = this.props;

    const { id: this_clue_id } = clue;
    const { current_clue_id } = currentRoom;

    // TODO: get an ordering of all the clues, and check which of this_clue_id and
    //    current_clue_id come first

    return false;
  };
}

Clue = withCurrentRoom(Clue);

class Category extends Component {
  static propTypes = {
    category: categoryShape.isRequired,
    clues: PropTypes.arrayOf(clueShape).isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { category, clues } = this.props;

    const { text } = category;

    const categoryClueCells = _.map(clues, (clue) => (
      <Clue clue={clue} key={clue.id} />
    ));

    const showCategoryTitle = !this.hasBeenDone();

    return (
      <div className="category">
        <div className="category-title">{showCategoryTitle && text}</div>
        <div className="category-cells">{categoryClueCells}</div>
      </div>
    );
  }

  /* Helpers. */

  hasBeenDone = () => {
    const { category, currentRoom } = this.props;

    const { id: category_id } = category;
    const { current_clue_id } = currentRoom;

    // TODO: get an ordering of all the categories, get the category for the
    //    current_clue_id check which of category_id and that category come first

    return false;
  };
}

Category = withCurrentRoom(Category);

class JRound extends Component {
  static propTypes = {
    roundType: roundShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  render() {
    const { roundType, jGameData } = this.props;

    const { categories, clues } = jGameData;

    // Object keyed by category_id, mapped to a list of clues for that category in money
    // order.
    const cluesByCategory = _(clues)
      .groupBy("category_id")
      .mapValues((categoryClues) => _.orderBy(categoryClues, "money"))
      .value();

    const roundCategories = _.pickBy(categories, { round_type: roundType });
    const roundCategoryCols = _(roundCategories)
      .values()
      .orderBy("col_order_index")
      .map((category) => (
        <Category
          category={category}
          clues={cluesByCategory[category.id]}
          key={category.id}
        />
      ))
      .value();

    return (
      <div className="j-round">
        <div className="j-round-cols">{roundCategoryCols}</div>
      </div>
    );
  }
}

JRound = withJGameData(JRound);

class JGameDisplay extends Component {
  static propTypes = {
    currentRound: PropTypes.oneOf(["single", "double", "final"]),
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  render() {
    const { currentRound, jGameData } = this.props;

    const { sourceGame } = jGameData;

    const tapedDate = moment
      .tz(sourceGame.taped_date, "UTC")
      .format("YYYY-MM-DD");

    return (
      <div className="j-game-display">
        <h1 hidden>{tapedDate}</h1>
        <JRound roundType={currentRound} />
      </div>
    );
  }
}

JGameDisplay = withJGameData(JGameDisplay);

export default JGameDisplay;
