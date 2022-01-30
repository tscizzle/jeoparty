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
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { clue, currentRoom, jGameData } = this.props;

    const { id: this_clue_id, clue: clueText, money } = clue;
    const { current_clue_id, current_clue_stage } = currentRoom;
    const { clueOrderIdxs } = jGameData;

    const thisClueIdx = clueOrderIdxs[this_clue_id];
    const currentClueIdx = !_.isNull(current_clue_id)
      ? clueOrderIdxs[current_clue_id]
      : -1;

    const showMoney = thisClueIdx > currentClueIdx;
    const showThisClueText =
      this_clue_id === current_clue_id && current_clue_stage === "answering";

    return (
      <div className="clue">
        {showMoney && <div className="money-text">${money}</div>}
        {showThisClueText && <div className="clue-text">{clueText}</div>}
      </div>
    );
  }
}

Clue = withCurrentRoom(Clue);
Clue = withJGameData(Clue);

class Category extends Component {
  static propTypes = {
    category: categoryShape.isRequired,
    clues: PropTypes.arrayOf(clueShape).isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { category, clues, currentRoom, jGameData } = this.props;

    const { text } = category;
    const { current_clue_id } = currentRoom;
    const { clueOrderIdxs } = jGameData;
    const orderedClues = _.orderBy(clues, "money");

    const lastClueIdxInThisCategory = clueOrderIdxs[_.last(orderedClues).id];
    const currentClueIdx = !_.isNull(current_clue_id)
      ? clueOrderIdxs[current_clue_id]
      : -1;

    const cells = _.map(orderedClues, (clue) => (
      <Clue clue={clue} key={clue.id} />
    ));

    const showCategoryTitle = lastClueIdxInThisCategory > currentClueIdx;

    return (
      <div className="category">
        <div className="category-title">{showCategoryTitle && text}</div>
        <div className="category-cells">{cells}</div>
      </div>
    );
  }
}

Category = withCurrentRoom(Category);
Category = withJGameData(Category);

class JRound extends Component {
  static propTypes = {
    roundType: roundShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  render() {
    const { roundType, jGameData } = this.props;

    const { categories, clues } = jGameData;

    const cluesByCategory = _.groupBy(clues, "category_id");

    const categoriesForThisRound = _.pickBy(categories, {
      round_type: roundType,
    });

    const columns = _(categoriesForThisRound)
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
        <div className="j-round-columns">{columns}</div>
      </div>
    );
  }
}

JRound = withJGameData(JRound);

class JGameDisplay extends Component {
  static propTypes = {
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  render() {
    const { currentRoom, jGameData } = this.props;

    const { sourceGame } = jGameData;

    const tapedDate = moment
      .tz(sourceGame.taped_date, "UTC")
      .format("YYYY-MM-DD");

    const { current_clue_id } = currentRoom;
    const currentClue = jGameData.clues[current_clue_id];
    let currentRound = "single";
    if (currentClue) {
      const currentCategory = jGameData.categories[currentClue.category_id];
      currentRound = currentCategory.round_type;
    }

    return (
      <div className="j-game-display">
        <h1 hidden>{tapedDate}</h1>
        <JRound roundType={currentRound} />
      </div>
    );
  }
}

JGameDisplay = withCurrentRoom(JGameDisplay);
JGameDisplay = withJGameData(JGameDisplay);

export default JGameDisplay;
