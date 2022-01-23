import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment-timezone";
import _ from "lodash";

import {
  roundShape,
  categoryShape,
  clueShape,
  jGameDataShape,
} from "prop-shapes";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import "components/JGameDisplay/JGameDisplay.scss";

class Clue extends Component {
  static propTypes = {
    clue: clueShape.isRequired,
  };

  render() {
    const { clue } = this.props;

    const { clue: clueText } = clue;

    return <div className="clue">{clueText}</div>;
  }
}

class Category extends Component {
  static propTypes = {
    category: categoryShape.isRequired,
    clues: PropTypes.arrayOf(clueShape).isRequired,
  };

  render() {
    const { category, clues } = this.props;

    const { text } = category;

    const categoryClueCells = _.map(clues, (clue) => (
      <Clue clue={clue} key={clue.id} />
    ));

    return (
      <div className="category">
        <div className="category-title">{text}</div>
        <div className="category-cells">{categoryClueCells}</div>
      </div>
    );
  }
}

class JRound extends Component {
  static propTypes = {
    roundType: roundShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  render() {
    const { roundType, jGameData } = this.props;

    const { categories, clues } = jGameData;

    const roundTitle = this.getRoundTitle();

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
        <div className="j-round-header">{roundTitle}</div>
        <div className="j-round-cols">{roundCategoryCols}</div>
      </div>
    );
  }

  /* Helpers. */

  getRoundTitle = () => {
    const { roundType } = this.props;

    const roundTitleMap = {
      single: "Jeopardy! Round",
      double: "Double Jeopardy! Round",
      final: "Final Jeopardy! Round",
    };
    const roundTitle = roundTitleMap[roundType];

    return roundTitle;
  };
}

JRound = withJGameData(JRound);

class JGameDisplay extends Component {
  static propTypes = {
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  render() {
    const { jGameData } = this.props;

    const { sourceGame } = jGameData;

    const tapedDate = moment
      .tz(sourceGame.taped_date, "UTC")
      .format("YYYY-MM-DD");

    return (
      <div className="j-game-display">
        <h1>Date: {tapedDate}</h1>
        <JRound roundType="single" />
        <JRound roundType="double" />
        <JRound roundType="final" />
      </div>
    );
  }
}

JGameDisplay = withJGameData(JGameDisplay);

export default JGameDisplay;
